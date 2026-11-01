// Executable product contract. The production game's integration remains separate.
function integerCount(value){
 if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<0))throw new TypeError('Expected exact nonnegative integer');
 if(typeof value!=='bigint'&&typeof value!=='number'&&!(typeof value==='string'&&/^\d+$/.test(value)))throw new TypeError('Invalid count');
 const n=BigInt(value);if(n<0n)throw new RangeError('Negative count');return n;
}
function stageNumber(n,max=11){if(!Number.isInteger(n)||n<1||n>max)throw new RangeError('Invalid stage');}
export function availableModes(stage,highestUnlocked,hardCleared=[]){
 stageNumber(stage);stageNumber(highestUnlocked,10);
 if(stage===11)return Array.from({length:10},(_,i)=>i+1).every(n=>hardCleared.includes(n))?['hard']:[];
 return stage<=highestUnlocked?['normal','hard']:[];
}
export function unlockAfterClear(highestUnlocked,stage,mode){
 stageNumber(highestUnlocked,10);stageNumber(stage,10);
 if(!['normal','hard'].includes(mode)||stage>highestUnlocked)throw new RangeError('Cannot clear a locked stage or mode');
 return Math.min(10,Math.max(highestUnlocked,stage+1));
}
export function bankRunResult(state,result){
 const wallet=integerCount(state.wallet);
 if(!Array.isArray(state.settledRunIds)||typeof result.runId!=='string'||!result.runId.trim()||typeof result.won!=='boolean')throw new TypeError('Invalid settlement');
 if(state.settledRunIds.includes(result.runId))return {wallet,settledRunIds:[...state.settledRunIds],payout:0n,alreadySettled:true};
 const picked=integerCount(result.collectedCoins),bonus=integerCount(result.clearBonus);
 const payout=result.won?picked+bonus:0n;
 return {wallet:wallet+payout,settledRunIds:[...state.settledRunIds,result.runId],payout,alreadySettled:false};
}
