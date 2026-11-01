# 婚外恋愛アクションシミュレーター

スマホ縦型の3D群集ランナー＋自動射撃。1体から増やし、3つの進路を自由に選び、群れを守って100体以上でゴールする。

**現在は全素材の先行制作・査定準備段階。** ルートの `src/` はコンペ閲覧サイトであり完成ゲームではない。モデル、音、完成UI、全20通常ラン＋秘密面の製品QAは未完了。既存のテスト成功と製品完成を混同しない。

## Codexへの入口
[開発ルール](AGENTS.md) → [引き継ぎ](docs/HANDOFF.md) → [製品の本質と確定条件](docs/PRODUCT_CONTRACT.md)。
そのまま渡す文章は [CODEX_START_PROMPT.md](CODEX_START_PROMPT.md)。本人に必要な判断は [Q01〜Q15](docs/DECISIONS_AND_OPEN_QUESTIONS.md)。

作り方は固定しない。完成素材の一括査定という本人指定を守りながら、素材検収用シーン・入力/描画/音の検証は先行してよい。本格製品の統合は素材承認後。指示を増やすことではなく、判断と証拠を残して前へ進むことを優先する。

## 起動・検査
```sh
npm install
npm run dev
npm test
npm run build
npm run check:assets
npm run check:release
```
初回の環境準備は [CODEX_ENVIRONMENT](docs/CODEX_ENVIRONMENT.md)。lockfileは実環境で生成・登録後に `npm ci` へ切り替える。最後の2コマンドは未制作・未承認ならNOT_READYになる。それをCI不良と勘違いして条件を削らない。

## 正式な核
- スマホ縦画面、3つの視覚的進路＋連続X移動、自動前進と自動射撃。
- 全ラン1体スタート。青増員、赤減員、道中強化。0体で終わり。
- ゴール衝突時100体以上なら白金発光、1〜99体なら同じゴールが紫の吸引へ変化。
- 成人女性10人の通常10面＋NORMAL/HARD、通常HARD全制覇でパイセンの隠し面。
- コイン・外見スキン・ユーザーレベル・選択称号。永続戦闘強化なし。
- 全素材先行、3周の観点別監査、本人査定。本編の面白さは統合後の実プレイで別検査。

## 素材と参考資料
[縦型SVG構図案12枚](docs/concept-art/) と [旧WebPラフ11枚](docs/concept-art/raster-drafts/) は未承認。SVGの390×844は縦長だが9:16ではない。900×1600が9:16。旧ラフの2レーンに見える画面・誤字・顔の成功失敗演出は実装基準にしない。
[パイセン参照](references/paisen/) は別作品からの読み取りコピー。元の `Zombieee` は変更禁止。公開利用権の確認が必要。
[旧試作](prototype/) は参考保存であり、本体の実装基盤として自動採用するものではない。

## 監査・運用
[今回の監査](docs/audits/2026-11-01-handoff-audit.md) ／ [再開ログ](docs/WORK_LOG.md) ／ [素材査定](docs/ART_FIRST_APPROVAL.md) ／ [3弱点](docs/THREE_WEAKNESSES_PREVENTION.md) ／ [公開の完成条件](docs/RELEASE_ACCEPTANCE.md)。
画像・モデルの作成、テスト、本人承認、公開は別の状態として記録する。Publicリポジトリにしたことは、完成・公開サイト有効化・素材利用許諾・OSSライセンス付与の証拠ではない。
