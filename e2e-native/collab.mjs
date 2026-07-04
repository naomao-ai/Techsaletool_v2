// L3 네이티브 2-인스턴스 협업/충돌 E2E (tauri-driver 없이 CDP attach).
//
// 두 Tauri 인스턴스를 서로 다른 디버깅 포트/WebView2 데이터폴더로,
// 동일 CWD(→ 동일 공유파일 data/workspace_active.json)로 실행.
// 각 인스턴스에서 온보딩(공유경로 설정)을 완료한 뒤 협업/충돌 시나리오 구동.
//
// 실행:  node e2e-native/collab.mjs
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const SHARED = path.join(PROJECT, "data\\workspace_active.json");
const LOCKS = path.join(PROJECT, "data\\locks");
const SHARED_PATH_FOR_APP = "C:\\01.claude\\Techsaletool_v2\\data\\workspace_active.json";
const EXPORT_DIR_FOR_APP = "C:\\01.claude\\Techsaletool_v2\\data";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

function launch(port, dataFolder) {
  const env = {
    ...process.env,
    WEBVIEW2_USER_DATA_FOLDER: dataFolder,
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`,
  };
  const c = spawn(EXE, [], { cwd: PROJECT, env, detached: true, stdio: "ignore" });
  c.unref();
  return c;
}

async function waitCDP(port, timeoutMs = 40000) {
  const dl = Date.now() + timeoutMs;
  while (Date.now() < dl) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return; } catch {}
    await sleep(500);
  }
  throw new Error(`CDP ${port} 미응답`);
}

async function attach(port) {
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null });
  for (let i = 0; i < 20; i++) {
    const pages = await browser.pages();
    const pg = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];
    if (pg) return { browser, page: pg };
    await sleep(300);
  }
  throw new Error(`포트 ${port} 페이지 없음`);
}

// React 제어 input에 값 주입 (native setter + input 이벤트)
async function setInputByPlaceholder(page, placeholderSub, value) {
  return page.evaluate(({ placeholderSub, value }) => {
    const setNativeValue = (el, val) => {
      const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
      desc.set.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const inp = [...document.querySelectorAll("input,textarea")].find((i) => (i.placeholder || "").includes(placeholderSub));
    if (!inp) return false;
    inp.focus();
    setNativeValue(inp, value);
    inp.blur();
    return true;
  }, { placeholderSub, value });
}

async function getInputByPlaceholder(page, placeholderSub) {
  return page.evaluate((placeholderSub) => {
    const inp = [...document.querySelectorAll("input,textarea")].find((i) => (i.placeholder || "").includes(placeholderSub));
    return inp ? inp.value : null;
  }, placeholderSub);
}

async function invokeRaw(page, cmd, args) {
  return page.evaluate(async ({ cmd, args }) => {
    try {
      const res = await window.__TAURI_INTERNALS__.invoke(cmd, args);
      return { ok: true, res };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }, { cmd, args });
}

// 결함 진단(§5.8): Rust get_server_config가 activeDataPath를 반환하지 않으면
// App.tsx(L514-517)가 rawConfig만 보고 무조건 setCurrentTab("settings_menu")를 호출한다.
// 이는 localStorage(app_config)의 activeDataPath 유무와 무관하게 실행되므로,
// localStorage 주입만으로는 설정화면을 "건너뛸" 수 없다 — 화면 전환은 강제되지만
// 데이터(fetchData)는 병합된 config(activeDataPath 포함)로 백그라운드에서 정상 로드된다.
// 따라서: localStorage에 activeDataPath 주입 → reload → 그래도 설정화면이면
// 사이드바 첫 탭(#sidebar-item-requirements)을 클릭해 데이터 화면으로 전환한다.
async function onboard(page, tag) {
  await page.evaluate(({ dataPath, exportDir }) => {
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem("app_config") || "{}"); } catch {}
    cfg.activeDataPath = dataPath;
    cfg.excelExportPath = exportDir;
    localStorage.setItem("app_config", JSON.stringify(cfg));
  }, { dataPath: SHARED_PATH_FOR_APP, exportDir: EXPORT_DIR_FOR_APP });

  // 결함#5 수정 이후 Rust 측 server_config.json(%APPDATA%\com.business.requirements\data\,
  // 머신 전역·이전 L4 실행 등 다른 세션과도 공유됨)이 남아있으면 rawConfig가 activeDataPath를
  // 항상 덮어써 localStorage 주입이 무시된다(§6.5/§7.4에서 확인된 테스트 하네스 함정).
  // 이 스크립트도 매번 update_server_config로 명시 동기화해 항상 이 파일을 보도록 고정한다.
  const cfgSync = await page.evaluate(async (dataPath) => {
    try {
      await window.__TAURI_INTERNALS__.invoke("update_server_config", { activePath: dataPath });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }, SHARED_PATH_FOR_APP);
  log(`  [${tag}] Rust 측 update_server_config 동기화=${JSON.stringify(cfgSync)}`);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sidebar-container", { timeout: 30000 });
  await sleep(3000); // initServer 이펙트(get_server_config/convert_to_unc_path/read_data invoke) 완료 대기

  const stillSettings = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => (i.placeholder || "").includes("workspace_active.json")));
  if (stillSettings) {
    const clicked = await page.evaluate(() => {
      const el = document.getElementById("sidebar-item-requirements");
      if (el) { el.click(); return true; }
      return false;
    });
    log(`  [${tag}] localStorage 주입 후에도 설정화면 → 사이드바 '요구조건 분석' 탭 클릭=${clicked}`);
    await sleep(1500);
  } else {
    log(`  [${tag}] localStorage 주입만으로 데이터 화면 진입(설정화면 미등장)`);
  }
}

function killAll() { try { spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" }); } catch {} }

const TITLE_PH = "대시보드 제목";
let bA, bB;
const results = [];
const rec = (name, ok, detail = "") => { results.push({ name, ok }); log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

try {
  log("\n=== L3 네이티브 2-인스턴스 협업/충돌 E2E (신규 빌드) ===\n");

  // 0) 공유 상태 초기화
  try { fs.writeFileSync(SHARED, "{}"); if (fs.existsSync(LOCKS)) fs.rmSync(LOCKS, { recursive: true, force: true }); } catch {}
  killAll(); await sleep(1500);

  // 1) 실행 + attach
  log("[1] 인스턴스 A(9222)·B(9223) 실행 + attach...");
  launch(9222, "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_A");
  launch(9223, "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_B");
  await Promise.all([waitCDP(9222), waitCDP(9223)]);
  const A = await attach(9222), B = await attach(9223);
  bA = A.browser; bB = B.browser;
  const pageA = A.page, pageB = B.page;
  const consoleLog = [];
  pageA.on("console", (m) => { consoleLog.push(`A:${m.text()}`); log(`  [A console:${m.type()}]`, m.text()); });
  pageB.on("console", (m) => { consoleLog.push(`B:${m.text()}`); log(`  [B console:${m.type()}]`, m.text()); });
  await pageA.waitForSelector("#sidebar-container", { timeout: 30000 });
  await pageB.waitForSelector("#sidebar-container", { timeout: 30000 });
  rec("두 인스턴스 실행·attach·사이드바 렌더", true);

  // 2) 온보딩(공유경로 설정)
  log("[2] 온보딩(공유경로 설정)...");
  await onboard(pageA, "A");
  await onboard(pageB, "B");

  // 3) 데이터 화면(대시보드 제목 입력) 등장 대기
  let titleReady = false;
  for (let i = 0; i < 15; i++) {
    const vA = await getInputByPlaceholder(pageA, TITLE_PH);
    const vB = await getInputByPlaceholder(pageB, TITLE_PH);
    if (vA !== null && vB !== null) { titleReady = true; break; }
    await sleep(1000);
  }
  rec("온보딩 후 스프레드시트/대시보드 화면 진입", titleReady,
    titleReady ? "대시보드 제목 입력 확인" : "대시보드 제목 입력 미등장(아래 진단 참고)");

  if (!titleReady) {
    // 진단: 현재 DOM 상태 덤프
    const diag = await pageA.evaluate(() => ({
      inputs: [...document.querySelectorAll("input")].map((i) => i.placeholder).slice(0, 10),
      buttons: [...document.querySelectorAll("button")].map((b) => (b.innerText || "").trim()).filter(Boolean).slice(0, 15),
      sidebar: [...document.querySelectorAll("#sidebar-container button")].map((b) => (b.innerText || "").trim()).filter(Boolean).slice(0, 15),
    }));
    log("  [진단] A DOM:", JSON.stringify(diag));
  } else {
    // 4) 협업 전파: A가 제목 편집 → 공유파일 반영 → B 전파
    const marker = `COLLAB_${Date.now()}`;
    log(`[4] 협업: A가 대시보드 제목을 '${marker}'로 변경...`);
    await setInputByPlaceholder(pageA, TITLE_PH, marker);

    let fileHit = false;
    for (let i = 0; i < 12; i++) { await sleep(1000); try { if (fs.readFileSync(SHARED, "utf-8").includes(marker)) { fileHit = true; break; } } catch {} }
    rec("A 편집 → 공유파일(workspace_active.json) 반영", fileHit, fileHit ? "save_data 저장 확인" : "12초 내 미반영");

    let prop = false;
    for (let i = 0; i < 10; i++) { await sleep(1000); const t = await getInputByPlaceholder(pageB, TITLE_PH); if (t && t.includes(marker)) { prop = true; break; } }
    const bT = await getInputByPlaceholder(pageB, TITLE_PH);
    rec("B가 A 변경을 전파받음(파일감시+병합)", prop, `B 제목='${bT}'`);

    // 5) 충돌 시나리오: A·B가 같은 필드를 동시에 다르게 변경
    // 결함#3 수정 확인: 예전엔 500ms 오차창 안에서 둘 다 조용히 성공(무한정 레이스)했으나,
    // 이제는 _rev CAS로 정확히 한쪽만 성공하고 패자는 VERSION_CONFLICT를 실제로 받아야 한다.
    log("[5] 충돌: A·B 동시 편집...");
    const preConflictLogCount = consoleLog.length;
    const mA = `A_${Date.now()}`, mB = `B_${Date.now()}`;
    await Promise.all([setInputByPlaceholder(pageA, TITLE_PH, mA), setInputByPlaceholder(pageB, TITLE_PH, mB)]);
    await sleep(8000);
    const finalFile = (() => { try { return fs.readFileSync(SHARED, "utf-8"); } catch { return ""; } })();
    const keptA = finalFile.includes(mA), keptB = finalFile.includes(mB);
    const conflictA = await pageA.evaluate(() => document.body.innerText.includes("충돌")).catch(() => false);
    const conflictB = await pageB.evaluate(() => document.body.innerText.includes("충돌")).catch(() => false);
    const sawVersionConflict = consoleLog.slice(preConflictLogCount).some((l) => l.includes("VERSION_CONFLICT"));
    log(`  최종파일: keptA=${keptA} keptB=${keptB} / 충돌모달: A=${conflictA} B=${conflictB} / VERSION_CONFLICT 로그 관측=${sawVersionConflict}`);
    rec("[결함#3 수정 확인] 동시 편집 시 실제 VERSION_CONFLICT가 발생함(더 이상 무음 레이스 아님)", sawVersionConflict);
    const observed = (conflictA || conflictB)
      ? "충돌 모달 발생"
      : (keptA !== keptB
        ? "한쪽만 최종 반영 — 단, VERSION_CONFLICT→executeSmartMerge 경유를 거친 결정적 결과(mergeEngine의 탭 메타데이터 정책상 mine-wins, requirements 필드 충돌은 L1에서 별도 검증됨). 더 이상 레이스에 의한 '조용한' 유실이 아님."
        : "동일 반영");
    rec("충돌 시나리오 최종 결과(정보성)", true, observed);

    // 6) 결함#4 수정 확인: 아이템 락 보유 중인 요구항목을 건드리는 저장은 ITEM_LOCKED로 거부되어야 함
    // rev CAS 통과가 전제이므로, 배경 자동저장/병합 재시도로 rev가 계속 바뀌는 동안에는
    // 무관한 VERSION_CONFLICT로 오탐할 수 있다 — 시도 직전마다 rev를 새로 읽고, 우연한
    // VERSION_CONFLICT는 재시도해 실제 락 차단(ITEM_LOCKED) 여부만 정확히 검증한다.
    log("[6] 결함#4 검증: 아이템 락 vs save_data(direct invoke)...");
    // 결함#8 수정 검증: 실 UI(Spreadsheet.tsx)와 동일한 "탭ID:행ID"(콜론 포함) 형식으로 락을 건다.
    // 수정 전에는 콜론이 NTFS ADS로 변질되어 락이 디렉터리 스캔에 안 보였고 저장 차단도 미작동했다.
    const LOCK_ITEM_ID = "t_locktest:REQ-LOCK-TEST";
    const lockAcq = await invokeRaw(pageA, "acquire_item_lock", {
      projectPath: SHARED_PATH_FOR_APP, itemId: LOCK_ITEM_ID, userId: "userA", userName: "사용자A",
    });
    rec("A가 실 UI 형식(탭ID:행ID) 락 획득", lockAcq.ok && lockAcq.res === true);

    const visLocks = await invokeRaw(pageB, "get_active_locks", { projectPath: SHARED_PATH_FOR_APP });
    rec("[결함#8 수정 확인] B가 콜론 형식 락을 원래 키로 조회 가능(가시성 복원)",
      visLocks.ok && !!visLocks.res[LOCK_ITEM_ID], JSON.stringify(visLocks.res));

    const conflictingPayload = JSON.stringify({ tabDataMap: { t_locktest: { requirements: [{ id: "REQ-LOCK-TEST", title: "B가 덮어쓰기 시도" }] } } });
    let bSaveAttempt = null;
    for (let i = 0; i < 5; i++) {
      const fresh = await invokeRaw(pageA, "read_data", { path: SHARED_PATH_FOR_APP });
      const freshRev = fresh.ok ? (fresh.res.rev ?? 0) : 0;
      bSaveAttempt = await invokeRaw(pageB, "save_data", {
        path: SHARED_PATH_FOR_APP, data: conflictingPayload, expectedRev: freshRev, userId: "userB",
      });
      if (!bSaveAttempt.ok && String(bSaveAttempt.error).includes("ITEM_LOCKED")) break;
      if (!bSaveAttempt.ok && String(bSaveAttempt.error).includes("VERSION_CONFLICT")) { await sleep(1000); continue; }
      break;
    }
    rec("[결함#4+#8 수정 확인] B가 락 보유 항목을 건드리는 저장 시도 → ITEM_LOCKED로 거부됨",
      !bSaveAttempt.ok && String(bSaveAttempt.error).includes(`ITEM_LOCKED:${LOCK_ITEM_ID}`),
      JSON.stringify(bSaveAttempt));

    const release = await invokeRaw(pageA, "release_item_lock", { projectPath: SHARED_PATH_FOR_APP, itemId: LOCK_ITEM_ID, userId: "userA" });
    let bRetry = null;
    for (let i = 0; i < 5; i++) {
      const fresh = await invokeRaw(pageA, "read_data", { path: SHARED_PATH_FOR_APP });
      const freshRev = fresh.ok ? (fresh.res.rev ?? 0) : 0;
      bRetry = await invokeRaw(pageB, "save_data", {
        path: SHARED_PATH_FOR_APP, data: conflictingPayload, expectedRev: freshRev, userId: "userB",
      });
      if (bRetry.ok || !String(bRetry.error).includes("VERSION_CONFLICT")) break;
      await sleep(1000);
    }
    rec("락 해제 후 B의 동일 저장은 성공함(락 해제 시 정상 동작 확인)", release.ok && bRetry.ok, JSON.stringify(bRetry));
  }
} catch (e) {
  log("\n[치명]", String(e.message).split("\n")[0]);
  results.push({ name: "실행", ok: false });
} finally {
  try { if (bA) await bA.disconnect(); } catch {}
  try { if (bB) await bB.disconnect(); } catch {}
  await sleep(500); killAll();
}

log("\n=== 요약 ===");
let ok = 0, fail = 0; for (const r of results) r.ok ? ok++ : fail++;
log(`통과 ${ok} / 실패 ${fail}`);
process.exitCode = fail > 0 ? 1 : 0;
