import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const load=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf8'));
const characters=load('characters.json');
const stages=load('stages.json');
const progression=load('progression.json');
const bonus=load('secret-stage.json');
const assetManifest=load('asset-manifest.json');
test('10 unique adult women attached to the original 10 stages',()=>{
  assert.equal(characters.characters.length,10);
  assert.deepEqual(characters.characters.map(x=>x.stageId),Array.from({length:10},(_,i)=>i+1));
  assert.ok(characters.characters.every(x=>x.adult===true && x.age>=25));
  assert.equal(new Set(characters.characters.map(x=>x.name)).size,10);
  assert.ok(stages.stages.every(s=>s.characterId===`heroine${String(s.id).padStart(2,'0')}`));
  const delivered=new Set(assetManifest.assets.flatMap(a=>[a.source,a.output]));
  for(const character of characters.characters)for(const path of character.requiredDeliverables){
    assert.ok(delivered.has(path),character.id+' references untracked deliverable '+path);
  }
});
test('secret stage is reserved for Paisen and requires all hard clears',()=>{
  assert.equal(bonus.stage.id,11);
  assert.equal(bonus.stage.subject.id,'paisen');
  assert.equal(bonus.stage.unlocksWhen,'all_10_hard_stages_cleared');
  assert.equal(progression.modeRules.secret,'all_10_hard_cleared');
  assert.equal(progression.modeRules.hard,'all_10_normal_cleared');
});
test('cosmetics and titles do not grant gameplay power',()=>{
  assert.equal(progression.userProgression.levelDoesNotIncreaseCombatPower,true);
  assert.equal(progression.userProgression.titles.length,15);
  assert.equal(progression.cosmetics.skins.length,3);
  assert.equal(progression.cosmetics.coinsOnlyForCosmetics,true);
  assert.equal(progression.missionGoal.main.minSurvivors,100);
});
test('asset state is honest, progressive and requires actual signoff before production',()=>{
  const states=new Set(['not_created','draft','review_ready','changes_requested','approved','rejected']);
  const reviews=new Set(['pending','approved','changes_requested','rejected']);
  assert.ok(assetManifest.assets.length>=130);
  assert.equal(new Set(assetManifest.assets.map(x=>x.id)).size,assetManifest.assets.length);
  for(const asset of assetManifest.assets){
    assert.ok(states.has(asset.status),asset.id+' invalid status');
    assert.ok(reviews.has(asset.reviewStatus),asset.id+' invalid reviewStatus');
    if(asset.status==='review_ready'||asset.status==='approved'){
      assert.ok(existsSync(new URL('../'+asset.source,import.meta.url)),asset.id+' lacks editable source');
      assert.ok(existsSync(new URL('../'+asset.output,import.meta.url)),asset.id+' lacks exported output');
    }
    if(asset.status==='approved') assert.equal(asset.reviewStatus,'approved',asset.id+' needs explicit asset approval');
  }
  const review=assetManifest.producerReview;
  assert.ok(review && typeof review.status==='string');
  if(assetManifest.approvedForProduction){
    assert.equal(review.status,'approved');
    assert.ok(typeof review.decisionReference==='string' && review.decisionReference.length>5);
    assert.ok(typeof review.approvedAssetRevision==='string' && review.approvedAssetRevision.length>4);
    assert.ok(assetManifest.assets.filter(x=>x.required).every(x=>x.status==='approved' && x.reviewStatus==='approved'));
  }
});
