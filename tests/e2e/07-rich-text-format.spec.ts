import { test, expect } from '@playwright/test';

/**
 * [Phase 2] 셀 텍스트 부분 서식 — 셀 우클릭 → 서식 팝오버 → 선택 구간 서식 적용 → 재렌더 검증.
 * 텍스트 정본은 그대로 두고 richText 부가 레이어만 갱신되는지(부분 굵기 span) 확인한다.
 */
test.describe('P2 — 셀 텍스트 부분 서식', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('app_config');
    });
    await page.goto('/');
    await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
    await page.getByText('요구조건 분석').first().click();
    await page.waitForTimeout(1000);
  });

  test('제목 셀 우클릭 시 서식 팝오버가 열린다', async ({ page }) => {
    const titleCell = page.locator('td[data-format-field="title"]').first();
    await titleCell.click({ button: 'right' });
    await expect(page.getByText(/텍스트 서식/).first()).toBeVisible({ timeout: 5_000 });
    // 서식 툴바(미리보기 라벨)까지 렌더되는지
    await expect(page.getByText('미리보기').first()).toBeVisible();
  });

  test('선택 구간에 굵기를 적용하면 미리보기에 부분 굵은 span이 생긴다', async ({ page }) => {
    // 제목이 있는 셀을 우클릭
    const titleCell = page.locator('td[data-format-field="title"]').first();
    await titleCell.click({ button: 'right' });
    const popover = page.getByText(/텍스트 서식/).first();
    await expect(popover).toBeVisible({ timeout: 5_000 });

    // 팝오버 내 선택 전용 textarea에서 앞 3글자를 실제 키보드 조작으로 선택
    const ta = page.getByTestId('rt-selector');
    await expect(ta).toBeVisible();
    await ta.click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.waitForTimeout(150);

    // 굵게 버튼 활성화 확인 후 클릭 (title="굵게")
    await expect(page.locator('button[title="굵게"]')).toBeEnabled();
    await page.locator('button[title="굵게"]').click();
    await page.waitForTimeout(150);

    // 미리보기 영역에 font-weight 700 span이 생겼는지
    const boldCount = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.filter((s) => {
        const fw = getComputedStyle(s).fontWeight;
        return fw === '700' || fw === 'bold';
      }).length;
    });
    expect(boldCount).toBeGreaterThan(0);

    // 적용 → 팝오버 닫힘
    await page.getByRole('button', { name: '적용', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/텍스트 서식/)).toHaveCount(0);

    // 셀 표시에도 굵은 span이 반영됐는지 (부분 서식 렌더)
    const boldInGrid = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('table span'));
      return spans.some((s) => {
        const fw = getComputedStyle(s as Element).fontWeight;
        return fw === '700' || fw === 'bold';
      });
    });
    expect(boldInGrid).toBeTruthy();
  });

  test('선택 없이 서식 버튼은 비활성이다', async ({ page }) => {
    const titleCell = page.locator('td[data-format-field="title"]').first();
    await titleCell.click({ button: 'right' });
    await expect(page.getByText(/텍스트 서식/).first()).toBeVisible({ timeout: 5_000 });
    // 선택 전 굵게 버튼은 disabled
    await expect(page.locator('button[title="굵게"]')).toBeDisabled();
  });
});
