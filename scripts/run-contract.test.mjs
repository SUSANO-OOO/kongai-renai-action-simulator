import test from 'node:test';
import assert from 'node:assert/strict';
import {count,applyGate,goalOutcome} from './lib/run-contract.mjs';
test('goal boundaries: zero, 1, 99, 100, 101 and arbitrarily large exact values',()=>{
  for(const [n,outcome] of [[0,'exhausted'],[1,'absorbed'],[99,'absorbed'],[100,'clear'],[101,'clear'],['1'+'0'.repeat(100),'clear']]) assert.equal(goalOutcome(n),outcome);
});
test('one-start path, blue growth and red loss use exact integer arithmetic',()=>{
  let n=1n; n=applyGate(n,'multiply',5); n=applyGate(n,'multiply',20);
  assert.equal(n,100n); assert.equal(goalOutcome(n),'clear');
  assert.equal(applyGate(n,'subtract',1),99n);
  assert.equal(applyGate(99,'divide',2),49n);
  assert.equal(applyGate(1,'subtract',10),0n);
  assert.equal(applyGate(1,'divide',2),0n);
});
test('elimination is absorbing and final goal snapshot does not change',()=>{
  assert.equal(applyGate(0,'add',500),0n);
  let n=100n; const final=goalOutcome(n); n=1n;
  assert.equal(final,'clear'); assert.equal(goalOutcome(n),'absorbed');
});
test('numeric errors fail instead of silently losing precision',()=>{
  for(const n of [-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1e20',null,{},true]) assert.throws(()=>count(n));
  assert.throws(()=>applyGate(5,'divide',0)); assert.throws(()=>applyGate(5,'other',2));
  assert.equal(applyGate('9007199254740993','multiply',20),180143985094819860n);
});
