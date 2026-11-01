import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateBudget} from './lib/budget-contract.mjs';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const settings=()=>JSON.parse(text('data/product-settings.json'));
const state=()=>JSON.parse(text('data/project-state.json'));
const ci=text('.github/workflows/ci.yml');
test('incremental cost is hard-zero rather than an unanswered budget question',()=>{
 assert.deepEqual(validateBudget(settings(),state(),ci),[]);
});
test('paid usage, top-ups, unknown costs and reopening Q10 are rejected',()=>{
 for(const field of ['authorized','paidApiCalls','overageBilling','automaticTopUps','newSubscriptions','paidAssets','autoRenewingTrials','reopenBudgetQuestion']){
  const p=settings();p.paidExternalResources[field]=true;
  assert.ok(validateBudget(p,state(),ci).length,field);
 }
 for(const value of [null,1,-1,'0']){
  const p=settings();p.paidExternalResources.budget=value;assert.ok(validateBudget(p,state(),ci).length);
 }
 const p=settings();p.paidExternalResources.whenCostUnknown='continue';assert.ok(validateBudget(p,state(),ci).length);
 const s=state();s.conditionalDecisions.push({id:'Q10'});assert.ok(validateBudget(settings(),s,ci).length);
});
test('routine CI cannot silently switch to private usage, large runners or artifact accumulation',()=>{
 for(const bad of [ci.replace('if: github.event.repository.private == false',''),ci.replace('ubuntu-latest','ubuntu-8-cores'),ci+'\n# actions/upload-artifact',ci.replace('contents: read','contents: write')]){
  assert.ok(validateBudget(settings(),state(),bad).length);
 }
});
test('all 21 stage/difficulty briefs exist without claiming playtest evidence',()=>{
 const plan=JSON.parse(text('data/stage-design-briefs.json'));
 assert.equal(plan.stages.length,11);assert.deepEqual(plan.stages.map(s=>s.id),Array.from({length:11},(_,i)=>i+1));
 assert.equal(plan.stages.reduce((n,s)=>n+s.modes.length,0),21);
 assert.deepEqual(plan.stages[10].modes,['hard']);
 for(const s of plan.stages){assert.ok(s.playerDecision&&s.visualBrief&&s.guardrail&&s.hard);if(s.id<11)assert.ok(s.normal);}
});
test('gallery calls both image sets old drafts and describes four appearances',()=>{
 const src=text('src/main.ts');assert.ok(src.includes('初期外見＋追加3種類＝合計4種類'));
 assert.ok(src.includes('旧構図ラフ（SVG）'));assert.ok(!src.includes('正確な構図（SVG）'));
 assert.ok(src.includes('HARD専用・NORMALなし'));assert.ok(src.includes('PAO GAMES'));
});
test('active handoff docs do not reopen a spending decision or send unfinished assets as complete',()=>{
 for(const path of ['AGENTS.md','CODEX_START_PROMPT.md','docs/HANDOFF.md','docs/PRODUCT_CONTRACT.md','docs/AUDIO_DIRECTION.md','docs/CODEX_ENVIRONMENT.md']){
  const t=text(path);assert.doesNotMatch(t,/追加サービス費は未許可|未回答の追加予算|Q10で予算が承認/);
 }
 const prompt=text('CODEX_START_PROMPT.md');assert.ok(prompt.includes('npm run check:handoff'));assert.ok(prompt.includes('不足時は本編統合を開始せず'));
});
