#!/usr/bin/env node
/* Five legacy fixture UI suites, not five Playwright Test cases or backend E2E. */
/* eslint-disable @typescript-eslint/no-require-imports -- CLI and legacy runners intentionally use CommonJS. */
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { localBase, chromeExecutable } = require('../../tests/e2e/network-guard.cjs');
const root = path.resolve(__dirname, '../..');
const base = 'http://127.0.0.1:3105';
const api = 'http://127.0.0.1:4310';
const suites = [
  { id: 'report-relief', outputVariable: 'QA_RELIEF_OUTPUT', expectedChecks: 100 },
  { id: 'vietnam-address-picker', outputVariable: 'QA_ADDRESS_OUTPUT', expectedChecks: 35 },
  { id: 'ui-enhancement', outputVariable: 'QA_UI_OUTPUT', expectedChecks: 109 },
  { id: 'chat-ui', outputVariable: 'QA_CHAT_OUTPUT', expectedChecks: 29 },
  { id: 'chat-attachment-confirm', outputVariable: 'QA_ATTACHMENT_OUTPUT', expectedChecks: 18 },
];

function summarizeReport(suite, report) {
  const errors = [];
  let checkCount = 0, passed = 0, failed = 0;
  const empty = (object, key, required = false) => {
    if (required && !Array.isArray(object[key])) errors.push(`Missing array ${key}`);
    else if (object[key]?.length) errors.push(`${key}: ${JSON.stringify(object[key])}`);
  };
  if (suite.id === 'chat-attachment-confirm') {
    if (!Array.isArray(report.cases) || report.cases.length !== 2) errors.push('Expected two attachment viewport cases');
    const widths = [];
    for (const item of report.cases || []) {
      widths.push(item.variant?.width);
      if (!Array.isArray(item.checks) || item.checks.length !== 9) errors.push('Expected nine attachment checks per viewport');
      checkCount += item.checks?.length || 0;
      if (item.status !== 'passed' || item.error) { failed++; errors.push(item.error || 'Attachment case not passed'); }
      else passed += item.checks?.length || 0;
      empty(item, 'pageErrors', true);
    }
    if (widths.sort((a, b) => a - b).join(',') !== '390,1280') errors.push('Incomplete attachment viewport matrix');
  } else if (suite.id === 'vietnam-address-picker') {
    if (!Array.isArray(report.checks)) errors.push('Missing checks');
    checkCount = report.checks?.length || 0;
    passed = checkCount;
    if (report.passed !== passed) errors.push('Address passed count disagrees with checks');
    empty(report, 'errors', true);
    empty(report, 'unexpected');
    if (report.error) errors.push(report.error);
  } else {
    if (!Array.isArray(report.results)) errors.push('Missing results');
    const results = report.results || [];
    checkCount = results.length;
    passed = results.filter(item => item.status === 'passed').length;
    failed = results.length - passed;
    if (report.passed !== passed || report.failed !== failed) errors.push('Declared counts disagree with result statuses');
    if (suite.id === 'chat-ui' && report.total !== checkCount) errors.push('Chat total disagrees with results');
    for (const item of results) if (item.status !== 'passed') errors.push(`${item.name}: ${item.error || item.status}`);
    empty(report, 'pageErrors', true);
    if (suite.id === 'report-relief') {
      for (const key of ['incidentRequests', 'writes', 'unexpected']) empty(report, key, true);
      const scenarios = results.filter(item => item.kind === 'scenario');
      if (report.expectedScenarioCases !== 96 || report.scenarioCasesAttempted !== 96 || report.scenarioCasesPassed !== 96 || scenarios.length !== 96 || scenarios.some(item => item.status !== 'passed')) errors.push('Incomplete 96-scenario relief matrix');
    }
    if (suite.id === 'ui-enhancement') {
      empty(report, 'unexpected', true);
      const routes = results.filter(item => item.kind === 'route');
      if (report.expectedRouteCases !== 64 || report.routeCasesAttempted !== 64 || report.routeCasesPassed !== 64 || routes.length !== 64 || routes.some(item => item.status !== 'passed')) errors.push('Incomplete 64-route UI matrix');
    }
  }
  if (checkCount !== suite.expectedChecks) errors.push(`Expected ${suite.expectedChecks} checks, found ${checkCount}`);
  if (failed) errors.push(`${failed} failed checks/cases`);
  const hydration = (report.consoleErrors || []).filter(item => /hydrat|cannot (?:be a descendant|contain a nested)/i.test(typeof item === 'string' ? item : item.text || ''));
  if (hydration.length) errors.push(`Hydration/invalid nesting diagnostics: ${JSON.stringify(hydration)}`);
  return { checkCount, passed, failed, errors };
}

function summarizeAudit(filename) {
  const errors = [], counts = {};
  if (!fs.existsSync(filename)) return { counts, errors: ['Missing network guard audit'] };
  for (const line of fs.readFileSync(filename, 'utf8').split('\n').filter(Boolean)) {
    let entry;
    try { entry = JSON.parse(line); } catch { errors.push('Invalid JSONL network audit'); continue; }
    counts[entry.event] = (counts[entry.event] || 0) + 1;
    if (entry.event === 'allowed-local-read') {
      const url = new URL(entry.url);
      if (url.origin !== base || !['GET', 'HEAD'].includes(entry.method)) errors.push(`Unsafe network fallthrough: ${entry.method} ${entry.url}`);
    }
    if (['page-error', 'hydration-error'].includes(entry.event)) errors.push(`${entry.event}: ${entry.message}`);
    if (entry.event === 'fixture-fulfilled' && [404, 501].includes(entry.status) && new URL(entry.url).origin !== base) errors.push(`Unhandled fixture endpoint: ${entry.method} ${entry.url} (${entry.status})`);
  }
  if (!counts.browser || !counts['context-guard-installed'] || !counts['allowed-local-read']) errors.push('Incomplete browser/context/network audit');
  return { counts, errors };
}

async function assertPortFree() {
  // Check both host spellings; never reuse or terminate an unrelated process.
  for (const host of ['127.0.0.1', '::1']) {
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', error => {
        if (host === '::1' && ['EADDRNOTAVAIL', 'EAFNOSUPPORT'].includes(error.code)) resolve();
        else reject(new Error(`Port 3105 unavailable on ${host}; stop its owner yourself (${error.code})`));
      });
      server.listen({ port: 3105, host, exclusive: true }, () => server.close(resolve));
    });
  }
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-') + `-${process.pid}`;
  const output = path.join(root, 'test-results/qa-regressions', runId);
  fs.mkdirSync(output, { recursive: true });
  const summaryFile = path.join(output, 'summary.json');
  const summary = {
    evidenceKind: 'Five synthetic fixture UI regression suites; not backend persistence, production or native E2E',
    runId, startedAt: new Date().toISOString(), base, api, status: 'running', interrupted: null,
    expectedSuites: suites.length, expectedChecks: suites.reduce((sum, suite) => sum + suite.expectedChecks, 0),
    errors: [], build: null, server: null,
    suites: suites.map(suite => ({ id: suite.id, expectedChecks: suite.expectedChecks, status: 'notRun', notRun: true, exitCode: null, signal: null, checkCount: 0, passed: 0, failed: 0, errors: [] })),
  };
  const save = () => fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2) + '\n');
  const active = new Set();
  const groups = new Set();
  const signalGroup = (child, signal) => {
    try {
      if (!child.pid) return;
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', timeout: 5000 });
      else process.kill(-child.pid, signal);
    }
    catch (error) { if (error.code !== 'ESRCH') summary.errors.push(`Teardown ${signal}: ${error.message}`); }
  };
  const stop = async child => {
    if (!child?.pid) return;
    signalGroup(child, 'SIGTERM');
    await delay(500);
    signalGroup(child, 'SIGKILL');
    groups.delete(child);
  };
  let interrupted;
  const handlers = new Map(['SIGINT', 'SIGTERM', 'SIGHUP'].map(signal => [signal, () => {
    interrupted = signal;
    summary.interrupted = signal;
    for (const child of active) signalGroup(child, 'SIGTERM');
    save();
  }]));
  for (const [signal, handler] of handlers) process.on(signal, handler);
  const env = { ...process.env, NEXT_PUBLIC_API_BASE_URL: api, QA_WEB_URL: base, QA_API_ORIGIN: api, NEXT_TELEMETRY_DISABLED: '1' };
  // Do not inherit global module lookup or arbitrary preloads from a legacy shell.
  delete env.NODE_PATH;
  delete env.NODE_OPTIONS;
  delete env.QA_GUARD_OUTPUT;
  function start(args, logName, timeoutMs) {
    if (interrupted) throw new Error(`Interrupted by ${interrupted}`);
    const logfile = path.join(output, logName);
    const log = fs.openSync(logfile, 'a');
    const child = spawn(process.execPath, args, { cwd: root, env, detached: process.platform !== 'win32', stdio: ['ignore', log, log] });
    active.add(child);
    if (child.pid) groups.add(child);
    const result = { pid: child.pid || null, log: path.relative(root, logfile), exitCode: null, signal: null, timedOut: false, error: null };
    const timer = setTimeout(() => { result.timedOut = true; signalGroup(child, 'SIGTERM'); }, timeoutMs);
    const killTimer = setTimeout(() => signalGroup(child, 'SIGKILL'), timeoutMs + 2000);
    let interruptKill;
    // Polling also escalates signal teardown if the child ignores SIGTERM.
    const poll = setInterval(() => {
      if (interrupted && !interruptKill) interruptKill = setTimeout(() => signalGroup(child, 'SIGKILL'), 2000);
    }, 100);
    const done = new Promise(resolve => {
      child.on('error', error => { result.error = error.message; });
      child.on('close', (code, signal) => {
        Object.assign(result, { exitCode: code, signal });
        clearTimeout(timer); clearTimeout(killTimer); clearTimeout(interruptKill); clearInterval(poll);
        fs.closeSync(log); active.delete(child); resolve(result);
      });
    });
    return { child, result, done };
  }
  const timeout = (key, fallback) => {
    const value = Number(process.env[key] || fallback);
    if (!Number.isSafeInteger(value) || value < 1000 || value > 3600000) throw new Error(`${key} must be 1000..3600000 ms`);
    return value;
  };
  let server;
  save();
  try {
    if (process.env.QA_WEB_URL && localBase(process.env.QA_WEB_URL).origin !== base) throw new Error(`Orchestrator owns only ${base}`);
    if (process.env.QA_API_ORIGIN && process.env.QA_API_ORIGIN !== api) throw new Error(`Orchestrator requires ${api}`);
    chromeExecutable(process.env.QA_CHROME);
    const suiteTimeout = timeout('QA_SUITE_TIMEOUT_MS', 600000);
    const buildTimeout = timeout('QA_BUILD_TIMEOUT_MS', 600000);
    const serverTimeout = timeout('QA_SERVER_TIMEOUT_MS', 90000);
    await assertPortFree();
    const next = require.resolve('next/dist/bin/next');
    const build = start([next, 'build'], 'build.log', buildTimeout);
    summary.build = build.result; save();
    await build.done; await stop(build.child); save();
    if (interrupted || build.result.exitCode !== 0 || build.result.timedOut || build.result.error) throw new Error('Production build failed/interrupted; see build.log');
    await assertPortFree();
    // Server lifetime is bounded even if orchestration stalls.
    server = start([next, 'start', '--hostname', '127.0.0.1', '--port', '3105'], 'server.log', suites.length * suiteTimeout + serverTimeout);
    summary.server = server.result; save();
    const deadline = Date.now() + serverTimeout;
    let ready = false;
    while (Date.now() < deadline && !interrupted) {
      if (!active.has(server.child)) throw new Error('Owned Next server exited before readiness');
      try {
        const response = await fetch(base, { redirect: 'manual', signal: AbortSignal.timeout(2000) });
        await response.body?.cancel();
        if (response.status >= 200 && response.status < 400) { ready = true; break; }
      } catch { /* bounded readiness retry */ }
      await delay(300);
    }
    if (!ready || interrupted || !active.has(server.child)) throw new Error('Owned Next server not ready or interrupted');
    for (const [index, suite] of suites.entries()) {
      if (interrupted) break;
      if (!active.has(server.child)) throw new Error('Owned Next server exited during regressions');
      const entry = summary.suites[index];
      const directory = path.join(output, suite.id);
      fs.mkdirSync(directory, { recursive: true });
      env[suite.outputVariable] = directory;
      env.QA_GUARD_OUTPUT = directory;
      Object.assign(entry, { notRun: false, status: 'running', output: path.relative(root, directory) });
      const runner = start(['--require', path.join(root, 'tests/e2e/network-guard.cjs'), path.join(root, 'docs/qa', `${suite.id}.cjs`)], `${suite.id}.log`, suiteTimeout);
      Object.assign(entry, runner.result); save();
      await runner.done; await stop(runner.child);
      Object.assign(entry, runner.result);
      const reportFile = path.join(directory, 'results.json');
      const failureFile = path.join(directory, 'failure.json');
      try {
        const file = fs.existsSync(reportFile) ? reportFile : failureFile;
        const report = JSON.parse(fs.readFileSync(file, 'utf8'));
        Object.assign(entry, summarizeReport(suite, report));
        entry.report = path.relative(root, file);
      } catch (error) { entry.errors.push(`Missing/unreadable result: ${error.message}`); }
      const network = summarizeAudit(path.join(directory, 'network-guard.jsonl'));
      entry.network = network.counts;
      entry.errors.push(...network.errors);
      if (entry.exitCode !== 0 || entry.signal || entry.timedOut || entry.error) entry.errors.push(`Child exit=${entry.exitCode} signal=${entry.signal} timeout=${entry.timedOut}${entry.error ? ` ${entry.error}` : ''}`);
      entry.status = entry.errors.length ? (interrupted ? 'interrupted' : 'failed') : 'passed';
      save();
      console.log(`${suite.id}: ${entry.status}, ${entry.passed}/${suite.expectedChecks} checks; ${entry.output}`);
    }
    if (server && !active.has(server.child)) throw new Error('Owned Next server exited before completion');
  } catch (error) { summary.errors.push(error.stack || String(error)); }
  finally {
    for (const child of [...groups]) await stop(child);
    if (server) await server.done;
    for (const [signal, handler] of handlers) process.off(signal, handler);
    summary.finishedAt = new Date().toISOString();
    summary.checkCount = summary.suites.reduce((sum, suite) => sum + suite.checkCount, 0);
    summary.passed = summary.suites.reduce((sum, suite) => sum + suite.passed, 0);
    summary.notRun = summary.suites.filter(suite => suite.notRun).map(suite => suite.id);
    summary.status = interrupted ? 'interrupted' : summary.errors.length || summary.suites.some(suite => suite.status !== 'passed') ? 'failed' : 'passed';
    save();
    console.log(`QA ${summary.status}: ${summary.passed}/${summary.expectedChecks} fixture UI checks. Summary: ${path.relative(root, summaryFile)}`);
    process.exitCode = interrupted === 'SIGINT' ? 130 : interrupted ? 143 : summary.status === 'passed' ? 0 : 1;
  }
}

module.exports = { suites, summarizeReport, summarizeAudit, assertPortFree, main };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
