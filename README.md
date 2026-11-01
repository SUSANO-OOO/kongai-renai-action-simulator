# 婚外恋愛アクションシミュレーター

**スマホブラウザ向け・縦型3D群集ランナー／オートシューティング／成人向け風刺コメディ**

> **現在の正確な状態：アート先行の企画・査定段階。** このリポジトリは12枚の9:16コンペ画像を閲覧できるレビューワークベンチと仕様書・素材台帳を収録しています。完成ゲーム、全11面の完成3D、最終女性キャラクター素材、音響はまだ完成していません。

## 縦型コンペをプレビュー

```sh
npm install
npm run dev
```

ブラウザの画面で、タイトル→ステージ選択→開始→ゲート→戦闘→ボス→ゴール→SUCCESS/FAILED→リザルト→スキン→SECRETの順に、各画面のコンペ画像を確認できます。画像は `docs/concept-art/` に編集可能なSVGとして保管し、Viteで公開用にコピーする `public/concept-art/` にも同じ内容を置いています。

## 変更不可のルール

- **3レーンの見た目＋左右自由X移動**（2レーンではない）
- 初期人数は全ステージ **必ず1体**
- 青ゲートで増員（×、+）、赤ゲートで減員（−、÷）
- 0体で即敗北、ゴールに100体以上生存で成功
- 同じ3Dゴールで100体以上なら白金色の発光、99体以下なら紫の吸引渦
- 通常10ステージ（成人女性10人）＋HARD10面クリアで解放されるパイセン面
- コイン/3スキン/XP/15ランクの称号。恒久的戦闘性能ブーストなし
- **完成モデル・UI・VFX・BGM/SEを先に全制作し、3周検査→本人査定→承認後に本格実装**

詳細：[`AGENTS.md`](AGENTS.md) ／ [`CODEX_START_PROMPT.md`](CODEX_START_PROMPT.md) ／ [`docs/THREE_LANE_CONTROL.md`](docs/THREE_LANE_CONTROL.md) ／ [`docs/GOAL_AND_GATE_DIRECTOR_SPEC.md`](docs/GOAL_AND_GATE_DIRECTOR_SPEC.md) ／ [`docs/ART_FIRST_APPROVAL.md`](docs/ART_FIRST_APPROVAL.md)

## コンペ画面一覧

| No. | 画面 | ファイル |
|---:|---|---|
| 1 | タイトル | [01_title.svg](docs/concept-art/01_title.svg) |
| 2 | ステージ選択 | [02_stage_select.svg](docs/concept-art/02_stage_select.svg) |
| 3 | 1体スタート | [03_one_start.svg](docs/concept-art/03_one_start.svg) |
| 4 | **青赤の3レーン分岐** | [04_blue_red_gates.svg](docs/concept-art/04_blue_red_gates.svg) |
| 5 | 敵との戦闘 | [05_enemy_wave.svg](docs/concept-art/05_enemy_wave.svg) |
| 6 | ボス戦 | [06_boss.svg](docs/concept-art/06_boss.svg) |
| 7 | ゴール接近 | [07_goal.svg](docs/concept-art/07_goal.svg) |
| 8 | 白金色SUCCESS | [08_clear.svg](docs/concept-art/08_clear.svg) |
| 9 | 紫色FAILED | [09_failed.svg](docs/concept-art/09_failed.svg) |
| 10 | リザルト | [10_result.svg](docs/concept-art/10_result.svg) |
| 11 | スキン | [11_skins.svg](docs/concept-art/11_skins.svg) |
| 12 | 秘密パイセン | [12_secret.svg](docs/concept-art/12_secret.svg) |

## 参照素材

[`references/paisen/`](references/paisen/) は既存の本人制作ゲーム `SUSANO-OOO/Zombieee` から、読み取りのみで取り込んだ参照画像3点です。**原作側のリポジトリは変更していません。** パイセンの新作内での使用は査定後に決定します。

## 検査

```sh
npm test
npm run build
```

`npm test` はゲーム完成テストではなく、仕様/データ/コンペ画像の整合性検査です。スマホ実機のプレイ確認と3Dモデル査定は別途必須です。
