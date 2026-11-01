(function(){
'use strict';
const $=id=>document.getElementById(id),core=window.KRCadence;
for(let i=1;i<=11;i++){const o=document.createElement('option');o.value=i;o.textContent=i===11?'SECRET / パイセン (HARD)':'STAGE '+String(i).padStart(2,'0');$('stage').append(o);}
let renderer,model={t:0,x:0,plan:core.plan(),state:core.initial(),running:false,skin:0,result:null,endAge:0},targetX=0,eventIndex=0,last=0,pointer=null,dragStart=0,dragX=0,disposed=false;
function setMode(){const secret=$('stage').value==='11';$('mode').options[0].disabled=secret;if(secret)$('mode').value='hard';}
function reset(){setMode();model={t:0,x:0,plan:core.plan(Number($('stage').value),$('mode').value),state:core.initial(),running:true,skin:Number($('skin').value),result:null,endAge:0};targetX=0;eventIndex=0;$('result').style.display='none';$('pause').textContent='一時停止';$('hint').textContent='左右にドラッグ / 自動前進・射撃';last=performance.now();}
function end(outcome){model.result=outcome;model.endAge=0;model.running=false;$('hint').textContent=outcome==='clear'?'白金色に包まれてクリア':outcome==='absorbed'?'紫の渦に吸収されて失敗':'全滅・今回のコインは0';}
function resultText(){const clear=model.result==='clear';$('outcome').textContent=clear?'SUCCESS':'FAILED';$('outcome').style.color=clear?'#ffe7ac':'#dbb9ff';$('summary').textContent='最終人数 '+core.format(model.state.units);$('banked').textContent='持ち帰りコイン '+core.format(core.payout(model.state));$('result').style.display='flex';}
function frame(now){if(disposed)return;const dt=Math.min(.25,Math.max(0,(now-(last||now))/1000));last=now;
 if(model.running&&!model.result){model.t=Math.min(model.plan.duration,model.t+dt);const next=model.plan.events[eventIndex];
  if($('auto').checked&&next)targetX=(core.choose(model.state,next)-1)*2.4;
  model.x+=(targetX-model.x)*Math.min(1,dt*14);
  if(next&&model.t>=next.at){const lane=Math.min(2,Math.max(0,Math.round(model.x/2.4)+1));model.state=core.apply(model.state,next,lane);eventIndex++;if(model.state.finished)end(model.state.outcome);}
  if(!model.result&&model.t>=model.plan.goalAt){model.state=core.finish(model.state);end(model.state.outcome);}
 }
 if(model.result){model.endAge+=dt;if(model.endAge>=2.3)resultText();}
 const stats=renderer.draw(model);$('units').textContent=core.format(model.state.units);$('coins').textContent=core.format(model.state.coins);$('stageLabel').textContent=(model.plan.stage===11?'SECRET':'STAGE '+String(model.plan.stage).padStart(2,'0'))+' / '+model.plan.mode.toUpperCase();$('progress').style.width=(model.t/model.plan.duration*100)+'%';
 $('phase').textContent=model.result?'GOAL':model.plan.events[eventIndex]?.phase||'ゴールへ';$('status').textContent=stats.renderer+' / 代表表示個体 '+stats.renderedUnits+' / 未承認の制作サンプル';requestAnimationFrame(frame);
}
function preview(n){reset();model.t=model.plan.duration;model.state=core.finish({...core.initial(),units:BigInt(n),coins:40n});end(model.state.outcome);$('hint').textContent+='（境界検査）';}
$('device').addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON')return;pointer=e.pointerId;dragStart=e.clientX;dragX=model.x;$('auto').checked=false;$('device').setPointerCapture(pointer);});
$('device').addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;targetX=Math.max(-3.25,Math.min(3.25,dragX+(e.clientX-dragStart)/$('device').clientWidth*7.2));});
for(const kind of ['pointerup','pointercancel','lostpointercapture'])$('device').addEventListener(kind,()=>{pointer=null;});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();$('auto').checked=false;targetX=Math.max(-3.25,Math.min(3.25,targetX+(e.key==='ArrowLeft'?-.4:.4)));}});
$('start').onclick=reset;$('retry').onclick=reset;$('stage').onchange=setMode;$('skin').onchange=()=>model.skin=Number($('skin').value);
$('pause').onclick=()=>{if(model.result)return;model.running=!model.running;$('pause').textContent=model.running?'一時停止':'再開';last=performance.now();};
$('preview99').onclick=()=>preview(99);$('preview100').onclick=()=>preview(100);
document.addEventListener('visibilitychange',()=>{if(document.hidden){model.running=false;$('pause').textContent='再開';}});
$('view').addEventListener('webglcontextlost',e=>{e.preventDefault();model.running=false;disposed=true;$('error').textContent='描画コンテキストが失われました。再読込してください。';$('error').style.display='block';});
try{renderer=window.KRRenderer($('view'),$('labels'));new ResizeObserver(()=>renderer.resize()).observe($('device'));requestAnimationFrame(frame);}catch(e){$('error').textContent=String(e.message||e);$('error').style.display='block';$('start').disabled=true;}
// Inspection only: no production save or fabricated player record.
window.__KR_LAB__={get state(){return model;},stepTo(t){if(!Number.isFinite(t)||t<0||t>model.plan.duration)throw Error('Invalid test position');reset();for(const ev of model.plan.events){if(ev.at>t)break;model.state=core.apply(model.state,ev,core.choose(model.state,ev));eventIndex++;if(model.state.finished)break;}model.t=t;model.running=false;},preview};
})();
