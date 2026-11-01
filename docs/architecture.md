# アーキテクチャ（C4モデル）

本書はリポジトリのコード・設定ファイルを調査し、[C4モデル](https://c4model.com/) に基づいて awsprint の構成を図示したものです。
設計方針・技術選定の経緯は [docs/architecture/overview.md](architecture/overview.md) を参照してください。

> 記述の根拠: `package.json` / `vite.config.ts` / `.github/workflows/deploy.yml` / `src/main.tsx` / `src/app/router.tsx` / `src/lib/repository/*` / `src/features/*` / `scripts/validate-data.ts`

## 概要

| 項目 | 内容 |
|------|------|
| 目的 | AWS Certified Solutions Architect – Associate（SAA）合格のための個人学習アプリ。解説文と構成図の**双方向連動ハイライト**で「文章要件 → 構成図」の変換力を鍛える |
| 主な利用者 | 学習者（単一ユーザー想定）。問題データの作成・検証を行う作成者（同一人物を想定）。認証機能は無い |
| 構成の特徴 | **バックエンドを持たない完全静的SPA**。採点・集計・模試タイマー・ブックマークなどの処理はすべてブラウザ内で完結し、学習履歴は端末内（IndexedDB / localStorage）に保存する。外部API・サーバーDB・認証基盤・外部SaaSへの接続はコード上に存在しない |

### 技術スタック

| レイヤー | 技術 | 根拠 |
|---------|------|------|
| 言語 | TypeScript 5 | `package.json`, `tsconfig*.json` |
| ビルド | Vite 6（`@vitejs/plugin-react`） | `vite.config.ts` |
| UIフレームワーク | React 19 | `package.json` |
| ルーティング | React Router 7（`createHashRouter`） | `src/app/router.tsx` |
| 図レンダリング | React Flow（`@xyflow/react` 12） | `src/features/diagram/DiagramView.tsx` |
| グラフ | Recharts 2 | `src/app/ProgressPage.tsx` ほか |
| UI部品 / スタイル | Radix UI（dialog / radio-group / tabs）, Tailwind CSS 3, PostCSS | `package.json`, `tailwind.config.js` |
| 状態管理 | Zustand 5 | `useQuizSession.ts`, `useHighlight.ts`, `useSettings.ts` |
| スキーマ検証 | zod 3 | `src/lib/schema/question.ts` |
| 永続化 | IndexedDB（`idb` ラッパ）, localStorage | `src/lib/repository/db.ts`, `src/lib/settings.ts`, `src/features/quiz/recent.ts` |
| テスト / Lint | Vitest 3, ESLint 9（typescript-eslint） | `vite.config.ts`, `eslint.config.js` |
| データ検証スクリプト | tsx | `scripts/validate-data.ts` |
| CI/CD | GitHub Actions（Node 20） | `.github/workflows/deploy.yml` |
| ホスティング | GitHub Pages | `.github/workflows/deploy.yml`, `vite.config.ts`（`base` 設定） |
| IaC / Docker | なし（リポジトリ内に該当ファイル無し） | — |

---

## Level 1: System Context 図

```mermaid
C4Context
  title System Context: awsprint

  Person(learner, "学習者", "SAA受験者。ブラウザで問題演習・模試・復習を行う")
  Person(author, "問題作成者", "問題JSON（DiagramSpec付き）を作成し、リポジトリへコミットする")

  System(awsprint, "awsprint", "AWS SAA学習SPA。解説文と構成図の連動ハイライト、採点、進捗分析を提供")

  System_Ext(pages, "GitHub Pages", "静的ファイル（SPA・問題JSON）のホスティング")
  System_Ext(github, "GitHub（リポジトリ / Actions）", "ソースと問題データの管理、CIによる検証・ビルド・デプロイ")

  Rel(learner, awsprint, "演習・結果確認・バックアップ", "ブラウザ")
  Rel(author, github, "問題JSON・コードをpush", "git")
  Rel(author, awsprint, "管理画面で問題JSONを検証・プレビュー", "ブラウザ")
  Rel(github, pages, "ビルド成果物 dist/ をデプロイ", "actions/deploy-pages")
  Rel(awsprint, pages, "配信を受ける", "HTTPS")

  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

| 名前 | 種別 | 技術 | 責務 |
|------|------|------|------|
| 学習者 | Person | ブラウザ | 1問1答・ランダム・模試の演習、結果解説と図解の閲覧、進捗確認、ブックマーク、学習履歴のバックアップ |
| 問題作成者 | Person | git / ブラウザ | `public/data/*.json` に問題を追加し push。管理画面（SCR-07）でJSONを検証・図プレビュー |
| awsprint | Software System（本システム） | Vite + React SPA | 出題・採点・図解連動・進捗集計をすべてクライアント側で実行 |
| GitHub Pages | External System | 静的ホスティング | `dist/`（HTML/JS/CSS と `data/*.json`）をHTTPSで配信 |
| GitHub（リポジトリ / Actions） | External System | GitHub Actions | typecheck・問題データzod検証・テスト・ビルドを実行し Pages へデプロイ |

> 外部API・認証基盤・外部SaaS・アクセス解析などへの通信はコード上に見当たらない（`fetch` は自サイトの `data/*.json` 取得のみ）。

---

## Level 2: Container 図

```mermaid
C4Container
  title Container: awsprint

  Person(learner, "学習者", "SAA受験者")
  Person(author, "問題作成者", "問題データを管理")

  System_Boundary(browser, "利用者のブラウザ（端末内）") {
    Container(spa, "SPA", "React 19 / TypeScript / Vite", "画面・出題・採点・図解連動ハイライト・進捗集計・バックアップ")
    ContainerDb(idb, "IndexedDB 'awsprint'", "IndexedDB（idb）", "attempts / examSessions / bookmarks")
    ContainerDb(ls, "localStorage", "Web Storage", "設定 awsprint.settings、直近出題 awsprint.recentRandom")
  }

  System_Boundary(gh, "GitHub") {
    Container(static, "静的サイト", "GitHub Pages", "index.html・JSバンドル・data/index.json・data/questions.*.json を配信")
    Container(ci, "Build & Deploy ワークフロー", "GitHub Actions / Node 20", "npm ci → typecheck → validate:data → test → build → deploy")
    ContainerDb(repo, "リポジトリ", "Git", "ソースコードと問題データ public/data/*.json")
  }

  Rel(learner, spa, "操作", "HTTPS / ブラウザ")
  Rel(author, repo, "push", "git")
  Rel(author, spa, "問題JSON検証・プレビュー（管理画面）")
  Rel(spa, static, "SPAと問題JSONを取得", "HTTPS fetch")
  Rel(spa, idb, "解答履歴・模試・ブックマークを読み書き", "IndexedDB API")
  Rel(spa, ls, "設定・直近出題を読み書き", "Web Storage API")
  Rel(repo, ci, "main への push で起動")
  Rel(ci, static, "dist/ をデプロイ", "deploy-pages")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| 名前 | 種別 | 技術 | 責務 |
|------|------|------|------|
| SPA | Container（Webアプリ） | React 19, React Router（Hash）, Zustand, React Flow, Recharts, zod | 全業務ロジック（出題選択・採点・模試タイマー・図解連動・集計・JSON検証・バックアップ）。エントリポイントは `index.html` → `src/main.tsx` |
| IndexedDB `awsprint` | Container（端末内DB） | IndexedDB v1（`idb`） | `attempts`（自動採番, index: questionId/domain/answeredAt）、`examSessions`（key: id）、`bookmarks`（key: questionId） |
| localStorage | Container（端末内KVS） | Web Storage | `awsprint.settings`（図の表示タイミング・合格ライン）、`awsprint.recentRandom`（直近出題の除外用） |
| 静的サイト | Container（ホスティング） | GitHub Pages | Vite ビルド成果物と `public/data/` を配信。サブパス配信のため `base` は `/<repo>/`、SPAのパスフォールバックが無いため HashRouter を使用 |
| Build & Deploy ワークフロー | Container（CI/CD） | GitHub Actions | `main` への push / 手動実行で検証・ビルド・Pages デプロイ |
| リポジトリ | Container（ソース/データ） | Git | コードと問題データ（コンテンツもGit管理）。`data/questions.sample.json` はスキーマ確定用の原本 |

> 進行中の演習セッション（`useQuizSession`）は Zustand のメモリ上にのみ保持され、永続化されていない（コード上で persist 未使用）。

---

## Level 3: Component 図（SPA）

```mermaid
C4Component
  title Component: SPA

  Person(learner, "学習者")

  Container_Boundary(spa, "SPA") {
    Component(router, "Router / Layout", "react-router createHashRouter", "画面ルーティング（SCR-01〜07）")
    Component(pages, "Pages", "src/app/*Page.tsx", "Dashboard / PracticeSetup / Quiz / Result / Bookmarks / Progress / Admin")
    Component(quiz, "Quiz 機能", "src/features/quiz", "出題選択・セッション開始・模試タイマー・結果表示・ブックマークボタン")
    Component(session, "useQuizSession", "Zustand store", "モード・出題・解答・経過時間・フラグ・終了状態")
    Component(diagram, "Diagram 機能", "React Flow / src/features/diagram", "DiagramSpec→Flow変換、ServiceNode・ContainerNode、拡大表示")
    Component(highlight, "useHighlight", "Zustand store", "activeId を共有し図と解説を双方向ハイライト")
    Component(expl, "Explanation 機能", "src/features/explanation", "解説文の ref 記法をパースしてRefSpan化")
    Component(scoring, "Scoring", "src/lib/scoring.ts", "正誤判定・模試採点・合否")
    Component(schema, "Schema / Validate", "zod / src/lib/schema", "型定義・問題JSON検証")
    Component(repoif, "QuizRepository", "interface / LocalRepository", "問題取得（fetch+キャッシュ）と履歴保存の抽象")
    Component(settings, "Settings", "useSettings + lib/settings", "設定の読み書き")
    Component(admin, "Admin 機能", "src/features/admin/backup.ts", "履歴バックアップのエクスポート/インポート")
  }

  ContainerDb(idb, "IndexedDB", "idb")
  ContainerDb(ls, "localStorage", "Web Storage")
  Container_Ext(static, "静的サイト", "GitHub Pages", "data/*.json")

  Rel(learner, router, "操作")
  Rel(router, pages, "描画")
  Rel(pages, quiz, "利用")
  Rel(quiz, session, "状態更新")
  Rel(quiz, diagram, "図を表示")
  Rel(quiz, expl, "解説を表示")
  Rel(diagram, highlight, "購読/更新")
  Rel(expl, highlight, "購読/更新")
  Rel(pages, scoring, "採点")
  Rel(pages, repoif, "取得/保存")
  Rel(repoif, schema, "zodでparse")
  Rel(repoif, static, "fetch", "HTTPS")
  Rel(repoif, idb, "読み書き")
  Rel(settings, ls, "読み書き")
  Rel(admin, idb, "全件読み書き")
  Rel(admin, ls, "設定")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

| 名前 | 種別 | 技術 | 責務 |
|------|------|------|------|
| Router / Layout | Component | `createHashRouter`（`src/app/router.tsx`, `Layout.tsx`） | `/`, `/practice/setup`, `/practice/quiz`, `/practice/result`, `/bookmarks`, `/progress`, `/admin` |
| Pages | Component | React（`src/app/`） | 各画面（SCR-01〜07）。データ取得は `useAsync` 経由で `repository` を呼ぶ |
| Quiz 機能 | Component | `src/features/quiz/` | `selection.ts`（mini/random/exam の出題選択・分野比率）、`startSession.ts`、`ExamTimer.tsx`（130分）、`QuestionResult.tsx`、`BookmarkButton.tsx`、`recent.ts` |
| useQuizSession | Component（状態） | Zustand | 演習セッション状態（メモリのみ） |
| Diagram 機能 ★ | Component | React Flow（`src/features/diagram/`） | `toFlow.ts`（DiagramSpec→nodes/edges, 入れ子コンテナ）、`nodes/ServiceNode`・`ContainerNode`、`iconMap.ts`、`DiagramView.tsx`（拡大モーダル） |
| useHighlight ★ | Component（状態） | Zustand | `activeId` を図ノードと解説RefSpanで共有し相互強調（FR-07） |
| Explanation 機能 | Component | `src/features/explanation/` | `parseRefs.ts` で解説中の ref をセグメント化、`ExplanationText.tsx` で描画・ホバー連動 |
| Scoring | Component | `src/lib/scoring.ts` | 選択の完全性判定、正誤判定、模試スコア算出 |
| Schema / Validate | Component | zod（`src/lib/schema/`） | `types.ts`（型・分野定数）、`question.ts`（zodスキーマ）、`validate.ts`（エラー/警告付き検証。CIスクリプトと共用） |
| QuizRepository | Component | `src/lib/repository/` | `types.ts`（interface＝将来の差替口）、`local.ts`（`LocalRepository`: `data/index.json`→各問題ファイルを fetch・キャッシュ、履歴は IndexedDB）、`db.ts`（スキーマ定義・open） |
| Settings | Component | Zustand + localStorage | 図の表示タイミング（問題時/解説時）、合格ラインの保持 |
| Admin 機能 | Component | `src/features/admin/backup.ts`, `src/lib/download.ts` | 学習履歴の JSON エクスポート、置換/マージでのインポート。問題JSONの検証・プレビュー・検証済みJSONのダウンロードは `AdminPage.tsx` |

---

## 主要なデータフロー

### 1. 起動〜問題データの読み込み

```mermaid
sequenceDiagram
  autonumber
  actor U as 学習者
  participant B as ブラウザ
  participant P as GitHub Pages
  participant R as LocalRepository
  U->>B: サイトにアクセス
  B->>P: GET index.html / JSバンドル
  P-->>B: 静的ファイル
  Note over B: main.tsx → HashRouter → DashboardPage
  B->>R: countQuestions() / listQuestions()
  R->>P: GET data/index.json
  P-->>R: { files: [...] }
  R->>P: GET data/questions.*.json（並列）
  P-->>R: 問題配列
  R->>R: zod parse → メモリキャッシュ（byId Map）
  R-->>B: Question[]
```

### 2. 演習 → 採点 → 図解連動ハイライト

```mermaid
sequenceDiagram
  autonumber
  actor U as 学習者
  participant S as PracticeSetupPage
  participant Q as useQuizSession
  participant QP as QuizPage
  participant RP as ResultPage
  participant R as LocalRepository
  participant DB as IndexedDB
  participant H as useHighlight
  U->>S: モード（mini/random/exam）・分野を選択
  S->>R: listQuestions(filter)
  S->>Q: start(mode, questions, 130分 if exam)
  U->>QP: 解答（ExamTimer で残り時間管理）
  QP->>Q: setAnswer / next / finish
  QP->>RP: /practice/result へ遷移
  RP->>RP: scoring で正誤判定・模試採点
  RP->>R: saveAttempt / saveExamSession
  R->>DB: add / put
  RP->>Q: markSaved（二重保存防止）
  U->>RP: 解説の語句 or 図ノードにホバー
  RP->>H: setActive(refId = node.id)
  H-->>RP: 解説RefSpanと図ノードを同時に強調
```

### 3. 問題データの追加〜デプロイ

```mermaid
sequenceDiagram
  autonumber
  actor A as 問題作成者
  participant AP as 管理画面(SCR-07)
  participant G as GitHubリポジトリ
  participant CI as GitHub Actions
  participant P as GitHub Pages
  A->>AP: 問題JSONを貼り付けて検証・図プレビュー（任意）
  A->>G: public/data/*.json と index.json を更新して main へ push
  G->>CI: Build & Deploy 起動
  CI->>CI: npm ci → typecheck → validate:data(zod) → vitest → vite build
  CI->>P: dist/ をデプロイ
```

---

## ディレクトリ構成

```
awsprint/
├── index.html                 # SPA エントリHTML（/src/main.tsx を読み込む）
├── vite.config.ts             # ビルド設定（base, エイリアス @, manualChunks, vitest設定）
├── tailwind.config.js / postcss.config.js
├── eslint.config.js / tsconfig*.json
├── package.json / package-lock.json
├── .github/workflows/deploy.yml   # CI/CD（検証・ビルド・Pagesデプロイ）
├── scripts/validate-data.ts   # CI用: public/data の問題JSONを zod 検証
├── public/data/               # 本番配信される問題データ（index.json がマニフェスト）
├── data/                      # サンプル問題の原本（スキーマ確定用）
├── docs/                      # 設計ドキュメント（要件・アーキテクチャ・機能・データ・UI・アーカイブ）
└── src/
    ├── main.tsx               # React エントリポイント（RouterProvider）
    ├── index.css              # Tailwind ベーススタイル
    ├── app/                   # ルーター・レイアウト・各画面（SCR-01〜07）
    ├── components/            # 汎用UI（DomainBadge）
    ├── features/
    │   ├── quiz/              # 出題選択・セッション・模試タイマー・結果表示・ブックマーク
    │   ├── diagram/           # ★ React Flow 図レンダラ・カスタムノード・連動ハイライトストア
    │   ├── explanation/       # 解説文の ref パースと連動表示
    │   ├── settings/          # 設定ストア（Zustand）
    │   └── admin/             # 学習履歴バックアップ
    └── lib/
        ├── repository/        # データアクセス抽象（interface / LocalRepository / IndexedDB定義）
        ├── schema/            # 型定義・zodスキーマ・検証ロジック
        ├── scoring.ts         # 採点・合否
        ├── settings.ts        # localStorage 設定の読み書き
        ├── download.ts        # JSON ダウンロードユーティリティ
        └── useAsync.ts        # 非同期取得フック
```

| ディレクトリ | 役割 |
|-------------|------|
| `src/app/` | 画面（ページコンポーネント）とルーティング。画面IDは [docs/ui/specification.md](ui/specification.md) と対応 |
| `src/features/` | 機能単位のロジック・UI。図解連動（diagram + explanation）がコア |
| `src/lib/` | 画面に依存しない共通ロジック（データアクセス・スキーマ・採点） |
| `src/components/` | 汎用UI部品 |
| `public/data/` | 配信対象の問題データ。追加は JSON のコミットで完結 |
| `data/` | サンプル問題の原本 |
| `scripts/` | Node で実行する開発・CI用スクリプト |
| `docs/` | 要件・設計ドキュメント（`docs/archive/` は v1.0 AWS構成時代の原本） |
| `.github/workflows/` | GitHub Actions 定義 |

## 未確認事項

- GitHub Pages の公開URL・カスタムドメインの有無（リポジトリ内に `CNAME` 等は無く、未確認）
- `docs/architecture/overview.md` に記載の `src/features/progress/` は現時点で存在しない（進捗集計は `LocalRepository.getProgress()` と `ProgressPage.tsx` で実装）
- `npm run lint` は CI ワークフローには含まれていない（`overview.md` の図には lint 記載あり）
