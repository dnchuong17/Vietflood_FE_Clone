import { test, expect, reports, allIds, expectIds, choose, selectStatus, apply, reset } from './fixtures';

for (const role of ['admin', 'relief'] as const) {
  test.describe(`${role} direct report list`, () => {
    test.use({ role });
    test.beforeEach(async ({ page }) => {
      await page.goto('/cuu-tro');
    });

    test('pending and all statuses visible without any incident data', async ({ page, scenario, colorScheme }) => {
      await expectIds(page, allIds);
      await expect(page.getByRole('heading', { name: 'Báo cáo người dân', exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /dark/ : /light/);
      for (const [id, label] of [[101, 'Chờ xử lý'], [102, 'Đã xác minh'], [103, 'Đã xử lý'], [104, 'Từ chối']] as const) {
        await expect(page.locator(`article[data-report-id="${id}"]`).getByText(label, { exact: true })).toBeVisible();
      }
      await expect(page.locator('article[data-report-id]').getByText('Khẩn cấp', { exact: true })).toHaveCount(0);
      for (const id of [106, 107]) await expect(page.locator(`article[data-report-id="${id}"]`).getByText('Chưa có ngày gửi', { exact: true })).toBeVisible();
      await expect(page.locator('a[href^="/su-co/"]')).toHaveCount(0);
      expect(scenario.requests.some(request => request.path === '/reports' && request.method === 'GET')).toBe(true);
      expect(scenario.incidents).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    });

    test('draft is inert, Apply is local, Reset clears every field', async ({ page, scenario }) => {
      await expectIds(page, allIds);
      const before = scenario.requests.filter(request => request.disposition === 'synthetic-api').length;
      await page.locator('#relief-filter-search').fill('SYNTHETIC-NO-MATCH');
      await expectIds(page, allIds);
      await apply(page); await expectIds(page, []);
      await page.locator('#relief-filter-from').fill('2026-10-16');
      await page.locator('#relief-filter-to').fill('2026-11-01');
      await choose(page, 'relief-filter-province', 'hcm', 'Thành phố Hồ Chí Minh');
      await choose(page, 'relief-filter-ward', 'tang nhon phu', 'Phường Tăng Nhơn Phú');
      await selectStatus(page, 'Chờ xử lý');
      await reset(page); await expectIds(page, allIds);
      for (const id of ['search', 'from', 'to', 'province', 'ward']) await expect(page.locator(`#relief-filter-${id}`)).toHaveValue('');
      await expect(page.locator('form select[name="status"]')).toHaveValue('all');
      expect(scenario.requests.filter(request => request.disposition === 'synthetic-api')).toHaveLength(before);
    });

    test('canonical HCM and ward with October16–November1 UTC+7 inclusive', async ({ page }) => {
      await expectIds(page, allIds);
      await page.locator('#relief-filter-from').fill('2026-10-16');
      await page.locator('#relief-filter-to').fill('2026-11-01');
      await choose(page, 'relief-filter-province', 'hcm', 'Thành phố Hồ Chí Minh');
      await choose(page, 'relief-filter-ward', 'tang nhon phu', 'Phường Tăng Nhơn Phú');
      await expectIds(page, allIds);
      await apply(page); await expectIds(page, [101, 102, 108]);
    });

    test('statuses and accentless Vietnamese search', async ({ page }) => {
      await expectIds(page, allIds);
      for (const [status, label] of [['pending', 'Chờ xử lý'], ['verified', 'Đã xác minh'], ['resolved', 'Đã xử lý'], ['rejected', 'Từ chối']]) {
        await selectStatus(page, label); await apply(page);
        await expectIds(page, reports.filter(report => report.status === status).map(report => report.id));
      }
      await selectStatus(page, 'Tất cả trạng thái'); await apply(page); await expectIds(page, allIds);
      await page.locator('#relief-filter-search').fill('duong ngap can doi chieu'); await apply(page); await expectIds(page, allIds);
      await page.locator('#relief-filter-search').fill('bao cao 101'); await apply(page); await expectIds(page, [101]);
    });

    test('UTC+7 edge dates, open range, missing dates and reversed range', async ({ page }) => {
      await expectIds(page, allIds);
      const dates = async (from: string, to: string, ids: number[]) => {
        await page.locator('#relief-filter-from').fill(from); await page.locator('#relief-filter-to').fill(to);
        await apply(page); await expectIds(page, ids);
      };
      await dates('2026-10-16', '2026-10-16', [101]);
      await dates('2026-11-01', '2026-11-01', [102]);
      await dates('2026-10-16', '2026-11-01', [101, 102, 105, 108]);
      await dates('2026-10-16', '', [101, 102, 104, 105, 108]);
      await dates('', '2026-11-01', [101, 102, 103, 105, 108, 109]);
      await dates('2026-09-01', '2026-11-01', [101, 102, 103, 105, 108, 109]);
      await dates('2026-11-02', '2026-10-16', [101, 102, 103, 105, 108, 109]);
      await expect(page.getByRole('alert').filter({ hasText: /ngày/i }).first()).toBeVisible();
      await reset(page); await expectIds(page, allIds);
    });

    test('unknown uncommitted address draft cannot apply', async ({ page }) => {
      await expectIds(page, allIds);
      await page.locator('#relief-filter-search').fill('SYNTHETIC-NO-MATCH');
      await page.locator('#relief-filter-province').fill('SYNTHETIC-UNKNOWN');
      await expect(page.getByText('Không tìm thấy kết quả.', { exact: true })).toBeVisible();
      await apply(page);
      expect(await page.locator('#relief-filter-province').evaluate((element: HTMLInputElement) => element.validity.customError)).toBe(true);
      await expectIds(page, allIds);
      await page.locator('#relief-filter-province').press('Escape');
      await apply(page); await expectIds(page, []);
    });

    test('actual detail route renders report from detail API without a write', async ({ page, scenario }) => {
      await expectIds(page, allIds);
      await page.locator('article[data-report-id="101"] a[href="/bao-cao/101"]').click();
      await expect(page).toHaveURL(/\/bao-cao\/101$/);
      await expect(page.getByText(reports[0].description, { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Báo cáo #101', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Khẩn cấp', { exact: true })).toHaveCount(0);
      expect(scenario.requests.some(request => request.path === '/reports/101')).toBe(true);
    });

    test('API failure is explicit; Retry and Refresh fetch again', async ({ page, scenario }) => {
      await expectIds(page, allIds);
      scenario.mode = 'error';
      await page.reload();
      await expect(page.getByText(/SYNTHETIC reports outage/).first()).toBeVisible();
      await expect(page.locator('article[data-report-id]')).toHaveCount(0);
      scenario.mode = 'data';
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await expectIds(page, allIds);
      const before = scenario.requests.filter(request => request.path === '/reports').length;
      await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
      await expect.poll(() => scenario.requests.filter(request => request.path === '/reports').length).toBeGreaterThan(before);
      await expectIds(page, allIds);
    });

    test('loading recovers; genuinely empty differs from filter no-match', async ({ page, scenario }) => {
      await expectIds(page, allIds);
      scenario.mode = 'loading'; await page.reload();
      await expect(page.getByText(/Đang tải báo cáo/).first()).toBeVisible();
      scenario.mode = 'data'; scenario.release(); await expectIds(page, allIds);
      scenario.mode = 'empty'; await page.reload();
      await expect(page.getByText('Chưa có báo cáo người dân.', { exact: true })).toBeVisible();
      await expectIds(page, [], 0);
      scenario.mode = 'data'; await page.reload(); await expectIds(page, allIds);
      await page.locator('#relief-filter-search').fill('SYNTHETIC-NO-MATCH'); await apply(page); await expectIds(page, []);
      await expect(page.getByText('Không có báo cáo phù hợp với bộ lọc.', { exact: true })).toBeVisible();
      await expect(page.getByText('Chưa có báo cáo người dân.', { exact: true })).toHaveCount(0);
      await reset(page); await expectIds(page, allIds);
    });
  });
}
