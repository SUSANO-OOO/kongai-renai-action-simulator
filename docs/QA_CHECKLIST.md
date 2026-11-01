# QAの入口

素材段階：`docs/ART_FIRST_APPROVAL.md`。数値とフロー：`docs/LEVEL_FLOW_ACCEPTANCE.md`。3弱点：`docs/THREE_WEAKNESSES_PREVENTION.md`。公開判定：`docs/RELEASE_ACCEPTANCE.md`。

毎回、対象commit/シーン/端末、確認方法、期待値、観測結果、証拠、未確認を分ける。素材の3周監査と機能回帰テストは同じものではない。検査の繰り返し回数だけで合格扱いしない。

通常CIはデータ/承認記録/数量仕様/文書/ビルドの整合性を検査する。ゲーム実行、視覚品質、音の聴感、実機性能、初見の面白さは別の観測が必要。未制作中の `check:assets` と `check:release` のNOT_READYは正しい判定。
