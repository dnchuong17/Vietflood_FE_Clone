import { test, expect } from './fixtures';

test('public landing and auth forms are reachable without a session', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cùng nhau an toàn');
  await page.goto('/dang-nhap');
  await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('link', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/\/dang-ky$/);
  await expect(page.locator('#register-username')).toBeVisible();
});

test('anonymous report workspace redirects to login without fetching reports', async ({ page, scenario }) => {
  await page.goto('/cuu-tro');
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.locator('#login-username')).toBeVisible();
  expect(scenario.requests.filter(request => request.origin.endsWith(':4310'))).toEqual([]);
});

test('synthetic login navigates to operational report workspace', async ({ page, scenario }) => {
  await page.goto('/dang-nhap');
  await page.locator('#login-username').fill('SYNTHETIC-login');
  await page.locator('#login-password').fill('SYNTHETIC-not-a-real-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/cuu-tro$/);
  await expect(page.getByRole('heading', { name: 'Báo cáo người dân', exact: true })).toBeVisible();
  expect(scenario.requests.filter(request => request.disposition === 'synthetic-auth')).toHaveLength(1);
});

test('synthetic rejected login stays on form with explicit error', async ({ page, scenario }) => {
  scenario.loginFailure = true;
  await page.goto('/dang-nhap');
  await page.locator('#login-username').fill('SYNTHETIC-login');
  await page.locator('#login-password').fill('SYNTHETIC-not-a-real-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText('SYNTHETIC invalid credentials', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  expect(scenario.requests.some(request => request.path === '/reports')).toBe(false);
});

test.describe('citizen role guard', () => {
  test.use({ role: 'citizen' });
  test('cannot render relief workspace or request operational reports', async ({ page, scenario }) => {
    await page.goto('/cuu-tro');
    await expect(page).toHaveURL(/\/trang-chu$/);
    await expect(page.getByRole('heading', { name: 'Bản đồ Windy', exact: true })).toBeVisible();
    await expect(page.getByTestId('report-relief-workspace')).toHaveCount(0);
    expect(scenario.requests.some(request => request.path === '/reports')).toBe(false);
  });
});
