// L4 스웜 부하 E2E — 실 NAS 하드웨어(§13.4 #2·#3·#7·#8) 대체용.
// 한 대의 PC에서 N개 인스턴스를 동시 실행해 하나의 공유 파일을 두드린다.
//
// 실행: node e2e-native/collab_swarm.mjs <N> <공유경로> <소크초>
//   예: node e2e-native/collab_swarm.mjs 6 "C:\\01.claude\\Techsaletool_v2\\data\\swarm.json" 20
//
// 커버: 동시성·부하(분산편집 무손실, 핫스팟 수렴, 락 가시성 팬아웃, 락 존중, 소크).
// 미커버(실기기 필요): 실 Samba FS(#1), 물리 네트워크 단절(#4), 시계 스큐(#5), 이기종 notify(#6).
import puppeteer from "puppeteer-core";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");

const N = parseInt(process.argv[2] || "6", 10);
const SHARED = process.argv[3] || path.join(PROJECT, "data\\swarm.json");
const SOAK_SEC = parseInt(process.argv[4] || "0", 10);
const EXPORT_DIR = path.dirname(SHARED);
const LOCKS = path.join(EXPORT_DIR, "locks");
const BASE_PORT = 9250;
const PROFILE_TAG = "wv2_swarm";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const results = [];
const rec = (name, ok, detail = "") => { results.push({ name, ok }); log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

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
async function waitCDP(port, timeoutMs = 45000) {
  const dl = Date.now() + timeoutMs;
  while (Date.now() < dl) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return; } catch {}
    await sleep(500);
  }
  throw new Error(`CDP ${port} 미응답`);
}
async function attach(port) {
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null });
  for (let i = 0; i < 25; i++) {
    const pages = await browser.pages();
    const pg = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];
    if (pg) return { browser, page: pg };
    await sleep(300);
  }
  throw new Error(`포트 ${port} 페이지 없음`);
}
async function invokeRaw(page, cmd, args) {
  return page.evaluate(async ({ cmd, args }) => {
    try { return { ok: true, res: await window.__TAURI_INTERNALS__.invoke(cmd, args) }; }
    catch (e) { return { ok: false, error: String(e) }; }
  }, { cmd, args });
}
async function getTitle(page) {
  return page.evaluate(() => {
    const inp = [...document.querySelectorAll("input,textarea")].find((i) => (i.placeholder || "").includes("대시보드 제목"));
    return inp ? inp.value : null;
  });
}
async function setTitle(page, value) {
  return page.evaluate((value) => {
    const inp = [...document.querySelectorAll("input,textarea")].find((i) => (i.placeholder || "").includes("대시보드 제목"));
    if (!inp) return false;
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), "value").set;
    inp.focus(); setter.call(inp, value);
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
    inp.blur();
    return true;
  }, value);
}
// 낙관적 CAS 추가(앱의 executeSmartMerge와 동일한 read→수정→저장→충돌재시도 재현).
async function casAppendRow(page, sharedPath, rowId, value, userId) {
  return page.evaluate(async ({ sharedPath, rowId, value, userId }) => {
    const inv = window.__TAURI_INTERNALS__.invoke;
    for (let attempt = 0; attempt < 15; attempt++) {
      let res;
      try { res = await inv("read_data", { path: sharedPath }); } catch (e) { return { ok: false, error: "read:" + e }; }
      const data = res.data || {};
      data.tabDataMap = data.tabDataMap || {};
      data.tabDataMap.swarm = data.tabDataMap.swarm || { requirements: [], columns: [] };
      const reqs = data.tabDataMap.swarm.requirements;
      const idx = reqs.findIndex((r) => r.id === rowId);
      const row = { id: rowId, title: value };
      if (idx === -1) reqs.push(row); else reqs[idx] = row;
      const payload = JSON.stringify({
        tabDataMap: data.tabDataMap, tabs: data.tabs, assigneesPool: data.assigneesPool,
        appName: data.appName, boardItems: data.boardItems,
      });
      try {
        const rev = await inv("save_data", { path: sharedPath, data: payload, expectedRev: res.rev ?? 0, userId });
        return { ok: true, rev, attempts: attempt + 1 };
      } catch (e) {
        const s = String(e);
        if (s.includes("VERSION_CONFLICT") || s.includes("LOCK_TIMEOUT")) { await new Promise((r) => setTimeout(r, 30 + Math.random() * 150)); continue; }
        if (s.includes("ITEM_LOCKED")) return { ok: false, locked: true, error: s };
        return { ok: false, error: s };
      }
    }
    return { ok: false, error: "retries_exhausted" };
  }, { sharedPath, rowId, value, userId });
}

async function onboard(page, tag) {
  await page.evaluate(({ dataPath, exportDir }) => {
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem("app_config") || "{}"); } catch {}
    cfg.activeDataPath = dataPath; cfg.excelExportPath = exportDir;
    localStorage.setItem("app_config", JSON.stringify(cfg));
  }, { dataPath: SHARED, exportDir: EXPORT_DIR });
  await page.evaluate(async (dataPath) => {
    try { await window.__TAURI_INTERNALS__.invoke("update_server_config", { activePath: dataPath }); } catch {}
  }, SHARED);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sidebar-container", { timeout: 30000 });
  await sleep(2500);
  const stillSettings = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => (i.placeholder || "").includes("workspace_active.json")));
  if (stillSettings) {
    await page.evaluate(() => document.getElementById("sidebar-item-requirements")?.click());
    await sleep(1200);
  }
}

// wv2_swarm 프로필을 참조하는 WebView2 자식만 정밀 종료(다른 앱 영향 없음).
function killSwarmProcesses() {
  try { spawnSync("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" }); } catch {}
  try {
    spawnSync("powershell", ["-NoProfile", "-Command",
      `Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -like '*${PROFILE_TAG}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
    ], { stdio: "ignore" });
  } catch {}
}
function cleanProfiles() {
  const base = "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude";
  for (let i = 0; i < N; i++) {
    try { fs.rmSync(path.join(base, `${PROFILE_TAG}_${i}`), { recursive: true, force: true }); } catch {}
  }
}
function readFileSafe() { try { return fs.readFileSync(SHARED, "utf-8"); } catch { return ""; } }
function parseFile() { try { return JSON.parse(readFileSafe()); } catch { return {}; } }
function countLocks() { try { return fs.readdirSync(LOCKS).filter((n) => n.startsWith("item_") && n.endsWith(".lock")).length; } catch { return 0; } }

const browsers = [];
const pages = [];
const consoleTally = () => ({ VERSION_CONFLICT: 0, ITEM_LOCKED: 0, LOCK_TIMEOUT: 0, uncaught: 0 });
const tallies = [];

try {
  log(`\n=== L4 스웜 부하 E2E (N=${N}, 소크=${SOAK_SEC}s) ===`);
  log(`공유 파일: ${SHARED}\n`);

  // 0) 초기화
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.writeFileSync(SHARED, "{}");
  if (fs.existsSync(LOCKS)) fs.rmSync(LOCKS, { recursive: true, force: true });
  killSwarmProcesses(); cleanProfiles(); await sleep(1500);

  // 1) N개 기동 + attach (스태거)
  log(`[1] ${N}개 인스턴스 기동 + attach...`);
  for (let i = 0; i < N; i++) {
    launch(BASE_PORT + i, `C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\${PROFILE_TAG}_${i}`);
    await sleep(500);
  }
  for (let i = 0; i < N; i++) await waitCDP(BASE_PORT + i);
  for (let i = 0; i < N; i++) {
    const { browser, page } = await attach(BASE_PORT + i);
    browsers.push(browser); pages.push(page);
    const t = consoleTally(); tallies.push(t);
    page.on("console", (m) => {
      const s = m.text();
      if (s.includes("VERSION_CONFLICT")) t.VERSION_CONFLICT++;
      if (s.includes("ITEM_LOCKED")) t.ITEM_LOCKED++;
      if (s.includes("LOCK_TIMEOUT")) t.LOCK_TIMEOUT++;
      if (s.includes("Uncaught error")) t.uncaught++;
    });
    await page.waitForSelector("#sidebar-container", { timeout: 30000 });
  }
  rec(`${N}개 인스턴스 실행·attach·렌더`, pages.length === N);

  // 2) 온보딩(전원 동일 공유 파일)
  log("[2] 온보딩(전원 동일 공유 파일)...");
  for (let i = 0; i < N; i++) await onboard(pages[i], `#${i}`);
  let titleReady = 0;
  for (let i = 0; i < N; i++) { if ((await getTitle(pages[i])) !== null) titleReady++; }
  rec("전원 데이터 화면 진입", titleReady === N, `${titleReady}/${N}`);

  // ── 시나리오 A: 분산 편집 폭주 (무손실 CAS) ──────────────────
  log("[A] 분산 편집 폭주 — 각 인스턴스가 자기 행을 R회 CAS 저장...");
  const R = 5;
  const tA0 = Date.now();
  const perInstance = await Promise.all(pages.map((pg, i) => (async () => {
    let ok = 0, locked = 0, fail = 0, attemptsSum = 0;
    for (let r = 0; r < R; r++) {
      const res = await casAppendRow(pg, SHARED, `SWARM-${i}`, `v${r}`, `user${i}`);
      if (res.ok) { ok++; attemptsSum += res.attempts || 1; }
      else if (res.locked) locked++; else fail++;
    }
    return { ok, locked, fail, attemptsSum };
  })()));
  const tA = Date.now() - tA0;
  // 최종 파일에 N개 행이 모두 최신값(v{R-1})으로 존재해야 함 (무손실)
  await sleep(1500);
  const fileA = parseFile();
  const swarmRows = fileA.tabDataMap?.swarm?.requirements || [];
  let survived = 0;
  for (let i = 0; i < N; i++) {
    const row = swarmRows.find((r) => r.id === `SWARM-${i}`);
    if (row && row.title === `v${R - 1}`) survived++;
  }
  const totalOk = perInstance.reduce((s, p) => s + p.ok, 0);
  const totalAttempts = perInstance.reduce((s, p) => s + p.attemptsSum, 0);
  rec("[A] 분산 편집 무손실 — N개 행 전부 최신값 생존(로스트 업데이트 0)", survived === N, `${survived}/${N} 생존`);
  log(`  [A] 측정: ${N}×${R}=${N * R}회 저장 중 성공 ${totalOk}, 평균 재시도 ${(totalAttempts / Math.max(1, totalOk)).toFixed(2)}회, 총 소요 ${tA}ms, 최종 rev=${fileA._rev}`);

  // ── 시나리오 B: 핫스팟 폭주 (UI 대시보드 제목, 수렴) ─────────
  log("[B] 핫스팟 폭주 — 전원이 대시보드 제목을 동시에 다르게 편집...");
  const hotMarkers = pages.map((_, i) => `HOT_${i}_${Date.now()}`);
  await Promise.all(pages.map((pg, i) => setTitle(pg, hotMarkers[i])));
  // 수렴 대기: 모든 인스턴스 UI 제목 == 파일 제목, 그리고 마커 중 하나
  let convValue = null, converged = false;
  const tB0 = Date.now();
  for (let s = 0; s < 20; s++) {
    await sleep(1000);
    const titles = [];
    for (let i = 0; i < N; i++) titles.push(await getTitle(pages[i]));
    const f = parseFile();
    const fileTitle = (f.tabs || []).find((t) => t.id === "requirements")?.dashboardTitle;
    const allSame = titles.every((t) => t === titles[0]) && titles[0] === fileTitle;
    if (allSame && hotMarkers.includes(fileTitle)) { convValue = fileTitle; converged = true; break; }
  }
  const tB = Date.now() - tB0;
  const anyCrash = tallies.reduce((s, t) => s + t.uncaught, 0);
  rec("[B] 핫스팟 무손실 수렴 — 전 인스턴스·파일이 단일 값으로 수렴, 크래시 0", converged && anyCrash === 0,
    converged ? `'${convValue}'로 ${(tB / 1000).toFixed(1)}s 수렴` : "20s 내 미수렴");

  // ── 시나리오 C: 락 가시성 팬아웃 ─────────────────────────────
  log("[C] 락 가시성 팬아웃 — #0 락 획득 → 전원 관측 → 해제 → 전원 소멸 확인...");
  const LOCK_ID = "swarm:ROW-X";
  await invokeRaw(pages[0], "acquire_item_lock", { projectPath: SHARED, itemId: LOCK_ID, userId: "user0", userName: "사용자0" });
  await sleep(300);
  let seenBy = 0;
  for (let i = 0; i < N; i++) {
    const r = await invokeRaw(pages[i], "get_active_locks", { projectPath: SHARED });
    if (r.ok && r.res[LOCK_ID]) seenBy++;
  }
  rec("[C] 락 획득 시 전 인스턴스가 동일 키로 관측", seenBy === N, `${seenBy}/${N}`);
  await invokeRaw(pages[0], "release_item_lock", { projectPath: SHARED, itemId: LOCK_ID, userId: "user0" });
  await sleep(300);
  let goneBy = 0;
  for (let i = 0; i < N; i++) {
    const r = await invokeRaw(pages[i], "get_active_locks", { projectPath: SHARED });
    if (r.ok && !r.res[LOCK_ID]) goneBy++;
  }
  rec("[C] 락 해제 시 전 인스턴스에서 소멸", goneBy === N, `${goneBy}/${N}`);

  // ── 시나리오 D: 락 존중 부하 ─────────────────────────────────
  log("[D] 락 존중 — #0이 swarm:SWARM-1 락 보유 중, 타 인스턴스가 그 행 저장 시도...");
  await invokeRaw(pages[0], "acquire_item_lock", { projectPath: SHARED, itemId: "swarm:SWARM-1", userId: "user0", userName: "사용자0" });
  // 인스턴스 1이 SWARM-1을 건드리는 저장을 시도 → ITEM_LOCKED 기대
  let blockedRes = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    blockedRes = await casAppendRow(pages[1], SHARED, "SWARM-1", `intrude${attempt}`, "user1");
    if (blockedRes.locked) break;
    await sleep(300); // CAS 통과했다면(락 미작동) 즉시 실패로 드러남
    if (blockedRes.ok) break;
  }
  rec("[D] 락 보유 행을 건드리는 타 사용자 저장이 ITEM_LOCKED로 거부됨", !!blockedRes.locked, JSON.stringify(blockedRes).slice(0, 120));
  // 락과 무관한 자기 행(SWARM-2)은 통과
  const okOther = await casAppendRow(pages[2], SHARED, "SWARM-2", "unrelated", "user2");
  rec("[D] 락과 무관한 행 저장은 통과", okOther.ok, JSON.stringify(okOther).slice(0, 80));
  await invokeRaw(pages[0], "release_item_lock", { projectPath: SHARED, itemId: "swarm:SWARM-1", userId: "user0" });

  // ── 시나리오 E: 소크(지속 부하) ──────────────────────────────
  if (SOAK_SEC > 0) {
    log(`[E] 소크 ${SOAK_SEC}s — 분산 CAS + 간헐 핫스팟 혼합, rev 단조성·수렴·고아락 확인...`);
    const revSamples = [];
    const deadline = Date.now() + SOAK_SEC * 1000;
    let round = 0;
    while (Date.now() < deadline) {
      round++;
      await Promise.all(pages.map((pg, i) => casAppendRow(pg, SHARED, `SWARM-${i}`, `soak${round}`, `user${i}`)));
      if (round % 3 === 0) await Promise.all(pages.map((pg, i) => setTitle(pg, `SOAK_${i}_${round}`)));
      revSamples.push(parseFile()._rev || 0);
      await sleep(400);
    }
    // rev 단조 증가 확인
    let monotonic = true;
    for (let k = 1; k < revSamples.length; k++) if (revSamples[k] < revSamples[k - 1]) monotonic = false;
    rec("[E] 소크 중 rev 단조 증가(역행 없음)", monotonic, `샘플 ${revSamples.length}개, 최종 rev=${revSamples[revSamples.length - 1]}`);
    // 소크 후 정착 대기 → 최종 수렴/무손실/고아락 검사
    await sleep(4000);
    const fileE = parseFile();
    const rowsE = fileE.tabDataMap?.swarm?.requirements || [];
    let survivedE = 0;
    for (let i = 0; i < N; i++) if (rowsE.find((r) => r.id === `SWARM-${i}`)) survivedE++;
    rec("[E] 소크 후 N개 행 전부 생존(무손실)", survivedE === N, `${survivedE}/${N}`);
    await sleep(16000); // 아이템 락 TTL(15s) 경과 대기
    const orphanLocks = countLocks();
    rec("[E] 소크 후 고아 아이템 락 없음(TTL 정리 확인)", orphanLocks === 0, `잔여 락 ${orphanLocks}개`);
    const totalCrash = tallies.reduce((s, t) => s + t.uncaught, 0);
    rec("[E] 소크 전 구간 uncaught 렌더 오류 0", totalCrash === 0, `crash=${totalCrash}`);
  }

  // 콘솔 집계 요약(정보성)
  const agg = tallies.reduce((a, t) => ({
    VERSION_CONFLICT: a.VERSION_CONFLICT + t.VERSION_CONFLICT,
    ITEM_LOCKED: a.ITEM_LOCKED + t.ITEM_LOCKED,
    LOCK_TIMEOUT: a.LOCK_TIMEOUT + t.LOCK_TIMEOUT,
    uncaught: a.uncaught + t.uncaught,
  }), consoleTally());
  log(`  [집계] 전 인스턴스 콘솔: VERSION_CONFLICT=${agg.VERSION_CONFLICT} ITEM_LOCKED=${agg.ITEM_LOCKED} LOCK_TIMEOUT=${agg.LOCK_TIMEOUT} uncaught=${agg.uncaught}`);
} catch (e) {
  log("\n[치명]", String(e.message).split("\n")[0]);
  results.push({ name: "실행", ok: false });
} finally {
  for (const b of browsers) { try { await b.disconnect(); } catch {} }
  await sleep(500);
  killSwarmProcesses();
  await sleep(500);
  cleanProfiles();
}

log("\n=== 요약 ===");
let ok = 0, fail = 0; for (const r of results) r.ok ? ok++ : fail++;
log(`통과 ${ok} / 실패 ${fail}`);
process.exitCode = fail > 0 ? 1 : 0;
