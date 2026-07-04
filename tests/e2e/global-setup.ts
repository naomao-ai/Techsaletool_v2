import { chromium } from '@playwright/test';

export default async function globalSetup() {
  // Vite cold-start warmup: 실제 브라우저로 접속해 React 앱이 마운트될 때까지 대기
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let ready = false;
  const deadline = Date.now() + 120_000; // 120초 이내

  while (!ready && Date.now() < deadline) {
    try {
      // networkidle 대신 load를 사용 (Socket.IO WebSocket이 networkidle을 막음)
      await page.goto('http://localhost:3000/', {
        waitUntil: 'load',
        timeout: 30_000,
      });
      // React가 마운트되어 사이드바가 렌더링됐는지 확인
      const sidebar = await page.locator('#sidebar-container').waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
      if (sidebar) {
        ready = true;
      } else {
        await page.waitForTimeout(2000);
      }
    } catch {
      await page.waitForTimeout(3000);
    }
  }

  await browser.close();

  if (!ready) {
    throw new Error('Dev server did not become ready within 120s');
  }
}
