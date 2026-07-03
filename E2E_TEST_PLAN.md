# Techsaletool_v2 — E2E 테스트 계획

작성일: 2026-07-01  
대상 앱: Business Requirements (Tauri 2.0 데스크톱 앱)  
레포: https://github.com/naomao-ai/Techsaletool_v2

---

## 1. 프로젝트 스택 & 구조 요약

| 구분 | 내용 |
|------|------|
| 프론트엔드 | React 19, TypeScript, Vite 6, TailwindCSS 4 |
| 데스크톱 래퍼 | Tauri 2.0 (`tauri v2.0.0`) |
| Rust 백엔드 | tokio, notify (파일 감시), chrono, serde_json |
| 웹 서버 (대체 모드) | Express 4 + Socket.IO 4 (포트 3000) |
| 가상 스크롤 | @tanstack/react-virtual |
| 차트 | recharts |
| 빌드 플러그인 | vite-plugin-singlefile (단일 HTML 번들) |

### 주요 Rust IPC 명령어 (Tauri `invoke`)

| 명령어 | 기능 |
|--------|------|
| `read_data` | JSON 파일 읽기 + .bak 자동 복구 |
| `save_data` | Atomic Write + 버전 충돌 감지 (`VERSION_CONFLICT`) |
| `start_file_watcher` | notify 기반 파일 변경 감지 이벤트 발행 |
| `acquire_item_lock` / `release_item_lock` | Optimistic Lock 획득/해제 |
| `get_active_locks` | 활성 잠금 목록 조회 |
| `append_changelog` / `read_changelog` | JSONL 이력 파일 기록/조회 |
| `get_server_config` / `update_server_config` | 앱 데이터 경로 설정 |
| `admin_setup_server_environment` | 초기 디렉토리 구조 생성 |
| `convert_to_unc_path` | NAS 공유 드라이브 UNC 경로 변환 |

---

## 2. 빌드 사전요건 점검 결과

### ✅ 설치된 항목
| 항목 | 버전 | 비고 |
|------|------|------|
| Node.js | v26.2.0 | 정상 |
| npm | v11.13.0 | 정상 |
| Visual Studio Community 2022 | — | MSVC C++ 빌드 도구 제공 |
| WebView2 | v149.0.4022.98 | Windows 11 기본 내장 (Tauri 필수) |

### ❌ 미설치 항목 (Tauri 네이티브 빌드 차단)
| 항목 | 설치 방법 |
|------|----------|
| **Rust 툴체인 (rustup)** | https://rustup.rs 에서 `rustup-init.exe` 실행 후 stable 설치 |
| **Tauri CLI** | Rust 설치 후 `cargo install tauri-cli` 또는 `npm install -D @tauri-apps/cli` |
| **npm 의존성** | 프로젝트 루트에서 `npm install` 실행 필요 |

### Rust 설치 절차 (사람이 직접 해야 하는 단계)
```
1. https://rustup.rs 접속 → rustup-init.exe 다운로드 실행
2. 설치 옵션: "1) Proceed with standard installation" 선택
3. VS 2022 C++ 빌드 도구 워크로드 확인
   (Visual Studio Installer → "C++를 사용한 데스크톱 개발" 체크)
4. 터미널 재시작 후 `rustc --version` 확인
5. npm 의존성 설치: cd C:\01.claude\Techsaletool_v2 && npm install
6. Tauri CLI 설치: npm install -D @tauri-apps/cli
```

### 빌드 시도 결과
- Rust 미설치로 인해 `npm run tauri:dev` 실행 불가 (차단됨)
- 웹 모드(`npm run dev` → Express + Vite 서버, 포트 3000)는 Rust 없이도 실행 가능하며, 이를 E2E 테스트 1단계로 활용

---

## 3. 앱 주요 화면 & 기능 목록

| 화면/탭 ID | 표시명 | 위젯 구성 |
|-----------|--------|----------|
| `requirements` | 요구조건 분석 | 통계 카드 + 스프레드시트 |
| `ce_dashboard_example` | CE 대시보드 | CE 대시보드 + 스프레드시트 |
| `inflation_dates` | 호선일정 | 타임라인 + 스프레드시트 |
| `board_menu` | 보드 (칸반) | BoardPage |
| `settings_menu` | 설정 | SettingsPage |

### 핵심 기능
- **스프레드시트**: 가상 스크롤, 인라인 셀 편집, 열 추가/삭제/순서 변경, 담당자 지정
- **실시간 협업**: 파일 감시 + Optimistic Lock으로 동시 편집 감지
- **스마트 머지**: 3-way 머지 (기준/내/상대방) + 충돌 모달 해결
- **파일 I/O**: JSON 데이터 저장/불러오기, .bak 자동 백업, 일자별 신규 파일 생성 알림
- **변경이력**: JSONL 기반 날짜별 작업 로그 조회
- **Excel 내보내기**: ExcelJS 기반
- **HTML 오프라인 내보내기**: vite-plugin-singlefile 번들

---

## 4. 추천 E2E 테스트 도구 및 이유

### 전략: 2단계 접근

#### 1단계 — **Playwright + 웹 모드** (즉시 시작 가능, Rust 불필요)

```
장점:
- Rust 없이 npm run dev(Express + Vite)로 http://localhost:3000 테스트
- Playwright의 풍부한 API (screenshot, locator, waitForSelector 등)
- CI 파이프라인 통합 용이 (GitHub Actions)
- React 컴포넌트 대부분의 UI 로직 검증 가능

단점:
- Tauri IPC(invoke) 호출은 웹 모드에서 폴백(Express API) 동작
- 네이티브 다이얼로그(save/open 파일 선택기) 테스트 불가
```

#### 2단계 — **WebdriverIO + tauri-driver** (Rust 설치 후 네이티브 앱 테스트)

```
장점:
- Tauri 공식 WebDriver 지원 (tauri-driver는 Tauri v1 공식 지원, v2에서도 동작)
- invoke 명령어, 파일 시스템 접근, 네이티브 창 제어 테스트 가능
- W3C WebDriver 표준 준수 → Selenium 호환

단점:
- tauri-driver 설치 필요: cargo install tauri-driver
- 빌드된 앱 바이너리 필요 (tauri build 선행)
- 설정 복잡도 높음
```

#### 추천 최종 스택
```
npm 패키지:
  @playwright/test   — UI/기능 E2E 테스트 (1단계)
  webdriverio        — 네이티브 Tauri E2E 테스트 (2단계)
  @tauri-apps/cli    — 빌드 도구

테스트 구조:
  tests/
    e2e/
      web/           ← Playwright (웹 모드)
        ├── app-launch.spec.ts
        ├── spreadsheet.spec.ts
        ├── tabs.spec.ts
        ├── settings.spec.ts
        └── export.spec.ts
      native/        ← WebdriverIO (Tauri 모드)
        ├── file-operations.spec.ts
        ├── file-watcher.spec.ts
        └── conflict-merge.spec.ts
```

---

## 5. 핵심 테스트 시나리오 목록

### 우선순위 P1 — Critical (앱의 핵심 가치, 반드시 통과)

| # | 시나리오 | 검증 포인트 |
|---|---------|------------|
| P1-01 | 앱 초기 로딩 | 1280×800 창 열림, "요구조건 분석" 기본 탭 활성화, 스프레드시트 렌더링 |
| P1-02 | 초기 데이터 경로 미설정 시 설정 탭 자동 이동 | settings_menu 탭 자동 전환 확인 |
| P1-03 | 데이터 경로 설정 및 저장 | SettingsPage에서 경로 입력 → 저장 → 데이터 로드 |
| P1-04 | 스프레드시트 셀 클릭 → 편집 모드 진입 | 클릭 시 input 활성화 확인 |
| P1-05 | 셀 값 편집 후 Tab/Enter로 커밋 | 편집값 테이블에 반영, 저장 트리거(1초 debounce) |
| P1-06 | 행 추가 | 신규 행 생성 및 스프레드시트에 표시 |
| P1-07 | 행 삭제 | 선택 행 삭제 후 테이블에서 제거 |
| P1-08 | 탭 전환 (요구조건 → CE 대시보드 → 호선일정) | 각 탭 콘텐츠 정상 렌더링 |
| P1-09 | JSON 파일 저장 (웹 모드) | /api/save-to-path API 호출 성공, 파일 내용 검증 |
| P1-10 | JSON 파일 불러오기 (웹 모드) | /api/load-from-path API 호출 성공, 데이터 복원 |

### 우선순위 P2 — High (주요 비즈니스 기능)

| # | 시나리오 | 검증 포인트 |
|---|---------|------------|
| P2-01 | CE 대시보드 차트 렌더링 | recharts 컴포넌트 SVG 렌더링, 비교호선 패널 표시 |
| P2-02 | 통계 카드 — 담당자별 집계 | 요구조건 수 변경 시 카드 수치 업데이트 |
| P2-03 | 통계 카드 클릭 → 스프레드시트 필터 연동 | DashboardFilter 적용, 필터된 행만 표시 |
| P2-04 | 타임라인 대시보드 렌더링 | 호선일정 탭에서 타임라인 표시 |
| P2-05 | 열 추가 (커스텀 컬럼) | 컬럼 추가 후 스프레드시트 헤더 반영 |
| P2-06 | 열 삭제 | 컬럼 삭제 후 헤더에서 제거 |
| P2-07 | 담당자 추가/지정 | 담당자 풀에서 선택, 행에 아바타 표시 |
| P2-08 | Excel 내보내기 | /api/export-excel 호출 → .xlsx 파일 다운로드 |
| P2-09 | HTML 오프라인 내보내기 | /api/download-offline 호출 → .html 파일 다운로드 |
| P2-10 | 변경이력 조회 | dbPath 설정된 상태에서 "실시간 작업 이력 확인" 버튼 → 로그 표시 |
| P2-11 | 충돌 모달 표시 (시뮬레이션) | `pendingMergeData` 강제 주입 후 ConflictModal 렌더링 |
| P2-12 | 충돌 해결 — 내 버전 선택 | "내 버전으로 덮어쓰기" 선택 후 데이터 반영 |
| P2-13 | 대시보드 제목/설명 인라인 편집 | 입력값 수정 → tabs 상태 업데이트 |

### 우선순위 P3 — Medium (품질/편의 기능)

| # | 시나리오 | 검증 포인트 |
|---|---------|------------|
| P3-01 | Ctrl+휠 줌 인/아웃 | document.body.style.zoom 값 변경 확인 |
| P3-02 | 레이아웃 설정 메뉴 열기/닫기 | 드롭다운 표시, 외부 클릭 시 닫힘 |
| P3-03 | 위젯 체크박스 토글 (통계 카드 숨기기) | stats 위젯 언체크 → StatsCards 사라짐 |
| P3-04 | 탭 이름 더블클릭 → 인라인 편집 | 사이드바 탭 레이블 변경 |
| P3-05 | 피드백(Coming Soon) 모달 열기/제출 | 폼 submit → 성공 토스트 표시 |
| P3-06 | 앱 이름 네이버 바에서 변경 | appName 상태 업데이트 |
| P3-07 | 오프라인 모드 (localStorage 저장/복원) | 페이지 새로고침 후 데이터 유지 |
| P3-08 | 대용량 스프레드시트 가상 스크롤 성능 | 100행 이상에서 렌더링 시간 측정 |
| P3-09 | 보드(칸반) 탭 렌더링 | board_menu 전환, 항목 표시 |

### 우선순위 P4 — Tauri 전용 (네이티브 빌드 후)

| # | 시나리오 | 검증 포인트 |
|---|---------|------------|
| P4-01 | 파일 열기 다이얼로그 | tauri-plugin-dialog의 open() 호출 |
| P4-02 | 파일 저장 다이얼로그 (Save As) | save() 호출 후 handleTauriSave 완료 |
| P4-03 | 파일 감시자 동작 | 외부에서 JSON 파일 수정 → shared-file-changed 이벤트 수신 |
| P4-04 | 스마트 머지 실행 | executeSmartMerge 함수 호출, 자동 병합 확인 |
| P4-05 | Optimistic Lock 획득 | acquire_item_lock 성공, 타 사용자 차단 확인 |
| P4-06 | 일자별 신규 파일 생성 알림 | 파일 날짜가 오늘과 다를 때 ask 다이얼로그 표시 |
| P4-07 | NAS UNC 경로 변환 | 드라이브 문자 경로 → \\\\server\\share 변환 |
| P4-08 | .bak 자동 복구 | 손상된 JSON 파일 → .bak에서 복구 |
| P4-09 | Atomic Write 및 VERSION_CONFLICT | 동시 저장 시 충돌 에러 발생 확인 |

---

## 6. 테스트 환경 구성 방법

### 1단계: 웹 모드 (즉시 시작 가능)

```bash
# 1. 의존성 설치
cd C:\01.claude\Techsaletool_v2
npm install

# 2. Playwright 설치
npm install -D @playwright/test
npx playwright install chromium

# 3. Playwright 설정 파일 생성
# playwright.config.ts 참고 (아래)

# 4. 개발 서버 실행
npm run dev   # Express + Vite → http://localhost:3000

# 5. (별도 터미널) 테스트 실행
npx playwright test tests/e2e/web/
```

#### `playwright.config.ts` (추천 설정)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/web',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { channel: 'chromium' } },
  ],
});
```

#### 테스트 예시 — P1-01 앱 초기 로딩
```typescript
// tests/e2e/web/app-launch.spec.ts
import { test, expect } from '@playwright/test';

test('앱 초기 로딩 — 요구조건 분석 탭 기본 표시', async ({ page }) => {
  await page.goto('/');
  // 사이드바에 기본 탭 3개 표시
  await expect(page.getByText('요구조건 분석')).toBeVisible();
  await expect(page.getByText('CE 대시보드')).toBeVisible();
  await expect(page.getByText('호선일정')).toBeVisible();
  // 스프레드시트 테이블 렌더링
  await expect(page.locator('[data-testid="spreadsheet"]')).toBeVisible({ timeout: 10_000 });
});

test('탭 전환 — CE 대시보드', async ({ page }) => {
  await page.goto('/');
  await page.getByText('CE 대시보드').click();
  await expect(page.getByText('CE 대시보드').first()).toBeVisible();
});
```

### 2단계: Tauri 네이티브 테스트 (Rust 설치 후)

```bash
# 1. Rust 설치 후 tauri-driver 설치
cargo install tauri-driver

# 2. 앱 빌드 (테스트 바이너리 생성)
npm run build
npx tauri build

# 3. WebdriverIO 설치
npm install -D webdriverio @wdio/cli @wdio/local-runner @wdio/mocha-framework

# 4. WebdriverIO 설정
npx wdio config  # 대화형 설정 또는 아래 wdio.conf.ts 직접 작성

# 5. 테스트 실행 (tauri-driver는 자동 시작)
npx wdio run wdio.conf.ts
```

#### `wdio.conf.ts` 핵심 설정
```typescript
import type { Options } from '@wdio/types';
import { spawn, spawnSync } from 'child_process';

// tauri-driver 프로세스 관리
let tauriDriver: ReturnType<typeof spawn>;

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./tests/e2e/native/**/*.spec.ts'],
  capabilities: [{
    maxInstances: 1,
    'tauri:options': {
      application: './src-tauri/target/release/business-requirements.exe',
    },
    browserName: '',
  }],
  services: ['tauri'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { timeout: 60_000 },
  before: () => {
    // tauri-driver 별도 시작 (포트 4444)
    tauriDriver = spawn('tauri-driver', [], { stdio: [null, process.stdout, process.stderr] });
  },
  after: () => {
    tauriDriver?.kill();
  },
};
```

---

## 7. 식별된 잠재적 문제점 & 테스트 포커스

코드 분석에서 발견한 취약 지점:

| # | 문제 | 근거 | 테스트 방법 |
|---|------|------|------------|
| 1 | `VERSION_CONFLICT` 경쟁 조건 | `save_data` 500ms 허용 오차 | 두 클라이언트 동시 저장 시뮬레이션 |
| 2 | 파일 감시자 스레드 누수 | `start_file_watcher`가 스레드 spawn만 하고 cleanup 없음 | 파일 경로 변경 시 구 감시자 종료 여부 확인 |
| 3 | TTL 초과 잠금 파일 처리 | 15초 cap인데 `get_active_locks`에서만 cleanup | 15초 경과 후 잠금 자동 해제 확인 |
| 4 | 대시보드 필터 소비 후 null 처리 | `onDashboardFilterConsumed` 콜백 | 필터 클릭 → 스프레드시트 적용 → null 복원 확인 |
| 5 | 초기화 완료 전 저장 트리거 | `initCompleteData.current` 체크 | 초기 로딩 중 데이터 변경 시 이중 저장 방지 |
| 6 | UNC 경로 변환 실패 시 원본 반환 | wmic/powershell/net use 3중 폴백 | 로컬 드라이브와 네트워크 드라이브 각각 테스트 |
| 7 | CE 대시보드 `ceDashboardConfigs` 마이그레이션 | 기존 탭에 설정 없을 경우 하드코딩 주입 | 빈 configs로 저장된 파일 불러오기 |
| 8 | 페이지 새로고침 시 `window.location.reload()` | 설정 저장 후 강제 reload | 데이터 유실 없이 reload 확인 |
| 9 | 가상 스크롤 성능 | @tanstack/react-virtual | 500행 이상 렌더링 시 스크롤 성능 측정 |
| 10 | beforeunload flush race condition | localStorage.setItem 동기 호출 | 탭 닫기 시 최신 데이터 보존 확인 |

---

## 8. CI 파이프라인 구성 예시 (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-web:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test tests/e2e/web/
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  e2e-native:
    runs-on: windows-latest
    needs: e2e-web  # 웹 테스트 통과 후 실행
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm install
      - run: npx tauri build
      - run: cargo install tauri-driver
      - run: npx wdio run wdio.conf.ts
```

---

## 9. 다음 실행 단계 요약

```
즉시 시작 (Rust 불필요):
  1. npm install                           — 의존성 설치
  2. npm install -D @playwright/test       — Playwright 추가
  3. npx playwright install chromium      — 브라우저 설치
  4. tests/e2e/web/ 디렉토리 생성 및 P1 시나리오 작성
  5. npm run dev & npx playwright test    — 테스트 실행

Rust 설치 후 (네이티브 앱 테스트):
  6. rustup 설치 (https://rustup.rs)
  7. npm run tauri:dev                    — 개발 빌드 실행 확인
  8. npx tauri build                      — 릴리즈 빌드
  9. cargo install tauri-driver           — WebDriver 설치
  10. tests/e2e/native/ P4 시나리오 작성
```
