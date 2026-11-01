# 監査パッチの検証記録

これはゲームの完成検査ではなく、引き継ぎ・契約・検査基盤の変更の検証。

## GitHub Actions
- PR: https://github.com/SUSANO-OOO/kongai-renai-action-simulator/pull/6
- head: `e669647a020b9ae0157669d91d716f3e011e48b2`
- PR合成commit: `888626b8cf2242d788421322ea5d4f5b6a079258`
- run: https://github.com/SUSANO-OOO/kongai-renai-action-simulator/actions/runs/41294676570
- job ID: `124812904696`
- Node `22.23.4`, npm `10.9.9`。npm install成功。
- `npm test`: 15件成功 / 失敗0 / スキップ0。
- `npm run build`: `tsc --noEmit` とVite `7.3.7` のbuild成功。

テスト範囲：人数0/1/99/100/101/巨大数、青増員/赤減員の整数計算、全滅後の復活禁止、承認前の状態許容、証拠なし承認拒否、正当な承認を許容、承認後の実体変更検出、素材の最低網羅範囲/重複、現行ステージ条件、成人キャラ数、SVGの配布コピー一致、引き継ぎリンクと未決定/公開検査の索引。

## ローカル補助検査
追加した数量/承認/引き継ぎの独立10件を再実行して全成功。`check:assets` と `check:release` はNOT_READY・終了値2。未承認の現状で正しい結果であり、失敗を隠すために条件を緩めていない。
旧試作の14テストも成功。ただし旧試作の机上検証であり、製品の実機・HARD・秘密面・演出/音の完成を証明しない。

## 留意点
rootはコンペ閲覧サイト。完成モデル、実プレイ、実機、初見の面白さ、Codex環境の生成/モデリング手段は今回のCIで確認していない。
lockfile不在と、Actionsのcheckout/setup-node v4のNode 20非推奨警告は #7 の環境整備へ引き継ぐ。現在の実行は成功しているが、将来も無条件に同じ依存が入ることを保証しない。
本文の証拠は上記headを対象とする。この記録自体の追記や後続差分のCI結果はPRの実行記録を参照。
