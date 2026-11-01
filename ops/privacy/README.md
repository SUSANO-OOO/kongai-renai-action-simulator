# 本人許可済みの個人メール履歴修正

Q15で本人が許可した範囲は、この新規リポジトリのコミット作者/コミッターに残る本人メールの除去。原作Zombieee、コード、画像、他人の作者情報を変更しない。

`Owner-authorized email privacy` workflowはmainへauthorization.jsonが入る時に実行。テスト/ビルド後、本人名SUSANO-OOOの非noreplyメールを検出し、本人IDに基づくnoreplyへ置き換える。各commitのtreeを比較して内容不変を確認し、親commitを再接続する。無効になる署名は維持しない。注釈付き/署名付きtagがあれば自動処理を止める。

全公開ブランチ/軽量tagを先に読み、Git bundleを作って公開証明書で暗号化する。平文bundleはアップロードせず削除。次にremoteの変化を再確認し、全変更をatomic＋個別force-with-leaseでpushする。競合作業があれば破棄せず停止する。

## 実行結果の読み方
権限の取得と処理完了は別。最新workflowの `verification.json` が正本で、`published_refs_rewritten`、`treeContentsUnchanged=true`、`remoteRefsVerified=true` を確認する。data側の許可情報や作成時点のpendingだけから成功を推測しない。レポートと暗号化bundleは `owner-email-privacy-recovery` artifactへ保存、保持30日。

## 復旧キー
公開リポジトリには暗号化に使う証明書しか置かない。復号用private keyは本会話から本人へ別配布する。鍵と暗号化バックアップは非公開の場所へ保管し、平文履歴や鍵をリポジトリ/Issue/公開ログに貼らない。

```sh
openssl cms -decrypt -binary -inform DER -in recovery.bundle.p7m -inkey recovery-private-key.pem -out recovery.bundle
git bundle verify recovery.bundle
```
復旧は検証用の別ローカルcloneで行い、旧履歴を無条件に再pushしない。

## 限界と再発防止
この処理はmain等の通常refsを書き換える。GitHubの古いPR refs、キャッシュ、fork、他人のcloneまで削除するものではない。必要ならGitHubのサポート対象/手続きを確認する。旧SHAを参照する記録は旧版の監査証拠で、現行mainの識別子として使わない。
今後CodexのCLI commitは `301576978+SUSANO-OOO@users.noreply.github.com` を使用。接続APIのcommitは作者メールを指定できない場合があるため、履歴修正後に同じAPIで新commitを作ると再付与する恐れがある。

参考：GitHub公式 https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
