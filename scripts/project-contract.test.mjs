import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('10 ordinary stages and 1 hidden Paisen stage',()=>{
 const p=read('data/stages.json');
 assert.equal(p.normalStages.length,10);
 assert.deepEqual(p.normalStages.map(s=>s.id),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(p.secretStage.id,11);assert.equal(p.secretStage.character,'パイセン');
 assert.equal(p.secretStage.unlockCondition,'clear all 10 stages on HARD');
});
test('all stages begin with 1; success requires 100; 3 visible free lanes',()=>{
 for(const s of read('data/stages.json').normalStages){
  assert.equal(s.initialTroops,1);
  assert.equal(s.requiredAtGoal,100);
  assert.equal(s.visualLaneCount,3);
  assert.equal(s.lateralMovement,'continuous');
  assert.deepEqual(s.gatePolicy.blue,['multiply','add']);
  assert.deepEqual(s.gatePolicy.red,['subtract','divide']);
 }
});
test('character lineup contains ten unique adults',()=>{
 const chars=read('data/characters.json').characters;
 assert.equal(chars.length,10);assert.equal(new Set(chars.map(c=>c.name)).size,10);
 for(const c of chars){assert.equal(c.ageGroup,'adult');assert.equal(c.approval,false);}
});
test('all required assets remain unapproved before user review',()=>{
 const m=read('data/asset-manifest.json');
 assert.equal(m.approvalGate,'user explicit approval');
 assert.ok(m.requiredAssets.length>=45);
 for(const a of m.requiredAssets){assert.equal(a.approved,false);}
});
test('concept screens have exact portrait frame and visible 3-lane gate scene',()=>{
 const ids=['01_title','02_stage_select','03_one_start','04_blue_red_gates','05_enemy_wave','06_boss','07_goal','08_clear','09_failed','10_result','11_skins','12_secret'];
 for(const id of ids){
  const path=new URL('../public/concept-art/'+id+'.svg',import.meta.url);
  assert.ok(existsSync(path));
  const svg=readFileSync(path,'utf8');
  assert.match(svg,/viewBox="0 0 390 844"/);
  assert.match(svg,/<svg[\s\S]*<\/svg>\s*$/);
 }
 const gate=readFileSync(new URL('../public/concept-art/04_blue_red_gates.svg',import.meta.url),'utf8');
 assert.match(gate,/×5/);assert.match(gate,/−10/);assert.match(gate,/\+20/);
});
