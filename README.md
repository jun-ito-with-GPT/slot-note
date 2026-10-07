# SLOT NOTE

iPhoneから退店後に素早く記録できる、個人用パチスロ収支管理Webアプリです。Next.js App Router / React / TypeScript / Supabaseで構築し、Vercelにデプロイできます。

## MVPの機能

- 日付・店舗名・機種名・投資額・回収額・任意メモの登録、編集、削除
- 収支 = 回収額 − 投資額を自動計算。選択した月の投資・回収・収支合計と実戦一覧
- 今日の日付を初期設定。保存後に店舗・機種を維持し、過去の値を入力候補として表示
- 数字キーボード用 `inputMode="numeric"`、投資加算ボタン、回収なしボタン
- メールのマジックリンクで認証。Supabase RLSで本人の記録だけを操作可能
- 接続設定なしの場合はブラウザのlocalStorageに保存するデモモード

## 1. ローカル起動

Node.js 22以上とnpmをインストールしてください。

```sh
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShellではコピーに `Copy-Item .env.example .env.local` を使います。実行ポリシーでnpm.ps1が拒否される場合は `npm.cmd ci` / `npm.cmd run dev` を使えます。

ブラウザで http://localhost:3000 を開きます。環境変数を空のままにするとデモモードで試せます。デモデータはブラウザごとに保存され、Supabaseへの自動移行はありません。ブラウザのデータ削除で消えるため、実際の収支にはSupabaseを設定してください。

## 2. Supabaseの設定

1. Supabaseでプロジェクトを新規作成します。
2. SQL Editorで `supabase/migrations/001_entries.sql` 全体を実行します。このSQLは初回用です。既存テーブルがある状態で繰り返し実行しないでください。
3. プロジェクトのConnectダイアログまたはAPI設定からProject URLとPublishable keyを取得します。
4. `.env.local` に以下を設定します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

旧形式のanon keyも同じ変数に設定可能です。**secret key / service_role keyは使わないでください。** `NEXT_PUBLIC_` の値はブラウザに公開されます。公開キーとRLSの組み合わせでデータを保護します。

5. Authentication → ProvidersでEmailを有効にします。標準のMagic Linkメールテンプレートを使用してください。このアプリはブラウザ側のSupabase SDKでリンクのセッションを取得する方式です。
6. Authentication → URL ConfigurationのSite URLを `http://localhost:3000` に、Redirect URLsに `http://localhost:3000` を追加します。
7. 開発サーバーを再起動します。自分のメールアドレスを入力してログインリンクを送り、同じブラウザでリンクを開きます。

個人専用にする場合は、初回ログインで自分のユーザーを作成した後、Email設定の新規ユーザー登録を無効にしてください。既存ユーザーには引き続きログインリンクを送信できます。Supabase標準のメール送信は制限があるため、運用時はAuthenticationのSMTP設定で自分のメール送信サービスを設定してください。

### データとアクセス制御

`entries` は `user_id` を持ち、SELECT / INSERT / UPDATE / DELETEすべてで `auth.uid() = user_id` を要求します。未認証ユーザーには操作権限を付与しません。金額は0〜100,000,000円の整数です。入力検証に加えDBにも金額・文字数の制約があります。収支は重複保存せず、投資と回収から算出します。同じ日に複数の実戦を登録できます。

## 3. Vercelへデプロイ

1. このフォルダーをGitリポジトリとしてGitHub等にプッシュします（未作成なら `git init` → `git add .` → `git commit` を実行）。
2. VercelでAdd New Projectを選び、リポジトリをImportします。
3. Framework PresetはNext.js、Root Directoryはリポジトリのルートにします。ビルドは `npm run build`、Output Directoryは既定のままで構いません。
4. Environment Variablesに上記2つの `NEXT_PUBLIC_` 変数を設定してDeployします。未設定ならデモモードとしてビルドされます。
5. SupabaseのSite URLを公開URL（例：`https://your-project.vercel.app`）に更新し、Redirect URLsにもそのURLを追加します。ローカル用URLは必要なら残します。Preview環境で認証を試す場合は、その正確なURLも追加します。
6. 公開URLをiPhone Safariで開き、ログインして動作を確認します。共有メニューの「ホーム画面に追加」から起動しやすくできます。

公開環境変数はビルド時に埋め込まれるため、変更後は再デプロイしてください。今回はデプロイ可能なコードを作成しており、実際のVercel公開やSupabaseプロジェクト作成は実行していません。

## 検証

```sh
npm test
npm run typecheck
npm run build
npm start
```

テストは収支計算、月境界、並び順、入力制約、ローカル日付を確認します。実接続の確認には以下の手動検証を行ってください。

1. iPhoneでログインし、今日・店舗・機種・投資10000・回収18000を保存。収支+8000円と履歴への反映を確認。
2. 再読み込み後にも記録が残ること、編集で回収0にすると−10000円になることを確認。
3. 月を切り替えて別月の記録が合計に入らないこと、削除キャンセルと確定を確認。
4. 金額入力時の数字キーボード、回収なし、過去候補、メモの改行を確認。
5. 別ユーザーでログインし、最初のユーザーの記録が見えないことを確認。未認証のanonキーでのDB読み書きも拒否されることを確認。
6. 通信を切断して保存し、失敗メッセージと入力内容の保持を確認。保存結果が不明な場合は、再読み込みで記録を確認してから再操作してください。

## 構成と今後の拡張

```text
src/app/                       ページ・共通レイアウト・スマホ向けCSS
src/components/bankroll.tsx     入力・認証・月間サマリー・履歴
src/lib/records.ts             データ型・純粋な収支集計・検証
src/lib/repository.ts          Supabase / デモのデータアクセス
supabase/migrations/           DBスキーマ・RLS
tests/                        集計・検証テスト
```

`Repository` のインターフェースを通して保存方式を分離しています。集計関数はUIに依存せず、店舗別・機種別・年間集計やグラフでも再利用可能です。MVPでは全記録を取得してクライアントで集計するため、大量データの運用ではページングとDBでの集計を追加してください。オフライン同期、CSV出力、グラフは未実装です。デモは同一ブラウザ内の試用向けです。

参考：[SupabaseのNext.jsガイド](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)、[Supabase Auth](https://supabase.com/docs/guides/auth)、[Next.js環境変数](https://nextjs.org/docs/pages/guides/environment-variables)。
