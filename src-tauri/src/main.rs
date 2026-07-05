#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::time::UNIX_EPOCH;
use std::path::Path;
use tauri::{State, Emitter, Manager};
use notify::Watcher;
use std::sync::mpsc;
use tokio::sync::Mutex;
use std::io::Write;
use business_requirements_lib::sync_core;

struct AppState {
    write_lock: Mutex<()>,
    // 결함#7 수정: start_file_watcher가 같은 경로에 대해 중복 스레드를 스폰하는 것을 막는다.
    watched_paths: std::sync::Mutex<std::collections::HashSet<String>>,
}

// ① 파일 읽기 명령 — 공유 폴더 JSON 로드 및 .bak 자동 복구 (sync_core에 위임)
// 결함#3 수정: mtime 대신 payload 루트의 `_rev`(단조 증가 카운터)를 함께 반환한다.
// `_rev`가 없는 기존 파일은 0으로 간주(하위호환, 마이그레이션 불필요).
#[tauri::command]
async fn read_data(path: String) -> Result<serde_json::Value, String> {
    let (json_val, rev) = sync_core::read_data_inner(&path)?;
    Ok(serde_json::json!({ "data": json_val, "rev": rev }))
}

// ② 파일 쓰기 명령 — _rev 기반 CAS(compare-and-swap) + 임계구역 락 + 아이템 락 검증 (sync_core에 위임)
// 결함#3 수정: mtime 500ms 오차창 대신, 저장 직전 파일을 다시 읽어 `_rev`를 정확히 비교한다.
//   불일치 → VERSION_CONFLICT. 일치 → `_rev+1`로 원자적 기록.
// 결함#4 수정: 저장하려는 변경분이 타 사용자가 보유한 활성 아이템 락과 겹치면 ITEM_LOCKED로 거부.
// `state.write_lock`(프로세스 내부)에 더해, sync_core 내부의 임계구역 파일 락이 프로세스 간
// 상호배제까지 보장한다(결함#3 근본원인 ②).
#[tauri::command]
async fn save_data(path: String, data: String, expected_rev: u64, user_id: Option<String>, state: State<'_, AppState>) -> Result<u64, String> {
    let _lock = state.write_lock.lock().await; // 프로세스 내 직렬 저장 큐(임계구역 락과 병행, 방어적 이중화)
    sync_core::save_data_inner(&path, &data, expected_rev, &user_id.unwrap_or_default())
}

// ③ File Watcher
// 결함#7 수정(2026-07-03): 이 커맨드는 initServer/fetchData가 mount·reload·파일 열기마다
// 무조건 재호출한다. 기존에는 매 호출마다 새 감시 스레드+notify::Watcher를 무조건 스폰해
// 같은 경로에 대한 감시 스레드가 재로드 때마다 누적됐다(리소스 누수). 같은 경로를 이미
// 감시 중이면 새 스레드를 스폰하지 않고 즉시 성공 반환하도록 방지한다.
//
// 결함#7-b(핵심 원인, 2026-07-03): 기존에는 대상 **파일 자체**를 `NonRecursive`로 watch했다.
// 그런데 `save_data`는 원자적 쓰기를 위해 tmp 파일을 쓴 뒤 `rename()`으로 덮어쓴다 — rename은
// 기존 파일 핸들/inode를 새 것으로 교체하는 작업이라, 파일 자체에 바인딩된 watch가 **첫 rename
// 이후 조용히 끊길 수 있다**(운영체제/파일시스템에 따라). 그 결과 이후의 변경은 감시자가
// 감지하지 못해 "다른 사용자의 저장이 전파되지 않는" 결함으로 나타난다(L3/L4 E2E 재실행 중
// "B가 A 변경을 전파받지 못함"으로 재현). **수정: 파일이 아니라 부모 디렉터리를 watch**하고,
// 이벤트의 대상 경로들 중 우리가 감시하려는 파일이 포함된 경우에만 반응하도록 필터링한다
// (rename-지속형 파일 감시의 표준 해법 — 디렉터리 자체는 rename으로 사라지지 않으므로 watch가
// 끊기지 않는다).
#[tauri::command]
async fn start_file_watcher(path: String, window: tauri::Window, state: State<'_, AppState>) -> Result<(), String> {
    {
        let mut watched = state.watched_paths.lock().unwrap();
        if watched.contains(&path) {
            return Ok(());
        }
        watched.insert(path.clone());
    }
    std::thread::spawn(move || {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        use std::time::Duration;

        let target_path = Path::new(&path);
        let watch_dir = match target_path.parent() {
            Some(p) if !p.as_os_str().is_empty() => p.to_path_buf(),
            _ => Path::new(".").to_path_buf(),
        };
        let target_file_name = target_path.file_name().map(|n| n.to_os_string());

        let (tx, rx) = mpsc::channel();
        let mut watcher = match notify::recommended_watcher(tx) {
            Ok(w) => w,
            Err(e) => {
                let mut file = std::fs::OpenOptions::new().create(true).append(true).open("tauri_crash.log").unwrap();
                let _ = writeln!(file, "[{}] Watcher Init Error: {}", chrono::Local::now(), e);
                return;
            }
        };

        if let Err(e) = watcher.watch(&watch_dir, notify::RecursiveMode::NonRecursive) {
            let mut file = std::fs::OpenOptions::new().create(true).append(true).open("tauri_crash.log").unwrap();
            let _ = writeln!(file, "[{}] Watch Error for {}: {}", chrono::Local::now(), path, e);
            return;
        }

        let mut last_hash = 0;
        let mut last_emit = std::time::Instant::now();

        for event in rx {
            if let Ok(e) = event {
                if matches!(e.kind, notify::EventKind::Modify(_) | notify::EventKind::Create(_)) {
                    // 디렉터리 전체를 watch하므로, 우리가 감시하려는 파일과 무관한 이벤트는 무시.
                    let matches_target = e.paths.iter().any(|p| p.file_name() == target_file_name.as_deref());
                    if !matches_target {
                        continue;
                    }
                    if last_emit.elapsed() < Duration::from_millis(100) {
                        continue; // Throttling: 100ms
                    }
                    if let Ok(content) = fs::read_to_string(&path) {
                        let mut hasher = DefaultHasher::new();
                        content.hash(&mut hasher);
                        let hash = hasher.finish();

                        if hash != last_hash {
                            last_hash = hash;
                            last_emit = std::time::Instant::now();
                            let _ = window.emit("shared-file-changed", &path);
                        }
                    }
                }
            }
        }
    });
    Ok(())
}

// ④ 항목 잠금 명령 — Optimistic Lock 획득 (sync_core에 위임, 결함#4 수정으로 save_data와 연동됨)
#[tauri::command]
async fn acquire_item_lock(project_path: String, item_id: String, user_id: String, user_name: String) -> Result<bool, String> {
    sync_core::acquire_item_lock_inner(&project_path, &item_id, &user_id, &user_name)
}

#[tauri::command]
async fn release_item_lock(project_path: String, item_id: String, user_id: String, force: Option<bool>) -> Result<bool, String> {
    sync_core::release_item_lock_inner(&project_path, &item_id, &user_id, force)
}

#[tauri::command]
async fn get_active_locks(project_path: String) -> Result<serde_json::Value, String> {
    sync_core::get_active_locks_inner(&project_path)
}

// [§14 R4 최적화] changelog 동시 append 경합 제거 — 사용자별 파일 분리.
// 기존에는 10명이 같은 `날짜.jsonl`에 무잠금 append하여 SMB에서 라인 인터리브/유실이
// 가능했다(§9 R4). 이제 각 사용자가 자기 파일(`날짜_사용자ID.jsonl`)에만 append하므로
// 파일당 작성자가 1명 = 경합이 원천 제거된다. 읽기는 해당 날짜의 모든 파일(레거시
// `날짜.jsonl` 포함)을 집계해 timestamp로 정렬 — 하위호환 유지.
#[tauri::command]
async fn append_changelog(project_path: String, log_entry: serde_json::Value) -> Result<(), String> {
    use std::io::Write;
    let path = Path::new(&project_path);
    let parent = path.parent().ok_or("Invalid path")?;

    let logs_dir = parent.join("changelogs");
    if !logs_dir.exists() {
        fs::create_dir_all(&logs_dir).map_err(|e| e.to_string())?;
    }

    let now = chrono::Local::now();
    let date_str = now.format("%Y-%m-%d").to_string();
    let user_id = log_entry
        .get("userId")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    // 파일명 안전 인코딩(결함#8과 동일 규칙) — userId에 금지 문자가 있어도 안전
    let log_file = logs_dir.join(format!(
        "{}_{}.jsonl",
        date_str,
        sync_core::encode_lock_id(user_id)
    ));

    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_file)
        .map_err(|e| e.to_string())?;

    writeln!(file, "{}", log_entry.to_string()).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn read_changelog(project_path: String, date_str: String) -> Result<Vec<serde_json::Value>, String> {
    let path = Path::new(&project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let logs_dir = parent.join("changelogs");
    if !logs_dir.exists() {
        return Ok(vec![]);
    }

    // 해당 날짜의 모든 changelog 파일 집계: 레거시 `날짜.jsonl` + 사용자별 `날짜_*.jsonl`
    let legacy_name = format!("{}.jsonl", date_str);
    let user_prefix = format!("{}_", date_str);
    let mut logs = Vec::new();
    if let Ok(entries) = fs::read_dir(&logs_dir) {
        for entry in entries.flatten() {
            let file_path = entry.path();
            let Some(name) = file_path.file_name().and_then(|n| n.to_str()) else { continue };
            let matches = name == legacy_name
                || (name.starts_with(&user_prefix) && name.ends_with(".jsonl"));
            if !matches {
                continue;
            }
            if let Ok(content) = fs::read_to_string(&file_path) {
                for line in content.lines() {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                        logs.push(json);
                    }
                }
            }
        }
    }
    // 여러 파일에서 모았으므로 timestamp로 시간순 정렬(뷰어 표시 순서 보존)
    logs.sort_by_key(|l| l.get("timestamp").and_then(|t| t.as_u64()).unwrap_or(0));

    Ok(logs)
}

#[tauri::command]
async fn save_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    let path_buf = std::path::PathBuf::from(&path);
    if let Some(parent) = path_buf.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, contents).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_server_config(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let exe_path = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
    };
    
    let config_path = exe_path.join("data").join("server_config.json");
    
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) {
                if parsed.get("activeDataPath").is_some() {
                    return Ok(parsed);
                }
            }
        }
    }
    
    Err("SERVER_NOT_SETUP".to_string())
}

#[tauri::command]
async fn update_server_config(app_handle: tauri::AppHandle, active_path: String) -> Result<(), String> {
    let exe_path = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
    };
    
    let data_dir = exe_path.join("data");
    if !data_dir.exists() {
        let _ = fs::create_dir_all(&data_dir);
    }
    let config_path = data_dir.join("server_config.json");
    
    let new_config = serde_json::json!({
        "activeDataPath": active_path
    });
    let pretty_json = serde_json::to_string_pretty(&new_config).unwrap();
    fs::write(&config_path, pretty_json).map_err(|e| format!("Failed to update server_config.json: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn admin_setup_server_environment(app_handle: tauri::AppHandle, project_name: String) -> Result<serde_json::Value, String> {
    let exe_path = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
    };
    
    let data_dir = exe_path.join("data");
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create 'data' directory: {}", e))?;
    }
    
    let locks_dir = data_dir.join("locks");
    if !locks_dir.exists() {
        fs::create_dir_all(&locks_dir).map_err(|e| format!("Failed to create 'locks' directory: {}", e))?;
    }
    
    let changelogs_dir = data_dir.join("changelogs");
    if !changelogs_dir.exists() {
        fs::create_dir_all(&changelogs_dir).map_err(|e| format!("Failed to create 'changelogs' directory: {}", e))?;
    }
    
    let export_dir = data_dir.join("EXPORT");
    if !export_dir.exists() {
        fs::create_dir_all(&export_dir).map_err(|e| format!("Failed to create 'EXPORT' directory: {}", e))?;
    }
    
    let config_path = data_dir.join("server_config.json");
    
    let base_name = if project_name.trim().is_empty() {
        "workspace_active".to_string()
    } else {
        project_name.trim().to_string()
    };
    
    let active_path = data_dir.join(format!("{}.json", base_name));
    
    let config_val = serde_json::json!({
        "activeDataPath": active_path.to_string_lossy().to_string()
    });
    
    let pretty_json = serde_json::to_string_pretty(&config_val).unwrap();
    fs::write(&config_path, pretty_json).map_err(|e| format!("Failed to write server_config.json: {}", e))?;
    
    if !active_path.exists() {
        fs::write(&active_path, "{}").map_err(|e| format!("Failed to write .json: {}", e))?;
    }
    
    Ok(serde_json::json!({
        "status": "success",
        "executableDir": exe_path.to_string_lossy().to_string(),
        "configPath": config_path.to_string_lossy().to_string(),
        "activeDataPath": active_path.to_string_lossy().to_string(),
        "exportDir": export_dir.to_string_lossy().to_string()
    }))
}

#[tauri::command]
fn convert_to_unc_path(path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut out_path = path.clone();

        if path.len() >= 2 && path.chars().nth(1) == Some(':') {
            let drive_letter = &path[0..2];
            
            if let Ok(output) = std::process::Command::new("wmic")
                .args(&["path", "win32_logicaldisk", "where", &format!("DeviceID='{}'", drive_letter), "get", "ProviderName", "/value"])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Some(line) = stdout.lines().find(|l| l.trim().starts_with("ProviderName=")) {
                    let nas_root = line.trim().replace("ProviderName=", "");
                    if !nas_root.is_empty() && nas_root.starts_with(r"\\") {
                        let remainder = &path[2..];
                        out_path = format!("{}{}", nas_root, remainder);
                        return Ok(out_path);
                    }
                }
            }
            
            if let Ok(output) = std::process::Command::new("powershell")
                .args(&["-NoProfile", "-NonInteractive", "-Command", &format!("(Get-WmiObject Win32_LogicalDisk -Filter \"DeviceID='{}'\").ProviderName", drive_letter)])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                let nas_root = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !nas_root.is_empty() && nas_root.starts_with(r"\\") {
                    let remainder = &path[2..];
                    out_path = format!("{}{}", nas_root, remainder);
                    return Ok(out_path);
                }
            }
            
            if let Ok(output) = std::process::Command::new("net")
                .args(&["use", drive_letter])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let text = line.trim();
                    if text.contains(r"\\") {
                        if let Some(idx) = text.find(r"\\") {
                            let nas_root = &text[idx..];
                            let nas_root: String = nas_root.split_whitespace().next().unwrap_or(nas_root).to_string();
                            if !nas_root.is_empty() && nas_root.starts_with(r"\\") {
                                let remainder = &path[2..];
                                out_path = format!("{}{}", nas_root, remainder);
                                return Ok(out_path);
                            }
                        }
                    }
                }
            }
        }
        
        if let Ok(canonical) = fs::canonicalize(&out_path) {
            let canon_str = canonical.to_string_lossy().to_string();
            if canon_str.starts_with(r"\\?\UNC\") {
                let unc_path = canon_str.replacen(r"\\?\UNC\", r"\\", 1);
                return Ok(unc_path);
            } else if canon_str.starts_with(r"\\?\") {
                let local_path = canon_str.replacen(r"\\?\", "", 1);
                return Ok(local_path);
            }
        }
        
        return Ok(out_path);
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Ok(path)
    }
}

#[tauri::command]
async fn open_path_native(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let cmd = if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
        std::process::Command::new(cmd)
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

// ⑨ 앱 종료 커맨드 (Tauri Window Control 보완)
#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}

#[tauri::command]
async fn copy_file_native(source: String, dest: String) -> Result<(), String> {
    std::fs::copy(&source, &dest).map_err(|e| format!("Failed to copy file: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn check_file_exists_native(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

#[tauri::command]
async fn get_file_modified_time_native(path: String) -> Result<u64, String> {
    if let Ok(meta) = fs::metadata(&path) {
        if let Ok(modified) = meta.modified() {
            if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                return Ok(duration.as_millis() as u64);
            }
        }
    }
    Err("Failed to get modified time".to_string())
}

fn main() {
    std::panic::set_hook(Box::new(|panic_info| {
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open("tauri_crash.log")
            .unwrap_or_else(|_| std::fs::File::create("tauri_crash.log").unwrap());
            
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
        let _ = writeln!(file, "[{}] App Panicked!", timestamp);
        if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            let _ = writeln!(file, "Message: {}", s);
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            let _ = writeln!(file, "Message: {}", s);
        }
        if let Some(location) = panic_info.location() {
            let _ = writeln!(file, "Location: {}:{}", location.file(), location.line());
        }
        let _ = writeln!(file, "--------------------------------------------------");
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            write_lock: Mutex::new(()),
            watched_paths: std::sync::Mutex::new(std::collections::HashSet::new()),
        })
        .invoke_handler(tauri::generate_handler![
            read_data,
            save_data,
            start_file_watcher,
            acquire_item_lock,
            release_item_lock,
            get_active_locks,
            append_changelog,
            read_changelog,
            save_binary_file,
            get_server_config,
            update_server_config,
            admin_setup_server_environment,
            convert_to_unc_path,
            open_path_native,
            exit_app,
            copy_file_native,
            check_file_exists_native,
            get_file_modified_time_native
        ])
        .run(tauri::generate_context!())
        .expect("앱 실행 중 오류");
}
