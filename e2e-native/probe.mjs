// 단일 인스턴스 DOM 조사: 편집 가능한 입력/셀렉터 파악용.
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";

const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EXE, [], {
  cwd: PROJECT,
  env: { ...process.env, WEBVIEW2_USER_DATA_FOLDER: "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_P", WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9230" },
  detached: true, stdio: "ignore",
});
child.unref();

for (let i = 0; i < 40; i++) { try { const r = await fetch("http://127.0.0.1:9230/json/version"); if (r.ok) break; } catch {} await sleep(500); }
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9230", defaultViewport: null });
const pages = await browser.pages();
const page = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];
await page.waitForSelector("#sidebar-container", { timeout: 30000 });
await sleep(1500);

const info = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("input, textarea")].slice(0, 25).map((el) => ({
    tag: el.tagName, type: el.type || "", placeholder: el.placeholder || "", value: (el.value || "").slice(0, 30),
  }));
  const editables = [...document.querySelectorAll('[contenteditable="true"]')].length;
  const appName = document.body.innerText.includes("Business Management System");
  return { inputCount: document.querySelectorAll("input,textarea").length, inputs, editables, appName };
});
console.log(JSON.stringify(info, null, 2));

await browser.disconnect();
spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" });
