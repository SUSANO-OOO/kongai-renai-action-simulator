# 実行環境の確認

> **2026-11-02更新**：タイム記録・タイマーHUDなし、1面約2〜3分、敗北回収コイン0。Codexは全素材制作から開始可。全素材の本人承認が必要なのは本格キャンペーン統合前であり、作業開始の前ではない。最新根拠は `docs/decisions/2026-11-02-cadence.md`。


仕様書は制作ツールや実機が利用可能な証拠ではない。能力は小さな実際の入出力で確認する。追加支出0円、既存枠と確認済み無料手段だけ。有料API/購入/超過/自動チャージ/新規契約は禁止。料金不明なら使わない。

1. 対象repo・branch・未コミット変更を確認。原作Zombieeeへ書かない。
2. .nvmrcのNode 22とpackage-lock.jsonを使いnpm ci、npm test、npm run build。ネットワーク/依存不足時の未実施とGitHub CIの結果を分ける。
3. 2D/3D/リグ/GLB/音/試聴/ブラウザ/キャプチャの手段を実検証。人物鑑賞3Dは完成後の任意候補で初期要件にしない。制作規格は `docs/ASSET_TECHNICAL_CONTRACT.md`。
4. Android Chrome/iOS Safariの実機・OS/ブラウザ版・場面を記録。エミュレーションを実機と呼ばない。

## 権限
検査済み低リスクPRは自律main統合可。全素材承認と初版公開の本人意思は別。`npm run check:handoff` の未準備を無視して本編へ移らない。費用Q10は回答済みで再質問しない。

## コミット情報
本人許可の通常refsメール修正は実施済み。記録は `docs/audits/2026-11-01-privacy-verification.json`。今後CLI作者/コミッターは `301576978+SUSANO-OOO@users.noreply.github.com` をrepoローカルで使用。他プロジェクトの設定を変えない。接続APIで作者を指定できない場合、個人メールが再付与され得るため最終commitを確認する。古いPR/サーバーキャッシュの完全消去とは区別する。
