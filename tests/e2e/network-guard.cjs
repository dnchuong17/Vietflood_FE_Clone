/* Local fixture isolation for legacy runners. Preload with node --require.
 * Route.continue must fall back through fixtures to the first/bottom deny rule.
 * https://playwright.dev/docs/api/class-route#route-fallback
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS preload, also consumed by legacy CJS runners. */
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

function localBase(value = 'http://127.0.0.1:3105') {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '3105' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('QA requires a credential-free HTTP localhost app origin on port 3105');
  }
  return url;
}

function chromeExecutable(value) {
  if (!value) return undefined; // Playwright bundled headless shell, not a machine-specific Chrome.
  let filename = value;
  if (/^file:/i.test(value)) {
    const url = new URL(value);
    if (url.username || url.password || url.host || url.search || url.hash) throw new Error('QA_CHROME must be a local executable');
    filename = fileURLToPath(url);
  } else if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    throw new Error('QA_CHROME cannot be a remote URL');
  }
  filename = path.resolve(filename);
  if (!fs.statSync(filename).isFile()) throw new Error('QA_CHROME must be a regular file');
  fs.accessSync(filename, fs.constants.X_OK);
  return filename;
}

function forbidden(url, base) {
  if (url.username || url.password) return 'credentials';
  if (/\/socket\.io(?:\/|$)/i.test(url.pathname)) return 'socket-polling';
  if (url.pathname === '/_next/image') {
    const source = url.searchParams.get('url');
    if (source) {
      try {
        const image = new URL(source, base);
        if (image.origin !== base.origin || image.username || image.password || !['http:', 'https:'].includes(image.protocol)) return 'remote-image-proxy';
      } catch { return 'invalid-image-proxy'; }
    }
  }
  return null;
}

async function guardContext(context, { base: value = process.env.QA_WEB_URL, audit = () => {} } = {}) {
  const base = localBase(value);
  const blockSocket = ws => {
    audit({ event: 'blocked-websocket', url: ws.url() });
    ws.close();
  };
  const registerSocket = context.routeWebSocket.bind(context);
  await registerSocket('**/*', blockSocket);
  // A later legacy websocket handler must not reconnect to a server.
  context.routeWebSocket = pattern => registerSocket(pattern, blockSocket);
  const register = context.route.bind(context);
  const record = route => ({ url: route.request().url(), method: route.request().method() });
  await register('**/*', async route => {
    const entry = record(route), url = new URL(entry.url);
    const reason = forbidden(url, base);
    if (!reason && url.origin === base.origin && ['GET', 'HEAD'].includes(entry.method)) {
      audit({ event: 'allowed-local-read', ...entry });
      return route.continue();
    }
    audit({ event: 'blocked-network', reason: reason || 'not-app-read', ...entry });
    return route.abort('blockedbyclient');
  });
  function wrap(handler) {
    return async (route, request) => {
      const entry = record(route), reason = forbidden(new URL(entry.url), base);
      if (reason) {
        audit({ event: 'blocked-network', reason, ...entry });
        return route.abort('blockedbyclient');
      }
      const guarded = new Proxy(route, {
        get(target, key) {
          if (key === 'continue') return overrides => target.fallback(overrides);
          if (key === 'fetch') return () => { throw new Error('QA fixtures must fulfill in memory, never route.fetch'); };
          if (key === 'fulfill') return options => {
            if (options?.response) throw new Error('QA fixtures cannot fulfill a live API response');
            audit({ event: 'fixture-fulfilled', status: options?.status || 200, ...entry });
            return target.fulfill(options);
          };
          const member = Reflect.get(target, key);
          return typeof member === 'function' ? member.bind(target) : member;
        },
      });
      return handler(guarded, request);
    };
  }
  context.route = (pattern, handler, options) => register(pattern, wrap(handler), options);
  // Page handlers take precedence over context handlers; protect them as well.
  context.on('page', page => {
    page.on('pageerror', error => audit({ event: 'page-error', message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error' && /hydrat|cannot (?:be a descendant|contain a nested)/i.test(message.text())) audit({ event: 'hydration-error', message: message.text() });
    });
    const pageRoute = page.route.bind(page);
    page.route = (pattern, handler, options) => pageRoute(pattern, wrap(handler), options);
    const pageSocket = page.routeWebSocket.bind(page);
    page.routeWebSocket = pattern => pageSocket(pattern, blockSocket);
  });
  audit({ event: 'context-guard-installed', base: base.origin, serviceWorkers: 'block' });
  return context;
}

function installLegacyGuard() {
  const base = localBase(process.env.QA_WEB_URL);
  if (!process.env.QA_GUARD_OUTPUT) throw new Error('QA_GUARD_OUTPUT is required for preload audit');
  fs.mkdirSync(process.env.QA_GUARD_OUTPUT, { recursive: true });
  const audit = entry => fs.appendFileSync(path.join(process.env.QA_GUARD_OUTPUT, 'network-guard.jsonl'), JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n');
  const { chromium } = require('playwright');
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async (options = {}) => {
    // Ignore old runners' hardcoded executable defaults; only explicit QA_CHROME is honored.
    const executablePath = chromeExecutable(process.env.QA_CHROME);
    const browser = await launch({ ...options, executablePath, channel: undefined, headless: true, handleSIGINT: true, handleSIGTERM: true, handleSIGHUP: true });
    audit({ event: 'browser', version: browser.version(), executable: executablePath || 'playwright-bundled-headless' });
    const create = browser.newContext.bind(browser);
    browser.newContext = async options => {
      const context = await create({ ...options, serviceWorkers: 'block' });
      return guardContext(context, { base: base.origin, audit });
    };
    return browser;
  };
}

module.exports = { localBase, chromeExecutable, forbidden, guardContext, installLegacyGuard };
if (process.env.QA_GUARD_OUTPUT) installLegacyGuard();
