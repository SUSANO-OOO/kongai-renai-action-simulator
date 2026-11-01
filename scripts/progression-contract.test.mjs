import test from 'node:test';
import assert from 'node:assert/strict';
import {availableModes,unlockAfterClear,bankRunResult} from './lib/progression-contract.mjs';
test('HARD is initially available but later stages are sequentially locked',()=>{
 assert.deepEqual(availableModes(1,1),['normal','hard']);assert.deepEqual(availableModes(2,1),[]);
 assert.equal(unlockAfterClear(1,1,'hard'),2);assert.equal(unlockAfterClear(1,1,'normal'),2);
 assert.throws(()=>unlockAfterClear(1,2,'hard'));
});
test('Paisen requires all ten distinct HARD clears and is HARD only',()=>{
 assert.deepEqual(availableModes(11,10,[1,2,3,4,5,6,7,8,9]),[]);
 assert.deepEqual(availableModes(11,10,[1,2,3,4,5,6,7,8,9,9]),[]);
 assert.deepEqual(availableModes(11,10,[1,2,3,4,5,6,7,8,9,10]),['hard']);
});
test('defeat discards run pickups but never deducts the existing wallet',()=>{
 const state={wallet:'1200',settledRunIds:[]};
 const result=bankRunResult(state,{runId:'loss',won:false,collectedCoins:99,clearBonus:200});
 assert.equal(result.wallet,1200n);assert.equal(result.payout,0n);assert.deepEqual(state.settledRunIds,[]);
});
test('successful payout is exactly once and old wallet retains precision',()=>{
 const result={runId:'clear',won:true,collectedCoins:33,clearBonus:20};
 const first=bankRunResult({wallet:'9007199254740993',settledRunIds:[]},result);
 assert.equal(first.wallet,9007199254741046n);
 const twice=bankRunResult(first,result);assert.equal(twice.wallet,first.wallet);assert.equal(twice.payout,0n);assert.equal(twice.alreadySettled,true);
});
