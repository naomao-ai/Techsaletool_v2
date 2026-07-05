// 결함#9 실증 프로브: tabs:[]로 오염된 공유 파일을 로드할 때 렌더 크래시가 나는지,
// ErrorBoundary가 잡은 에러의 실제 메시지/스택을 캡처한다.
// 사용법: node e2e-native/_probe_defect9.mjs <오염된 데이터파일 경로>
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const TARGET = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const env = { ...process.env, WEBVIEW2_USER_DATA_FOLDER: "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_probe9", WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9231" };
spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" });
await sleep(1500);
const c = spawn(EXE, [], { cwd: PROJECT, env, detached: true, stdio: "ignore" });
c.unref();

const dl = Date.now() + 40000;
while (Date.now() < dl) { try { const r = await fetch("http://127.0.0.1:9231/json/version"); if (r.ok) break; } catch {} await sleep(500); }
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9231", defaultViewport: null });
const pages = await browser.pages();
const pg = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];

const errors = [];
pg.on("console", async (m) => {
  if (m.type() !== "error") return;
  // 각 인자를 스택/컴포넌트스택까지 직렬화
  const parts = [];
  for (const h of m.args()) {
    try {
      const v = await h.evaluate((o) => {
        if (o instanceof Error) return `[Error] ${o.message}\n${o.stack}`;
        if (o && typeof o === "object" && o.componentStack) return `[componentStack]${o.componentStack}`;
        return String(o);
      });
      parts.push(v);
    } catch { parts.push("<직렬화 실패>"); }
  }
  errors.push(parts.join(" | "));
});
pg.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack || ""}`));

await pg.waitForSelector("#sidebar-container", { timeout: 30000 }).catch(() => {});

// 오염된 파일을 activeDataPath로 지정 후 reload (L4 재실행과 동일 조건)
await pg.evaluate(async (target) => {
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem("app_config") || "{}"); } catch {}
  cfg.activeDataPath = target;
  localStorage.setItem("app_config", JSON.stringify(cfg));
  await window.__TAURI_INTERNALS__.invoke("update_server_config", { activePath: target });
}, TARGET);
await pg.reload({ waitUntil: "domcontentloaded" });
await sleep(6000);

const bodySnippet = await pg.evaluate(() => document.body.innerText.slice(0, 200)).catch(() => "<본문 읽기 실패>");
console.log("=== 캡처된 에러", errors.length, "건 ===");
for (const e of errors.slice(0, 6)) console.log("---\n" + e.slice(0, 1500));
console.log("=== 화면 상태(본문 앞부분) ===\n" + bodySnippet);

await browser.disconnect();
spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" });
