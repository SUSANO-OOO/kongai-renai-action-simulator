import './styles.css';

type Screen={id:string;title:string;purpose:string;checks:string[]};
const SCREENS:Screen[]=[
 {id:'01_title',title:'タイトル画面',purpose:'世界観と1タップで始められる入口',checks:['9:16で主題が見える','背景とロゴが競合に埋もれない','ボタンの大きさ']},
 {id:'02_stage_select',title:'女性キャラ／ステージ選択',purpose:'10人の成人キャラクターと難易度の選択',checks:['成人キャラ全10人','選択中の人物が主役','NORMAL / HARD','隠しパイセンの導線']},
 {id:'03_one_start',title:'1体からゲーム開始',purpose:'プレイヤーの精子は必ず1体から始まる',checks:['初期数1体','自動前進','左・中央・右が見える','左右移動は自由X座標']},
 {id:'04_blue_red_gates',title:'青増員・赤減員の3択',purpose:'3レーンの選択と倍率の気持ちよさ',checks:['青は増員','赤は減員','中央も進路に含む','レーン位置へのスナップは不要']},
 {id:'05_enemy_wave',title:'敵大群・攻撃・損耗',purpose:'敵を倒しながら仲間を維持',checks:['腐敗ゾンビ系の敵','自動射撃の予告','ユニット数の視認性']},
 {id:'06_boss',title:'ボス戦',purpose:'コース中の明確な見せ場',checks:['攻撃予告を見られる','ボスHPが分かる','軍団戦の迫力']},
 {id:'07_goal',title:'発光ゴール接近',purpose:'同一地点の3Dゴールから勝敗分岐',checks:['現在の軍団数','同じポータルを維持','100体基準が明確']},
 {id:'08_clear',title:'SUCCESS / 白金色',purpose:'100体以上で軍団が光に包まれ勝利',checks:['100体以上','白金色の発光','3Dゴールとカメラを維持']},
 {id:'09_failed',title:'FAILED / 紫の吸引',purpose:'99体以下でゲートが紫化、吸引され敗北',checks:['1〜99体','紫の吸引渦','同じ位置の3Dゴール']},
 {id:'10_result',title:'リザルト／報酬',purpose:'クリア数・コイン・経験値の表示',checks:['成績と報酬','次のステージ','リトライ']},
 {id:'11_skins',title:'初期＋追加3種の着せ替え',purpose:'コインで外見を変える楽しみ',checks:['初期外見＋追加3種類＝合計4種類','ゲーム内コインの価格と装備','性能差はない','旧ラフは3外見のため作り直し対象']},
 {id:'12_secret',title:'秘密のパイセン面',purpose:'10面のHARDクリア後に解放される特殊面',checks:['HARD 10/10','HARD専用・NORMALなし','忠実なidentity-r2を参照','隠し面の別世界観']},
];
const RASTER_BY_SCREEN:Record<string,string>={'01_title':'01_title.webp','02_stage_select':'02_stage_select.webp','03_one_start':'03_one_unit_start.webp','04_blue_red_gates':'04_blue_red_gates.webp','05_enemy_wave':'05_enemies_and_damage.webp','06_boss':'07_boss_battle.webp','07_goal':'08_goal_approach.webp','08_clear':'09_clear_screen.webp','09_failed':'10_failed_screen.webp'};
let viewMode:'layout'|'raster'='layout';
const app=document.querySelector<HTMLElement>('#app')||document.body;
let selected=0;
let startX=0;
app.innerHTML=`<div class="app-shell">
 <header class="masthead">
  <div class="brand-mark">KR<span>AS</span></div>
  <div class="brand-copy"><strong>婚外恋愛アクションシミュレーター</strong><span>PAO GAMES · PRE-PRODUCTION</span></div>
  <span class="draft">未承認コンペ</span>
 </header>
 <main class="workspace">
  <section class="preview-column" aria-label="縦型画面プレビュー">
   <div class="preview-top"><span class="eyebrow">PORTRAIT SCREEN PREVIEW</span><strong id="step">01 / 12</strong></div>
   <div class="mode-picker"><button id="mode-layout" class="active" type="button">旧構図ラフ（SVG）</button><button id="mode-raster" type="button">旧ビジュアルラフ（WebP）</button></div><div class="phone-stage" id="phone-stage"><img id="screen-image" alt="選択中の縦画面コンペ" loading="eager"/></div>
   <div class="preview-controls"><button id="prev" type="button">← 前の画面</button><button id="next" type="button">次の画面 →</button></div>
  </section>
  <aside class="spec-column">
   <span class="eyebrow">DESIGN REVIEW / FIRST DRAFT</span>
   <h1 id="screen-title"></h1>
   <p id="screen-purpose"></p>
   <div class="notice"><b>これは完成ゲームではありません。</b><p>SVG・WebPとも未承認の旧ラフです。国籍表記・外見数・ゴール表現などに現行仕様との差があります。右の検収項目と最新仕様を優先し、完成素材として転用しないでください。</p></div>
   <h2>この画面の検収項目</h2><ul id="checks"></ul>
   <p><a class="spec-link" href="./labs/cadence/index.html">3レーン・2〜3分の制作検証を開く ↗</a></p><h2>画面一覧</h2><nav id="thumbnail-list" aria-label="各画面を選択"></nav>
   <div class="milestone"><b>必須ルール</b><p>全11ステージで1体開始。青ゲートは増員、赤ゲートは減員。3経路の見た目に対して移動は自由。ゴール時100体以上で成功。</p></div>
   <a class="spec-link" href="https://github.com/SUSANO-OOO/kongai-renai-action-simulator/blob/main/AGENTS.md" target="_blank" rel="noopener">Codex開発ルールを見る ↗</a>
  </aside>
 </main>
 </div>`;
const $=<T extends HTMLElement>(id:string)=>{const el=document.getElementById(id);if(!el)throw Error('Missing '+id);return el as T;};
const img=$<HTMLImageElement>('screen-image');
const thumbnails=$('thumbnail-list');
for(let i=0;i<SCREENS.length;i++){
 const s=SCREENS[i];const btn=document.createElement('button');btn.type='button';
 btn.className='thumb';btn.textContent=`${String(i+1).padStart(2,'0')} · ${s.title}`;
 btn.addEventListener('click',()=>show(i));thumbnails.appendChild(btn);
}
function show(i:number){
 selected=(i+SCREENS.length)%SCREENS.length;const s=SCREENS[selected];
 const raster=RASTER_BY_SCREEN[s.id];const useRaster=viewMode==='raster'&&!!raster;img.src=useRaster?`./concept-art/raster-drafts/${raster}`:`./concept-art/${s.id}.svg`;img.style.objectFit='contain';img.alt=`${s.title} / ${useRaster?'旧ビジュアルラフ（誤記や不整合あり）':'旧構図ラフ（現行仕様との差あり）'}・未承認`;
 $('step').textContent=`${String(selected+1).padStart(2,'0')} / ${SCREENS.length}`;
 $('screen-title').textContent=s.title;$('screen-purpose').textContent=s.purpose;
 $('checks').replaceChildren(...s.checks.map(c=>{const li=document.createElement('li');li.textContent=c;return li;}));
 document.querySelectorAll('.thumb').forEach((btn,n)=>btn.classList.toggle('active',n===selected));
}
$('mode-layout').addEventListener('click',()=>{viewMode='layout';$('mode-layout').classList.add('active');$('mode-raster').classList.remove('active');show(selected);});
$('mode-raster').addEventListener('click',()=>{viewMode='raster';$('mode-raster').classList.add('active');$('mode-layout').classList.remove('active');show(selected);});
$('prev').addEventListener('click',()=>show(selected-1));$('next').addEventListener('click',()=>show(selected+1));
$('phone-stage').addEventListener('touchstart',e=>{startX=e.touches[0]?.clientX??0;},{passive:true});
$('phone-stage').addEventListener('touchend',e=>{const d=(e.changedTouches[0]?.clientX??0)-startX;if(Math.abs(d)>55)show(selected+(d<0?1:-1));},{passive:true});
window.addEventListener('keydown',e=>{if(e.key==='ArrowRight')show(selected+1);if(e.key==='ArrowLeft')show(selected-1);});
show(0);
