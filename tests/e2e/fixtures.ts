import { test as base, expect, type Page } from '@playwright/test';

export const APP = 'http://127.0.0.1:3105';
export const API = 'http://127.0.0.1:4310';
export type Role = 'admin' | 'relief' | 'citizen';
type Status = 'pending' | 'verified' | 'resolved' | 'rejected';
// Same canonical data/choices as docs/qa/report-relief.cjs and vietnam-address-picker.cjs.
// Plain typed data avoids pulling standalone runners and their side effects into Test.
export const profile = (role: Role) => ({ id: 1, username: 'SYNTHETIC-fixture', role,
  first_name: 'QA', last_name: 'Synthetic', name: 'QA Synthetic', email: 'fixture@example.invalid' });
const make = (id: number, status: Status, createdAt?: string, extra: Record<string, unknown> = {}) => ({
  id, userId: 1, user: profile('citizen'), description: `SYNTHETIC báo cáo ${id} — Đường ngập cần đối chiếu`,
  category: ['flood'], province: 'Hồ Chí Minh', ward: 'Tăng Nhơn Phú', addressLine: '12 đường kiểm thử',
  status, createdAt, isUrgent: id === 101, evidences: [], images: [], ...extra,
});
export const reports = [
  make(101, 'pending', '2026-10-15T17:00:00.000Z'),
  make(102, 'verified', '2026-11-01T16:59:59.999Z', { province: 'Thành phố Hồ Chí Minh', ward: 'Phường Tăng Nhơn Phú' }),
  make(103, 'resolved', '2026-10-15T16:59:59.999Z'),
  make(104, 'rejected', '2026-11-01T17:00:00.000Z'),
  make(105, 'pending', '2026-10-20T00:00:00Z', { province: 'Thành phố Đà Nẵng', ward: 'Phường Hải Châu' }),
  make(106, 'verified'), make(107, 'resolved', 'invalid-date'),
  make(108, 'rejected', undefined, { created_at: '2026-10-20T00:00:00Z' }),
  make(109, 'pending', '2026-09-01T00:00:00Z'),
];
export const allIds = reports.map(report => report.id);
const provinces = [{ code: 48, name: 'Thành phố Đà Nẵng' }, { code: 79, name: 'Thành phố Hồ Chí Minh' }, { code: 1, name: 'Thành phố Hà Nội' }];
const wards = [{ code: 20194, name: 'Phường Hải Châu', province_code: 48 }, { code: 20200, name: 'Phường Thanh Khê', province_code: 48 }, { code: 26734, name: 'Phường Bến Thành', province_code: 79 }, { code: 1, name: 'Phường Ba Đình', province_code: 1 }, { code: 26800, name: 'Phường Tăng Nhơn Phú', province_code: 79 }];
function token(role: Role) {
  return [Buffer.from('{"alg":"none"}').toString('base64url'), Buffer.from(JSON.stringify({
    ...profile(role), sub: 1, exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url'), 'SYNTHETIC-only'].join('.');
}
type RecordEntry = { method: string; path: string; origin: string; query: string; disposition: string };
export type Scenario = {
  role: Role | null; mode: 'data' | 'empty' | 'error' | 'loading'; loginFailure: boolean;
  requests: RecordEntry[]; unexpected: RecordEntry[]; writes: RecordEntry[]; incidents: RecordEntry[];
  blocked: RecordEntry[]; errors: string[]; release: () => void;
};
export const test = base.extend<{ scenario: Scenario; role: Role | null }>({
  role: [null, { option: true }],
  scenario: [async ({ context, role, colorScheme }, runFixture, testInfo) => {
    const held: (() => void)[] = [];
    const state: Scenario = { role, mode: 'data', loginFailure: false, requests: [], unexpected: [], writes: [],
      incidents: [], blocked: [], errors: [], release: () => held.splice(0).forEach(resolve => resolve()) };
    await context.addInitScript(({ value, theme, origin }) => {
      if (location.origin !== origin) return;
      localStorage.setItem('theme', theme);
      if (value) localStorage.setItem('vietflood_access_token', value);
      // No storageState file or real credentials: synthetic identity lives only in this ephemeral context.
    }, { value: role ? token(role) : null, theme: colorScheme ?? 'light', origin: APP });
    context.on('page', page => page.on('pageerror', error => state.errors.push(error.message)));
    await context.routeWebSocket('**/*', socket => {
      state.blocked.push({ method: 'WS', path: new URL(socket.url()).pathname, origin: new URL(socket.url()).origin, query: '', disposition: 'blocked-socket' });
      socket.close();
    });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url()), method = request.method(), path = url.pathname;
      const entry: RecordEntry = { method, path, origin: url.origin, query: url.search, disposition: 'blocked' };
      const fulfill = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': APP, 'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }, body: JSON.stringify(body) });
      state.requests.push(entry);
      if (/^\/incidents(?:\/|$)/.test(path)) {
        state.incidents.push(entry); return fulfill({ message: 'SYNTHETIC: incidents forbidden' }, 501);
      }
      // Only this explicit, validated auth POST is allowed; never continue a write to any server.
      if (url.origin === API && path === '/auth/sign_in' && method === 'POST') {
        const body = request.postDataJSON() as { username?: string; password?: string };
        if (body.username !== 'SYNTHETIC-login' || body.password !== 'SYNTHETIC-not-a-real-password') {
          state.writes.push(entry); return fulfill({ message: 'Unexpected auth payload' }, 501);
        }
        entry.disposition = 'synthetic-auth';
        if (state.loginFailure) return fulfill({ message: 'SYNTHETIC invalid credentials' }, 401);
        return fulfill({ accessToken: token(state.role ?? 'admin') });
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        state.writes.push(entry); return fulfill({ message: 'SYNTHETIC operational write forbidden' }, 501);
      }
      if (path.startsWith('/socket.io') || (path === '/_next/image' && !/^\/(?!\/)/.test(url.searchParams.get('url') ?? ''))) {
        state.blocked.push(entry); return route.abort();
      }
      if (url.origin === API) {
        if (method === 'OPTIONS') { entry.disposition = 'synthetic-preflight'; return fulfill({}); }
        if (method !== 'GET') { state.unexpected.push(entry); return route.abort(); }
        entry.disposition = 'synthetic-api';
        if (path === '/auth/profile') return fulfill(profile(state.role ?? 'admin'));
        if (path === '/reports') {
          if (state.mode === 'loading') await new Promise<void>(resolve => held.push(resolve));
          if (state.mode === 'error') return fulfill({ message: 'SYNTHETIC reports outage' }, 503);
          return fulfill(state.mode === 'empty' ? [] : reports);
        }
        const detail = reports.find(report => path === `/reports/${report.id}`);
        if (detail) return fulfill(detail);
        state.unexpected.push(entry); return fulfill({ message: 'SYNTHETIC unknown API' }, 501);
      }
      if (url.origin === 'https://provinces.open-api.vn' && method === 'GET' && ['/api/v2/p/', '/api/v2/w/'].includes(path)) {
        entry.disposition = 'synthetic-catalogue'; return fulfill(path.endsWith('/w/') ? wards : provinces);
      }
      if (url.origin === APP && ['GET', 'HEAD'].includes(method)) {
        if (path.startsWith('/api/')) { state.unexpected.push(entry); return route.abort(); }
        entry.disposition = 'local-app'; return route.continue();
      }
      // All other remote requests (including Windy, images and socket polling) abort before network.
      state.blocked.push(entry); return route.abort();
    });
    try { await runFixture(state); }
    finally {
      state.release();
      await testInfo.attach('SYNTHETIC-request-audit', { body: JSON.stringify(state, null, 2), contentType: 'application/json' });
      expect(state.incidents, 'No incident request, including failed requests').toEqual([]);
      expect(state.unexpected, 'No unknown APIs').toEqual([]);
      expect(state.writes, 'No unexpected writes').toEqual([]);
      expect(state.errors, 'No uncaught browser exceptions').toEqual([]);
    }
  }, { auto: true }],
});
export { expect };
export async function expectIds(page: Page, ids: number[], total = reports.length) {
  await expect.poll(async () => page.locator('article[data-report-id]').evaluateAll(elements => elements.map(element => Number(element.getAttribute('data-report-id'))).sort((a, b) => a - b))).toEqual([...ids].sort((a, b) => a - b));
  await expect(page.getByText(new RegExp(`^${ids.length}\\s*/\\s*${total}\\s+báo cáo$`)).first()).toBeVisible();
}
export async function choose(page: Page, id: string, query: string, name: string) {
  await page.locator(`#${id}`).fill(query);
  await page.getByRole('option', { name: new RegExp(`^${name}(?: ✓)?$`) }).click();
  await expect(page.locator(`#${id}`)).toHaveValue(name);
}
export async function selectStatus(page: Page, value: string) {
  await page.locator('#relief-filter-status').click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
export const apply = (page: Page) => page.getByRole('button', { name: 'Áp dụng bộ lọc', exact: true }).click();
export const reset = (page: Page) => page.locator('form').getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
