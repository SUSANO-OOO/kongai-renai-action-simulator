import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = JSON.parse(readFileSync(new URL('../data/stages.json', import.meta.url), 'utf8'));
const lanes = [-1, 0, 1];
const gateTypes = new Set(['multiply','add','subtract','divide','attack','rapid','shield']);
const eventTypes = new Set(['gate_row','enemy','boss','obstacle']);

test('exactly ten unique handcrafted stages', () => {
  assert.equal(source.stages.length, 10);
  assert.equal(source.schemaVersion,2);
  assert.equal(source.developmentGate,'art_approval_required_before_feature_expansion');
  assert.deepEqual(source.stages.map(s=>s.id), [1,2,3,4,5,6,7,8,9,10]);
  assert.equal(new Set(source.stages.map(s=>s.title)).size,10);
  assert.equal(new Set(source.stages.map(s=>s.gimmick)).size,10);
});

test('every stage has well-formed, sorted, unique events and reachably placed content', () => {
  const allIds = new Set();
  for (const stage of source.stages) {
    assert.ok(stage.events.length >= 10, `Stage ${stage.id} is too empty`);
    assert.ok(stage.length >= 350);
    assert.ok(stage.speed > 0);
    assert.ok(stage.colors.tissue.startsWith('#'));
    assert.ok(stage.events.some(e => e.type === 'enemy'));
    assert.ok(stage.events.some(e => e.type === 'gate_row'));
    let lastAt = -Infinity;
    for (const e of stage.events) {
      assert.ok(!allIds.has(e.id), `duplicate id ${e.id}`);
      allIds.add(e.id);
      assert.ok(e.at > lastAt, `bad event order in ${stage.title}`);
      assert.ok(e.at < stage.length, `event after finish in ${stage.title}`);
      assert.ok(eventTypes.has(e.type));
      if (e.type === 'gate_row') {
        assert.equal(e.choices.length,3);
        assert.deepEqual(e.choices.map(c=>c.lane), lanes);
        for(const c of e.choices){ assert.ok(gateTypes.has(c.action)); assert.ok(Number.isInteger(c.value) && c.value>0); if(c.action==='divide') assert.ok(c.value>=2); }
      } else {
        assert.ok(lanes.includes(e.lane));
        if(e.type === 'obstacle') assert.ok(e.damage > 0 && e.width > 0 && e.width < 4);
        else assert.ok(e.hp > 0 && e.strength > 0);
      }
      lastAt = e.at;
    }
  }
});

test('bosses only on three designed set-piece stages', () => {
  assert.deepEqual(source.stages.filter(s=>s.events.some(e=>e.type === 'boss')).map(s=>s.id),[5,7,10]);
});


test('blue gains and red penalties are present on every main stage',()=>{
 for(const stage of source.stages){
  const choices=stage.events.filter(e=>e.type==='gate_row').flatMap(e=>e.choices);
  assert.ok(choices.some(c=>c.action==='multiply'||c.action==='add'),`stage ${stage.id} missing blue growth`);
  assert.ok(choices.some(c=>c.action==='subtract'||c.action==='divide'),`stage ${stage.id} missing red penalty`);
 }
});
