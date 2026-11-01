import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const entrypoints=['AGENTS.md','CODEX_START_PROMPT.md','docs/HANDOFF.md','docs/PRODUCT_CONTRACT.md','docs/ART_FIRST_APPROVAL.md','docs/THREE_WEAKNESSES_PREVENTION.md','docs/RELEASE_ACCEPTANCE.md','docs/CODEX_ENVIRONMENT.md','docs/PROGRESSION_ECONOMY.md','docs/WORK_LOG.md','docs/DECISIONS_AND_OPEN_QUESTIONS.md'];
test('handoff entrypoints and their exact repository file references exist',()=>{
 for(const path of entrypoints){
  const text=read(path);assert.ok(text.trim().length>0);
  for(const match of text.matchAll(/`((?:docs|data|scripts)\/[A-Za-z0-9_./-]+\.(?:md|json|mjs|ts))`/g)) assert.ok(existsSync(new URL('../'+match[1],import.meta.url)),path+' links to missing '+match[1]);
 }
});
test('all open decisions and release coverage are traceable',()=>{
 const state=JSON.parse(read('data/project-state.json')),questions=read('docs/DECISIONS_AND_OPEN_QUESTIONS.md');
 assert.equal(new Set(state.openProductDecisions).size,state.openProductDecisions.length);
 for(const id of state.openProductDecisions) assert.ok(questions.includes('| '+id+' |'),'missing '+id);
 const expected=['production_game','normal_10','hard_10','secret_stage','game_feel','ios_safari_real_device','android_chrome_real_device','audio','save_recovery','licenses_privacy','deployment_smoke_rollback'];
 for(const id of expected) assert.ok(state.releaseChecks.some(c=>c.id===id),'missing release check '+id);
 assert.equal(new Set(state.releaseChecks.map(c=>c.id)).size,state.releaseChecks.length);
});
