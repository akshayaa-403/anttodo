'use strict';
/* Extract the engine from index.html and run equivalence + invariant tests.
   This guarantees the shipped code, not just the scratch copy, is correct. */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'index.html'), 'utf8');

// Pull the single <script> body
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('no script found'); process.exit(1); }
let src = m[1];

// Stub out the DOM so the engine portion evaluates. We cut everything from the
// APP STATE marker onward, keeping only pure logic.
const cut = src.indexOf('/* ============================================================\n   APP STATE');
if (cut < 0) { console.error('APP STATE marker not found'); process.exit(1); }
src = src.slice(0, cut);

src += `
module.exports = { ACO, makeErrandModel, makeFocusModel, topoOrder, hasCycle,
                   haversine, mulberry32, buildPredMap, clamp, fmtHM, CATS,
                   sampleFocus, sampleErrand };
`;

const tmp = path.join(__dirname, '_inpage.tmp.js');
fs.writeFileSync(tmp, src);
const P = require(tmp);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c
  ? (pass++, console.log('  PASS  ' + n))
  : (fail++, console.log('  FAIL  ' + n + ' ' + x));

console.log('\n=== in-page engine: structural ===');
ok('ACO class exported', typeof P.ACO === 'function');
ok('both models exported', typeof P.makeErrandModel === 'function' && typeof P.makeFocusModel === 'function');
ok('sample data present', P.sampleFocus().length === 10 && P.sampleErrand().length === 8);

console.log('\n=== in-page engine: cycle detection ===');
ok('3-cycle caught', P.hasCycle(3, [[0,1],[1,2],[2,0]]));
ok('chain fine', !P.hasCycle(3, [[0,1],[1,2]]));
ok('self-loop not a cycle', !P.hasCycle(2, [[0,0]]));

console.log('\n=== in-page engine: errand = known optimum ===');
{
  const t = [
    { lat:0, lon:0 }, { lat:0, lon:0.1 }, { lat:0.1, lon:0.1 }, { lat:0.1, lon:0 },
  ];
  const mo = P.makeErrandModel(t);
  const perim = mo.cost([0,1,2,3]), cross = mo.cost([0,2,1,3]);
  ok('perimeter < crossing', perim < cross);
  const a = new P.ACO({ n:4, model:mo, nAnts:10, seed:7 });
  for (let i=0;i<30;i++) a.step();
  ok('ACO reaches optimum', Math.abs(a.bestCost - perim) < 1e-6,
     `got ${a.bestCost.toFixed(4)} want ${perim.toFixed(4)}`);
  ok('closed tour flag set', mo.closed === true);
}

console.log('\n=== in-page engine: beats random on real sample ===');
{
  const tasks = P.sampleErrand();
  const mo = P.makeErrandModel(tasks);
  const rnd = P.mulberry32(4242);
  let rb = Infinity;
  for (let k=0;k<500;k++){
    const p=[...tasks.keys()];
    for(let i=p.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]];}
    rb=Math.min(rb,mo.cost(p));
  }
  const a=new P.ACO({n:tasks.length,model:mo,nAnts:20,seed:5});
  for(let i=0;i<80;i++)a.step();
  ok('ACO <= best-of-500 random on sample errands', a.bestCost <= rb + 1e-9,
     `aco=${a.bestCost.toFixed(3)} rand=${rb.toFixed(3)}`);
  console.log(`        (aco ${a.bestCost.toFixed(2)}km vs random ${rb.toFixed(2)}km)`);
}

console.log('\n=== in-page engine: focus improves the real sample day ===');
{
  const tasks = P.sampleFocus();
  const W = { deadline:1, priority:1, context:1, energy:1 };
  const mo = P.makeFocusModel(tasks, W);
  const orig = tasks.map((_,i)=>i);
  const a = new P.ACO({ n:tasks.length, model:mo, nAnts:20, seed:1337 });
  for(let i=0;i<100;i++) a.step();
  const cB = mo.cost(orig), cA = a.bestCost;
  ok('optimized beats entered order', cA < cB, `before=${cB.toFixed(2)} after=${cA.toFixed(2)}`);
  const sB = mo.schedule(orig), sA = mo.schedule(a.best);
  const lb = sB.filter(x=>x.late).length, la = sA.filter(x=>x.late).length;
  ok('deadline misses not increased', la <= lb, `before=${lb} after=${la}`);
  console.log(`        (cost ${cB.toFixed(1)} -> ${cA.toFixed(1)}, ${(100*(cB-cA)/cB).toFixed(1)}% better; late ${lb} -> ${la})`);
  ok('schedule() returns one row per task', sA.length === tasks.length);
  ok('breakdown() has all four terms', ['deadline','priority','context','energy']
      .every(k => typeof mo.breakdown(orig)[k] === 'number'));
}

console.log('\n=== in-page engine: dependencies never violated ===');
{
  const tasks = P.sampleFocus();
  const deps = [[2,1],[1,3],[5,7],[0,9]];   // standup->emails->review, grocery->mealprep, report->backlog
  const mo = P.makeFocusModel(tasks, {deadline:1,priority:1,context:1,energy:1});
  const a = new P.ACO({ n:tasks.length, model:mo, deps, nAnts:18, seed:88 });
  let clean = true;
  for(let it=0; it<40; it++){
    a.step();
    for(const ant of a.lastAnts){
      const pos={}; ant.seq.forEach((t,i)=>pos[t]=i);
      for(const [x,y] of deps) if(!(pos[x]<pos[y])) clean=false;
      if(new Set(ant.seq).size !== tasks.length) clean=false;
    }
  }
  ok('all ants across 40 iterations respected every constraint', clean);
  const bp={}; a.best.forEach((t,i)=>bp[t]=i);
  ok('best respects constraints', deps.every(([x,y])=>bp[x]<bp[y]));
  ok('2-opt preserved feasibility', a.validOrder(a.best));
}

console.log('\n=== in-page engine: MMAS bounds + no blowup ===');
{
  const tasks=P.sampleFocus();
  const a=new P.ACO({n:tasks.length,model:P.makeFocusModel(tasks,{deadline:1,priority:1,context:1,energy:1}),nAnts:20,seed:2});
  for(let i=0;i<150;i++)a.step();
  let inb=true, fin=true;
  for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){
    if(i===j)continue;
    const v=a.tau[i][j];
    if(!isFinite(v))fin=false;
    if(v>a.tauMax+1e-9||v<a.tauMin-1e-9)inb=false;
  }
  ok('pheromone finite after 150 iters', fin);
  ok('pheromone clamped to [tauMin,tauMax]', inb);
  let mono=true;
  for(let i=1;i<a.history.length;i++) if(a.history[i]>a.history[i-1]+1e-12) mono=false;
  ok('best-so-far never worsens', mono);
}

console.log('\n=== in-page engine: edge cases must not throw ===');
const nt=(n,f)=>{try{f();ok(n,true);}catch(e){ok(n,false,`threw ${e.name}: ${e.message}`);}};
nt('n=0', ()=>{const a=new P.ACO({n:0,model:P.makeErrandModel([]),nAnts:5,seed:1});a.step();});
nt('n=1 errand', ()=>{const a=new P.ACO({n:1,model:P.makeErrandModel([{lat:1,lon:1}]),nAnts:5,seed:1});a.step();});
nt('n=1 focus', ()=>{const a=new P.ACO({n:1,model:P.makeFocusModel([{category:'w',duration:30,priority:5,load:5,due:null}],{deadline:1,priority:1,context:1,energy:1}),nAnts:5,seed:1});a.step();});
nt('n=2', ()=>{const a=new P.ACO({n:2,model:P.makeErrandModel([{lat:0,lon:0},{lat:1,lon:1}]),nAnts:5,seed:1});for(let i=0;i<5;i++)a.step();});
nt('identical coords', ()=>{const t=Array.from({length:6},()=>({lat:5,lon:5}));const a=new P.ACO({n:6,model:P.makeErrandModel(t),nAnts:10,seed:2});for(let i=0;i<10;i++)a.step();});
nt('all weights zero', ()=>{const t=P.sampleFocus();const a=new P.ACO({n:t.length,model:P.makeFocusModel(t,{deadline:0,priority:0,context:0,energy:0}),nAnts:10,seed:3});for(let i=0;i<10;i++)a.step();});
nt('alpha=0 beta=0', ()=>{const t=P.sampleErrand();const a=new P.ACO({n:t.length,model:P.makeErrandModel(t),nAnts:10,alpha:0,beta:0,seed:4});for(let i=0;i<10;i++)a.step();});
nt('rho=0.9 q0=1', ()=>{const t=P.sampleErrand();const a=new P.ACO({n:t.length,model:P.makeErrandModel(t),nAnts:10,rho:0.9,q0:1,seed:5});for(let i=0;i<10;i++)a.step();});
nt('fully-chained deps (one legal order)', ()=>{
  const t=P.sampleFocus();
  const deps=[]; for(let i=0;i<t.length-1;i++)deps.push([i,i+1]);
  const a=new P.ACO({n:t.length,model:P.makeFocusModel(t,{deadline:1,priority:1,context:1,energy:1}),deps,nAnts:8,seed:6});
  for(let i=0;i<10;i++)a.step();
  const want=t.map((_,i)=>i);
  if(JSON.stringify(a.best)!==JSON.stringify(want)) throw new Error('got '+JSON.stringify(a.best));
});
nt('localSearch off', ()=>{const t=P.sampleErrand();const a=new P.ACO({n:t.length,model:P.makeErrandModel(t),nAnts:10,useLocalSearch:false,seed:7});for(let i=0;i<10;i++)a.step();});

console.log('\n=== determinism ===');
{
  const t=P.sampleErrand();
  const run=()=>{const a=new P.ACO({n:t.length,model:P.makeErrandModel(t),nAnts:12,seed:999});for(let i=0;i<25;i++)a.step();return a.bestCost;};
  ok('same seed reproduces exactly', Math.abs(run()-run())<1e-12);
}

fs.unlinkSync(tmp);
console.log(`\n${'='.repeat(50)}\nIN-PAGE ENGINE: ${pass} passed, ${fail} failed\n${'='.repeat(50)}`);
process.exit(fail?1:0);
