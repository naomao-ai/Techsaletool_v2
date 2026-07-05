import { test } from '@playwright/test';

/**
 * 사용자 설명서용 스크린샷 캡처 유틸.
 * 실행:  npx playwright test tests/e2e/_docs-capture.spec.ts
 * 결과:  docs/images/*.png (설명서가 참조)
 * 앱 UI가 바뀌면 이 스펙을 다시 돌려 이미지를 갱신하면 된다.
 */
const DIR = 'docs/images';

test.use({ viewport: { width: 1440, height: 900 } });

async function boot(page: any) {
  await page.addInitScript(() => localStorage.removeItem('app_config'));
  await page.goto('/');
  await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
  await page.getByText('요구조건 분석').first().click();
  await page.waitForTimeout(1200);
}

test('01 메인 스프레드시트', async ({ page }) => {
  await boot(page);
  await page.screenshot({ path: `${DIR}/01-main-spreadsheet.png` });
});

test('02 셀 편집', async ({ page }) => {
  await boot(page);
  const cell = page.locator('td[data-format-field="title"]').first();
  await cell.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/02-cell-edit.png` });
});

test('03 서식 팝오버', async ({ page }) => {
  await boot(page);
  const cell = page.locator('td[data-format-field="title"]').first();
  await cell.click({ button: 'right' });
  await page.getByText(/텍스트 서식/).first().waitFor({ timeout: 5_000 });
  // 앞 4글자 선택해 버튼 활성 상태로
  const ta = page.getByTestId('rt-selector');
  await ta.click();
  await page.keyboard.press('Home');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${DIR}/03-format-popover.png` });
});

test('04 CE 대시보드', async ({ page }) => {
  await boot(page);
  await page.getByText('CE 대시보드').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/04-dashboard.png` });
});

test('05 환경 설정', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /환경 설정/ }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/05-settings.png` });
});

test('06 상단 툴바 (저장/열기/내보내기)', async ({ page }) => {
  await boot(page);
  // 상단 영역만 크롭
  await page.screenshot({
    path: `${DIR}/06-toolbar.png`,
    clip: { x: 0, y: 0, width: 1440, height: 160 },
  });
});

test('07 게시판(요청)', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /게시판/ }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${DIR}/07-board.png` });
});
