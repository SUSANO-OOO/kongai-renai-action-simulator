import './styles.css';
import {Game,STAGES} from './game/Game';
import {formatTime,formatTroops} from './game/format';
import {loadSave,SKIN_COLORS,writeSave} from './game/save';
import type {GameResult,GameStatus,HudSnapshot,Quality,SkinId} from './game/types';

const byId=<T extends HTMLElement>(id:string)=>{
  const el=document.getElementById(id);
  if(!el)throw new Error(`Missing UI element ${id}`);
  return el as T;
};
const canvas=byId<HTMLCanvasElement>('game-canvas');
const screenIds=['screen-title','screen-stages','screen-skins','screen-settings','screen-pause','screen-result'] as const;
let save=loadSave();
let feedbackTimer:number|undefined;
let hintTimer:number|undefined;
let game:Game;
let lastStatus:GameStatus='menu';

function showScreen(id:string|null){
  for(const screenId of screenIds)byId(screenId).classList.toggle('is-hidden',screenId!==id);
}
function feedback(text:string,kind:'good'|'bad'|'neutral'){
  const el=byId('game-feedback');
  el.textContent=text;el.className=`game-feedback is-visible feedback-${kind}`;
  if(feedbackTimer)clearTimeout(feedbackTimer);
  feedbackTimer=window.setTimeout(()=>{el.className='game-feedback';},1150);
}
function onSnapshot(data:HudSnapshot){
  byId('hud-stage').textContent=String(data.stage).padStart(2,'0');
  byId('hud-stage-name').textContent=data.title;
  byId('hud-progress-text').textContent=`${Math.floor(data.progress*100)}%`;
  byId('hud-progress-fill').style.width=`${data.progress*100}%`;
  byId('hud-count').textContent=formatTroops(data.troops);
  byId('hud-modifiers').textContent=`ATK Lv.${data.attack}  ·  SPD +${data.rapid}  ·  ◇ ${data.shields}`;
  const boss=byId('hud-boss');
  boss.classList.toggle('is-hidden',!data.boss);
  if(data.boss){
    byId('hud-boss-name').textContent=data.boss.name;
    byId('hud-boss-pct').textContent=`${Math.ceil(data.boss.hp/data.boss.maxHp*100)}%`;
    byId('hud-boss-bar').style.width=`${Math.max(0,data.boss.hp/data.boss.maxHp*100)}%`;
  }
}
function onStatus(status:GameStatus){
  lastStatus=status;
  byId('game-hud').classList.toggle('is-hidden',status==='menu');
  if(status==='menu'){showScreen('screen-title');renderTitle();}
  if(status==='running')showScreen(null);
  if(status==='paused')showScreen('screen-pause');
  if(status==='win'||status==='lost')showScreen('screen-result');
  if(status!=='running')byId('drag-hint').classList.add('is-hidden');
}
function onFinish(result:GameResult){
  const won=result.won;
  byId('result-overline').textContent=won?'MISSION COMPLETE':'MISSION FAILED';
  byId('result-title').textContent=won?'CLEAR':'FAILED';
  byId('result-description').textContent=won?result.stage===10?'全10ステージ突破。ここからが本番だ。':`${STAGES[result.stage-1].title}を突破。次の区画が解放された。`:result.reason;
  byId('result-count').textContent=formatTroops(result.troops);
  byId('result-time').textContent=formatTime(result.seconds);
  byId('btn-result-next').classList.toggle('is-hidden',!won || result.stage===10);
  if(won){
    save.unlockedStage=Math.max(save.unlockedStage,Math.min(10,result.stage+1));
    if(!save.cleared.includes(result.stage))save.cleared.push(result.stage);
    const prev=save.bestTimes[String(result.stage)];
    if(!prev || prev>result.seconds)save.bestTimes[String(result.stage)]=result.seconds;
    writeSave(save);
  }
  renderStageGrid();renderTitle();
}

game=new Game(canvas,{onSnapshot,onStatus,onFeedback:feedback,onFinish});
game.setSkin(save.equippedSkin);
game.setQuality(save.quality);
game.setSound(save.sound);
game.setReducedMotion(save.reducedMotion);

function renderTitle(){
  const id=Math.min(10,Math.max(1,save.unlockedStage));
  const stage=STAGES[id-1];
  byId('menu-stage').textContent=`STAGE ${String(id).padStart(2,'0')}`;
  byId('menu-stage-name').textContent=stage.title;
}
function start(id:number){
  game.start(id);
  byId('drag-hint').classList.remove('is-hidden');
  if(hintTimer)clearTimeout(hintTimer);
  hintTimer=window.setTimeout(()=>byId('drag-hint').classList.add('is-hidden'),4600);
}
function renderStageGrid(){
  const container=byId('stage-grid');container.replaceChildren();
  for(const stage of STAGES){
    const unlocked=stage.id<=save.unlockedStage;
    const cleared=save.cleared.includes(stage.id);
    const btn=document.createElement('button');
    btn.type='button';btn.className=`stage-tile${unlocked?'':' is-locked'}`;
    btn.disabled=!unlocked;
    const number=document.createElement('strong');number.textContent=String(stage.id).padStart(2,'0');
    const name=document.createElement('span');name.textContent=stage.title;
    const state=document.createElement('small');state.textContent=cleared?'CLEARED':unlocked?'UNLOCKED':'LOCKED';
    btn.append(number,name,state);
    if(unlocked)btn.addEventListener('click',()=>start(stage.id));
    container.append(btn);
  }
}
function renderSkins(){
  const list=byId('skin-options');list.replaceChildren();
  const names:Record<SkinId,string>={teal:'MINT / 01',pearl:'PEARL / 02',violet:'VIOLET / 03',gold:'GOLD / 04'};
  for(const id of Object.keys(SKIN_COLORS) as SkinId[]){
    const btn=document.createElement('button');btn.type='button';
    btn.className=`skin-option${save.equippedSkin===id?' is-equipped':''}`;
    const sample=document.createElement('span');sample.className='skin-dot';sample.style.backgroundColor=SKIN_COLORS[id];
    const name=document.createElement('span');name.textContent=names[id];
    const badge=document.createElement('small');badge.textContent=save.equippedSkin===id?'EQUIPPED':'EQUIP';
    btn.append(sample,name,badge);
    btn.addEventListener('click',()=>{
      save.equippedSkin=id;game.setSkin(id);writeSave(save);renderSkins();
    });
    list.append(btn);
  }
}
function renderSettings(){
  byId('btn-sound-toggle').textContent=save.sound?'ON':'OFF';
  byId('btn-quality-toggle').textContent=save.quality.toUpperCase();
  byId('btn-motion-toggle').textContent=save.reducedMotion?'ON':'OFF';
}
function menu(){game.preview(save.unlockedStage);renderTitle();}

byId('btn-start').addEventListener('click',()=>start(save.unlockedStage));
byId('btn-level-select').addEventListener('click',()=>{renderStageGrid();showScreen('screen-stages');});
byId('btn-skins').addEventListener('click',()=>{renderSkins();showScreen('screen-skins');});
byId('btn-settings').addEventListener('click',()=>{renderSettings();showScreen('screen-settings');});
for(const back of document.querySelectorAll<HTMLButtonElement>('[data-back="title"]'))back.addEventListener('click',()=>showScreen('screen-title'));
byId('btn-pause').addEventListener('click',()=>game.pause());
byId('btn-resume').addEventListener('click',()=>game.resume());
byId('btn-restart').addEventListener('click',()=>start(game.selectedStage));
byId('btn-quit').addEventListener('click',menu);
byId('btn-result-retry').addEventListener('click',()=>start(game.selectedStage));
byId('btn-result-next').addEventListener('click',()=>start(Math.min(10,game.selectedStage+1)));
byId('btn-result-home').addEventListener('click',menu);
byId('btn-sound-toggle').addEventListener('click',()=>{save.sound=!save.sound;game.setSound(save.sound);writeSave(save);renderSettings();});
byId('btn-quality-toggle').addEventListener('click',()=>{
  const qualities:Quality[]=['low','normal','high'];
  save.quality=qualities[(qualities.indexOf(save.quality)+1)%3];game.setQuality(save.quality);writeSave(save);renderSettings();
});
byId('btn-motion-toggle').addEventListener('click',()=>{save.reducedMotion=!save.reducedMotion;game.setReducedMotion(save.reducedMotion);writeSave(save);renderSettings();});
renderTitle();renderStageGrid();renderSkins();renderSettings();
game.preview(save.unlockedStage);

window.addEventListener('visibilitychange',()=>{if(document.hidden&&lastStatus==='running')game.pause();});
