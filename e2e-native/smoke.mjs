// L3 스모크 테스트: msedgedriver로 기존 Tauri 릴리스 .exe(WebView2)를 직접 자동화 가능한지 확인.
// tauri-driver(러스트 빌드) 없이 msedgedriver의 WebView2 자동화 기능을 직접 사용.
// 실행: node e2e-native/smoke.mjs   (사전: msedgedriver --port=9515 실행 중)
import { remote } from "webdriverio";

const APP = "C:\\01.claude\\Techsaletool_v2\\src-tauri\\target\\x86_64-pc-windows-gnu\\release\\business-requirements.exe";

const caps = {
  browserName: "webview2",
  "ms:edgeOptions": {
    binary: APP,
    args: [],
  },
};

let browser;
try {
  console.log("[smoke] remote() 세션 생성 시도 → WebView2 앱 구동...");
  browser = await remote({
    hostname: "127.0.0.1",
    port: 9515,
    path: "/",
    connectionRetryCount: 1,
    connectionRetryTimeout: 120000,
    logLevel: "error",
    capabilities: caps,
  });
  console.log("[smoke] 세션 생성 성공 ✅");

  // 사이드바(#sidebar-container)가 마운트될 때까지 대기
  const sidebar = await browser.$("#sidebar-container");
  await sidebar.waitForExist({ timeout: 30000 });
  console.log("[smoke] #sidebar-container 발견 ✅ — 앱이 자동화 가능 상태");

  const title = await browser.getTitle().catch(() => "(제목 없음)");
  console.log(`[smoke] 문서 제목: ${title}`);

  // 기본 탭 텍스트 확인
  const bodyText = await browser.$("body").getText().catch(() => "");
  const hasReq = bodyText.includes("요구조건");
  console.log(`[smoke] '요구조건' 텍스트 존재: ${hasReq}`);

  console.log("\n[smoke] 결과: 자동화 가능 ✅ (2-인스턴스 협업 시나리오 진행 가능)");
} catch (e) {
  console.error("\n[smoke] 실패 ❌");
  console.error(`[smoke] ${String(e.message).split("\n").slice(0, 6).join("\n")}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.deleteSession().catch(() => {});
}
