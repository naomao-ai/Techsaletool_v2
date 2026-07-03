// L4 실 NAS/공유드라이브 시뮬레이션 E2E — collab.mjs(L3)의 네트워크 경로 버전.
// admin 권한 없이 접근 가능한 loopback 관리자 공유(\\localhost\C$\...)를 "네트워크 공유"로 사용해
// UNC 경로 변환(convert_to_unc_path)·파일 잠금(locks/)·감시자 전파·충돌 시나리오를 검증한다.
//
// 실행: node e2e-native/collab_l4.mjs <SHARED_PATH_FOR_APP>
//   예1) UNC 직접:   node e2e-native/collab_l4.mjs "\\localhost\C$\01.claude\Techsaletool_v2\data\l4_nas_sim\workspace_l4.json"
//   예2) 매핑 드라이브(같은 셸 호출 내에서 net use로 매핑한 뒤 사용): node e2e-native/collab_l4.mjs "N:\workspace_l4.json"
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");

const SHARED_PATH_FOR_APP = process.argv[2];
if (!SHARED_PATH_FOR_APP) {
  console.error("사용법: node e2e-native/collab_l4.mjs <SHARED_PATH_FOR_APP>");
  process.exit(2);
}
const EXPORT_DIR_FOR_APP = path.dirname(SHARED_PATH_FOR_APP);
const LOCKS = path.join(EXPORT_DIR_FOR_APP, "locks");

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

async function onboard(page, tag) {
  // 결함#5 수정(§2) 이후: Rust 측 server_config.json(%APPDATA%\com.business.requirements\data\,
  // 머신 전역·WebView2 프로필과 무관하게 공유됨)이 한 번이라도 저장되면, App.tsx의
  // config = {...localConfig, ...rawConfig} 병합에서 rawConfig(Rust)가 activeDataPath를 항상 덮어쓴다.
  // 따라서 localStorage 주입만으로는 이전에 영속된 Rust 설정을 바꿀 수 없다 —
  // 실사용자가 설정화면에서 "설정 저장"을 누르는 것과 동일하게 update_server_config도 함께 호출해야
  // 이번 테스트가 의도한 경로(L4 NAS 시뮬레이션 경로)로 실제 리다이렉트된다.
  await page.evaluate(({ dataPath, exportDir }) => {
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem("app_config") || "{}"); } catch {}
    cfg.activeDataPath = dataPath;
    cfg.excelExportPath = exportDir;
    localStorage.setItem("app_config", JSON.stringify(cfg));
  }, { dataPath: SHARED_PATH_FOR_APP, exportDir: EXPORT_DIR_FOR_APP });

  const uncSync = await page.evaluate(async (dataPath) => {
    try {
      await window.__TAURI_INTERNALS__.invoke("update_server_config", { activePath: dataPath });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }, SHARED_PATH_FOR_APP);
  log(`  [${tag}] Rust 측 update_server_config 동기화=${JSON.stringify(uncSync)}`);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sidebar-container", { timeout: 30000 });
  await sleep(3000);

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
  log("\n=== L4 실 NAS/공유드라이브 시뮬레이션 E2E ===");
  log(`대상 경로: ${SHARED_PATH_FOR_APP}\n`);

  // 0) 공유 상태 초기화 (대상 폴더가 있어야 함 — UNC/매핑드라이브 대상은 미리 mkdir 필요)
  try {
    fs.mkdirSync(EXPORT_DIR_FOR_APP, { recursive: true });
    fs.writeFileSync(SHARED_PATH_FOR_APP, "{}");
    if (fs.existsSync(LOCKS)) fs.rmSync(LOCKS, { recursive: true, force: true });
  } catch (e) {
    log("[치명] 대상 경로 초기화 실패:", String(e.message));
    throw e;
  }
  killAll(); await sleep(1500);

  // 1) 실행 + attach
  log("[1] 인스턴스 A(9224)·B(9225) 실행 + attach...");
  launch(9224, "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_L4_A");
  launch(9225, "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_L4_B");
  await Promise.all([waitCDP(9224), waitCDP(9225)]);
  const A = await attach(9224), B = await attach(9225);
  bA = A.browser; bB = B.browser;
  const pageA = A.page, pageB = B.page;
  const consoleLog = [];
  pageA.on("console", (m) => { consoleLog.push(`A:${m.text()}`); log(`  [A console:${m.type()}]`, m.text()); });
  pageB.on("console", (m) => { consoleLog.push(`B:${m.text()}`); log(`  [B console:${m.type()}]`, m.text()); });
  await pageA.waitForSelector("#sidebar-container", { timeout: 30000 });
  await pageB.waitForSelector("#sidebar-container", { timeout: 30000 });
  rec("두 인스턴스 실행·attach·사이드바 렌더", true);

  // 2) convert_to_unc_path 직접 호출 검증 (변환 로직 단독 확인)
  log("[2] convert_to_unc_path 직접 호출...");
  const uncResult = await invokeRaw(pageA, "convert_to_unc_path", { path: SHARED_PATH_FOR_APP });
  rec("convert_to_unc_path 호출 성공(에러 없음)", uncResult.ok, JSON.stringify(uncResult));
  if (uncResult.ok) {
    log(`  변환 결과: '${SHARED_PATH_FOR_APP}' → '${uncResult.res}'`);
  }

  // 3) 온보딩(공유경로 = NAS 시뮬레이션 경로)
  log("[3] 온보딩(NAS 시뮬레이션 공유경로 설정)...");
  await onboard(pageA, "A");
  await onboard(pageB, "B");

  // 4) 데이터 화면 등장 대기
  let titleReady = false;
  for (let i = 0; i < 15; i++) {
    const vA = await getInputByPlaceholder(pageA, TITLE_PH);
    const vB = await getInputByPlaceholder(pageB, TITLE_PH);
    if (vA !== null && vB !== null) { titleReady = true; break; }
    await sleep(1000);
  }
  rec("온보딩 후 데이터 화면 진입", titleReady, titleReady ? "대시보드 제목 입력 확인" : "미등장");

  if (!titleReady) {
    const diag = await pageA.evaluate(() => ({
      inputs: [...document.querySelectorAll("input")].map((i) => i.placeholder).slice(0, 10),
    }));
    log("  [진단] A DOM:", JSON.stringify(diag));
  } else {
    // 5) 아이템 락(locks/) — NAS 경로 위에서 획득/조회 확인
    log("[5] 아이템 락(locks/) NAS 경로 검증...");
    const lockAcq = await invokeRaw(pageA, "acquire_item_lock", {
      projectPath: SHARED_PATH_FOR_APP, itemId: "L4-TEST-1", userId: "userA", userName: "사용자A",
    });
    rec("A가 NAS 경로에 아이템 락 획득", lockAcq.ok && lockAcq.res === true, JSON.stringify(lockAcq));

    const activeLocks = await invokeRaw(pageB, "get_active_locks", { projectPath: SHARED_PATH_FOR_APP });
    const seenByB = activeLocks.ok && activeLocks.res && activeLocks.res["L4-TEST-1"];
    rec("B가 NAS 경로에서 A의 락을 조회(파일 기반 락 가시성)", !!seenByB, JSON.stringify(activeLocks));

    const lockFileExists = fs.existsSync(path.join(LOCKS, "item_L4-TEST-1.lock"));
    rec("locks/item_L4-TEST-1.lock 파일이 NAS 경로에 실제 생성됨", lockFileExists);

    const lockConflict = await invokeRaw(pageB, "acquire_item_lock", {
      projectPath: SHARED_PATH_FOR_APP, itemId: "L4-TEST-1", userId: "userB", userName: "사용자B",
    });
    rec("B가 A 보유 락에 대해 획득 거부됨(충돌 정상)", !lockConflict.ok, JSON.stringify(lockConflict));

    await invokeRaw(pageA, "release_item_lock", { projectPath: SHARED_PATH_FOR_APP, itemId: "L4-TEST-1", userId: "userA" });

    // 6) 협업 전파: A가 제목 편집 → 공유파일(NAS) 반영 → B 전파
    const marker = `L4COLLAB_${Date.now()}`;
    log(`[6] 협업: A가 대시보드 제목을 '${marker}'로 변경(NAS 경로 저장)...`);
    await setInputByPlaceholder(pageA, TITLE_PH, marker);

    let fileHit = false;
    for (let i = 0; i < 15; i++) { await sleep(1000); try { if (fs.readFileSync(SHARED_PATH_FOR_APP, "utf-8").includes(marker)) { fileHit = true; break; } } catch {} }
    rec("A 편집 → NAS 공유파일 반영(save_data)", fileHit, fileHit ? "저장 확인" : "15초 내 미반영");

    let prop = false;
    for (let i = 0; i < 12; i++) { await sleep(1000); const t = await getInputByPlaceholder(pageB, TITLE_PH); if (t && t.includes(marker)) { prop = true; break; } }
    const bT = await getInputByPlaceholder(pageB, TITLE_PH);
    rec("B가 NAS 경로 파일감시(notify)로 A 변경 전파받음", prop, `B 제목='${bT}'`);

    // 7) 충돌 시나리오 — 결함#3 수정 확인: NAS(네트워크) 경로에서도 VERSION_CONFLICT가
    // 실제로 발생해야 한다(더 이상 mtime 500ms 창에 의한 무음 레이스가 아님).
    log("[7] 충돌: A·B 동시 편집(NAS 경로)...");
    const preConflictLogCount = consoleLog.length;
    const mA = `A_${Date.now()}`, mB = `B_${Date.now()}`;
    await Promise.all([setInputByPlaceholder(pageA, TITLE_PH, mA), setInputByPlaceholder(pageB, TITLE_PH, mB)]);
    await sleep(5000);
    const finalFile = (() => { try { return fs.readFileSync(SHARED_PATH_FOR_APP, "utf-8"); } catch { return ""; } })();
    const keptA = finalFile.includes(mA), keptB = finalFile.includes(mB);
    const conflictA = await pageA.evaluate(() => document.body.innerText.includes("충돌")).catch(() => false);
    const conflictB = await pageB.evaluate(() => document.body.innerText.includes("충돌")).catch(() => false);
    const sawVersionConflict = consoleLog.slice(preConflictLogCount).some((l) => l.includes("VERSION_CONFLICT"));
    log(`  최종파일: keptA=${keptA} keptB=${keptB} / 충돌모달: A=${conflictA} B=${conflictB} / VERSION_CONFLICT 로그 관측=${sawVersionConflict}`);
    rec("[결함#3 수정 확인] NAS 경로에서도 동시 편집 시 VERSION_CONFLICT 발생", sawVersionConflict);
    const observed = (conflictA || conflictB) ? "충돌 모달 발생" : (keptA !== keptB ? "한쪽만 최종 반영(CAS-안전 경유, 무음 레이스 아님)" : (keptA && keptB ? "동일 반영" : "둘 다 미반영(이상)"));
    rec("충돌 시나리오 최종 결과(정보성, NAS 경로)", true, observed);

    // 8) 결함#4 수정 확인: NAS 경로에서도 아이템 락 보유 항목 저장이 ITEM_LOCKED로 거부되는지
    log("[8] 결함#4 검증: NAS 경로에서 아이템 락 vs save_data...");
    const baseRead = await invokeRaw(pageA, "read_data", { path: SHARED_PATH_FOR_APP });
    const baseRev = baseRead.ok ? (baseRead.res.rev ?? 0) : 0;
    const lockAcq2 = await invokeRaw(pageA, "acquire_item_lock", {
      projectPath: SHARED_PATH_FOR_APP, itemId: "REQ-LOCK-TEST-L4", userId: "userA", userName: "사용자A",
    });
    rec("A가 NAS 경로에서 REQ-LOCK-TEST-L4 락 획득", lockAcq2.ok && lockAcq2.res === true);

    const conflictingPayload = JSON.stringify({ tabDataMap: { t_locktest: { requirements: [{ id: "REQ-LOCK-TEST-L4", title: "B가 덮어쓰기 시도" }] } } });
    const bSaveAttempt = await invokeRaw(pageB, "save_data", {
      path: SHARED_PATH_FOR_APP, data: conflictingPayload, expectedRev: baseRev, userId: "userB",
    });
    rec("[결함#4 수정 확인] NAS 경로에서도 락 보유 항목 저장 시도가 ITEM_LOCKED로 거부됨",
      !bSaveAttempt.ok && String(bSaveAttempt.error).includes("ITEM_LOCKED:REQ-LOCK-TEST-L4"),
      JSON.stringify(bSaveAttempt));

    await invokeRaw(pageA, "release_item_lock", { projectPath: SHARED_PATH_FOR_APP, itemId: "REQ-LOCK-TEST-L4", userId: "userA" });
    const bRetry = await invokeRaw(pageB, "save_data", {
      path: SHARED_PATH_FOR_APP, data: conflictingPayload, expectedRev: baseRev, userId: "userB",
    });
    rec("락 해제 후 B의 동일 저장은 NAS 경로에서도 성공함", bRetry.ok, JSON.stringify(bRetry));
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
