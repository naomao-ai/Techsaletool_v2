// executable_dir 역추적: 원클릭 인프라 설치 버튼을 눌러 EXPORT/ 등이 생성되는 위치를 찾는다.
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";
const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const c = spawn(EXE, [], { cwd: PROJECT, env: { ...process.env, WEBVIEW2_USER_DATA_FOLDER: "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_F", WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9236" }, detached: true, stdio: "ignore" });
c.unref();
for (let i = 0; i < 40; i++) { try { const r = await fetch("http://127.0.0.1:9236/json/version"); if (r.ok) break; } catch {} await sleep(500); }
const b = await puppeteer.connect({ browserURL: "http://127.0.0.1:9236", defaultViewport: null });
const pages = await b.pages();
const page = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];
await page.waitForSelector("#sidebar-container", { timeout: 30000 });
await sleep(2000);
const clicked = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((x) => (x.innerText || "").includes("원 클릭"));
  if (btn) { btn.click(); return true; }
  return false;
});
console.log("원클릭 버튼 클릭:", clicked);
await sleep(4000);
await b.disconnect();
spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" });
