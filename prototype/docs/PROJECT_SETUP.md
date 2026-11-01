# 新規GitHubリポジトリセットアップ

## 所属と名前

- owner: `SUSANO-OOO`
- repository: `kongai-renai-action-simulator`
- display title: **婚外恋愛アクションシミュレーター**
- description: `Mobile portrait 3D crowd-runner shooter in a surreal biological sci-fi world. 10 handcrafted adult-character stages, Normal/Hard, and one secret Paisen stage.`
- visibility: **Public**（ユーザーが公開を許可。初期ソースを公開前に必ず再点検）
- GitHub Pages: 公開デモ用として将来的に有効化（アプリ完成・動作確認後）

## 新規作成（GitHub CLIが使える場合・推奨）

Codexを動かすPCで本フォルダを展開し、GitHub CLI `gh` で認証済みなら次の手順で**新しい**GitHubリポジトリを作成できます。既存リポジトリには触れません。

```sh
cd kongai-renai-action-simulator
git init -b main
git add .
# ここで git config user.name / git config user.email を確認し、実名や個人メールの公開を防ぐ。
git commit -m "chore: initialize action simulator"
gh repo create SUSANO-OOO/kongai-renai-action-simulator --public --source=. --remote=origin --push
```

GitHub CLIはローカルGitリポジトリからの `--source=. --push` 新規作成をサポートしています。事前に `gh auth status` で接続を確認してください。GitHub上の同名リポジトリが既にある場合は作成に失敗するので、別の場所へPushして回避しないでください。

## 新規作成（GitHubのWeb画面を使う場合）

1. `https://github.com/new` を開き、Owner: `SUSANO-OOO`。
2. 名前: `kongai-renai-action-simulator`。Public を指定。
3. 初期README等の自動生成は **OFF** （このパッケージにすでに存在する）。Create repository を押す。
4. ローカルでこのフォルダを開き、以下を実行（GitHub CLIがある場合は任意で簡略化可能）。

```sh
git init
git add .
git commit -m "chore: initialize kongai-renai-action-simulator"
git branch -M main
git remote add origin https://github.com/SUSANO-OOO/kongai-renai-action-simulator.git
git push -u origin main
```

※まだリポジトリを作っていない段階で remote にpushしても作成されない。Gitのコミットに使う氏名・メールアドレスは `git config user.name` `git config user.email` を確認してから作業する。

## Codex開始手順

1. 作成した新規リポジトリ `SUSANO-OOO/kongai-renai-action-simulator` をCodexに接続。
2. Codexの最初の指示は `CODEX_START_PROMPT.md` を全文渡す。
3. `main`ではなく作業ブランチを作成し、まず `AGENTS.md` に従って**全素材の制作・検査と制作者査定**を先行する。
4. 全素材の制作・3回監査・本人査定で承認された後、Stage 1〜11のゲーム本体・バランス・端末QAを実装する。
5. 他の既存プロジェクトへのコミット・PR・編集は禁止。

## セキュリティ

`.env`, APIキー、個人情報、コミット作者のメールを誤って公開しない。現実の相手・パートナーの個人情報はストーリーやデータに使用しない。
