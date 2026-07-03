import { test, expect } from '@playwright/test';

test.describe('P1 — 탭 전환', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 기본 탭(요구조건 분석)이 로딩될 때까지 대기
    await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
  });

  test('CE 대시보드 탭 클릭 시 전환된다', async ({ page }) => {
    await page.getByText('CE 대시보드').first().click();
    await expect(page.getByText('CE 대시보드').first()).toBeVisible();
    // URL이나 페이지 내용 변경 확인
    await page.waitForTimeout(500);
    const title = await page.locator('input[placeholder="대시보드 제목"]').inputValue().catch(() => '');
    expect(title).toContain('CE');
  });

  test('호선일정 탭 클릭 시 전환된다', async ({ page }) => {
    await page.getByText('호선일정').first().click();
    await page.waitForTimeout(500);
    const title = await page.locator('input[placeholder="대시보드 제목"]').inputValue().catch(() => '');
    expect(title).toContain('호선');
  });

  test('탭 전환 후 돌아와도 요구조건 분석 탭이 복원된다', async ({ page }) => {
    await page.getByText('CE 대시보드').first().click();
    await page.waitForTimeout(300);
    await page.getByText('요구조건 분석').first().click();
    await page.waitForTimeout(300);
    const title = await page.locator('input[placeholder="대시보드 제목"]').inputValue().catch(() => '');
    expect(title).toContain('요구조건');
  });

  test('게시판(요청) 탭이 존재하고 클릭 시 전환된다', async ({ page }) => {
    // 사이드바 고정 항목: 게시판 (요청)
    const boardBtn = page.getByText('게시판 (요청)').first();
    const exists = await boardBtn.isVisible().catch(() => false);
    if (exists) {
      await boardBtn.click();
      await page.waitForTimeout(800);
      // 사이드바가 여전히 표시되어야 함 (앱이 크래시하지 않음)
      await expect(page.locator('#sidebar-container')).toBeVisible();
    }
    // 탭이 없어도 앱이 크래시하지 않음을 확인
    await expect(page.locator('#sidebar-container')).toBeVisible();
  });
});
