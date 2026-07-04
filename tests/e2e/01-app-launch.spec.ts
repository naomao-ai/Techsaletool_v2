import { test, expect } from '@playwright/test';

test.describe('P1 — 앱 초기 로딩', () => {
  test('사이드바에 기본 탭 3개가 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('요구조건 분석').first()).toBeVisible();
    await expect(page.getByText('CE 대시보드').first()).toBeVisible();
    await expect(page.getByText('호선일정').first()).toBeVisible();
  });

  test('초기 탭이 요구조건 분석이고 스프레드시트가 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
    // 스프레드시트 고유 테이블 (table-fixed 클래스는 스프레드시트 테이블만 사용)
    await expect(page.locator('table.table-fixed').first()).toBeVisible({ timeout: 15_000 });
  });

  test('앱 이름이 상단 바에 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Business Management System').first()).toBeVisible();
  });

  test('설정 탭이 없어도 앱이 정상 로딩된다 (offline 모드)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('app_config');
      localStorage.removeItem('offline_db');
      localStorage.removeItem('app_user_profile');
    });
    await page.goto('/');
    await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
    // 사이드바가 렌더링되어야 함
    await expect(page.locator('#sidebar-container')).toBeVisible();
    // 기본 탭이 표시되어야 함
    await expect(page.getByText('요구조건 분석').first()).toBeVisible();
  });
});
