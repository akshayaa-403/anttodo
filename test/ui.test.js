'use strict';
/* Execute the FULL inline script against a minimal fake DOM + canvas so that
   rendering, event handlers and reasoning text all actually run. Catches
   wiring bugs the pure-engine tests cannot. */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1]);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, console.log('  PASS  ' + n))
                              : (fail++, console.log('  FAIL  ' + n + ' ' + x));

/* ---------- fake canvas 2d context: records nothing, throws on nothing ---------- */
function ctx2d() {
  const noop = () => {};
  const h = {
    canvas: null,
    createLinearGradient: () => ({ addColorStop: noop }),
    measureText: (t) => ({ width: String(t).length * 7 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  };
  return new Proxy(h, {
    get(t, k) {
      if (k in t) return t[k];
      return typeof k === 'string' ? noop : undefined;
    },
    set() { return true; },
  });
}

/* ---------- fake elements ---------- */
const registry = new Map();
function mkEl(id) {
  const listeners = {};
  const el = {
    id, value: '', textContent: '', _html: '',
    dataset: {}, style: {}, selectedIndex: 0, children: [],
    classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
    setAttribute(k, v) { this['_' + k] = v; },
    getAttribute(k) { return this['_' + k]; },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener() {},
    dispatch(t, ev = {}) { (listeners[t] || []).forEach((f) => f(Object.assign({ target: el, preventDefault(){}, stopPropagation(){} }, ev))); },
    _listeners: listeners,
    getContext: () => { const c = ctx2d(); c.canvas = el; return c; },
    getBoundingClientRect: () => ({ width: 800, height: 450, top: 0, left: 0 }),
    closest() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    appendChild(c) { this.children.push(c); return c; },
    focus() {}, blur() {}, click() { this.dispatch('click'); if (this.onclick) this.onclick({ target: el }); },
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = String(v); },
  });
  // canvas sizing attrs
  el.width = 1600; el.height = 900;
  return el;
}
for (const id of ids) registry.set(id, mkEl(id));

const documentStub = {
  getElementById: (id) => registry.get(id) || null,
  documentElement: { style: { getPropertyValue: () => '#888' } },
  createElement: (t) => mkEl('created-' + t),
  addEventListener: () => {},
  body: mkEl('body'),
};
const windowStub = { addEventListener: () => {}, devicePixelRatio: 1 };

let rafCount = 0;
const sandbox = {
  document: documentStub,
  window: windowStub,
  getComputedStyle: () => ({ getPropertyValue: () => '#888888' }),
  requestAnimationFrame: (f) => { if (rafCount++ < 3) { /* run a few frames */ try { f(); } catch (e) { throw e; } } return rafCount; },
  cancelAnimationFrame: () => {},
  setTimeout: (f) => { return 0; },
  clearTimeout: () => {},
  performance: { now: () => 1234.5 },
  console,
  Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Date,
  Float64Array, Uint8Array, Uint8ClampedArray, isFinite, isNaN, parseFloat, parseInt,
  Proxy, Reflect, Error, TypeError, RangeError, Infinity, NaN, undefined,
};

/* run it */
const vm = require('vm');
vm.createContext(sandbox);
console.log('\n=== boot the full page script ===');
let bootErr = null;
try {
  vm.runInContext(script + '\n;globalThis.__S = S;', sandbox, { timeout: 20000 });
  ok('script boots with no exception', true);
} catch (e) {
  bootErr = e;
  ok('script boots with no exception', false, `${e.name}: ${e.message}\n${(e.stack||'').split('\n').slice(1,4).join('\n')}`);
}
if (bootErr) { console.log('\nABORT: cannot continue without a clean boot.'); process.exit(1); }

const S = sandbox.__S;
const $ = (i) => registry.get(i);

console.log('\n=== initial state ===');
ok('focus mode default', S.mode === 'focus');
ok('10 sample tasks loaded', S.tasks.length === 10, `got ${S.tasks.length}`);
ok('engine constructed', !!S.aco);
ok('layout computed for every task', S.layout.length === S.tasks.length);
ok('task list rendered to DOM', $('taskList').innerHTML.includes('Finish quarterly report'));
ok('task count label set', /10 tasks/.test($('taskCount').textContent), $('taskCount').textContent);
ok('dependency selects populated', $('depA').innerHTML.includes('<option'));
ok('results start empty', $('results').innerHTML.includes('Run the colony'));

console.log('\n=== step / run ===');
try {
  $('bStep').onclick();
  ok('single Step runs', S.aco.iteration === 1, `iter=${S.aco.iteration}`);
  ok('HUD iteration updated', $('hIter').textContent === '1', $('hIter').textContent);
  ok('HUD cost is numeric', /\d/.test($('hCost').textContent), $('hCost').textContent);
} catch (e) { ok('single Step runs', false, e.message); }

try {
  for (let i = 0; i < 25; i++) $('bStep').onclick();
  ok('25 more steps without error', S.aco.iteration === 26, `iter=${S.aco.iteration}`);
  ok('history recorded', S.aco.history.length === 26);
} catch (e) { ok('25 more steps without error', false, e.message); }

console.log('\n=== results + reasoning actually render ===');
const res = $('results').innerHTML;
ok('stat tiles rendered', res.includes('class="stat"'));
ok('before column rendered', res.includes('Your order'));
ok('after column rendered', res.includes("Colony's order"));
ok('reasoning section rendered', res.includes('Why this is better'));
ok('reasoning has at least one bullet', (res.match(/<li class="(up|dn|eq)"/g) || []).length > 0,
   `found ${(res.match(/<li class="(up|dn|eq)"/g)||[]).length}`);
ok('improvement % present', /Improvement/.test(res));
ok('clock times rendered (focus mode)', /\d\d:\d\d/.test(res));
ok('no literal "undefined" leaked into HTML', !res.includes('undefined'),
   res.includes('undefined') ? res.slice(res.indexOf('undefined')-90, res.indexOf('undefined')+40) : '');
ok('no NaN leaked into HTML', !/\bNaN\b/.test(res));
console.log('        reasoning bullets:');
for (const m of res.matchAll(/<li class="(up|dn|eq)">([\s\S]*?)<\/li>/g))
  console.log('          [' + m[1] + '] ' + m[2].replace(/<[^>]+>/g, '').trim().slice(0, 96));

console.log('\n=== view toggles ===');
for (const [b, v] of [['vPhero','phero'],['vBoth','both'],['vAnts','ants']]) {
  try { $(b).onclick(); ok(`view -> ${v} redraws`, S.view === v); }
  catch (e) { ok(`view -> ${v} redraws`, false, e.message); }
}

console.log('\n=== dependencies via UI ===');
try {
  $('depA').value = '2'; $('depB').value = '1';
  $('bDep').onclick();
  ok('constraint added', S.deps.length === 1, JSON.stringify(S.deps));
  // duplicate
  $('bDep').onclick();
  ok('duplicate rejected', S.deps.length === 1 && /already exists/.test($('depWarn').innerHTML));
  // self
  $('depA').value = '3'; $('depB').value = '3'; $('bDep').onclick();
  ok('self-dependency rejected', /cannot precede itself/.test($('depWarn').innerHTML));
  // cycle
  $('depA').value = '1'; $('depB').value = '2'; $('bDep').onclick();
  ok('cycle rejected', /circular/.test($('depWarn').innerHTML), $('depWarn').innerHTML);
  ok('still exactly 1 constraint', S.deps.length === 1);
  // run with the constraint and confirm it holds
  for (let i = 0; i < 30; i++) $('bStep').onclick();
  const pos = {}; S.aco.best.forEach((t, i) => (pos[t] = i));
  ok('constraint honored in best solution', pos[2] < pos[1], `pos2=${pos[2]} pos1=${pos[1]}`);
  const r2 = $('results').innerHTML;
  ok('reasoning mentions constraints', /dependency constraint/.test(r2));
} catch (e) { ok('dependency UI', false, `${e.name}: ${e.message}`); }

console.log('\n=== add / delete task ===');
try {
  const n0 = S.tasks.length;
  $('newTask').value = '  Water the plants  ';
  $('bAdd').onclick();
  ok('task added and trimmed', S.tasks.length === n0 + 1 && S.tasks[n0].name === 'Water the plants',
     JSON.stringify(S.tasks[n0] && S.tasks[n0].name));
  ok('input cleared', $('newTask').value === '');
  $('newTask').value = '   ';
  $('bAdd').onclick();
  ok('blank task rejected', S.tasks.length === n0 + 1);
  // XSS attempt must be escaped in the DOM
  $('newTask').value = '<img src=x onerror=alert(1)>';
  $('bAdd').onclick();
  const lst = $('taskList').innerHTML;
  ok('task name HTML-escaped (no XSS)', !lst.includes('<img src=x') && lst.includes('&lt;img'),
     lst.slice(lst.indexOf('&lt;img') - 20, lst.indexOf('&lt;img') + 50));
} catch (e) { ok('add task', false, `${e.name}: ${e.message}`); }

console.log('\n=== deleting a task remaps dependencies ===');
try {
  S.deps = [[0, 5]];
  const before = S.tasks.length;
  // delete index 2 -> both endpoints shift down by one where > 2
  const handler = $('taskList')._listeners['click'][0];
  handler({ target: { closest: () => ({ dataset: { del: '2' } }) } });
  ok('task removed', S.tasks.length === before - 1);
  ok('dependency indices remapped', JSON.stringify(S.deps) === JSON.stringify([[0, 4]]), JSON.stringify(S.deps));
  // deleting an endpoint should drop the constraint
  S.deps = [[1, 3]];
  handler({ target: { closest: () => ({ dataset: { del: '1' } }) } });
  ok('constraint dropped when endpoint deleted', S.deps.length === 0, JSON.stringify(S.deps));
} catch (e) { ok('delete remap', false, `${e.name}: ${e.message}`); }

console.log('\n=== mode switch to Errand (true TSP) ===');
try {
  $('mErrand').onclick();
  ok('mode is errand', S.mode === 'errand');
  ok('errand sample loaded', S.tasks.length === 8, `got ${S.tasks.length}`);
  ok('deps cleared on mode switch', S.deps.length === 0);
  ok('model is closed tour', S.model.closed === true);
  ok('unit switched to km', /km/.test($('hUnit').textContent), $('hUnit').textContent);
  ok('layout uses lat/lon projection', S.layout.every(p => isFinite(p.x) && isFinite(p.y)));
  for (let i = 0; i < 40; i++) $('bStep').onclick();
  const r = $('results').innerHTML;
  ok('errand results render', r.includes('Distance saved'));
  ok('errand reasoning mentions km', /km/.test(r));
  ok('errand reasoning mentions closed tour', /returns to your starting point/.test(r));
  ok('no undefined in errand results', !r.includes('undefined'));
  console.log('        errand bullets:');
  for (const m of r.matchAll(/<li class="(up|dn|eq)">([\s\S]*?)<\/li>/g))
    console.log('          [' + m[1] + '] ' + m[2].replace(/<[^>]+>/g, '').trim().slice(0, 96));
} catch (e) { ok('errand mode', false, `${e.name}: ${e.message}`); }

console.log('\n=== shuffle / sample / reset ===');
try {
  $('bShuffle').onclick(); ok('shuffle works', S.aco.iteration === 0 && S.tasks.length === 8);
  $('bSample').onclick();  ok('load sample works', S.tasks.length === 8);
  $('bReset').onclick();   ok('reset zeroes iteration', S.aco.iteration === 0);
} catch (e) { ok('shuffle/sample/reset', false, `${e.name}: ${e.message}`); }

console.log('\n=== sliders drive params ===');
try {
  const set = (id, v) => { $(id).value = String(v); $(id).dispatch('change'); };
  set('sAnts', 44);  ok('nAnts slider', S.params.nAnts === 44, String(S.params.nAnts));
  set('sIters', 200); ok('iters slider', S.params.iters === 200, String(S.params.iters));
  set('sAlpha', 2.5); ok('alpha slider', S.params.alpha === 2.5);
  set('sBeta', 0);    ok('beta slider accepts 0', S.params.beta === 0);
  set('sRho', 0.9);   ok('rho slider', S.params.rho === 0.9);
  set('sQ0', 1);      ok('q0 slider accepts 1', S.params.q0 === 1);
  set('sLS', 0);      ok('local search toggled off', S.params.ls === 0 && S.aco.useLocalSearch === false);
  ok('engine rebuilt with new nAnts', S.aco.nAnts === 44, String(S.aco.nAnts));
  for (let i = 0; i < 5; i++) $('bStep').onclick();
  ok('runs with extreme params', S.aco.iteration === 5 && isFinite(S.aco.bestCost));
} catch (e) { ok('sliders', false, `${e.name}: ${e.message}`); }

console.log('\n=== weight sliders (focus mode) ===');
try {
  $('mFocus').onclick();
  const set = (id, v) => { $(id).value = String(v); $(id).dispatch('change'); };
  set('sWd', 3); set('sWp', 0); set('sWc', 0); set('sWe', 0);
  ok('weights applied', S.weights.deadline === 3 && S.weights.priority === 0);
  for (let i = 0; i < 30; i++) $('bStep').onclick();
  const r = $('results').innerHTML;
  ok('zero-weight terms explained as ignored', /ignored/.test(r), r.includes('ignored')?'':'no "ignored" text');
  ok('deadline-only optimization ran', isFinite(S.aco.bestCost));
  // with deadline weight only, all deadlines should be met if possible
  const sched = S.model.schedule(S.aco.best);
  console.log('        late tasks under deadline-only weighting:', sched.filter(x=>x.late).length);
} catch (e) { ok('weight sliders', false, `${e.name}: ${e.message}`); }

console.log('\n=== empty-task edge case ===');
try {
  const handler = $('taskList')._listeners['click'][0];
  let guard = 0;
  while (S.tasks.length && guard++ < 40)
    handler({ target: { closest: () => ({ dataset: { del: '0' } }) } });
  ok('all tasks deletable', S.tasks.length === 0);
  $('bStep').onclick();
  ok('Step with zero tasks does not crash', true);
  ok('empty state shown', $('taskList').innerHTML.includes('No tasks'));
  $('newTask').value = 'Recovered task'; $('bAdd').onclick();
  ok('recovers after empty', S.tasks.length === 1);
  for (let i=0;i<5;i++) $('bStep').onclick();
  ok('single task runs', isFinite(S.aco.bestCost));
} catch (e) { ok('empty edge case', false, `${e.name}: ${e.message}`); }

console.log(`\n${'='.repeat(52)}\nUI INTEGRATION: ${pass} passed, ${fail} failed\n${'='.repeat(52)}`);
process.exit(fail ? 1 : 0);
