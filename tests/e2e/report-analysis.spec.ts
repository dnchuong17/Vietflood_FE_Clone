import type { Page, TestInfo } from '@playwright/test';
import type { FloodReport } from '../../src/features/reports/api/reports';
import {
  test as base, expect, API, APP, reports, profile, expectIds, selectStatus, apply, reset,
} from './fixtures';

// Either original spelling is valid when the applied date sort changes which
// canonical report first represents a location; do not invent a normalized label.
const sharedLocation = (page: Page) => page.getByRole('button', {
  name: /^Xem báo cáo tại 12 đường kiểm thử, (?:Tăng Nhơn Phú, Hồ Chí Minh|Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh)$/,
});
const candidateDescription = 'SYNTHETIC nước ngập sâu cần hỗ trợ tại nhà';
const makeReport = (id: number, extra: Partial<FloodReport> = {}): FloodReport => ({
  ...reports[0], id, userId: 1, user: profile('citizen'), isUrgent: false,
  description: `SYNTHETIC báo cáo phân tích ${id}`, createdAt: '2026-10-20T00:00:00Z', ...extra,
});
// Eight canonical IDs, four known locations, two independently unknown locations.
// Similar-content candidates remain separate reports; only repeated IDs collapse.
const canonical: FloodReport[] = [
  makeReport(201, { description: candidateDescription, isUrgent: true }),
  makeReport(202, { description: `  ${candidateDescription.toUpperCase()}  `, status: 'verified',
    province: 'Thành phố Hồ Chí Minh', ward: 'Phường Tăng Nhơn Phú', createdAt: '2026-10-20T00:30:00Z' }),
  makeReport(203, { status: 'resolved', province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu', addressLine: '34 đường kiểm thử' }),
  makeReport(204, { status: 'rejected', province: '', ward: '', addressLine: '' }),
  makeReport(205, { province: 'Hồ Chí Minh', ward: '', addressLine: '' }),
  makeReport(206, { status: 'verified', isUrgent: true, province: '', ward: '', addressLine: '',
    lat: 10.1234561, lng: 106.1234561, description: 'SYNTHETIC cùng vị trí GPS chính xác' }),
  makeReport(207, { status: 'resolved', province: '', ward: '', addressLine: '',
    lat: 10.1234561, lng: 106.1234561, description: 'SYNTHETIC cùng vị trí GPS chính xác', createdAt: '2026-10-20T00:45:00Z' }),
  makeReport(208, { status: 'rejected', province: '', ward: '', addressLine: '',
    lat: 10.1234562, lng: 106.1234562, description: 'SYNTHETIC cùng vị trí GPS chính xác' }),
];
const syntheticRows = () => [
  ...canonical.map(report => ({ ...report })),
  { ...canonical[0] },
  { ...canonical[0], status: 'resolved', isUrgent: false, description: 'SYNTHETIC conflicting later payload' },
];
type Dataset = { rows: FloodReport[]; release: () => void };
const test = base.extend<{ dataset: Dataset }>({
  dataset: [async ({ context, scenario }, runFixture) => {
    const held: (() => void)[] = [];
    const dataset: Dataset = { rows: syntheticRows(), release: () => held.splice(0).forEach(resolve => resolve()) };
    const fixtureRelease = scenario.release;
    scenario.release = () => { dataset.release(); fixtureRelease(); };
    // This narrow override never continues/fetches a real API. All other requests
    // still pass through the shared fixture's fail-closed auditing and blocking.
    await context.route(url => url.origin === API && url.pathname === '/reports', async route => {
      const request = route.request(), url = new URL(request.url()), method = request.method();
      const entry = { method, path: url.pathname, origin: url.origin, query: url.search,
        disposition: method === 'OPTIONS' ? 'synthetic-preflight' : 'synthetic-api' };
      scenario.requests.push(entry);
      const fulfill = (body: unknown, status = 200) => route.fulfill({ status,
        contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': APP,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS' }, body: JSON.stringify(body) });
      if (method === 'OPTIONS') return fulfill({});
      if (method !== 'GET') {
        entry.disposition = 'blocked-write';
        scenario.writes.push(entry);
        return fulfill({ message: 'SYNTHETIC operational write forbidden' }, 501);
      }
      if (scenario.mode === 'loading') await new Promise<void>(resolve => held.push(resolve));
      if (scenario.mode === 'error') return fulfill({ message: 'SYNTHETIC reports outage' }, 503);
      return fulfill(scenario.mode === 'empty' ? [] : dataset.rows);
    });
    try { await runFixture(dataset); } finally { dataset.release(); }
  }, { auto: true }],
});

async function metrics(page: Page, total: number, resolved: number, open: number, locations: number) {
  for (const [id, value] of [['total', total], ['resolved', resolved], ['open', open], ['locations', locations]] as const) {
    await expect(page.getByTestId(`analysis-${id}`)).toHaveText(String(value));
  }
}
async function counter(page: Page, visible: number, total: number) {
  await expect(page.getByText(new RegExp(`^${visible}\\s*/\\s*${total}\\s+báo cáo$`)).first()).toBeVisible();
}
async function evidence(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: 'image/png' });
  if (name === 'analysis-summary') {
    for (const section of ['report-area-heading', 'report-status-heading', 'report-location-heading']) {
      await page.locator(`#${section}`).scrollIntoViewIfNeeded();
      const sectionPath = testInfo.outputPath(`${name}-${section}.png`);
      await page.screenshot({ path: sectionPath });
      await testInfo.attach(`${name}-${section}`, { path: sectionPath, contentType: 'image/png' });
    }
  }
}
const reportReads = (requests: { path: string; method: string }[]) => requests.filter(request => request.path === '/reports' && request.method === 'GET').length;

test.describe('admin report analytics', () => {
  test.use({ role: 'admin' });

  test('unique-ID summary, canonical first row, shared/missing locations without duplicate suggestion panels', async ({ page, scenario, colorScheme }, testInfo) => {
    await page.goto('/cuu-tro');
    await expectIds(page, canonical.map(report => report.id!), 8);
    await expect(page.getByRole('heading', { name: 'Báo cáo người dân', exact: true })).toBeVisible();
    await expect(page.getByTestId('report-analysis-panel')).toBeVisible();
    await metrics(page, 8, 2, 4, 4);
    const notice = page.getByTestId('report-dedup-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/2/); // two repeated rows
    await expect(notice).toContainText(/1/); // one conflicting ID
    await expect(page.locator('article[data-report-id="201"]')).toHaveCount(1);
    await expect(page.locator('article[data-report-id="201"]')).toContainText(candidateDescription);
    await expect(page.locator('article[data-report-id="201"]')).toContainText('Chờ xử lý');
    await expect(page.getByText('SYNTHETIC conflicting later payload', { exact: true })).toHaveCount(0);
    const panel = page.getByTestId('report-analysis-panel');
    await expect(panel.getByRole('button', { name: /^Xem báo cáo tại / })).toHaveCount(4);
    await expect(sharedLocation(page)).toBeVisible();
    await expect(page.getByTestId('duplicate-candidates')).toHaveCount(0);
    await expect(page.getByText('Cách đếm và giới hạn chống trùng', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Đối chiếu #/ })).toHaveCount(0);
    for (const id of [201, 202, 206, 207]) {
      await expect(page.locator(`article[data-report-id="${id}"]`)).toHaveCount(1);
      await expect(page.locator(`article[data-report-id="${id}"] a[href="/bao-cao/${id}"]`)).toBeVisible();
    }
    await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /dark/ : /light/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect(reportReads(scenario.requests)).toBeGreaterThan(0);
    await evidence(page, testInfo, 'analysis-summary');
  });

  test('draft does not change metrics; Apply and Reset use the deduped applied scope locally', async ({ page, scenario }) => {
    await page.goto('/cuu-tro');
    await metrics(page, 8, 2, 4, 4);
    const before = reportReads(scenario.requests);
    await selectStatus(page, 'Đã xác minh');
    await metrics(page, 8, 2, 4, 4);
    await expectIds(page, canonical.map(report => report.id!), 8);
    await apply(page);
    await metrics(page, 2, 0, 2, 2);
    await expectIds(page, [202, 206], 8);
    await page.locator('#relief-filter-search').fill('SYNTHETIC-NO-MATCH');
    await metrics(page, 2, 0, 2, 2);
    await apply(page);
    await metrics(page, 0, 0, 0, 0);
    await expectIds(page, [], 8);
    await expect(page.getByText('Không có báo cáo phù hợp với bộ lọc.', { exact: true })).toBeVisible();
    await reset(page);
    await metrics(page, 8, 2, 4, 4);
    await expectIds(page, canonical.map(report => report.id!), 8);
    await expect(page.locator('#relief-filter-search')).toHaveValue('');
    await expect(page.locator('form select[name="status"]')).toHaveValue('all');
    expect(reportReads(scenario.requests)).toBe(before);
  });

  test('status chart applies immediately without Apply or a new API request', async ({ page, scenario }) => {
    await page.goto('/cuu-tro');
    await metrics(page, 8, 2, 4, 4);
    const before = reportReads(scenario.requests);
    for (const [label, ids, resolved, open, locations] of [
      ['Chờ xử lý', [201, 205], 0, 2, 1],
      ['Đã xác minh', [202, 206], 0, 2, 2],
      ['Đã xử lý', [203, 207], 2, 0, 2],
      ['Từ chối', [204, 208], 0, 0, 1],
    ] as const) {
      // Reset restores the chart's full applied scope before the next drilldown.
      await reset(page);
      await page.getByRole('button', { name: `Lọc trạng thái ${label}`, exact: true }).click();
      await expectIds(page, [...ids], 8);
      await metrics(page, 2, resolved, open, locations);
    }
    expect(reportReads(scenario.requests)).toBe(before);
  });

  test('location drilldown scopes originals, not metrics, and supports clear and Reset', async ({ page, scenario }, testInfo) => {
    await page.goto('/cuu-tro');
    await metrics(page, 8, 2, 4, 4);
    const before = reportReads(scenario.requests);
    await sharedLocation(page).click();
    await expectIds(page, [201, 202], 8);
    await metrics(page, 8, 2, 4, 4);
    await evidence(page, testInfo, 'analysis-location-drilldown');
    await page.getByRole('button', { name: 'Bỏ chọn địa điểm', exact: true }).click();
    await expectIds(page, canonical.map(report => report.id!), 8);
    await sharedLocation(page).click();
    await reset(page);
    await expectIds(page, canonical.map(report => report.id!), 8);
    await expect(page.getByRole('button', { name: 'Bỏ chọn địa điểm', exact: true })).toHaveCount(0);
    await metrics(page, 8, 2, 4, 4);
    expect(reportReads(scenario.requests)).toBe(before);
  });

  test('true and false urgency flags do not change rendered IDs, rankings or metrics', async ({ page, dataset, scenario }, testInfo) => {
    const places = page.getByRole('list', { name: 'Các địa điểm không lặp', exact: true });
    const chart = page.getByTestId('report-area-chart');
    const snapshot = async () => {
      await expectIds(page, canonical.map(report => report.id!), 8);
      await metrics(page, 8, 2, 4, 4);
      await expect(places.getByRole('button')).toHaveCount(4);
      await expect(chart.getByTestId('area-ranking-item')).toHaveCount(2);
      await expect(page.getByTestId('analysis-urgent')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Chỉ xem báo cáo khẩn cấp', exact: true })).toHaveCount(0);
      await expect(page.getByText('Khẩn cấp', { exact: true })).toHaveCount(0);
      const ids = await page.locator('article[data-report-id]').evaluateAll(elements => elements.map(element => element.getAttribute('data-report-id')));
      const locations = await places.getByRole('button').allTextContents();
      const provinces = await chart.getByTestId('area-ranking-item').allTextContents();
      await chart.getByRole('button', { name: 'Phường/xã', exact: true }).click();
      await expect(chart).toHaveAttribute('data-area-level', 'ward');
      await expect(chart.getByTestId('area-ranking-item')).toHaveCount(2);
      const wards = await chart.getByTestId('area-ranking-item').allTextContents();
      const values = await Promise.all(['total', 'resolved', 'open', 'locations'].map(id => page.getByTestId(`analysis-${id}`).innerText()));
      await chart.getByRole('button', { name: 'Tỉnh/thành', exact: true }).click();
      return { ids, locations, provinces, wards, metrics: values };
    };
    await page.goto('/cuu-tro');
    const baseline = await snapshot();
    await expect(places.getByRole('button').first()).toHaveAccessibleName(/^Xem báo cáo tại 12 đường kiểm thử/);
    for (const flag of [false, true]) {
      // Preserve both legacy spellings in the API payload; only flags change.
      dataset.rows = syntheticRows().map(report => ({ ...report, isUrgent: flag, is_urgent: flag }));
      const before = reportReads(scenario.requests);
      await page.reload();
      await expect.poll(() => reportReads(scenario.requests)).toBeGreaterThan(before);
      expect(await snapshot()).toEqual(baseline);
      await evidence(page, testInfo, `analysis-ignored-urgency-${flag}`);
    }
  });

  test('Recharts ranks deduped province and ward areas, bar and keyboard drilldown preserve totals', async ({ page, scenario }, testInfo) => {
    await page.goto('/cuu-tro');
    await metrics(page, 8, 2, 4, 4);
    const before = reportReads(scenario.requests);
    const chart = page.getByTestId('report-area-chart');
    const ranks = chart.getByTestId('area-ranking-item');
    await expect(ranks).toHaveCount(2);
    await expect(ranks.first()).toHaveAttribute('data-area-total', '3');
    await expect(chart.getByRole('status')).toContainText('4 báo cáo thiếu tỉnh/thành');
    const bars = chart.locator('.recharts-bar-rectangle');
    await expect(bars).toHaveCount(2);
    await expect(chart.locator('svg.recharts-surface')).toBeVisible();
    // No-overflow alone misses a flex header squeezed into a very narrow column.
    const headingBox = await chart.getByRole('heading', { name: 'Khu vực nhiều báo cáo', exact: true }).boundingBox();
    expect(headingBox!.width).toBeGreaterThan(250);
    await chart.scrollIntoViewIfNeeded();
    await evidence(page, testInfo, 'area-province-chart');
    await chart.getByTestId('area-recharts').scrollIntoViewIfNeeded();
    await evidence(page, testInfo, 'area-chart-rendered');
    await bars.first().click();
    await expectIds(page, [201, 202, 205], 8);
    await metrics(page, 8, 2, 4, 4);
    await page.getByRole('button', { name: 'Bỏ chọn khu vực', exact: true }).click();
    await expectIds(page, canonical.map(report => report.id!), 8);
    await chart.getByRole('button', { name: 'Phường/xã', exact: true }).click();
    await expect(chart).toHaveAttribute('data-area-level', 'ward');
    await expect(ranks.first()).toHaveAttribute('data-area-total', '2');
    await expect(chart.getByRole('status')).toContainText('5 báo cáo thiếu tỉnh/thành hoặc phường/xã');
    const first = ranks.first().getByRole('button');
    await first.focus(); await page.keyboard.press('Enter');
    await expectIds(page, [201, 202], 8);
    await reset(page);
    await expectIds(page, canonical.map(report => report.id!), 8);
    await expect(page.getByRole('button', { name: 'Bỏ chọn khu vực', exact: true })).toHaveCount(0);
    expect(reportReads(scenario.requests)).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test('area chart caps top eight but complete ranking retains smaller areas and unknown scope is honest', async ({ page, dataset }, testInfo) => {
    dataset.rows = Array.from({ length: 10 }, (_, index) => makeReport(501 + index, {
      province: `Tỉnh QA khu vực ${String(index + 1).padStart(2, '0')}`, ward: 'Phường QA trùng tên',
    }));
    dataset.rows.push({ ...dataset.rows[0] });
    await page.goto('/cuu-tro');
    const chart = page.getByTestId('report-area-chart');
    await expect(chart.getByTestId('area-ranking-item')).toHaveCount(10);
    await expect(chart.locator('.recharts-bar-rectangle')).toHaveCount(8);
    await chart.getByRole('button', { name: 'Phường/xã', exact: true }).click();
    await expect(chart.getByTestId('area-ranking-item')).toHaveCount(10);
    await chart.getByTestId('area-ranking-item').last().getByRole('button').click();
    await expectIds(page, [510], 10);
    dataset.rows = [makeReport(601, { province: '', ward: '', lat: 0, lng: 0 })];
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await expectIds(page, [601], 1);
    await expect(chart.getByText('Chưa có báo cáo đủ thông tin cho cấp khu vực này.', { exact: true })).toBeVisible();
    await expect(chart.getByRole('status')).toContainText('1 báo cáo thiếu');
    await chart.scrollIntoViewIfNeeded();
    await evidence(page, testInfo, 'area-unknown-address');
  });

  test('initial loading and error have no fabricated zero metrics; Retry recovers', async ({ page, scenario, dataset }) => {
    scenario.mode = 'loading';
    await page.goto('/cuu-tro');
    await expect(page.getByText(/Đang tải báo cáo/).first()).toBeVisible();
    for (const id of ['total', 'resolved', 'open', 'locations']) await expect(page.getByTestId(`analysis-${id}`)).toHaveCount(0);
    await expect(page.locator('article[data-report-id]')).toHaveCount(0);
    await expect(page.getByText(/^0\s*\/\s*0\s+báo cáo$/)).toHaveCount(0);
    scenario.mode = 'error'; dataset.release();
    await expect(page.getByText(/SYNTHETIC reports outage/).first()).toBeVisible();
    for (const id of ['total', 'resolved', 'open', 'locations']) await expect(page.getByTestId(`analysis-${id}`)).toHaveCount(0);
    await expect(page.getByText(/^0\s*\/\s*0\s+báo cáo$/)).toHaveCount(0);
    scenario.mode = 'data';
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await metrics(page, 8, 2, 4, 4);
    await expectIds(page, canonical.map(report => report.id!), 8);
  });

  test('failed refresh retains marked stale metrics and originals, then successful retry replaces them', async ({ page, scenario, dataset }) => {
    await page.goto('/cuu-tro');
    await metrics(page, 8, 2, 4, 4);
    scenario.mode = 'error';
    const before = reportReads(scenario.requests);
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await expect.poll(() => reportReads(scenario.requests)).toBeGreaterThan(before);
    await expect(page.getByText(/SYNTHETIC reports outage/).first()).toBeVisible();
    await expect(page.getByText(/Dữ liệu hiển thị là từ lần tải trước/).first()).toBeVisible();
    await metrics(page, 8, 2, 4, 4);
    await expectIds(page, canonical.map(report => report.id!), 8);
    dataset.rows = [canonical[0]];
    scenario.mode = 'data';
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await metrics(page, 1, 0, 1, 1);
    await expectIds(page, [201], 1);
    await expect(page.getByText(/Dữ liệu hiển thị là từ lần tải trước/)).toHaveCount(0);
    await expect(page.getByText(/SYNTHETIC reports outage/)).toHaveCount(0);
  });

  test('successful empty dataset may show zero metrics rather than a loading/error state', async ({ page, scenario }) => {
    scenario.mode = 'empty';
    await page.goto('/cuu-tro');
    await metrics(page, 0, 0, 0, 0);
    await expectIds(page, [], 0);
    await expect(page.getByText('Chưa có báo cáo người dân.', { exact: true })).toBeVisible();
  });

  test('pagination renders twelve unique originals but keeps totals and metrics unpaginated', async ({ page, dataset, scenario }) => {
    const many = Array.from({ length: 15 }, (_, index) => makeReport(301 + index, {
      status: 'pending', isUrgent: index === 0, createdAt: '2026-10-20T00:00:00Z',
    }));
    dataset.rows = [...many, { ...many[0] }];
    await page.goto('/cuu-tro');
    await metrics(page, 15, 0, 15, 1);
    await expect(page.locator('article[data-report-id]')).toHaveCount(12);
    await counter(page, 15, 15);
    const first = await page.locator('article[data-report-id]').evaluateAll(elements => elements.map(element => Number(element.getAttribute('data-report-id'))));
    expect(new Set(first).size).toBe(12);
    const before = reportReads(scenario.requests);
    await expect(page.getByRole('button', { name: 'Trang báo cáo trước', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Trang báo cáo sau', exact: true }).click();
    await expect(page.locator('article[data-report-id]')).toHaveCount(3);
    await counter(page, 15, 15);
    await metrics(page, 15, 0, 15, 1);
    const last = await page.locator('article[data-report-id]').evaluateAll(elements => elements.map(element => Number(element.getAttribute('data-report-id'))));
    expect([...first, ...last].sort((a, b) => a - b)).toEqual(many.map(report => report.id!));
    await expect(page.getByRole('button', { name: 'Trang báo cáo sau', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Trang báo cáo trước', exact: true }).click();
    await expect(page.locator('article[data-report-id]')).toHaveCount(12);
    await counter(page, 15, 15);
    expect(reportReads(scenario.requests)).toBe(before);
  });
});

test.describe('relief retains original report workspace without admin analytics', () => {
  test.use({ role: 'relief' });
  test('list and applied filters remain available, analytics and advisory controls stay absent', async ({ page, dataset }) => {
    dataset.rows = reports;
    await page.goto('/cuu-tro');
    await expect(page.getByRole('heading', { name: 'Báo cáo người dân', exact: true })).toBeVisible();
    // Preserve the shared Relief fixture's existing list and filter behavior.
    await expectIds(page, reports.map(report => report.id));
    await expect(page.getByTestId('report-analysis-panel')).toHaveCount(0);
    await expect(page.getByTestId('duplicate-candidates')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Xem báo cáo tại / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Lọc trạng thái / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Chỉ xem báo cáo khẩn cấp', exact: true })).toHaveCount(0);
    await selectStatus(page, 'Đã xác minh');
    await apply(page);
    await expectIds(page, [102, 106]);
    await expect(page.getByTestId('report-analysis-panel')).toHaveCount(0);
  });
});
