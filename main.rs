// Prevents additional console window on Windows in release
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

struct AppState {
    write_lock: Mutex<()>,
}

// ① 파일 읽기 명령 — 공유 폴더 JSON 로드 및 .bak 자동 복구
#[tauri::command]
async fn read_data(path: String) -> Result<serde_json::Value, String> {
    let content = fs::read_to_string(&path);
    
    let json_val = match content {
        Ok(c) => {
            match serde_json::from_str::<serde_json::Value>(&c) {
                Ok(j) => j,
                Err(_) => {
                    // 원본 JSON 파싱 실패 시 .bak 파일로 복구 시도
                    let bak_path = format!("{}.bak", path);
                    if Path::new(&bak_path).exists() {
                        let bak_content = fs::read_to_string(&bak_path).map_err(|e| e.to_string())?;
                        let bak_json: serde_json::Value = serde_json::from_str(&bak_content).map_err(|e| e.to_string())?;
                        // 손상된 원본 덮어쓰기 (복구)
                        fs::write(&path, &bak_content).unwrap_or(());
                        bak_json
                    } else {
                        return Err("Failed to parse JSON and no backup available".to_string());
                    }
                }
            }
        },
        Err(e) => {
            // 파일이 아예 없거나 읽기 실패
            let bak_path = format!("{}.bak", path);
            if Path::new(&bak_path).exists() {
                let bak_content = fs::read_to_string(&bak_path).map_err(|e| e.to_string())?;
                let bak_json: serde_json::Value = serde_json::from_str(&bak_content).map_err(|e| e.to_string())?;
                fs::write(&path, &bak_content).unwrap_or(());
                bak_json
            } else {
                return Err(e.to_string());
            }
        }
    };
    
    let meta = fs::metadata(&path).map_err(|e| e.to_string())?;
    let modified = meta.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis();
    
    Ok(serde_json::json!({ "data": json_val, "lastModified": modified as u64 }))
}

// ② 파일 쓰기 명령 — Atomic Write + Write Queue
#[tauri::command]
async fn save_data(path: String, data: String, expected_version: u64, state: State<'_, AppState>) -> Result<u64, String> {
    let _lock = state.write_lock.lock().await; // 직렬 저장 큐
    
    // 현재 버전(수정 시각) 확인
    if let Ok(meta) = fs::metadata(&path) {
        let server_ts = meta.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        if server_ts > expected_version + 500 { // 500ms 오차 허용
            return Err("VERSION_CONFLICT".to_string());
        }
    }
    
    let tmp_path = format!("{}.tmp", &path);
    let bak_path = format!("{}.bak", &path);
    
    // 임시 파일에 기록
    fs::write(&tmp_path, &data).map_err(|e| format!("Failed to write tmp: {}", e))?;
    
    // 기존 파일이 있다면 .bak으로 복사
    if Path::new(&path).exists() {
        fs::copy(&path, &bak_path).map_err(|e| format!("Failed to create backup: {}", e))?;
    }
    
    // 임시 파일을 원본으로 원자적 교체
    fs::rename(&tmp_path, &path).map_err(|e| format!("Failed to rename tmp to original: {}", e))?;
    
    // 새 버전(수정 시각) 반환
    let new_meta = fs::metadata(&path).unwrap();
    let new_modified = new_meta.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    
    Ok(new_modified)
}

// ③ File Watcher
#[tauri::command]
async fn start_file_watcher(path: String, window: tauri::Window) -> Result<(), String> {
    std::thread::spawn(move || {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        use std::time::Duration;
        
        let (tx, rx) = mpsc::channel();
        let mut watcher = notify::recommended_watcher(tx).unwrap();
        watcher.watch(Path::new(&path), notify::RecursiveMode::NonRecursive).unwrap();
        
        let mut last_hash = 0;
        let mut last_emit = std::time::Instant::now();
        
        for event in rx {
            if let Ok(e) = event {
                if matches!(e.kind, notify::EventKind::Modify(_)) {
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

// ④ 항목 잠금 명령 — Optimistic Lock 획득
#[tauri::command]
async fn acquire_item_lock(project_path: String, item_id: String, user_id: String, user_name: String) -> Result<bool, String> {
    let path = Path::new(&project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let locks_dir = parent.join("locks");
    
    if !locks_dir.exists() {
        fs::create_dir_all(&locks_dir).map_err(|e| e.to_string())?;
    }
    
    let lock_file = locks_dir.join(format!("item_{}.lock", item_id));
    let now = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    if lock_file.exists() {
        if let Ok(content) = fs::read_to_string(&lock_file) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                let acquired_at = json["acquiredAt"].as_u64().unwrap_or(0);
                let ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                if now < acquired_at + ttl {
                    if json["userId"].as_str().unwrap_or("") != user_id {
                        return Err(format!("Locked by {}", json["userName"].as_str().unwrap_or("another user")));
                    }
                }
            }
        }
    }
    
    let lock_data = serde_json::json!({
        "userId": user_id,
        "userName": user_name,
        "acquiredAt": now,
        "ttlSeconds": 600
    });
    
    fs::write(&lock_file, lock_data.to_string()).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
async fn release_item_lock(project_path: String, item_id: String, user_id: String, force: Option<bool>) -> Result<bool, String> {
    let path = Path::new(&project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let lock_file = parent.join("locks").join(format!("item_{}.lock", item_id));
    
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

#[tauri::command]
async fn get_active_locks(project_path: String) -> Result<serde_json::Value, String> {
    let path = Path::new(&project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let locks_dir = parent.join("locks");
    
    let mut active_locks = serde_json::Map::new();
    let now = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    if locks_dir.exists() {
        if let Ok(entries) = fs::read_dir(&locks_dir) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("item_") && name.ends_with(".lock") {
                        if let Ok(content) = fs::read_to_string(&file_path) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                let acquired_at = json["acquiredAt"].as_u64().unwrap_or(0);
                                let ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                                if now >= acquired_at + ttl {
                                    // Expired lock, delete it
                                    let _ = fs::remove_file(&file_path);
                                } else {
                                    if let Some(id) = name.strip_prefix("item_").and_then(|s| s.strip_suffix(".lock")) {
                                        active_locks.insert(id.to_string(), json);
                                    }
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

#[tauri::command]
async fn append_changelog(project_path: String, log_entry: serde_json::Value) -> Result<(), String> {
    use std::io::Write;
    let path = Path::new(&project_path);
    let parent = path.parent().ok_or("Invalid path")?;
    
    // Create changelogs directory
    let logs_dir = parent.join("changelogs");
    if !logs_dir.exists() {
        fs::create_dir_all(&logs_dir).map_err(|e| e.to_string())?;
    }
    
    // Write to a daily file YYYY-MM-DD.jsonl
    let now = chrono::Local::now();
    let date_str = now.format("%Y-%m-%d").to_string();
    let log_file = logs_dir.join(format!("{}.jsonl", date_str));
    
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
    
    let log_file = parent.join("changelogs").join(format!("{}.jsonl", date_str));
    if !log_file.exists() {
        return Ok(vec![]);
    }
    
    let content = fs::read_to_string(&log_file).map_err(|e| e.to_string())?;
    let mut logs = Vec::new();
    for line in content.lines() {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
            logs.push(json);
        }
    }
    
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
    let exe_path = match app_handle.path().executable_dir() {
        Ok(dir) => dir,
        Err(_) => std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
    };
    
    let data_dir = exe_path.join("data");
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create data directory: {}", e))?;
    }
    
    let config_path = data_dir.join("server_config.json");
    let default_active_path = data_dir.join("workspace_active.json");
    
    let mut config_val = serde_json::json!({
        "activeDataPath": default_active_path.to_string_lossy().to_string()
    });
    
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) {
                if parsed.get("activeDataPath").is_some() {
                    config_val = parsed;
                }
            }
        }
    } else {
        let pretty_json = serde_json::to_string_pretty(&config_val).unwrap();
        fs::write(&config_path, pretty_json).map_err(|e| format!("Failed to write server_config.json: {}", e))?;
    }
    
    if let Some(active_path) = config_val.get("activeDataPath").and_then(|v| v.as_str()) {
        let active_path_buf = std::path::PathBuf::from(active_path);
        if !active_path_buf.exists() {
            if let Some(parent) = active_path_buf.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(&active_path_buf, "{}");
        }
    }
    
    Ok(config_val)
}

#[tauri::command]
async fn update_server_config(app_handle: tauri::AppHandle, active_path: String) -> Result<(), String> {
    let exe_path = match app_handle.path().executable_dir() {
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
async fn admin_setup_server_environment(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let exe_path = match app_handle.path().executable_dir() {
        Ok(dir) => dir,
        Err(_) => std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
    };
    
    // 1. data 폴더 생성
    let data_dir = exe_path.join("data");
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create 'data' directory: {}", e))?;
    }
    
    // 2. locks 폴더 생성
    let locks_dir = data_dir.join("locks");
    if !locks_dir.exists() {
        fs::create_dir_all(&locks_dir).map_err(|e| format!("Failed to create 'locks' directory: {}", e))?;
    }
    
    // 3. changelogs 폴더 생성
    let changelogs_dir = data_dir.join("changelogs");
    if !changelogs_dir.exists() {
        fs::create_dir_all(&changelogs_dir).map_err(|e| format!("Failed to create 'changelogs' directory: {}", e))?;
    }
    
    // 4. EXPORT 폴더 추가 (엑셀 출력 기본 경로)
    let export_dir = data_dir.join("EXPORT");
    if !export_dir.exists() {
        fs::create_dir_all(&export_dir).map_err(|e| format!("Failed to create 'EXPORT' directory: {}", e))?;
    }
    
    // 5. server_config.json 및 workspace_active.json 생성 확인
    let config_path = data_dir.join("server_config.json");
    let active_path = data_dir.join("workspace_active.json");
    
    let config_val = serde_json::json!({
        "activeDataPath": active_path.to_string_lossy().to_string()
    });
    
    // 없다면 새로 기록
    if !config_path.exists() {
        let pretty_json = serde_json::to_string_pretty(&config_val).unwrap();
        fs::write(&config_path, pretty_json).map_err(|e| format!("Failed to write server_config.json: {}", e))?;
    }
    
    if !active_path.exists() {
        fs::write(&active_path, "{}").map_err(|e| format!("Failed to write workspace_active.json: {}", e))?;
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

        // 1. If it has a drive letter, try parsing the UNC path via wmic first
        if path.len() >= 2 && path.chars().nth(1) == Some(':') {
            let drive_letter = &path[0..2]; // e.g., "Y:"
            
            // Try wmic path win32_logicaldisk where "DeviceID='Y:'" get ProviderName /value
            if let Ok(output) = std::process::Command::new("wmic")
                .args(&["path", "win32_logicaldisk", "where", &format!("DeviceID='{}'", drive_letter), "get", "ProviderName", "/value"])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Some(line) = stdout.lines().find(|l| l.trim().starts_with("ProviderName=")) {
                    let nas_root = line.trim().replace("ProviderName=", "");
                    if !nas_root.is_empty() && nas_root.starts_with(r"\\") {
                        let remainder = &path[2..]; // e.g., "\folder\data.json"
                        out_path = format!("{}{}", nas_root, remainder);
                        return Ok(out_path);
                    }
                }
            }
            
            // Fallback to powershell if wmic fails
            if let Ok(output) = std::process::Command::new("powershell")
                .args(&["-NoProfile", "-NonInteractive", "-Command", &format!("(Get-WmiObject Win32_LogicalDisk -Filter \"DeviceID='{}'\").ProviderName", drive_letter)])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                let nas_root = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !nas_root.is_empty() && nas_root.starts_with(r"\\") {
                    let remainder = &path[2..]; // e.g., "\folder\data.json"
                    out_path = format!("{}{}", nas_root, remainder);
                    return Ok(out_path);
                }
            }
            
            // Fallback to net use
            if let Ok(output) = std::process::Command::new("net")
                .args(&["use", drive_letter])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
            {
                // Parse Korean "원격 이름" or English "Remote name"
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let text = line.trim();
                    if text.contains(r"\\") {
                        if let Some(idx) = text.find(r"\\") {
                            let nas_root = &text[idx..];
                            // Usually space separated or end of line. Let's just take it if it doesn't contain space after \\
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
        
        // 2. Canonicalize fallback for non-mapped drives or just cleaning up paths
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            write_lock: Mutex::new(()),
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
            open_path_native
        ])
        .run(tauri::generate_context!())
        .expect("앱 실행 중 오류");
}
