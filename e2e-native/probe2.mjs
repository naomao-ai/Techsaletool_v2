// 온보딩/설정 화면의 버튼·구조 조사.
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";
const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EXE, [], { cwd: PROJECT, env: { ...process.env, WEBVIEW2_USER_DATA_FOLDER: "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_P2", WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9231" }, detached: true, stdio: "ignore" });
child.unref();
for (let i = 0; i < 40; i++) { try { const r = await fetch("http://127.0.0.1:9231/json/version"); if (r.ok) break; } catch {} await sleep(500); }
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9231", defaultViewport: null });
const pages = await browser.pages();
const page = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];
await page.waitForSelector("#sidebar-container", { timeout: 30000 });
await sleep(1500);

const info = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")].map((b) => (b.innerText || "").trim()).filter(Boolean).slice(0, 40);
  const sidebarButtons = [...document.querySelectorAll("#sidebar-container button, #sidebar-container a")].map((b) => (b.innerText || "").trim()).filter(Boolean).slice(0, 30);
  // 첫 입력 주변 라벨/헤딩
  const headings = [...document.querySelectorAll("h1,h2,h3,label")].map((h) => (h.innerText || "").trim()).filter(Boolean).slice(0, 25);
  return { buttons, sidebarButtons, headings };
});
console.log(JSON.stringify(info, null, 2));
await browser.disconnect();
spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" });
