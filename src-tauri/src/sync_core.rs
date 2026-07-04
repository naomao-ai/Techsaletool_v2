//! 동시성/저장 코어 로직 (Tauri 비의존).
//!
//! main.rs의 `#[tauri::command]` 함수들(`read_data`, `save_data`, `acquire_item_lock`,
//! `get_active_locks`, `release_item_lock`)이 위임하는 실제 구현.
//! 커맨드는 이 함수를 호출하고, 동시성 테스트는 이 순수 함수를 직접 스레드로
//! 호출해 경쟁 조건을 재현한다.
//!
//! ── 결함 #3·#4 수정 (2026-07-03) ──────────────────────────────────────
//! 기존에는 파일 mtime을 "버전"으로 사용하고 500ms 오차를 허용했는데(§4 근본원인 1),
//! 이 창 안에서 동시 저장하면 lost update가 발생했다(결함#3). 또한 아이템 락은
//! `save_data` 경로가 전혀 참조하지 않아 락 보유 중에도 덮어쓰기가 가능했다(결함#4).
//!
//! 수정: payload 루트에 단조 증가 `_rev` 필드를 두고, `save_data`가 저장 직전
//! "현재 파일을 다시 읽어 `_rev` 비교(compare-and-swap)"하도록 바꿨다. mtime·클럭에
//! 전혀 의존하지 않으므로 SMB/네트워크 지연·클럭 스큐에도 견고하다. 또한 read→비교→write
//! 임계구역을 프로세스 간에도 유효한 파일 잠금(`{path}.critical.lock`, O_EXCL 생성)으로
//! 감싸 진짜 상호배제를 확보했다(결함#3의 근본원인 ②). 마지막으로 저장 대상 payload와
//! 직전 파일 내용을 비교해 변경된 요구항목 id를 뽑아, 그 id에 대한 활성 아이템 락이
//! 타 사용자 소유면 저장 자체를 거부(`ITEM_LOCKED:<id>`)하도록 해 락과 저장 경로를
//! 실제로 연동했다(결함#4).
//!
//! 하위호환: `_rev` 필드가 없는 기존 파일은 `_rev=0`으로 간주한다(마이그레이션 불필요).

use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, UNIX_EPOCH};

/// 아이템 락 TTL (초). 원본 main.rs와 동일(15초로 캡).
pub const LOCK_TTL_SECONDS: u64 = 15;
/// 임계구역 락(critical section) 최대 대기 시간.
const CRITICAL_LOCK_TIMEOUT: Duration = Duration::from_secs(5);
/// 임계구역 락 파일이 이 시간 이상 방치되면(보유 프로세스 비정상 종료로 간주) 강제 회수.
const CRITICAL_LOCK_STALE_AFTER: Duration = Duration::from_secs(5);

// ══════════════════════════════════════════════════════════════════════
//  임계구역 락 — 프로세스 간 상호배제 (결함#3 근본원인 ② 해결)
// ══════════════════════════════════════════════════════════════════════

/// `{data_path}.critical.lock`을 O_EXCL(`create_new`)로 생성해 임계구역을 보호하는
/// RAII 가드. 드롭 시 자동으로 락 파일을 제거한다. 보유 프로세스가 비정상 종료해
/// 락 파일이 고아로 남으면, TTL(5초) 경과 후 다음 획득 시도자가 강제로 회수한다.
struct CriticalSection {
    lock_path: PathBuf,
}

impl CriticalSection {
    fn acquire(data_path: &str) -> Result<Self, String> {
        let lock_path = PathBuf::from(format!("{}.critical.lock", data_path));
        let deadline = Instant::now() + CRITICAL_LOCK_TIMEOUT;

        loop {
            match fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&lock_path)
            {
                Ok(mut f) => {
                    let _ = f.write_all(std::process::id().to_string().as_bytes());
                    return Ok(CriticalSection { lock_path });
                }
                Err(_) => {
                    // 스테일 락 회수: 보유 프로세스가 죽어 정리되지 못한 경우.
                    // [§14 P2-R3] remove 기반 회수는 "스테일 판정 → remove" 사이에 락이
                    // 신선한 것으로 교체되면 남의 살아있는 락을 지워 이중 진입을 허용할 수
                    // 있었다(§9 R3). rename은 원자적이므로 회수권을 먼저 선점하고, 선점한
                    // 파일의 mtime을 재검증해 신선했으면 원상 복구한다 — 살아있는 락이
                    // 영구 삭제되는 경로가 사라진다.
                    if let Ok(meta) = fs::metadata(&lock_path) {
                        if let Ok(modified) = meta.modified() {
                            if modified.elapsed().unwrap_or_default() > CRITICAL_LOCK_STALE_AFTER {
                                let claim_path = PathBuf::from(format!(
                                    "{}.claim.{}",
                                    lock_path.display(),
                                    std::process::id()
                                ));
                                if fs::rename(&lock_path, &claim_path).is_ok() {
                                    let still_stale = fs::metadata(&claim_path)
                                        .and_then(|m| m.modified())
                                        .ok()
                                        .and_then(|mt| mt.elapsed().ok())
                                        .map(|d| d > CRITICAL_LOCK_STALE_AFTER)
                                        .unwrap_or(true);
                                    if still_stale {
                                        let _ = fs::remove_file(&claim_path);
                                    } else {
                                        // 그 사이 교체된 신선한 락을 선점한 것 — 원상 복구
                                        let _ = fs::rename(&claim_path, &lock_path);
                                    }
                                }
                                continue;
                            }
                        }
                    }
                    if Instant::now() >= deadline {
                        return Err("LOCK_TIMEOUT".to_string());
                    }
                    std::thread::sleep(Duration::from_millis(50));
                }
            }
        }
    }
}

impl Drop for CriticalSection {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.lock_path);
    }
}

// ══════════════════════════════════════════════════════════════════════
//  읽기/쓰기 헬퍼
// ══════════════════════════════════════════════════════════════════════

/// 파일의 현재 값과 `_rev`(없으면 0)를 읽는다. 파일이 없거나 파싱 실패 시 (`{}`, 0).
fn read_current(path: &str) -> (serde_json::Value, u64) {
    match fs::read_to_string(path) {
        Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
            Ok(v) => {
                let rev = v.get("_rev").and_then(|r| r.as_u64()).unwrap_or(0);
                (v, rev)
            }
            Err(_) => (serde_json::json!({}), 0),
        },
        Err(_) => (serde_json::json!({}), 0),
    }
}

/// `read_data` 커맨드의 코어. `.bak` 자동 복구 포함 + `_rev` 반환.
///
/// 결함 분석 §9 R1 수정(2026-07-04): 기존에는 **모든** 읽기 실패에 `.bak` 복구를 발동해
/// 오래된 백업을 현재 파일 위에 덮어썼다. 다중 사용자 환경에서는 다른 클라이언트의
/// rename/copy 순간에 발생하는 일시적 공유 위반(SMB sharing violation)도 "읽기 실패"이므로,
/// 최신 데이터가 낮은 rev의 백업으로 롤백되는 사고가 가능했다.
/// 수정 후 정책:
///   - 일시 IO 오류(권한/공유 위반 등) → 100ms 간격 3회 재시도 → 그래도 실패면 **복구 없이 에러 반환**
///     (파일 자체는 멀쩡할 가능성이 높으므로 절대 덮어쓰지 않음. 호출부는 기존 상태 유지)
///   - 파일 없음(NotFound) → `.bak` 복구 (크래시로 rename이 미완된 경우의 정당한 복구)
///   - 읽기는 성공했으나 JSON 파싱 실패(파일 손상) → `.bak` 복구 (정당한 손상 복구)
pub fn read_data_inner(path: &str) -> Result<(serde_json::Value, u64), String> {
    let mut last_io_err: Option<std::io::Error> = None;

    for attempt in 0..3 {
        match fs::read_to_string(path) {
            Ok(c) => {
                let json_val = match serde_json::from_str::<serde_json::Value>(&c) {
                    Ok(j) => j,
                    Err(_) => recover_from_backup(path)?, // 손상 → 정당한 복구
                };
                let rev = json_val.get("_rev").and_then(|r| r.as_u64()).unwrap_or(0);
                return Ok((json_val, rev));
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                // 파일 자체가 없음 → 재시도 무의미, 크래시 복구 경로
                let json_val = recover_from_backup(path)?;
                let rev = json_val.get("_rev").and_then(|r| r.as_u64()).unwrap_or(0);
                return Ok((json_val, rev));
            }
            Err(e) => {
                last_io_err = Some(e);
                if attempt < 2 {
                    std::thread::sleep(Duration::from_millis(100));
                }
            }
        }
    }

    // 일시 IO 오류 소진 — .bak를 건드리지 않고 에러 반환(호출부가 현 상태 유지)
    Err(format!(
        "READ_RETRY_EXHAUSTED: {}",
        last_io_err.map(|e| e.to_string()).unwrap_or_default()
    ))
}

fn recover_from_backup(path: &str) -> Result<serde_json::Value, String> {
    let bak_path = format!("{}.bak", path);
    if Path::new(&bak_path).exists() {
        let bak_content = fs::read_to_string(&bak_path).map_err(|e| e.to_string())?;
        let bak_json: serde_json::Value =
            serde_json::from_str(&bak_content).map_err(|e| e.to_string())?;
        fs::write(path, &bak_content).unwrap_or(());
        Ok(bak_json)
    } else {
        Err("Failed to parse JSON and no backup available".to_string())
    }
}

/// tmp 기록 + 백업 + rename의 원자적 쓰기(원본 main.rs와 동일한 재시도 정책).
fn atomic_write(path: &str, data: &str) -> Result<(), String> {
    let tmp_path = format!("{}.tmp", path);
    let bak_path = format!("{}.bak", path);

    let mut retries = 3;
    while retries > 0 {
        if fs::write(&tmp_path, data).is_ok() {
            break;
        }
        retries -= 1;
        std::thread::sleep(Duration::from_millis(100));
    }
    if retries == 0 {
        return Err("Failed to write tmp file after retries".to_string());
    }

    if Path::new(path).exists() {
        let _ = fs::copy(path, &bak_path);
    }

    retries = 5;
    while retries > 0 {
        if fs::rename(&tmp_path, path).is_ok() {
            break;
        }
        retries -= 1;
        std::thread::sleep(Duration::from_millis(100));
    }
    if retries == 0 {
        return Err("Failed to rename tmp to original after retries".to_string());
    }

    Ok(())
}

// ══════════════════════════════════════════════════════════════════════
//  락 ID ↔ 파일명 인코딩 (결함#8 해결)
// ══════════════════════════════════════════════════════════════════════
// UI는 락 itemId로 `탭ID:행ID`(예: "requirements:REQ-001")를 사용하는데, 콜론은
// Windows 파일명 금지 문자다(NTFS에서는 ADS로 변질되어 디렉터리 스캔에 안 보이고,
// Samba NAS에서는 쓰기 자체가 거부될 수 있음 — §9.1 실증). 락 파일명에 쓰기 전
// 금지 문자('%' 포함, 전단사 보장)를 %XX(hex)로 인코딩하고, 스캔 시 디코딩해
// 원래 itemId를 복원한다. 모든 락 함수(acquire/release/get_active_locks)가
// 이 인코딩을 일괄 사용하므로 우회 경로가 없다.

/// (pub: main.rs의 changelog 파일명 등 다른 파일명 구성에도 재사용 — §14 R4)
pub fn encode_lock_id(id: &str) -> String {
    let mut out = String::with_capacity(id.len());
    for c in id.chars() {
        let code = c as u32;
        let forbidden = matches!(c, '%' | ':' | '/' | '\\' | '*' | '?' | '"' | '<' | '>' | '|')
            || code < 0x20;
        if forbidden {
            out.push('%');
            out.push_str(&format!("{:02X}", code));
        } else {
            out.push(c);
        }
    }
    out
}

fn decode_lock_id(encoded: &str) -> String {
    let mut out = String::with_capacity(encoded.len());
    let mut chars = encoded.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '%' {
            let h1 = chars.next();
            let h2 = chars.next();
            if let (Some(h1), Some(h2)) = (h1, h2) {
                if let Ok(code) = u32::from_str_radix(&format!("{}{}", h1, h2), 16) {
                    if let Some(decoded) = char::from_u32(code) {
                        out.push(decoded);
                        continue;
                    }
                }
                // 유효하지 않은 시퀀스는 원문 보존
                out.push('%');
                out.push(h1);
                out.push(h2);
            } else {
                out.push('%');
                if let Some(h1) = h1 {
                    out.push(h1);
                }
            }
        } else {
            out.push(c);
        }
    }
    out
}

// ══════════════════════════════════════════════════════════════════════
//  아이템 락 ↔ 저장 경로 연동 (결함#4 해결, 결함#8로 키 네임스페이스 정합)
// ══════════════════════════════════════════════════════════════════════

/// payload의 `tabDataMap.*.requirements[]`에서 `"탭ID:행ID" -> 정규화된 내용 문자열` 맵 추출.
/// 결함#8 수정: UI 락 키(`탭ID:행ID`)와 일치하도록 탭 네임스페이스를 포함한다.
fn extract_requirement_map(value: &serde_json::Value) -> HashMap<String, String> {
    let mut map = HashMap::new();
    if let Some(tab_data_map) = value.get("tabDataMap").and_then(|v| v.as_object()) {
        for (tab_id, tab_data) in tab_data_map.iter() {
            if let Some(reqs) = tab_data.get("requirements").and_then(|v| v.as_array()) {
                for req in reqs {
                    if let Some(id) = req.get("id").and_then(|v| v.as_str()) {
                        map.insert(format!("{}:{}", tab_id, id), req.to_string());
                    }
                }
            }
        }
    }
    map
}

/// 직전 파일 내용(old)과 저장하려는 내용(new)을 비교해 변경/삭제된 요구항목 id 중,
/// 활성 아이템 락이 **타 사용자** 소유인 것이 있으면 그 id를 반환(=저장 거부 사유).
fn find_locked_conflict(
    locks_dir: &Path,
    old: &serde_json::Value,
    new: &serde_json::Value,
    user_id: &str,
) -> Option<String> {
    let old_map = extract_requirement_map(old);
    let new_map = extract_requirement_map(new);

    let mut touched: Vec<String> = Vec::new();
    for (id, new_content) in &new_map {
        match old_map.get(id) {
            Some(old_content) if old_content == new_content => {}
            _ => touched.push(id.clone()),
        }
    }
    for id in old_map.keys() {
        if !new_map.contains_key(id) {
            touched.push(id.clone()); // 삭제도 충돌 대상
        }
    }
    if touched.is_empty() {
        return None;
    }

    let active_locks = get_active_locks_from_dir(locks_dir);
    for id in &touched {
        // 결함#8 수정: 1차로 UI 형식("탭ID:행ID") 정확 매치, 2차로 평면 행ID 매치
        // (탭 정보 없이 획득된 레거시/외부 락과의 호환 — 방어적).
        let plain_row_id = id.split(':').nth(1).unwrap_or(id);
        let lock = active_locks
            .get(id)
            .or_else(|| active_locks.get(plain_row_id));
        if let Some(lock) = lock {
            let owner = lock.get("userId").and_then(|v| v.as_str()).unwrap_or("");
            if !owner.is_empty() && owner != user_id {
                return Some(id.clone());
            }
        }
    }
    None
}

/// 락 파일의 나이(초). §9 R2 수정: 획득자 로컬 시계로 기록된 `acquiredAt` 대신
/// **락 파일 자체의 mtime(NAS/파일서버 시계)** 을 기준으로 나이를 계산한다.
/// 기존에는 획득자 시계 vs 판정자 시계의 쌍별 스큐(N명이면 N² 조합)에 노출됐지만,
/// 이제 모든 클라이언트가 동일한 파일서버 시계 하나만 상대하므로 판정이 일관된다.
/// 하트비트(5초)가 락 파일을 재작성해 mtime을 갱신하므로 TTL(15초) 대비 10초의
/// 스큐 여유가 있다. mtime이 미래(클라이언트가 서버보다 느림)면 나이 0으로 간주
/// — 락이 조기 만료되지 않는 안전한 방향.
fn lock_age_secs(lock_file: &Path) -> u64 {
    fs::metadata(lock_file)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|mtime| mtime.elapsed().ok())
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn get_active_locks_from_dir(locks_dir: &Path) -> serde_json::Map<String, serde_json::Value> {
    let mut active_locks = serde_json::Map::new();

    if locks_dir.exists() {
        if let Ok(entries) = fs::read_dir(locks_dir) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("item_") && name.ends_with(".lock") {
                        if let Ok(content) = fs::read_to_string(&file_path) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                let mut ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                                if ttl > LOCK_TTL_SECONDS {
                                    ttl = LOCK_TTL_SECONDS;
                                }
                                if lock_age_secs(&file_path) < ttl {
                                    if let Some(id) = name
                                        .strip_prefix("item_")
                                        .and_then(|s| s.strip_suffix(".lock"))
                                    {
                                        // 결함#8 수정: 파일명 인코딩을 디코딩해 원래 itemId로 복원
                                        active_locks.insert(decode_lock_id(id), json);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    active_locks
}

// ══════════════════════════════════════════════════════════════════════
//  save_data — _rev 기반 CAS + 임계구역 락 + 아이템 락 검증
// ══════════════════════════════════════════════════════════════════════

/// `save_data` 커맨드의 코어.
/// - `expected_rev`가 파일의 현재 `_rev`와 다르면 `VERSION_CONFLICT`.
/// - 저장하려는 변경분 중 타 사용자가 보유한 활성 아이템 락과 겹치면 `ITEM_LOCKED:<id>`.
/// - 성공 시 파일에 `_rev = expected_rev + 1`을 기록하고 새 rev를 반환.
/// - 전체 과정(읽기→비교→쓰기)은 프로세스 간에도 유효한 임계구역 락으로 보호된다.
pub fn save_data_inner(
    path: &str,
    data: &str,
    expected_rev: u64,
    user_id: &str,
) -> Result<u64, String> {
    let _guard = CriticalSection::acquire(path)?;

    let (current_value, current_rev) = read_current(path);
    if current_rev != expected_rev {
        return Err("VERSION_CONFLICT".to_string());
    }

    let mut new_value: serde_json::Value =
        serde_json::from_str(data).map_err(|e| format!("Invalid JSON payload: {}", e))?;

    if let Some(parent) = Path::new(path).parent() {
        let locks_dir = parent.join("locks");
        if let Some(conflict_id) =
            find_locked_conflict(&locks_dir, &current_value, &new_value, user_id)
        {
            return Err(format!("ITEM_LOCKED:{}", conflict_id));
        }
    }

    let new_rev = expected_rev + 1;
    if let Some(obj) = new_value.as_object_mut() {
        obj.insert("_rev".to_string(), serde_json::json!(new_rev));
    }
    let new_data_str = serde_json::to_string(&new_value).map_err(|e| e.to_string())?;

    atomic_write(path, &new_data_str)?;

    Ok(new_rev)
}

/// `acquire_item_lock` 커맨드의 코어. 파일 기반 낙관적 락.
/// 결함#8 수정: itemId를 파일명에 쓰기 전 인코딩. §9 R2 수정: TTL 판정을 파일 mtime 기준으로.
pub fn acquire_item_lock_inner(
    project_path: &str,
    item_id: &str,
    user_id: &str,
    user_name: &str,
) -> Result<bool, String> {
    let path = Path::new(project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let locks_dir = parent.join("locks");

    if !locks_dir.exists() {
        fs::create_dir_all(&locks_dir).map_err(|e| e.to_string())?;
    }

    let lock_file = locks_dir.join(format!("item_{}.lock", encode_lock_id(item_id)));
    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    if lock_file.exists() {
        if let Ok(content) = fs::read_to_string(&lock_file) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                let mut ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                if ttl > LOCK_TTL_SECONDS {
                    ttl = LOCK_TTL_SECONDS;
                }
                if lock_age_secs(&lock_file) < ttl {
                    if json["userId"].as_str().unwrap_or("") != user_id {
                        return Err(format!(
                            "Locked by {}",
                            json["userName"].as_str().unwrap_or("another user")
                        ));
                    }
                }
            }
        }
    }

    let lock_data = serde_json::json!({
        "userId": user_id,
        "userName": user_name,
        "acquiredAt": now, // 표시/디버그용 — TTL 판정은 파일 mtime 기준(§9 R2)
        "ttlSeconds": LOCK_TTL_SECONDS
    });

    fs::write(&lock_file, lock_data.to_string()).map_err(|e| e.to_string())?;
    Ok(true)
}

/// `release_item_lock` 커맨드의 코어. (결함#8: 파일명 인코딩 적용)
pub fn release_item_lock_inner(
    project_path: &str,
    item_id: &str,
    user_id: &str,
    force: Option<bool>,
) -> Result<bool, String> {
    let path = Path::new(project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let lock_file = parent
        .join("locks")
        .join(format!("item_{}.lock", encode_lock_id(item_id)));

    if lock_file.exists() {
        if force.unwrap_or(false) {
            fs::remove_file(&lock_file).map_err(|e| e.to_string())?;
            return Ok(true);
        }
        if let Ok(content) = fs::read_to_string(&lock_file) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if json["userId"].as_str().unwrap_or("") == user_id {
                    fs::remove_file(&lock_file).map_err(|e| e.to_string())?;
                }
            }
        }
    }
    Ok(true)
}

/// `get_active_locks` 커맨드의 코어.
/// (결함#8: 파일명 디코딩으로 원래 itemId 복원 / §9 R2: mtime 기반 TTL / 만료 락 정리 유지)
pub fn get_active_locks_inner(project_path: &str) -> Result<serde_json::Value, String> {
    let path = Path::new(project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let locks_dir = parent.join("locks");

    let mut active_locks = serde_json::Map::new();

    if locks_dir.exists() {
        if let Ok(entries) = fs::read_dir(&locks_dir) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("item_") && name.ends_with(".lock") {
                        if let Ok(content) = fs::read_to_string(&file_path) {
                            if let Ok(json) =
                                serde_json::from_str::<serde_json::Value>(&content)
                            {
                                let mut ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                                if ttl > LOCK_TTL_SECONDS {
                                    ttl = LOCK_TTL_SECONDS;
                                }
                                if lock_age_secs(&file_path) >= ttl {
                                    let _ = fs::remove_file(&file_path);
                                } else if let Some(id) = name
                                    .strip_prefix("item_")
                                    .and_then(|s| s.strip_suffix(".lock"))
                                {
                                    active_locks.insert(decode_lock_id(id), json);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(serde_json::Value::Object(active_locks))
}

// ══════════════════════════════════════════════════════════════════════
//  L2 동시성 테스트 — 결함#3(버전 경합)·#4(락이 저장을 못막음)가
//  이제 "안전하게 방지됨"을 단언한다(수정 전에는 "결함 존재"를 단언했음).
// ══════════════════════════════════════════════════════════════════════
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Arc;
    use std::thread;

    static COUNTER: AtomicU64 = AtomicU64::new(0);

    fn unique_dir(tag: &str) -> std::path::PathBuf {
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let nanos = std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let mut p = std::env::temp_dir();
        p.push(format!("techsale_l2_{}_{}_{}_{}", tag, std::process::id(), n, nanos));
        fs::create_dir_all(&p).unwrap();
        p
    }

    fn rev_of(path: &Path) -> u64 {
        read_current(path.to_str().unwrap()).1
    }

    // ── 대조군: 정상 순차 저장은 rev가 1씩 증가하며 계속 성공 ──────────
    #[test]
    fn control_sequential_saves_increment_rev() {
        let dir = unique_dir("ctrl_seq");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, r#"{"tabDataMap":{}}"#).unwrap();
        assert_eq!(rev_of(&path), 0, "신규(무 _rev) 파일은 rev=0으로 간주");

        let r1 = save_data_inner(p, r#"{"tabDataMap":{},"author":"A"}"#, 0, "userA");
        assert_eq!(r1, Ok(1), "첫 저장은 rev=1을 반환해야 함");
        assert_eq!(rev_of(&path), 1);

        let r2 = save_data_inner(p, r#"{"tabDataMap":{},"author":"A2"}"#, 1, "userA");
        assert_eq!(r2, Ok(2), "정확한 expected_rev로 재저장하면 rev=2");
    }

    // ── 신규 파일(존재하지 않음)에 대한 첫 저장 ──────────────────────
    #[test]
    fn control_first_save_on_nonexistent_file() {
        let dir = unique_dir("ctrl_new");
        let path = dir.join("brand_new.json");
        let p = path.to_str().unwrap();
        assert!(!path.exists());

        let r = save_data_inner(p, r#"{"tabDataMap":{}}"#, 0, "userA");
        assert_eq!(r, Ok(1), "존재하지 않는 파일도 expected_rev=0이면 첫 저장 성공");
    }

    // ── [수정 확인] 결함#3: 동시 저장 시 이제 lost update가 발생하지 않는다 ──
    // A와 B가 같은 rev(0)를 읽고 순차 저장 시도 → A는 성공(rev=1), B는 stale rev(0)라
    // VERSION_CONFLICT로 안전하게 거부되어야 한다(과거엔 500ms 창 안에서 조용히 통과·유실).
    #[test]
    fn risk2_fixed_stale_rev_save_is_rejected_not_lost() {
        let dir = unique_dir("risk2_fixed");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, r#"{"tabDataMap":{}}"#).unwrap();
        let v0 = rev_of(&path);

        // A와 B 모두 v0(=0)을 읽은 상태에서 저장 시도 (예전엔 500ms 이내라 둘 다 성공했음)
        let a = save_data_inner(p, r#"{"tabDataMap":{},"author":"A"}"#, v0, "userA");
        assert_eq!(a, Ok(1), "A 저장 성공(rev 0→1)");

        let b = save_data_inner(p, r#"{"tabDataMap":{},"author":"B"}"#, v0, "userB");
        assert!(
            b.is_err() && b.as_ref().unwrap_err() == "VERSION_CONFLICT",
            "[수정 확인] stale rev로 저장 시도한 B는 VERSION_CONFLICT로 거부되어야 함(더 이상 통과 못함). 실제={:?}",
            b
        );

        let final_content = fs::read_to_string(&path).unwrap();
        assert!(
            final_content.contains(r#""author":"A""#),
            "[수정 확인] A의 저장이 더 이상 유실되지 않고 파일에 남아 있어야 함. 최종={final_content}"
        );

        // B가 최신 rev(1)로 재조회 후 재시도하면 성공(정상적인 재시도 경로)
        let b_retry = save_data_inner(p, r#"{"tabDataMap":{},"author":"B"}"#, 1, "userB");
        assert_eq!(b_retry, Ok(2), "최신 rev로 재시도하면 B도 성공해야 함(유실 없이 순차 반영)");
    }

    // ── [수정 확인] 결함#3(스레드): 동시 저장은 임계구역 락으로 직렬화되고,
    // 정확히 한쪽만 성공(rev CAS 통과)하며 다른 쪽은 VERSION_CONFLICT로 안전 거부된다.
    // (예전엔 두 스레드 모두 성공 → 상호배제 부재로 한쪽이 조용히 유실됐음)
    #[test]
    fn risk2_fixed_threaded_mutual_exclusion_prevents_lost_update() {
        let dir = unique_dir("risk2t_fixed");
        let path = dir.join("data.json");
        fs::write(&path, r#"{"tabDataMap":{}}"#).unwrap();
        let v0 = rev_of(&path);
        let p = Arc::new(path.to_str().unwrap().to_string());

        let mut handles = vec![];
        for author in ["A", "B"] {
            let p = Arc::clone(&p);
            handles.push(thread::spawn(move || {
                save_data_inner(
                    &p,
                    &format!(r#"{{"tabDataMap":{{}},"author":"{author}"}}"#),
                    v0,
                    author,
                )
            }));
        }
        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();

        let ok_count = results.iter().filter(|r| r.is_ok()).count();
        assert_eq!(
            ok_count, 1,
            "[수정 확인] 임계구역 락으로 직렬화되어 정확히 한쪽만 성공해야 함(다른 쪽은 CAS 실패, 상호배제 확보). 실제={results:?}"
        );
        let conflict_count = results
            .iter()
            .filter(|r| r.as_ref().err().map(|e| e == "VERSION_CONFLICT").unwrap_or(false))
            .count();
        assert_eq!(conflict_count, 1, "패자는 반드시 VERSION_CONFLICT(안전 거부)여야 함. 실제={results:?}");

        // 유실이 아니라 "거부"이므로 실패한 쪽은 최신 rev로 재시도해 데이터를 보존할 수 있다
        // (App.tsx의 executeSmartMerge가 이 재시도·병합을 담당).
    }

    // ── 대조군: 락 획득/충돌 자체는 정상 동작(변경 없음) ────────────
    #[test]
    fn control_item_lock_blocks_second_user() {
        let dir = unique_dir("lockctrl");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, "{}").unwrap();

        let a = acquire_item_lock_inner(p, "REQ-001", "userA", "Alice");
        assert!(a.is_ok(), "A가 락 획득");
        let b = acquire_item_lock_inner(p, "REQ-001", "userB", "Bob");
        assert!(
            b.is_err() && b.as_ref().unwrap_err().contains("Locked by"),
            "다른 사용자 B의 같은 아이템 락은 거부되어야 함. 실제={:?}",
            b
        );
    }

    // ── [수정 확인] 결함#4: 아이템 락 보유 중에는 그 아이템을 건드리는 저장이 거부된다 ──
    // A가 REQ-001을 편집(락 보유) 중, B가 전체 파일 저장을 시도하면서 REQ-001 내용을
    // 바꾸려 하면 ITEM_LOCKED로 거부되어야 한다(예전엔 save_data가 락을 전혀 참조 안 해 통과).
    #[test]
    fn risk3_fixed_item_lock_blocks_conflicting_save() {
        let dir = unique_dir("risk3_fixed");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        let base = r#"{"tabDataMap":{"t1":{"requirements":[{"id":"REQ-001","editing_by":"A"}]}}}"#;
        fs::write(&path, base).unwrap();
        let v0 = rev_of(&path);

        // A가 REQ-001 편집 락 획득
        let lock = acquire_item_lock_inner(p, "REQ-001", "userA", "Alice");
        assert!(lock.is_ok(), "A가 REQ-001 락 획득");
        let active = get_active_locks_inner(p).unwrap();
        assert!(active.get("REQ-001").is_some(), "REQ-001 락이 활성 상태여야 함");

        // B가 락을 무시하고 REQ-001을 변경하는 전체 파일 저장 시도
        // (평면 행ID 락이므로 find_locked_conflict의 2차 폴백 매치로 차단 — 결함#8 수정 후에도 유지)
        let changed = r#"{"tabDataMap":{"t1":{"requirements":[{"id":"REQ-001","overwritten_by":"B"}]}}}"#;
        let b = save_data_inner(p, changed, v0, "userB");
        assert!(
            b.is_err() && b.as_ref().unwrap_err().starts_with("ITEM_LOCKED:t1:REQ-001"),
            "[수정 확인] 락 보유 중인 REQ-001을 건드리는 저장은 ITEM_LOCKED로 거부되어야 함. 실제={:?}",
            b
        );

        let final_content = fs::read_to_string(&path).unwrap();
        assert!(
            final_content.contains("editing_by") && !final_content.contains("overwritten_by"),
            "[수정 확인] A가 편집 중이던 REQ-001 데이터가 보존되어야 함. 최종={final_content}"
        );

        // 락 소유자 본인(A)이 REQ-001을 수정해 저장하는 것은 허용되어야 함
        let by_owner = r#"{"tabDataMap":{"t1":{"requirements":[{"id":"REQ-001","editing_by":"A_updated"}]}}}"#;
        let a_save = save_data_inner(p, by_owner, v0, "userA");
        assert!(a_save.is_ok(), "락 소유자 본인의 저장은 허용되어야 함. 실제={:?}", a_save);

        // 락과 무관한 다른 요구항목 저장은 영향받지 않음
        let dir2 = unique_dir("risk3_fixed_unrelated");
        let path2 = dir2.join("data.json");
        let p2 = path2.to_str().unwrap();
        fs::write(&path2, r#"{"tabDataMap":{"t1":{"requirements":[{"id":"REQ-001","x":1},{"id":"REQ-002","x":1}]}}}"#).unwrap();
        let v0_2 = rev_of(&path2);
        acquire_item_lock_inner(p2, "REQ-001", "userA", "Alice").unwrap();
        let touch_other = r#"{"tabDataMap":{"t1":{"requirements":[{"id":"REQ-001","x":1},{"id":"REQ-002","x":2}]}}}"#;
        let c = save_data_inner(p2, touch_other, v0_2, "userC");
        assert!(c.is_ok(), "락과 무관한 REQ-002만 바뀐 저장은 통과해야 함. 실제={:?}", c);
    }

    // ── [결함#8 수정 확인] 콜론 포함 실 UI 형식("탭ID:행ID") 락이 정상 동작 ──
    // 수정 전: 콜론이 NTFS ADS로 변질되어 디렉터리 스캔에 안 보이고(락 가시성 0),
    // 저장 검증 키와도 불일치해 결함#4 보호가 실 UI에서 미작동했다.
    #[test]
    fn defect8_fixed_colon_item_ids_work_end_to_end() {
        // 인코딩/디코딩 왕복 보장
        let ugly = r#"tab:REQ/00\1*?"<>|%"#;
        assert_eq!(decode_lock_id(&encode_lock_id(ugly)), ugly, "인코딩 왕복 무손실");
        assert!(
            !encode_lock_id(ugly).contains(|c: char| matches!(c, ':' | '/' | '\\' | '*' | '?' | '"' | '<' | '>' | '|')),
            "인코딩 결과에 금지 문자가 없어야 함: {}",
            encode_lock_id(ugly)
        );

        let dir = unique_dir("defect8");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, r#"{"tabDataMap":{"requirements":{"requirements":[{"id":"REQ-001","v":1}]}}}"#).unwrap();
        let v0 = rev_of(&path);

        // 실 UI 형식으로 락 획득 (Spreadsheet.tsx와 동일)
        let ui_item_id = "requirements:REQ-001";
        acquire_item_lock_inner(p, ui_item_id, "userA", "Alice").unwrap();

        // ① 락 파일이 디렉터리 스캔에 실제로 잡히는 진짜 파일이어야 함(ADS 아님)
        let lock_files: Vec<String> = fs::read_dir(dir.join("locks"))
            .unwrap()
            .flatten()
            .filter_map(|e| e.file_name().to_str().map(String::from))
            .filter(|n| n.starts_with("item_") && n.ends_with(".lock"))
            .collect();
        assert_eq!(lock_files.len(), 1, "락 파일 1개가 디렉터리에 보여야 함. 실제={lock_files:?}");
        assert!(
            lock_files[0].contains("%3A"),
            "콜론이 %3A로 인코딩된 파일명이어야 함. 실제={}",
            lock_files[0]
        );

        // ② get_active_locks가 원래 itemId(콜론 포함)로 복원해 반환 — UI 인디케이터 키와 일치
        let active = get_active_locks_inner(p).unwrap();
        assert!(
            active.get(ui_item_id).is_some(),
            "[수정 확인] 콜론 형식 락이 활성 목록에 원래 키로 보여야 함. 실제={active}"
        );

        // ③ 저장 검증: 타 사용자가 락 걸린 항목을 변경하는 저장은 ITEM_LOCKED
        let changed = r#"{"tabDataMap":{"requirements":{"requirements":[{"id":"REQ-001","v":2}]}}}"#;
        let b = save_data_inner(p, changed, v0, "userB");
        assert!(
            b.is_err() && b.as_ref().unwrap_err().starts_with("ITEM_LOCKED:requirements:REQ-001"),
            "[수정 확인] 실 UI 형식 락도 저장을 차단해야 함(결함#4가 실 경로에서 작동). 실제={:?}",
            b
        );

        // ④ 해제 후 정상 저장
        release_item_lock_inner(p, ui_item_id, "userA", None).unwrap();
        let active_after = get_active_locks_inner(p).unwrap();
        assert!(active_after.get(ui_item_id).is_none(), "해제 후 락이 사라져야 함");
        let b_retry = save_data_inner(p, changed, v0, "userB");
        assert!(b_retry.is_ok(), "해제 후 저장은 통과. 실제={:?}", b_retry);
    }

    // ── [§9 R1 수정 확인] 손상 파일은 .bak로 복구되지만, 일시 IO 오류는 롤백을 유발하지 않음 ──
    #[test]
    fn r1_fixed_corrupt_file_recovers_from_bak() {
        let dir = unique_dir("r1_corrupt");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, "{{{{ 손상된 JSON").unwrap();
        fs::write(dir.join("data.json.bak"), r#"{"tabDataMap":{},"_rev":3}"#).unwrap();

        let (val, rev) = read_data_inner(p).expect("손상 파일은 .bak로 복구되어야 함");
        assert_eq!(rev, 3, "복구된 rev=3");
        assert!(val.get("tabDataMap").is_some());
        // 본 파일도 .bak 내용으로 복원됨
        let restored = fs::read_to_string(&path).unwrap();
        assert!(restored.contains(r#""_rev":3"#));
    }

    #[cfg(windows)]
    #[test]
    fn r1_fixed_transient_lock_does_not_rollback_to_bak() {
        use std::os::windows::fs::OpenOptionsExt;

        let dir = unique_dir("r1_locked");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        // 본 파일은 최신(rev 5), .bak는 구버전(rev 1)
        fs::write(&path, r#"{"tabDataMap":{},"_rev":5}"#).unwrap();
        fs::write(dir.join("data.json.bak"), r#"{"tabDataMap":{},"_rev":1}"#).unwrap();

        // 다른 프로세스의 배타 접근을 흉내: share_mode(0)으로 열어 공유 위반 유발
        let _exclusive = fs::OpenOptions::new()
            .read(true)
            .share_mode(0)
            .open(&path)
            .unwrap();

        let result = read_data_inner(p);
        assert!(
            result.is_err() && result.as_ref().unwrap_err().contains("READ_RETRY_EXHAUSTED"),
            "[수정 확인] 일시 IO 오류는 복구가 아니라 재시도 소진 에러여야 함. 실제={:?}",
            result
        );

        drop(_exclusive);
        // 본 파일이 구버전 .bak로 덮어써지지 않고 rev 5 그대로 남아야 함
        let after = fs::read_to_string(&path).unwrap();
        assert!(
            after.contains(r#""_rev":5"#),
            "[수정 확인] 최신 데이터가 .bak(rev1)로 롤백되지 않아야 함. 실제={after}"
        );
    }

    // ── [§14 P2-R3 수정 확인] 스테일 임계락이 원자적으로 회수되고 잔여물이 없음 ──
    #[test]
    fn p2r3_stale_critical_lock_is_reclaimed_atomically() {
        let dir = unique_dir("p2r3_stale");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, r#"{"tabDataMap":{}}"#).unwrap();

        // 죽은 프로세스가 남긴 스테일 임계락을 재현: 락 파일 생성 후 mtime을 10초 과거로
        let crit = dir.join("data.json.critical.lock");
        fs::write(&crit, "99999").unwrap();
        let past = std::time::SystemTime::now() - Duration::from_secs(10);
        filetime::set_file_mtime(&crit, filetime::FileTime::from_system_time(past)).unwrap();

        // 회수가 원자적으로 일어나 저장이 (5초 타임아웃 없이) 즉시 성공해야 함
        let t0 = std::time::Instant::now();
        let r = save_data_inner(p, r#"{"tabDataMap":{},"x":1}"#, 0, "userA");
        assert_eq!(r, Ok(1), "스테일 임계락은 회수되고 저장이 성공해야 함");
        assert!(
            t0.elapsed() < Duration::from_secs(3),
            "회수는 타임아웃 대기 없이 즉시 이루어져야 함. 소요={:?}",
            t0.elapsed()
        );

        // 잔여물 검사: 저장 완료 후 critical.lock도 .claim.* 파일도 남아있지 않아야 함
        let leftovers: Vec<String> = fs::read_dir(&dir)
            .unwrap()
            .flatten()
            .filter_map(|e| e.file_name().to_str().map(String::from))
            .filter(|n| n.contains(".critical.lock"))
            .collect();
        assert!(
            leftovers.is_empty(),
            "회수/저장 후 락 잔여물이 없어야 함. 실제={leftovers:?}"
        );
    }

    // ── [§9 R2 수정 확인] TTL 판정이 acquiredAt(획득자 시계)이 아니라 파일 mtime 기준 ──
    #[test]
    fn r2_fixed_ttl_uses_file_mtime_not_writer_clock() {
        let dir = unique_dir("r2_mtime");
        let path = dir.join("data.json");
        let p = path.to_str().unwrap();
        fs::write(&path, "{}").unwrap();

        // 획득자 시계가 크게 어긋난 상황을 흉내: acquiredAt을 1시간 과거로 조작한 락 파일을 직접 기록
        let locks_dir = dir.join("locks");
        fs::create_dir_all(&locks_dir).unwrap();
        let skewed_acquired_at = std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            - 3600;
        let lock_content = serde_json::json!({
            "userId": "userA", "userName": "Alice",
            "acquiredAt": skewed_acquired_at, // 구식 판정이라면 즉시 만료로 오판할 값
            "ttlSeconds": LOCK_TTL_SECONDS
        });
        fs::write(locks_dir.join("item_REQ-SKEW.lock"), lock_content.to_string()).unwrap();

        // 파일은 방금 만들어졌으므로(mtime=now) mtime 기준으로는 활성이어야 함
        let active = get_active_locks_inner(p).unwrap();
        assert!(
            active.get("REQ-SKEW").is_some(),
            "[수정 확인] acquiredAt이 아무리 과거여도 파일이 방금 쓰였으면(mtime) 락은 활성. 실제={active}"
        );

        // 타 사용자 획득 시도도 mtime 기준으로 거부되어야 함
        let b = acquire_item_lock_inner(p, "REQ-SKEW", "userB", "Bob");
        assert!(
            b.is_err() && b.as_ref().unwrap_err().contains("Locked by"),
            "[수정 확인] 시계 스큐와 무관하게 신선한 락은 타 사용자를 거부. 실제={:?}",
            b
        );
    }
}
