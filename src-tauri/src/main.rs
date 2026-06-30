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

struct AppState {
    write_lock: Mutex<()>,
}

// ① 파일 읽기 명령 — 공유 폴더 JSON 로드 및 .bak 자동 복구
#[tauri::command]
async fn read_data(path: String) -> Result<serde_json::Value, String> {
    let content = fs::read_to_string(&path);
    
    let json_val = match content {
        Ok(c) => match serde_json::from_str::<serde_json::Value>(&c) {
            Ok(j) => j,
            Err(_) => {
                let bak_path = format!("{}.bak", path);
                if Path::new(&bak_path).exists() {
                    let bak_content = fs::read_to_string(&bak_path).map_err(|e| e.to_string())?;
                    let bak_json: serde_json::Value = serde_json::from_str(&bak_content).map_err(|e| e.to_string())?;
                    fs::write(&path, &bak_content).unwrap_or(());
                    bak_json
                } else {
                    return Err("Failed to parse JSON and no backup available".to_string());
                }
            }
        },
        Err(e) => {
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
    
    if let Ok(meta) = fs::metadata(&path) {
        let server_ts = meta.modified().unwrap().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        if server_ts > expected_version + 500 { // 500ms 오차 허용
            return Err("VERSION_CONFLICT".to_string());
        }
    }
    
    let tmp_path = format!("{}.tmp", &path);
    let bak_path = format!("{}.bak", &path);
    
    fs::write(&tmp_path, &data).map_err(|e| format!("Failed to write tmp: {}", e))?;
    
    if Path::new(&path).exists() {
        fs::copy(&path, &bak_path).map_err(|e| format!("Failed to create backup: {}", e))?;
    }
    
    fs::rename(&tmp_path, &path).map_err(|e| format!("Failed to rename tmp to original: {}", e))?;
    
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
        let mut watcher = match notify::recommended_watcher(tx) {
            Ok(w) => w,
            Err(e) => {
                let mut file = std::fs::OpenOptions::new().create(true).append(true).open("tauri_crash.log").unwrap();
                let _ = writeln!(file, "[{}] Watcher Init Error: {}", chrono::Local::now(), e);
                return;
            }
        };
        
        if let Err(e) = watcher.watch(Path::new(&path), notify::RecursiveMode::NonRecursive) {
            let mut file = std::fs::OpenOptions::new().create(true).append(true).open("tauri_crash.log").unwrap();
            let _ = writeln!(file, "[{}] Watch Error for {}: {}", chrono::Local::now(), path, e);
            return;
        }
        
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
                let mut ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                if ttl > 15 {
                    ttl = 15; // Cap legacy long locks
                }
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
        "ttlSeconds": 15
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
                                let mut ttl = json["ttlSeconds"].as_u64().unwrap_or(600);
                                if ttl > 15 {
                                    ttl = 15; // Cap legacy long locks
                                }
                                if now >= acquired_at + ttl {
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
    
    let logs_dir = parent.join("changelogs");
    if !logs_dir.exists() {
        fs::create_dir_all(&logs_dir).map_err(|e| e.to_string())?;
    }
    
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
