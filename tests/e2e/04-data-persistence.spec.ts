import { test, expect } from '@playwright/test';

test.describe('P1 — 데이터 영속성 (localStorage)', () => {
  test('앱 로딩 후 localStorage에 app_user_profile이 생성된다', async ({ page }) => {
    await page.addInitScript(() => { localStorage.removeItem('app_user_profile'); });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const profile = await page.evaluate(() => localStorage.getItem('app_user_profile'));
    expect(profile).not.toBeNull();
    const parsed = JSON.parse(profile!);
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('name');
  });

  test('사용자 프로필 ID가 USR- 접두어를 갖는다', async ({ page }) => {
    await page.addInitScript(() => { localStorage.removeItem('app_user_profile'); });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const profile = JSON.parse(await page.evaluate(() => localStorage.getItem('app_user_profile') ?? '{}'));
    expect(profile.id).toMatch(/^USR-/);
  });

  test('기존 프로필이 있으면 새 ID를 생성하지 않는다', async ({ page }) => {
    const fixedProfile = { id: 'USR-TEST1', name: 'User_TEST1' };
    await page.addInitScript((p) => {
      localStorage.setItem('app_user_profile', JSON.stringify(p));
    }, fixedProfile);
    await page.goto('/');
    await page.waitForTimeout(1000);
    const profile = JSON.parse(await page.evaluate(() => localStorage.getItem('app_user_profile') ?? '{}'));
    expect(profile.id).toBe('USR-TEST1');
  });

  test('offline_db에 초기 데이터가 저장된다', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('app_config');
      localStorage.removeItem('offline_db');
    });
    await page.goto('/');
    await page.waitForTimeout(2000); // 1초 debounce 후 저장
    const offlineDb = await page.evaluate(() => localStorage.getItem('offline_db'));
    expect(offlineDb).not.toBeNull();
    const parsed = JSON.parse(offlineDb!);
    expect(parsed).toHaveProperty('tabs');
    expect(Array.isArray(parsed.tabs)).toBeTruthy();
  });

  test('새로고침 후에도 탭 데이터가 유지된다', async ({ page }) => {
    // offline_db를 비워서 초기 상태부터 시작
    await page.addInitScript(() => {
      localStorage.removeItem('app_config');
      localStorage.removeItem('offline_db');
    });
    await page.goto('/');
    await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
    await page.waitForTimeout(2500); // debounce 저장 대기

    // 저장된 탭 수 확인
    const tabCount = await page.evaluate(() => {
      const db = localStorage.getItem('offline_db');
      return db ? JSON.parse(db).tabs?.length ?? 0 : 0;
    });
    expect(tabCount).toBeGreaterThan(0); // 저장이 됐어야 함

    // 새로고침 (addInitScript는 재실행되지 않음 — reload는 goto가 아님)
    await page.reload();
    await page.locator('#sidebar-container').waitFor({ timeout: 20_000 });
    await page.waitForTimeout(1500);

    const afterCount = await page.evaluate(() => {
      const db = localStorage.getItem('offline_db');
      return db ? JSON.parse(db).tabs?.length ?? 0 : 0;
    });
    expect(afterCount).toBe(tabCount);
  });
});
