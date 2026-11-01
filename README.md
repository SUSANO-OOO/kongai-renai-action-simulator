# 婚外恋愛アクションシミュレーター
## PAO GAMES（パオゲームズ）

スマホ縦型の3D群集ランナー＋自動射撃。1体から増え、3つの進路を自由に動き、群れを守り100体以上でゴールする。

**現在は素材先行の制作準備段階。rootのアプリはコンペ閲覧サイトで、完成ゲームではありません。** 全素材の本人査定と製品QAはまだです。

## Codexの入口
[AGENTS](AGENTS.md) → [HANDOFF](docs/HANDOFF.md) → [本人回答](docs/decisions/2026-11-01-owner-answers.md) → [製品契約](docs/PRODUCT_CONTRACT.md)。最初に渡す文章は [CODEX_START_PROMPT](CODEX_START_PROMPT.md)。
制作方法は任せ、必要な成果・検証・本人査定の境界を守ります。検査済み低リスクPRの自律main統合は本人から許可されています。

## 2026-11-01 確定した仕様
- 人物：スタイライズCG寄りの成人女性2D立ち絵10人。人妻感のある人物も複数。名前と見た目が主で、国籍/文化紹介/台詞/恋愛分岐なし。人物3Dは完成後の任意候補。
- 通常10面は順次解放。解放済み面はNORMAL/HARDを初めから選べます。通常HARD全制覇でHARD専用パイセン面。
- 3つの視覚進路＋連続左右移動、全ラン1体。青増員/赤減員/一時強化。同じ3Dゴールで100以上は白金、1〜99は紫吸引。
- 初期外見＋追加3＝計4スキン。記録/レベル/称号。性能の永久強化なし。
- 負けたランで拾ったコインは持ち帰れません。既存財布を減らさず、成功時だけ一度確定します。
- 初版無料、端末内保存。広告は将来候補。開始画面の注意は小さく読みやすく。

## 実行と検査
```sh
npm install
npm run dev
npm test
npm run build
npm run check:assets
npm run check:release
```
最後の2コマンドは未制作・未承認ならNOT_READYを返す設計です。通常テストが通ることと、ゲームの完成・公開許可は別です。

## コンペ・参考の扱い
[SVG構図ラフ](docs/concept-art/) と [旧WebP](docs/concept-art/raster-drafts/) は**旧参考・未承認**。国籍表記、旧3外見、2進路に見える構図、人物の顔で成功失敗を代用する画面は現行仕様ではありません。作り直し対象の指示は各画面の検収要件を優先します。
SVG390×844は縦長ですが9:16ではなく、900×1600が9:16です。最終UIは両方に自然に適応します。
[パイセン参照](references/paisen/) は原作の現在のr2出力と内容ハッシュで照合します。本作利用権は本人確認済み、新作美術の完成承認とは別。原作Zombieeeへ変更しません。
[旧試作](prototype/) は参考保存で完成ゲームではありません。

## ライセンス・運用
ソースコードは[MIT](LICENSE)、画像/モデル/音/肖像/フォント/ブランド等は[別権利](ASSET_RIGHTS.md)。作者名義はPAO GAMESです。
[回答と残件](docs/DECISIONS_AND_OPEN_QUESTIONS.md)、[WORK_LOG](docs/WORK_LOG.md)、[素材承認](docs/ART_FIRST_APPROVAL.md)、[製品公開条件](docs/RELEASE_ACCEPTANCE.md)、[個人メール履歴修正](ops/privacy/README.md)。
