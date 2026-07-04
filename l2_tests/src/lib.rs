//! L2 동시성 테스트 진입점.
//! src-tauri의 실제 sync_core.rs를 그대로 포함하여(#[path]) 테스트한다.
#[path = "../../src-tauri/src/sync_core.rs"]
pub mod sync_core;
