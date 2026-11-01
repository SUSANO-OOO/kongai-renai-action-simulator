"""One-time owner-directed cadence/handoff migration. No network or purchase operations."""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def load(p):return json.loads((R/p).read_text())
def save(p,d):(R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def write(p,t):
 f=R/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(t.strip()+'\n')
D=[120,126,132,138,144,150,156,162,168,180,180]
p=load('data/progression.json');p['records']['secondary']=[v for v in p['records']['secondary'] if v not in ['clear_time','best_time','fastest_time']];p['records'].update(timingRecords=False,timerHud=False);p['runRewards']['lossPayout']=0;save('data/progression.json',p)
p=load('data/product-settings.json');p['gameplay']={'targetStageSeconds':[120,180],'timerHud':False,'timeRecords':False,'timingUse':'internal_progression_and_developer_validation_only','longerStagesMeanMoreEncounters':True,'decisionSource':'docs/decisions/2026-11-02-cadence.md'};save('data/product-settings.json',p)
p=load('data/stages.json')
for s in p['normalStages']:
 s['targetPlaySeconds']=D[s['id']-1]
 for mode in ['normal','hard']:s[mode]['targetPlaySeconds']=D[s['id']-1]
p['secretStage']['targetPlaySeconds']=180;save('data/stages.json',p)
p=load('data/project-state.json');p['handoff']={'readyToBeginAssetProduction':True,'productionImplementationReady':False,'allAssetsApprovalRequiredForProduction':True,'gate':'npm run check:handoff','productionGate':'npm run check:assets','correction':'Codex may start asset production before approval; producer approval gates campaign integration, not starting asset work.'};save('data/project-state.json',p)
p=load('data/stage-design-briefs.json')
for s in p['stages']:s['targetPlaySeconds']=D[s['id']-1]
save('data/stage-design-briefs.json',p)
p=load('data/asset-manifest.json');mapping={'player-base':['player-normal'],'player-skin-01':['player-spartan'],'player-skin-02':['player-nightmare'],'player-skin-03':['player-aurora'],'enemy-zombie':['enemy-zombie'],'prop-blue-gate':['gate-blue'],'prop-red-gate':['gate-red'],'prop-goal':['goal-neutral','goal-clear','goal-failed']}
for a in p['requiredAssets']:
 if a['id'] in mapping:
  if a.get('approved'):raise RuntimeError('Refusing to replace approved asset '+a['id'])
  a.update(status='in_progress',approved=False,sourceFiles=['scripts/generate-cadence-assets.mjs'],runtimeFiles=['public/labs/cadence/models/'+n+'.glb' for n in mapping[a['id']]],previewFiles=['public/labs/cadence/index.html'],notes='Unapproved static blockout; lab uses matching procedural shapes, not a GLB importer. No final animation, artist QA or production approval.')
save('data/asset-manifest.json',p)
# Outward winding for exported sphere primitives.
f=R/'scripts/generate-cadence-assets.mjs';f.write_text(f.read_text().replace('idx.push(v,v+13,v+14,v,v+14,v+1)','idx.push(v,v+14,v+13,v,v+1,v+14)'))
write('docs/decisions/2026-11-02-cadence.md','''# 本人指定 — 2026-11-02
本人：「タイム記録とかはなくていいしコインの件は苦痛にならない。だいたい、2分～3分程度で1ステージクリアできる物量を想定。あとはお前の言ってる通りに進めれるだけ進めてほしい」

タイム記録・タイムランキング・タイマーHUDは作らない。内部の進行制御/開発計測は別。1面約120〜180秒を狙い、低速化で引き延ばさず戦闘/ゲート/障害/強化/見せ場を増やす。敗北したランの回収コイン0を維持し、救済を勝手に追加しない。追加支出0円も維持。

前回答で説明した引き渡し訂正：Codexへ全素材の制作から任せてよい。本人承認が必要なのは本格キャンペーン統合前。ChatGPTが全素材を作り終わるまでCodexの作業開始を禁止する制約は撤回する。制作主体にかかわらず全素材の同じ検査/本人査定を適用する。

面別120/126/…/180秒は調整案で、完成ゲームの実測ではない。数値シミュレーションや人数注入を人間のクリア実績として数えない。
''')
write('CODEX_START_PROMPT.md','''# Codexへ渡す開始指示 — 素材制作から開始
最新mainのAGENTS.md、docs/HANDOFF.md、docs/decisions/2026-11-02-cadence.md、docs/PRODUCT_CONTRACT.mdを確認して『婚外恋愛アクションシミュレーター』を完成へ進めてください。

最初の仕事は全素材の制作と検収。ChatGPT側の全素材完成を待つ必要はありません。`npm run check:handoff` は素材制作開始の下地、`npm run check:assets` は本格キャンペーン統合前の本人承認を検査します。承認不足時は本編統合を開始せず、素材制作・修正・検収を続けてください。

タイム記録/タイマーHUDはなし。1面約2〜3分の物量。敗北ランの回収コイン0、既存財布は維持。通常NORMAL10＋HARD10＋秘密HARD1、1体開始、視覚3進路と連続横移動、青増員/赤減員、100体以上の白金成功/99以下の紫吸引を守ってください。

public/labs/cadence/ は操作・画角・物量・ゴール分岐の技術検証。GLB10点は未承認のブロックアウトで、完成アートや個別弾/敵HPの完成戦闘ではありません。人物2D/4外見/称号/端末保存/無料公開の条件は維持します。

追加支出0円。既存枠と確認済み無料手段だけ。制作方法や調整は自分で判断して検査し、低リスクPRは自律main統合可。全素材の3観点検査・本人一括査定と、初版公開の本人承認を捏造しないでください。独立して進められる作業は継続し、成果・実施した検査・未確認・残件をIssue/WORK_LOGへ残してください。
''')
write('docs/HANDOFF.md','''# 素材制作から始める再開入口

最新の本人指示は `docs/decisions/2026-11-02-cadence.md`。タイム記録なし、1面120〜180秒の物量、敗北回収コイン0、追加支出0円。その他のCG寄り人物2D/人妻感/順次解放/HARD最初から/パイセンHARD専用/4外見/端末保存を維持。

Codexが全素材を制作する担当になれる。ChatGPTが素材を全完成するまで引き渡せない条件は撤回。check:handoffは素材制作開始、check:assetsは本格キャンペーン統合前の本人承認。二つを混同して全停止しない。

rootは旧コンペギャラリー。新しい実物は public/labs/cadence/index.html、単独ローカル版offline.html。視覚3進路/連続操作/青赤/人数/仮コイン/同じゴールの99・100分岐を検証する。敵は集約損失モデル、個別の弾/HP戦闘は未完成。GLB10点は未承認ブロックアウトで、8素材項目をin_progressにした。残りの素材が完成したという意味ではない。

制作環境確認→全素材→3観点監査と本人一括査定→本編統合→全21面/難度の実機QA→許可後公開。素材検収用のカメラ/入力/負荷/音は先行可。文書だけ増やす、本体完成後に全素材を差し替える、素材承認に全編完成を要求する循環を避ける。

方法と調整は裁量、追加支出は0円、検査済み低リスクPRはmainへ統合可。素材承認/公開/権利の本人意思は捏造しない。原作Zombieeeは読み取り専用。作者はnoreplyを使い、台帳/WORK_LOGに証拠を残す。
''')
notice='> **2026-11-02更新**：タイム記録・タイマーHUDなし、1面約2〜3分、敗北回収コイン0。Codexは全素材制作から開始可。全素材の本人承認が必要なのは本格キャンペーン統合前であり、作業開始の前ではない。最新根拠は `docs/decisions/2026-11-02-cadence.md`。\n\n'
for name in ['AGENTS.md','docs/PRODUCT_CONTRACT.md','docs/PROGRESSION_ECONOMY.md','docs/LEVELS_11.md','docs/CODEX_ENVIRONMENT.md','docs/RELEASE_ACCEPTANCE.md','README.md']:
 f=R/name;t=f.read_text();head,_,rest=t.partition('\n');t=head+'\n\n'+notice+rest;t=t.replace('参考タイム','タイム以外の成績').replace('素材査定後の本編引き渡し用','素材制作から開始する指示');f.write_text(t)
write('docs/FEEL_BENCHMARK.md','''# 2〜3分の物量とテンポ
本人目標は1面約120〜180秒。以前の30〜60秒案は採用しない。タイム記録やHUDタイマーはなし。内部時間は進行制御と開発計測だけに使う。
約6秒ごとに選択/交戦のまとまりを置き、1体増員→経路/敵→強化→複合→最終突破→ゴール。長い面はイベント数を増やす。HARDは同じ時間帯で配置や判断を変え、低速化/待機/HPだけの水増しをしない。
競合との速度一致は未実測。検証シーンの集約損失/自動ルートは個別戦闘や人間の反応を保証しない。最終素材で実進行/空走/予告距離/描画負荷を測る。
''')
for name in ['docs/concept-art/10_result.svg','public/concept-art/10_result.svg']:
 f=R/name;f.write_text(re.sub(r'<text\b[^>]*>(?:クリアタイム|00:42)</text>','',f.read_text()))
f=R/'src/main.ts';t=f.read_text();t=t.replace('<h2>画面一覧</h2>','<p><a class="spec-link" href="./labs/cadence/index.html">3レーン・2〜3分の制作検証を開く ↗</a></p><h2>画面一覧</h2>');f.write_text(t)
write('scripts/check-handoff.mjs','''import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {validateAssets} from './lib/asset-contract.mjs';import {validateBudget} from './lib/budget-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),text=p=>readFileSync(resolve(root,p),'utf8'),read=p=>JSON.parse(text(p));
if(process.argv.includes('--production')){const r=spawnSync(process.execPath,[resolve(root,'scripts/check-readiness.mjs'),'assets'],{stdio:'inherit'});process.exit(r.status??1);}
const m=read('data/asset-manifest.json'),s=read('data/project-state.json'),issues=validateBudget(read('data/product-settings.json'),s,text('.github/workflows/ci.yml'));
issues.push(...validateAssets(m,root,read('data/asset-requirements.json').requiredIds));
for(const f of ['package-lock.json','AGENTS.md','CODEX_START_PROMPT.md','docs/HANDOFF.md','docs/decisions/2026-11-02-cadence.md'])if(!existsSync(resolve(root,f)))issues.push('Missing '+f);
console.log(JSON.stringify({status:issues.length?'NOT_READY':'READY_FOR_ASSET_PRODUCTION',scope:'Codex can start producing and validating assets',productionIntegrationApproved:m.approvedForProduction===true,issues,notice:'Not finished artwork, a completed game, or permission to skip producer review.'},null,2));process.exitCode=issues.length?2:0;
''')
lab=R/'public/labs/cadence';html=(lab/'index.html').read_text()
for name in ['core.js','render.js','app.js']:html=html.replace('<script src="'+name+'"></script>','<script>'+(lab/name).read_text()+'</script>')
(lab/'offline.html').write_text(html)
write('docs/WORK_LOG.md','''# 作業再開ログ

## 2026-11-02 — 記録・物量・素材制作開始を更新
本人指定は docs/decisions/2026-11-02-cadence.md。タイム記録なし、1面120〜180秒、敗北回収コイン0。追加支出なし。
Codexの素材制作開始に全素材完成を要求する誤った条件を撤回。check:handoffは素材制作開始、check:assetsは本格統合前の本人査定。
実物：public/labs/cadence/ のWebGL2シーンとCPU投影fallback。左右自由移動、視覚3進路、青赤/人数/仮コイン、同じゴールの99失敗/100成功。敵は集約損失モデル。保存/外部通信/課金なし。
モデル：初期＋3外見、敵、青赤ゲート、同じゴール3状態＝10 GLB。8素材項目をin_progressにし完成/承認にはしていない。静的形状でリグ/最終アニメ/美術は未完成。
数値：21面/難度それぞれに100体以上の経路を検査。実際の人間や戦闘の難度保証ではない。ローカルChromiumはWebGL2不可のためCPU fallbackで3縦画角、連続ドラッグ、99/100と持ち帰り0/40を検査。実機/GPU性能は未検証。GitHub CIの結果は対応PRのログを確認。
次は人物2D/環境/UI/最終モデル/モーション/音を制作して本人へ一括査定。過去監査の全素材未制作は当時の記録であり、現状は素材台帳が正本。
''')
write('docs/validation/2026-11-02-lab.md','''# 検証の範囲
内部時間で120〜180秒の物量を設計するが、タイム記録/タイマーHUDは作らない。集約損失モデルで21シナリオの経路を比較し、勝率や人間の面白さとは呼ばない。
ローカルChromiumではWebGL2を取得できず、CPU投影fallbackで操作/UI/ゴールを検査。GPU shaderやiOS/Android実機は未確認。CPU fallbackを最終画質/性能に採用する指示ではない。
GLB10点は未承認の静的ブロックアウト。生成可能な元ソース、構造テストを同梱し、ローカルtrimeshでも読み込み確認。最終美術/モーション/音/個別戦闘/本編はまだ未完成。検証専用の自動操作や人数注入をクリア実績/保存へ転用しない。
''')
print('Owner cadence applied; 8 blockout asset entries in progress, none approved.')
