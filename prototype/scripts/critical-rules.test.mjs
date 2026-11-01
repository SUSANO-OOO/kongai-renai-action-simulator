import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const txt=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const json=(file)=>JSON.parse(txt(file));
const progress=json('data/progression.json');
const stages=json('data/stages.json').stages;
const manifest=json('data/asset-manifest.json');

test('All modes start exactly one sperm; loss/win threshold is 100',()=>{
 assert.equal(progress.missionGoal.main.startSurvivors,1);
 assert.equal(progress.missionGoal.secret.startSurvivors,1);
 assert.equal(progress.missionGoal.main.minSurvivors,100);
 assert.equal(progress.missionGoal.main.lossAtZero,true);
 assert.equal(progress.missionGoal.main.failBelow100AtFinish,true);
 assert.equal(progress.userProgression.levelDoesNotIncreaseCombatPower,true);
 assert.equal(progress.cosmetics.coinsOnlyForCosmetics,true);
 const src=txt('src/game/Game.ts');
 assert.match(src,/private troops=1n;/);
 assert.match(src,/this\.troops=1n;/);
 assert.match(src,/this\.troops>=100n/);
 assert.doesNotMatch(src,/BigInt\(10\+id\*2\)/);
});

test('Stage 1 and all other regular stages contain routes with enough multiplication/addition to reach 100 from 1, ignoring enemies',()=>{
 for(const stage of stages){
  let best=1n;
  const gates=stage.events.filter(e=>e.type==='gate_row');
  assert.ok(gates.length>=3,`${stage.id} missing growth decisions`);
  for(const event of gates){
   best=event.choices.reduce((maximum,choice)=>{
    let n=best;
    if(choice.action==='multiply')n*=BigInt(choice.value);
    else if(choice.action==='add')n+=BigInt(choice.value);
    return n>maximum?n:maximum;
   },0n);
  }
  assert.ok(best>=100n,`stage ${stage.id} cannot reach 100 even without combat`);
 }
});

test('Production approval contract and 3 weakness docs stay present',()=>{
 assert.ok(manifest.assets.length>=130);
 assert.ok(manifest.producerReview);
 if(manifest.producerReview.status!=='approved') assert.equal(manifest.approvedForProduction,false);
 for(const file of ['docs/THREE_WEAKNESSES_PREVENTION.md','docs/LEVEL_FLOW_ACCEPTANCE.md','docs/DECISIONS_AND_OPEN_QUESTIONS.md']){
  assert.ok(existsSync(new URL('../'+file,import.meta.url)),file);
 }
});
