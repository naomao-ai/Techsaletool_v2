//! 라이브러리 타깃 — 동시성/저장 코어를 테스트 가능하게 노출한다.
//! `cargo test --lib` 는 이 타깃만 컴파일하므로 Tauri 런타임/generate_context
//! 없이 순수 로직의 동시성 테스트를 실행할 수 있다.
pub mod sync_core;
