# Codex環境と外部能力の事前確認

## この監査で確認した範囲
GitHubの読書き、既存ActionsのNode 22でのテスト/ビルド成功を確認。ユーザーのCodex実行環境で画像/3D/音生成、Blender、ブラウザ操作、実機接続が使えることまでは確認していない。チャットで使えるツールがそのままCodexにもあると推測しない。

## 最初の自律タスク
1. 作業対象とブランチ、git状態を確認。既存未コミット変更を破棄しない。
2. Node/npmと依存関係を確認。rootのpackage-lock.jsonは監査開始時に存在しなかった。ネットワークが利用できる環境でlockfileを生成・レビュー・登録し、以後CIを `npm ci` に揃える。`npm install` の成功だけで再現性確保済みとしない。
3. `npm test`、`npm run build`、ローカルのコンペ閲覧を確認。製品のプレイ可否は別に判定。
4. 画像制作、モデル/リグ/GLB出力、音制作/試聴、ブラウザ自動試験/画面取得の利用可能な手段を調べ、機能別に実際の小さな入出力を試す。
5. 不足する手段は利用可能な代替を探す。未契約の有料サービスや有料素材はQ10まで使用しない。品質不足の代替を完成品と偽らない。

3D制作ソフト、プラグイン、生成サービスを固定しない。どの方法でも、編集元・配布データ・画面/音の査定と権利を満たすこと。認証情報は環境のシークレットへ置き、リポジトリやログに書かない。

## Gitの作者情報
CLIで新しいコミットを作る前に、本人アカウントで確認したnoreplyメールを使用する。推測したメール、実名、他人の作者情報を付けない。接続APIは作者情報を指定できない場合があるため、その制限を隠さない。既存履歴の非noreplyアドレスは確認済みだが、Q15が回答されるまで履歴を書き換えない。

## 参考（確認日2026-11-01）
- OpenAI: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- OpenAI: https://learn.chatgpt.com/docs/environments/cloud-environments
- OpenAI: https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra
これらはAGENTSの解釈と環境準備の参考で、特定モデルや特定制作ツールを必須にするものではない。
