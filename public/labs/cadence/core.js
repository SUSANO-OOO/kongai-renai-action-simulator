/* PAO GAMES: deterministic pacing/route experiment, not production combat.
   Exact integer rules shared by browser and Node; no network or persistent save. */
(function(scope){
'use strict';
const DURATIONS=[120,126,132,138,144,150,156,162,168,180,180];
const TYPES=['増殖区画','交戦区画','経路判断','増殖区画','突破区画','強化区画'];
function integer(v){if(typeof v==='number'&&(!Number.isSafeInteger(v)||v<0))throw new TypeError('Nonnegative exact count required');if(!['bigint','number'].includes(typeof v)&&!(typeof v==='string'&&/^\d+$/.test(v)))throw new TypeError('Invalid count');const n=BigInt(v);if(n<0n)throw new RangeError('Negative count');return n;}
function gate(n,op,v){n=integer(n);v=integer(v);if(v===0n)throw new RangeError('Zero operand');if(!['add','multiply','subtract','divide','none'].includes(op))throw new RangeError('Unknown operation');if(n===0n)return 0n;if(op==='add')return n+v;if(op==='multiply')return n*v;if(op==='subtract')return n>v?n-v:0n;if(op==='divide')return n/v;return n;}
const label=o=>({multiply:'×',add:'+',subtract:'−',divide:'÷',none:''}[o.op])+(o.op==='none'?(o.power?'強化':'通路'):o.value);
function option(op,value,loss=0,coins=0,power=0,riskBps=0){const o={op,value,loss,coins,power,riskBps};return {...o,label:label(o)};}
function plan(stage=1,mode='normal'){
 if(!Number.isInteger(stage)||stage<1||stage>11)throw new RangeError('Stage 1..11 required');
 if(!['normal','hard'].includes(mode)||stage===11&&mode!=='hard')throw new RangeError('Invalid mode; secret is HARD only');
 const duration=DURATIONS[stage-1],hard=mode==='hard',rows=Math.floor((duration-18)/6),events=[];
 for(let i=0;i<rows;i++){
  const at=6+i*6,intensity=1+(stage-1)*.07+(hard?.35:0),turn=(i+stage+(hard?1:0))%3;let cells,kind;
  if(i===0){cells=[option('multiply',5),option('multiply',3,0,6),option('add',3)];kind='gate';}
  else if(i===1){cells=[option('multiply',4),option('add',12,0,8),option('multiply',3)];kind='gate';}
  else if(i%6===2){const loss=Math.ceil((24+i*11)*intensity);cells=[option('none',1,Math.ceil(loss/4),22,0,4500),option('none',1,0,7,0,1800),option('none',1,Math.ceil(loss/8),13,0,3000)];kind='wave';}
  else if(i%6===3){cells=[option('multiply',3,Math.ceil((15+i*3)*intensity),18,0,6000),option('add',90+i*5,0,8),option('divide',2,0,50)];kind='gate';}
  else if(i%6===4){const loss=Math.ceil((20+i*5)*intensity);cells=[option('subtract',Math.max(1,Math.floor(loss/2)),0,40),option('add',50,loss,15),option('none',1,0,5)];kind='wall';}
  else if(i%6===5){cells=[option('none',1,0,10,1),option('multiply',2,Math.ceil((45+i*3)*intensity),12),option('add',75,0,6)];kind='upgrade';}
  else{cells=[option('multiply',5,Math.ceil((15+i*2)*intensity),12,0,7200),option('add',75+i*4,0,5),option('divide',2,0,45)];kind='gate';}
  events.push({id:`s${stage}-${mode}-${i}`,at,kind,phase:TYPES[i%6],options:[cells[turn],cells[(1+turn)%3],cells[(2+turn)%3]],previewSeconds:4.5});
 }
 events.push({id:`s${stage}-${mode}-boss`,at:duration-12,kind:'boss',phase:'最終突破',previewSeconds:5,options:[option('none',1,Math.ceil(25*stage*(hard?1.6:1)),80,0,4000),option('none',1,Math.ceil(12*stage*(hard?1.4:1)),35,0,1800),option('none',1,Math.ceil(18*stage*(hard?1.5:1)),60,0,3000)]});
 return {stage,mode,duration,visualLanes:3,freeX:true,initialUnits:1,goalMin:100,events,goalAt:duration,scope:'cadence_and_route_lab'};
}
function initial(){return {units:1n,power:0,coins:0n,kills:0,seen:[],finished:false,outcome:null};}
function evaluate(state,opt){const after=gate(state.units,opt.op,opt.value),ratio=Math.max(0,(opt.riskBps||0)-state.power*150),loss=after*BigInt(ratio)/10000n+BigInt(Math.ceil(opt.loss/(1+state.power*.6)));return after>loss?after-loss:0n;}
function choose(state,event,policy='survive'){if(policy==='center')return 1;let best=0;const score=o=>policy==='greedy'?gate(state.units,o.op,o.value):evaluate(state,o);for(let i=1;i<3;i++)if(score(event.options[i])>score(event.options[best]))best=i;return best;}
function apply(state,event,lane){if(!Number.isInteger(lane)||lane<0||lane>2)throw new RangeError('Three lanes only');if(state.finished||state.seen.includes(event.id))return state;const o=event.options[lane],before=state.units,units=evaluate(state,o),eliminated=units===0n;return {...state,units,power:state.power+o.power,coins:state.coins+BigInt(eliminated?0:o.coins),kills:state.kills+(o.loss?Math.ceil(Math.min(Number(before>1000n?1000n:before),o.loss)/12):0),seen:[...state.seen,event.id],finished:eliminated,outcome:eliminated?'exhausted':null};}
function finish(state){if(state.finished)return state;return {...state,finished:true,outcome:state.units>=100n?'clear':state.units===0n?'exhausted':'absorbed'};}
function payout(state){return state.finished&&state.outcome==='clear'?state.coins:0n;}
function simulate(p,policy='survive'){let state=initial();const trace=[];for(const event of p.events){const lane=choose(state,event,policy);state=apply(state,event,lane);trace.push({event:event.id,at:event.at,lane,units:state.units.toString(),coins:state.coins.toString()});if(state.finished)break;}state=finish(state);return {stage:p.stage,mode:p.mode,duration:p.duration,policy,events:p.events.length,goalUnits:state.units.toString(),outcome:state.outcome,bankedCoins:payout(state).toString(),trace};}
function format(n){const s=integer(n).toString();return s.length>7?s.slice(0,3)+'… ('+s.length+'桁)':Number(n).toLocaleString('en-US');}
scope.KRCadence={DURATIONS,integer,gate,plan,initial,evaluate,choose,apply,finish,payout,simulate,format};
})(typeof window==='undefined'?globalThis:window);
