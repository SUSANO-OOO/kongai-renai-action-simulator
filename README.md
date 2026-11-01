# 婚外恋愛アクションシミュレーター
## PAO GAMES（パオゲームズ）

スマホ縦型の3D群集ランナー＋自動射撃。1体から増え、3進路を自由に動き、群れを守り100体以上でゴールする。

**現在は素材先行の制作準備。実行対象は旧コンペ閲覧サイトで、完成ゲームではありません。全素材と本人査定は未完了です。**

## 入口・費用
[AGENTS](AGENTS.md) → [HANDOFF](docs/HANDOFF.md) → [追加支出0円](docs/decisions/2026-11-01-zero-spend.md) → [本人回答](docs/decisions/2026-11-01-owner-answers.md) → [製品契約](docs/PRODUCT_CONTRACT.md)。[CODEX_START_PROMPT](CODEX_START_PROMPT.md)は素材査定後の本編引き渡し用。
**追加支出は0円。既存枠と確認済み無料手段だけ。有料API・購入・超過課金・自動チャージ・新規契約は禁止。** [費用方針](docs/ZERO_SPEND_POLICY.md)。低リスクPRは検査済みなら自律main統合可。

## 確定仕様
- CG寄りの架空成人女性2D10人、人妻感も複数。名前/見た目が主役、国籍/文化説明/台詞/恋愛分岐なし。人物3Dは完成後の任意候補。
- 通常10面順次解放。解放済み面のNORMAL/HARDは初めから選択。通常HARD全制覇でHARD専用パイセン。
- 3視覚進路＋連続左右移動、全ラン1体。青/赤/一時強化。同じ3Dゴールで100以上は白金、1〜99は紫吸引。
- 初期＋追加3＝計4外見。記録/レベル/称号、永久戦闘強化なし。敗北時の回収コイン0、既存財布は保持。
- 初版無料、端末内保存。広告は将来候補。注意はタイトルに小さく読みやすく。

## 実行と検査
Node版は.nvmrc、依存はpackage-lock.json。
```sh
npm ci
npm run dev
npm test
npm run build
npm run check:budget
npm run check:handoff
npm run check:assets
npm run check:release
```
後ろ3つは未制作/未承認ならNOT_READYを返します。通常テスト/ビルドの成功と、全素材完成/本人承認/公開許可は別です。

## 制作基準・旧参考
[共通規格](docs/ASSET_TECHNICAL_CONTRACT.md)、[21面・難度の判断案](data/stage-design-briefs.json)、[素材台帳](data/asset-manifest.json)。基準や案を完成素材と数えません。
SVG構図とWebPはともに旧未承認ラフ。国籍表記・3外見・2進路・顔ポスター勝敗は現行仕様ではありません。390×844は9:16ではなく、900×1600が9:16。最終UIは両方へ自然に対応します。
パイセンは[忠実なr2参照](references/paisen/)を優先。本作利用権と新作完成承認は別。原作Zombieeeは読み取り専用。

## 権利・状態
ソース[MIT](LICENSE)、画像/モデル/音/肖像/フォント/ブランドは[別権利](ASSET_RIGHTS.md)。[回答と残件](docs/DECISIONS_AND_OPEN_QUESTIONS.md)、[WORK_LOG](docs/WORK_LOG.md)、[素材査定](docs/ART_FIRST_APPROVAL.md)、[公開条件](docs/RELEASE_ACCEPTANCE.md)。
