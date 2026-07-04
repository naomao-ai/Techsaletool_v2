import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";
const PROJECT = "C:\\01.claude\\Techsaletool_v2";
const EXE = path.join(PROJECT, "src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const c = spawn(EXE, [], { cwd: PROJECT, env: { ...process.env, WEBVIEW2_USER_DATA_FOLDER: "C:\\Users\\naoma\\AppData\\Local\\Temp\\claude\\wv2_D", WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=9235" }, detached: true, stdio: "ignore" });
c.unref();
for (let i = 0; i < 40; i++) { try { const r = await fetch("http://127.0.0.1:9235/json/version"); if (r.ok) break; } catch {} await sleep(500); }
const b = await puppeteer.connect({ browserURL: "http://127.0.0.1:9235", defaultViewport: null });
const pages = await b.pages();
const page = pages.find((p) => p.url().includes("tauri.localhost")) || pages[0];
await page.waitForSelector("#sidebar-container", { timeout: 30000 });
await sleep(2000);
const info = await page.evaluate(() => ({
  isTauri: !!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window)),
  hasInternals: "__TAURI_INTERNALS__" in window,
  appConfig: localStorage.getItem("app_config"),
  offlineDb: (localStorage.getItem("offline_db") || "").slice(0, 80),
  keys: Object.keys(localStorage),
}));
console.log(JSON.stringify(info, null, 2));
await b.disconnect();
spawn("taskkill", ["/F", "/IM", "business-requirements.exe"], { stdio: "ignore" });
