import bundleJson from '../../data/stages.json';
import {AudioFx} from './Audio';
import {approximateTroopLog10} from './format';
import {DragInput} from './Input';
import {Render3D} from './Render';
import type {GameResult,GameStatus,HudSnapshot,StageBundle,StageDefinition,StageEvent, GateChoice,Quality,SkinId} from './types';

export const STAGES=(bundleJson as unknown as StageBundle).stages;

interface GameHooks {
  onSnapshot(snapshot:HudSnapshot):void;
  onStatus(status:GameStatus):void;
  onFeedback(message:string,kind:'good'|'bad'|'neutral'):void;
  onFinish(result:GameResult):void;
}
const clamp=(value:number, min:number,max:number)=>Math.max(min,Math.min(max,value));

export class Game {
  readonly audio=new AudioFx();
  readonly render:Render3D;
  readonly input:DragInput;
  status:GameStatus='menu';
  stage:StageDefinition=STAGES[0];
  selectedStage=1;
  private distance=0;
  private x=0;
  private time=0;
  private troops=1n;
  private attack=1;
  private rapid=0;
  private shields=0;
  private hp=new Map<string,number>();
  private frameId=0;
  private lastTime=0;
  private shotTimer=0;
  private lastHud=0;
  private lastShotSound=0;
  private isDisposed=false;
  private callbacks:GameHooks;

  constructor(canvas:HTMLCanvasElement, hooks:GameHooks){
    this.callbacks=hooks;
    this.render=new Render3D(canvas);
    this.input=new DragInput(canvas);
    this.loadStage(1);
    window.addEventListener('keydown',this.keyboard);
    this.frameId=requestAnimationFrame(this.frame);
  }
  private keyboard=(ev:KeyboardEvent)=>{
    if(this.status!=='running')return;
    if(ev.key==='ArrowLeft'||ev.key==='a')this.input.targetX=clamp(this.input.targetX-.62,-4.08,4.08);
    if(ev.key==='ArrowRight'||ev.key==='d')this.input.targetX=clamp(this.input.targetX+.62,-4.08,4.08);
    if(ev.key==='Escape')this.pause();
  };
  loadStage(id:number){
    const def=STAGES.find(x=>x.id===id);
    if(!def)throw new Error(`Unknown stage ${id}`);
    this.stage=def;this.selectedStage=id;
    this.render.load(def);
    this.distance=0;this.x=0;this.time=0;this.troops=1n;
    this.attack=1;this.rapid=0;this.shields=0;this.shotTimer=0;
    this.hp.clear();
    for(const ev of def.events)if(ev.type==='enemy'||ev.type==='boss')this.hp.set(ev.id,ev.hp);
    this.input.reset();this.sendSnapshot();
  }
  preview(id:number){this.loadStage(id);this.status='menu';this.callbacks.onStatus('menu');}
  start(id=this.selectedStage){
    this.loadStage(id);
    this.status='running';this.audio.unlock();this.callbacks.onStatus('running');
  }
  pause(){if(this.status!=='running')return;this.status='paused';this.callbacks.onStatus('paused');}
  resume(){if(this.status!=='paused')return;this.status='running';this.callbacks.onStatus('running');}
  quit(){this.status='menu';this.preview(this.selectedStage);}
  restart(){this.start(this.selectedStage);}
  setSkin(skin:SkinId){this.render.setSkin(skin);}
  setSound(active:boolean){this.audio.enabled=active;if(active)this.audio.unlock();}
  setQuality(q:Quality){this.render.setQuality(q);}
  setReducedMotion(reduced:boolean){this.render.setReducedMotion(reduced);}

  private frame=(nowMs:number)=>{
    if(this.isDisposed)return;
    if(!this.lastTime)this.lastTime=nowMs;
    const dt=clamp((nowMs-this.lastTime)/1000,0,.05);
    this.lastTime=nowMs;
    const elapsed=nowMs/1000;
    if(this.status==='running')this.tick(dt,elapsed);
    this.render.update(this.distance,this.x,this.troops,elapsed,dt,this.hp,this.status==='running');
    if(this.status==='running' && nowMs-this.lastHud>80){this.sendSnapshot();this.lastHud=nowMs;}
    this.frameId=requestAnimationFrame(this.frame);
  };
  private tick(dt:number,elapsed:number){
    const old=this.distance;
    this.time+=dt;
    // Slippery mucus slows lateral response, current introduces limited sideways drift.
    let lateralFactor=1;
    for(const ev of this.stage.events){
      if(ev.type!=='obstacle')continue;
      const d=ev.at-this.distance;
      if(d>-10 && d<17 && Math.abs(this.x-ev.lane*3)<ev.width/2+1.1){
        if(ev.kind==='mucus')lateralFactor=.63;
        if(ev.kind==='current')this.input.targetX=clamp(this.input.targetX+Math.sin(elapsed*2.9+ev.at)*.74*dt,-4.08,4.08);
      }
    }
    const response=1-Math.exp(-dt*17*lateralFactor);
    this.x+=(this.input.targetX-this.x)*response;
    this.distance=Math.min(this.stage.length,this.distance+this.stage.speed*dt);
    this.shoot(dt,elapsed);
    // Process exactly once as each scripted event distance is crossed.
    for(const ev of this.stage.events){
      if(old<ev.at && this.distance>=ev.at){
        this.processCollision(ev,elapsed);
        if(this.status!=='running')break;
      }
    }
    if(this.status==='running' && this.distance>=this.stage.length){
      if(this.troops>=100n)this.finish(true,'100体以上でゴールに到達！');
      else this.finish(false,'ゴール到達時の生存数が100体未満');
    }
  }
  private shoot(dt:number,elapsed:number){
    const targets=this.stage.events
      .filter((ev):ev is Extract<StageEvent,{type:'enemy'|'boss'}>=>ev.type==='enemy'||ev.type==='boss')
      .filter(ev=>(this.hp.get(ev.id)??0)>0 && ev.at-this.distance>0 && ev.at-this.distance<44)
      .sort((a,b)=>a.at-b.at);
    const target=targets.find(ev=>Math.abs(ev.lane*3-this.x)<4.6);
    if(!target)return;
    const troopBoost=Math.pow(10,Math.min(2.4,.47*approximateTroopLog10(this.troops)));
    const dps=12*troopBoost*(1+(this.attack-1)*.85)*(1+this.rapid*.32);
    const nextHp=Math.max(0,(this.hp.get(target.id)??target.hp)-dps*dt);
    this.hp.set(target.id,nextHp);
    this.shotTimer+=dt;
    const interval=Math.max(.055,.19-this.rapid*.018);
    if(this.shotTimer>interval){
      this.shotTimer=0;
      this.render.fire(this.x,target.lane*3);
      if(elapsed-this.lastShotSound>.42){this.audio.tone('shot');this.lastShotSound=elapsed;}
    }
    if(nextHp===0){
      this.callbacks.onFeedback(target.type==='boss'?'BOSS BREAK!':'ENEMY DOWN','good');
      this.audio.tone('gate');
    }
  }
  private processCollision(ev:StageEvent,elapsed:number){
    if(ev.type==='gate_row'){
      // The group has a continuous position. Only the gate actually crossed is applied.
      const choice=ev.choices.reduce((prev,current)=>Math.abs(current.lane*3-this.x)<Math.abs(prev.lane*3-this.x)?current:prev);
      if(Math.abs(choice.lane*3-this.x)<=1.5){this.applyGate(choice);}
      return;
    }
    if(ev.type==='obstacle'){
      let width=ev.width;
      if(ev.kind==='pulsing')width*=.7+.31*(1+Math.sin(elapsed*3.6+ev.at*.2))*.5;
      if(Math.abs(ev.lane*3-this.x)<=width/2+.16){
        this.applyLoss(BigInt(ev.damage),ev.kind.toUpperCase());
      }return;
    }
    const hp=this.hp.get(ev.id)??ev.hp;
    if(hp<=0)return;
    const damage=Math.ceil(ev.strength * (hp / ev.hp));
    // This is an arcade battle, not realistic biology. Crowds at edge lanes can bypass some enemies.
    const radius=ev.type==='boss'?5.4:ev.enemy==='swarm'?2.7:2.1;
    if(Math.abs(this.x-ev.lane*3)<=radius){
      this.applyLoss(BigInt(damage),ev.type==='boss'?'BOSS COLLISION':'ENEMY COLLISION');
    }
    this.hp.set(ev.id,0);
  }
  private applyGate(choice:GateChoice){
    switch(choice.action){
      case 'multiply':this.troops*=BigInt(choice.value);break;
      case 'add':this.troops+=BigInt(choice.value);break;
      case 'subtract':this.troops=this.troops>BigInt(choice.value)?this.troops-BigInt(choice.value):0n;break;
      case 'divide':this.troops/=BigInt(choice.value);break;
      case 'attack':this.attack+=choice.value;break;
      case 'rapid':this.rapid+=choice.value;break;
      case 'shield':this.shields+=choice.value;break;
    }
    const label={multiply:`×${choice.value} MULTIPLY`,add:`+${choice.value} JOINED`,subtract:`−${choice.value} LOST`,divide:`÷${choice.value} LOST`,attack:`ATK +${choice.value}`,rapid:`RAPID +${choice.value}`,shield:`SHIELD +${choice.value}`}[choice.action];
    const negative=choice.action==='subtract'||choice.action==='divide';
    this.callbacks.onFeedback(label,negative?'bad':'good');this.audio.tone(negative?'hit':'gate');
    if(this.troops===0n)this.finish(false,'減少ゲートで精子が0体になった');
  }
  private applyLoss(loss:bigint,reason:string){
    if(this.shields>0){this.shields--;this.callbacks.onFeedback('SHIELD BLOCK','neutral');this.audio.tone('gate');return;}
    this.troops=this.troops>loss?this.troops-loss:0n;
    this.callbacks.onFeedback(`−${loss.toLocaleString('ja-JP')} ${reason}`,'bad');
    this.audio.tone('hit');
    if(this.troops===0n)this.finish(false,`戦力を失った：${reason}`);
  }
  private finish(won:boolean,reason:string){
    this.status=won?'win':'lost';this.audio.tone(won?'win':'lose');
    this.callbacks.onStatus(this.status);
    this.callbacks.onFinish({won,stage:this.stage.id,troops:this.troops,seconds:this.time,reason});
    this.sendSnapshot();
  }
  private sendSnapshot(){
    const upcomingBoss=this.stage.events.find(e=>e.type==='boss' && e.at-this.distance<65 && e.at-this.distance>-8);
    let boss:HudSnapshot['boss'];
    if(upcomingBoss && upcomingBoss.type==='boss' && (this.hp.get(upcomingBoss.id)??0)>0){
      boss={name:upcomingBoss.boss.replaceAll('_',' ').toUpperCase(),hp:this.hp.get(upcomingBoss.id)??0,maxHp:upcomingBoss.hp};
    }
    this.callbacks.onSnapshot({
      stage:this.stage.id,title:this.stage.title,progress:clamp(this.distance/this.stage.length,0,1),
      distance:this.distance,troops:this.troops,attack:this.attack,rapid:this.rapid,shields:this.shields,boss,status:this.status,
    });
  }
  dispose(){this.isDisposed=true;cancelAnimationFrame(this.frameId);window.removeEventListener('keydown',this.keyboard);this.input.dispose();this.render.dispose();}
}