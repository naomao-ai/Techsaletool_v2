// 결함 #5 전용 검증: SettingsPage "설정 저장" 버튼이 실제로 Rust update_server_config를
// 호출해 get_server_config가 activeDataPath를 반환하도록(=재실행 시 설정화면에 갇히지 않도록) 고쳤는지 확인.
// 실행: node e2e-native/verify_defect5.mjs
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
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

async function typeByPlaceholder(page, sub, value) {
  const h = await page.evaluateHandle((sub) => [...document.querySelectorAll("input")].find((i) => (i.placeholder || "").includes(sub)) || null, sub);
  const el = h.asElement();
  if (!el) return false;
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 5 });
  return true;
}

async function callGetServerConfig(page) {
  return page.evaluate(async () => {
    try {
      // App.tsx와 동일한 invoke 경로: @tauri-apps/api/core의 invoke는 결국
      // window.__TAURI_INTERNALS__.invoke를 감싼 래퍼일 뿐이며, ESM 동적 import는
      // page.evaluate로 주입된 스크립트 컨텍스트에서 모듈 지정자를 해석 못하므로 직접 호출.
      const cfg = await window.__TAURI_INTERNALS__.invoke("get_server_config");
      return { ok: true, cfg };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });
}

function killAll() { try { spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" }); } catch {} }

const results = [];
const rec = (name, ok, detail = "") => { results.push({ name, ok }); log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

let b;
try {
  log("\n=== 결함#5 검증: SettingsPage 저장 → Rust update_server_config 영속화 ===\n");
  killAll(); await sleep(1500);

  const PORT = 9231;
  const PROFILE = "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_verify5";
  launch(PORT, PROFILE);
  await waitCDP(PORT);
  const { browser, page } = await attach(PORT);
  b = browser;
  await page.waitForSelector("#sidebar-container", { timeout: 30000 });

  // 1) 최초 상태: get_server_config가 SERVER_NOT_SETUP 반환해야 함(신규 프로필)
  const before = await callGetServerConfig(page);
  rec("최초 실행 시 get_server_config = 미설정(SERVER_NOT_SETUP)", !before.ok, JSON.stringify(before));

  // 2) 설정화면에서 실제 입력 + "설정 저장" 클릭 (실사용자 플로우)
  const isSettings = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => (i.placeholder || "").includes("workspace_active.json")));
  rec("부팅 시 설정화면 진입(신규 프로필이므로 예상된 동작)", isSettings);

  await typeByPlaceholder(page, "workspace_active.json", SHARED_PATH_FOR_APP);
  await typeByPlaceholder(page, "Documents", EXPORT_DIR_FOR_APP);
  await sleep(300);
  const btnH = await page.evaluateHandle(() => [...document.querySelectorAll("button")].find((b) => (b.innerText || "").includes("설정 저장")) || null);
  const btn = btnH.asElement();
  if (btn) await btn.click();
  await sleep(2000);

  // 3) 저장 버튼 클릭 직후, 같은 세션에서 get_server_config가 이제 activeDataPath를 반환하는지 확인
  const afterSameSession = await callGetServerConfig(page);
  rec("'설정 저장' 클릭 직후 get_server_config가 activeDataPath 반환(같은 세션)",
    afterSameSession.ok && afterSameSession.cfg && afterSameSession.cfg.activeDataPath === SHARED_PATH_FOR_APP,
    JSON.stringify(afterSameSession));

  // 4) reload 후에도(새 프로세스 재시작을 흉내) 여전히 반환되는지(파일 영속) 확인
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sidebar-container", { timeout: 30000 });
  await sleep(2000);
  const afterReload = await callGetServerConfig(page);
  rec("reload 후에도 get_server_config가 activeDataPath 반환(영속 확인)",
    afterReload.ok && afterReload.cfg && afterReload.cfg.activeDataPath === SHARED_PATH_FOR_APP,
    JSON.stringify(afterReload));

  const stillSettingsAfterReload = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => (i.placeholder || "").includes("workspace_active.json")));
  rec("reload 후 설정화면에 갇히지 않음(결함#5 재현 여부)", !stillSettingsAfterReload,
    stillSettingsAfterReload ? "여전히 설정화면(결함 재현)" : "데이터 화면으로 정상 진입");
} catch (e) {
  log("\n[치명]", String(e.message).split("\n")[0]);
  results.push({ name: "실행", ok: false });
} finally {
  try { if (b) await b.disconnect(); } catch {}
  await sleep(500); killAll();
}

log("\n=== 요약 ===");
let ok = 0, fail = 0; for (const r of results) r.ok ? ok++ : fail++;
log(`통과 ${ok} / 실패 ${fail}`);
process.exitCode = fail > 0 ? 1 : 0;
