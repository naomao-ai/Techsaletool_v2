// 결함#10 재현/수정 검증: 미커밋 초안 + 락 만료 + 동일 필드 → B 편집 무통지 유실.
//
// 시나리오(사용자 질문 그대로):
//   A가 셀 편집창을 연 채 초안을 입력(미커밋)하고 유휴 → 그 사이 A 락이 만료 →
//   B가 같은 셀을 편집·저장 → A가 (알림 없이) 돌아와 편집창을 커밋 →
//   A의 옛 초안이 B의 값을 덮어써 B의 편집이 유실되는가?
//
// 통과(수정됨) 기준: A 커밋 시 B 값이 유실되지 않음(덮어쓰기 차단/충돌 유도/재확인).
// 실패(결함 존재) 기준: 최종 파일 = A 초안, B 값 소실, A에 충돌 모달 없음.
//
// 실행: node e2e-native/verify_defect10.mjs
import puppeteer from "puppeteer-core";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const SHARED = path.join(PROJECT, "data\\d10.json");
const LOCKS = path.join(PROJECT, "data\\locks");
const LOCK_FILE = path.join(LOCKS, "item_requirements%3AREQ-001.lock"); // encode("requirements:REQ-001")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const results = [];
const rec = (name, ok, detail = "") => { results.push({ name, ok }); log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

function launch(port, dataFolder) {
  const env = { ...process.env, WEBVIEW2_USER_DATA_FOLDER: dataFolder, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` };
  const c = spawn(EXE, [], { cwd: PROJECT, env, detached: true, stdio: "ignore" }); c.unref(); return c;
}
async function waitCDP(port, t = 45000) { const dl = Date.now() + t; while (Date.now() < dl) { try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return; } catch {} await sleep(500); } throw new Error(`CDP ${port} 미응답`); }
async function attach(port) { const b = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null }); for (let i = 0; i < 25; i++) { const ps = await b.pages(); const pg = ps.find((p) => p.url().includes("tauri.localhost")) || ps[0]; if (pg) return { browser: b, page: pg }; await sleep(300); } throw new Error("페이지 없음"); }
async function invokeRaw(page, cmd, args) { return page.evaluate(async ({ cmd, args }) => { try { return { ok: true, res: await window.__TAURI_INTERNALS__.invoke(cmd, args) }; } catch (e) { return { ok: false, error: String(e) }; } }, { cmd, args }); }

async function onboard(page) {
  await page.evaluate(({ p, e }) => { let c = {}; try { c = JSON.parse(localStorage.getItem("app_config") || "{}"); } catch {} c.activeDataPath = p; c.excelExportPath = e; localStorage.setItem("app_config", JSON.stringify(c)); }, { p: SHARED, e: path.dirname(SHARED) });
  await page.evaluate(async (p) => { try { await window.__TAURI_INTERNALS__.invoke("update_server_config", { activePath: p }); } catch {} }, SHARED);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#sidebar-container", { timeout: 30000 });
  await sleep(2500);
  const stuck = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => (i.placeholder || "").includes("workspace_active.json")));
  if (stuck) { await page.evaluate(() => document.getElementById("sidebar-item-requirements")?.click()); await sleep(1200); }
}
// B가 REQ-001의 title을 CAS로 커밋(=B의 UI 편집 저장과 동등한 파일 결과).
async function casSetTitle(page, title, userId) {
  return page.evaluate(async ({ SHARED, title, userId }) => {
    const inv = window.__TAURI_INTERNALS__.invoke;
    for (let a = 0; a < 15; a++) {
      let res; try { res = await inv("read_data", { path: SHARED }); } catch (e) { return { ok: false, error: "read:" + e }; }
      const d = res.data || {};
      d.tabDataMap = d.tabDataMap || {};
      d.tabDataMap.requirements = d.tabDataMap.requirements || { requirements: [], columns: [] };
      const reqs = d.tabDataMap.requirements.requirements;
      const i = reqs.findIndex((r) => r.id === "REQ-001");
      if (i === -1) reqs.push({ id: "REQ-001", title }); else reqs[i] = { ...reqs[i], title };
      const payload = JSON.stringify({ tabDataMap: d.tabDataMap, tabs: d.tabs, assigneesPool: d.assigneesPool, appName: d.appName, boardItems: d.boardItems });
      try { const rev = await inv("save_data", { path: SHARED, data: payload, expectedRev: res.rev ?? 0, userId }); return { ok: true, rev }; }
      catch (e) { const s = String(e); if (s.includes("VERSION_CONFLICT")) { await new Promise((r) => setTimeout(r, 50)); continue; } if (s.includes("ITEM_LOCKED")) return { ok: false, locked: true, error: s }; return { ok: false, error: s }; }
    }
    return { ok: false, error: "retries" };
  }, { SHARED, title, userId });
}
function fileTitle() { try { const d = JSON.parse(fs.readFileSync(SHARED, "utf-8")); return d.tabDataMap?.requirements?.requirements?.find((r) => r.id === "REQ-001")?.title; } catch { return null; } }
function killAll() { try { spawnSync("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" }); } catch {} }

let bA, bB;
try {
  log("\n=== 결함#10 검증: 미커밋 초안 + 락 만료 + 동일 필드 유실 ===\n");
  // 시드: REQ-001 한 행(제목 SEED)을 담은 유효 payload
  const seed = {
    tabDataMap: { requirements: { requirements: [{ id: "REQ-001", title: "SEED", priority: "MEDIUM", status: "TODO", assignees: [], dueDate: "", customColumns: {} }], columns: [{ id: "id", label: "Req.ID" }, { id: "title", label: "제목" }, { id: "priority", label: "우선순위" }, { id: "status", label: "상태" }] } },
    tabs: [{ id: "requirements", sidebarLabel: "요구조건 분석", dashboardTitle: "요구조건 분석", dashboardDesc: "", iconName: "BarChart3", dashboardWidgets: ["stats", "spreadsheet"] }],
    assigneesPool: [], appName: "App", boardItems: [], _rev: 0,
  };
  fs.mkdirSync(path.dirname(SHARED), { recursive: true });
  fs.writeFileSync(SHARED, JSON.stringify(seed));
  if (fs.existsSync(LOCKS)) fs.rmSync(LOCKS, { recursive: true, force: true });
  killAll(); await sleep(1500);

  launch(9260, "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_d10_A");
  launch(9261, "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_d10_B");
  await Promise.all([waitCDP(9260), waitCDP(9261)]);
  const A = await attach(9260), B = await attach(9261);
  bA = A.browser; bB = B.browser;
  const pageA = A.page, pageB = B.page;
  const aLog = [];
  pageA.on("console", (m) => aLog.push(m.text()));
  // 수정본이 stale 시 alert()로 사용자에게 통지 → 자동 수락하고 통지 사실 기록
  let aAlerted = false;
  pageA.on("dialog", async (d) => { aAlerted = true; aLog.push("ALERT:" + d.message().replace(/\n/g, " ")); try { await d.accept(); } catch {} });
  await pageA.waitForSelector("#sidebar-container", { timeout: 30000 });
  await pageB.waitForSelector("#sidebar-container", { timeout: 30000 });
  await onboard(pageA); await onboard(pageB);

  // 스프레드시트에 REQ-001 행이 렌더될 때까지 대기
  let rowReady = false;
  for (let i = 0; i < 15; i++) { if (await pageA.$("#req-row-REQ-001")) { rowReady = true; break; } await sleep(1000); }
  rec("REQ-001 행 렌더", rowReady);
  if (!rowReady) throw new Error("행 미렌더");

  // 1) A가 제목 셀 편집창을 열고 초안 입력(미커밋)
  log("[1] A: 제목 셀 편집창 열기 + 초안 입력(미커밋, 유휴)...");
  const opened = await pageA.evaluate(() => {
    const row = document.getElementById("req-row-REQ-001");
    const cell = [...row.querySelectorAll("td")].find((td) => td.textContent.includes("SEED"));
    if (!cell) return { ok: false, texts: [...row.querySelectorAll("td")].map((t) => t.textContent.trim()).slice(0, 25) };
    cell.click(); return { ok: true };
  });
  await sleep(800);
  const A_DRAFT = `A_DRAFT_${Date.now()}`;
  const draftSet = await pageA.evaluate((v) => {
    const ta = document.querySelector("#req-row-REQ-001 textarea");
    if (!ta) return { ok: false };
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ta), "value").set;
    ta.focus(); setter.call(ta, v); ta.dispatchEvent(new Event("input", { bubbles: true }));
    return { ok: true, val: ta.value };
  }, A_DRAFT);
  rec("A 편집창 열림 + 초안 입력(미커밋)", opened.ok && draftSet.ok, JSON.stringify({ opened, draftSet }).slice(0, 160));
  await sleep(1000); // A가 락 보유(클릭 시 acquire + 하트비트)

  // 2) 보호 확인: A 락 보유 중 B가 같은 필드 저장 시도 → ITEM_LOCKED
  log("[2] 보호 확인: A 락 보유 중 B 저장 시도...");
  const bBlocked = await casSetTitle(pageB, "B_BLOCKED", "userB");
  rec("A 락 보유 중 B 저장이 ITEM_LOCKED로 차단됨(정상 보호)", !!bBlocked.locked, JSON.stringify(bBlocked).slice(0, 120));

  // 3) A 락 만료 시뮬레이션(파일 삭제) 후 B 편집 성공 — A 하트비트 재생성 전에 B가 선점
  log("[3] A 락 만료(파일 삭제) → B가 같은 필드 편집·저장...");
  const B_VALUE = `B_VALUE_${Date.now()}`;
  let bSaved = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    try { if (fs.existsSync(LOCK_FILE)) fs.rmSync(LOCK_FILE, { force: true }); } catch {}
    bSaved = await casSetTitle(pageB, B_VALUE, "userB");
    if (bSaved.ok) break;
    await sleep(200);
  }
  rec("락 만료 후 B의 편집 저장 성공", !!bSaved.ok, JSON.stringify(bSaved).slice(0, 120));

  // 4) A가 B의 변경을 전파받아 상태에 병합될 시간 부여(편집창은 여전히 열림·초안 표시)
  log("[4] A 전파 대기(편집창 열린 채 상태만 B값으로 병합)...");
  await sleep(5000);
  const editorStillOpen = await pageA.evaluate(() => !!document.querySelector("#req-row-REQ-001 textarea"));
  const editorShows = await pageA.evaluate(() => document.querySelector("#req-row-REQ-001 textarea")?.value);
  log(`  편집창 열림=${editorStillOpen}, 표시값='${editorShows}'`);

  // 5) A가 편집창을 커밋(blur) → 옛 초안이 반영되는지
  log("[5] A: 편집창 커밋(blur)...");
  await pageA.evaluate(() => { const ta = document.querySelector("#req-row-REQ-001 textarea"); if (ta) ta.blur(); });
  await sleep(3000);

  const finalTitle = fileTitle();
  const bLost = finalTitle === A_DRAFT;
  const bKept = finalTitle === B_VALUE;
  const aConflictModal = await pageA.evaluate(() => document.body.innerText.includes("충돌")).catch(() => false);
  const aStaleNotice = aAlerted || aLog.some((l) => l.includes("STALE_EDIT") || l.includes("ALERT:"));
  log(`  최종 제목='${finalTitle}' (A초안=${A_DRAFT} / B값=${B_VALUE})`);
  log(`  A 충돌모달=${aConflictModal}, A stale 통지(alert/log)=${aStaleNotice}`);

  // 판정: 결함이 수정됐다면 B값이 유실되지 않아야 함.
  //  - 최선: B값 보존(A의 옛 초안 덮어쓰기 차단) + A에게 통지
  //  - 허용: A초안이 반영되더라도 사용자에게 명시적 통지(무통지 유실만 아니면)
  rec("[결함#10 수정] A의 옛 초안이 B의 편집을 무통지로 덮어쓰지 않음",
    bKept && aStaleNotice ? true : (!bLost || aConflictModal || aStaleNotice),
    bKept
      ? (aStaleNotice ? "B값 보존 + A에게 통지(수정 확인)" : "B값 보존")
      : (bLost ? (aStaleNotice ? "A초안 반영이나 통지됨" : "❗B값 무통지 유실(결함 재현)") : `기타(${finalTitle})`));

  // 6) POSITIVE CONTROL — 원격 변경이 없는 정상 단일 편집은 stale 오탐 없이 정상 커밋되어야 함
  log("[6] positive control: 원격 변경 없는 정상 편집 커밋...");
  await sleep(1500); // 5단계 저장/렌더 정착 대기
  aAlerted = false;
  const NORMAL = `NORMAL_${Date.now()}`;
  const pcOpen = await pageA.evaluate(() => {
    const row = document.getElementById("req-row-REQ-001");
    if (!row) return { ok: false, why: "no-row" };
    const tds = [...row.querySelectorAll("td")];
    const titleCell = tds.find((td) => (td.textContent || "").includes("B_VALUE"));
    if (!titleCell) return { ok: false, why: "no-title-cell", texts: tds.map((t) => (t.textContent || "").trim()).slice(0, 12) };
    titleCell.click(); return { ok: true };
  });
  await sleep(900);
  const pcSet = await pageA.evaluate((v) => {
    const ta = document.querySelector("#req-row-REQ-001 textarea");
    if (!ta) return { ok: false, why: "no-textarea" };
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ta), "value").set;
    ta.focus(); setter.call(ta, v); ta.dispatchEvent(new Event("input", { bubbles: true }));
    return { ok: true, val: ta.value };
  }, NORMAL);
  await sleep(200);
  const pcCommit = await pageA.evaluate(() => {
    const ta = document.querySelector("#req-row-REQ-001 textarea");
    if (!ta) return { ok: false };
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    return { ok: true };
  });
  await sleep(3500);
  const pcTitle = fileTitle();
  log(`  pcOpen=${JSON.stringify(pcOpen)} pcSet=${JSON.stringify(pcSet)} pcCommit=${JSON.stringify(pcCommit)} 최종='${pcTitle}'`);
  rec("[결함#10 회귀] 정상 편집은 stale 오탐 없이 커밋됨(false positive 없음)",
    pcTitle === NORMAL && aAlerted === false, `최종='${pcTitle}', alert=${aAlerted}`);
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
