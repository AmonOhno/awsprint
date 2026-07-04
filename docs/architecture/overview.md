# システム概要・アーキテクチャ

| 項目 | 内容 |
|------|------|
| 文書ID | DOC-ARCH-001 |
| バージョン | 2.0（v1.0 の AWS サーバーレス構成をゼロコスト構成へ全面改訂） |
| 更新日 | 2026-07-04 |
| 前提文書 | [requirement/requirements.md](../requirement/requirements.md) |

## プロジェクト概要

AWS Certified Solutions Architect – Associate（SAA）合格を目的とした個人学習アプリ。
「問題文（文章要件）→ インフラ構成図」への変換力を、**解説文と構成図の双方向ハイライト連動**で反復訓練する。

## コスト方針（最重要制約）

**ランニングコスト 0円 を絶対条件とする（NFR-06）。**

v1.0 では「AWS学習を兼ねてAWSサーバーレスを採用」としていたが、以下の理由で撤回する。

- CloudFront / API Gateway / Lambda / DynamoDB は無料枠があっても、12ヶ月無料枠の期限切れ・無料枠超過・リージョン差で課金が発生しうる。「ほぼ0円」であって「0円保証」ではない
- 本アプリは AWS アーキテクチャを**教材として扱う**アプリであり、インフラ自体を AWS にする必然性はない。AWS の実地学習はハンズオン等で別途行えばよい
- 単一ユーザー・データ読み取り中心のワークロードに、サーバー・DB・認証基盤は過剰

そこで **「バックエンドを持たない」** ことをアーキテクチャの第一原則とする。

## システムアーキテクチャ

```
┌──────────────────────────────────────────────┐
│  GitHub リポジトリ（無料・Public）              │
│  ├─ ソースコード                               │
│  └─ 問題データ（public/data/*.json）★コンテンツもGit管理│
│         │ push                                │
│         ▼                                     │
│  GitHub Actions（無料枠）                      │
│  lint / 型チェック / zod検証 / テスト / ビルド   │
│         │ deploy                              │
│         ▼                                     │
│  GitHub Pages（無料・静的配信）                 │
└──────────────────┬───────────────────────────┘
                   │ HTTPS（静的ファイルのみ）
                   ▼
┌──────────────────────────────────────────────┐
│  ブラウザ（SPA / 全ロジックがクライアント側）     │
│  ├─ React + Vite（UI・ルーティング）            │
│  ├─ React Flow（構成図レンダラ ★コア）          │
│  ├─ Recharts（進捗グラフ）                     │
│  ├─ Zustand（UI状態・ハイライト連動）           │
│  └─ localStorage / IndexedDB（学習履歴の永続化）│
└──────────────────────────────────────────────┘
```

サーバー・DB・認証基盤・外部SaaSは**一切使わない**。動的処理（採点・集計・模試タイマー・ブックマーク）はすべてブラウザ内で完結し、学習履歴は端末内（localStorage / IndexedDB）に保存する。

## 技術スタック

| レイヤー | 採用技術 | 選定理由 |
|---------|---------|---------|
| ビルド/フレームワーク | Vite + React + TypeScript | SSR不要の純SPA。静的出力が単純で GitHub Pages と相性がよい。v1.0のNext.jsはSSR/Server機能を使わないため過剰と判断し変更 |
| ルーティング | React Router（HashRouter） | GitHub Pages はSPAのパスフォールバックが無いため、ハッシュルーティングで404問題を回避 |
| UI | Tailwind CSS + Radix UI | 素早く一貫したUI。アクセシブルな基本部品（NFR-07） |
| 図レンダリング ★ | React Flow | ノード単位のイベント・強調が可能＝連動ハイライト（FR-07）の実現手段。入れ子コンテナ・パン/ズーム対応 |
| グラフ | Recharts | 分野別レーダー/バー（FR-11）を宣言的に実装 |
| 状態管理 | Zustand | 演習セッション・ハイライト状態。サーバーが無いため TanStack Query は不採用（v1.0から削除） |
| スキーマ検証 | zod | 型定義から問題JSONのインポート検証（NFR-05）を生成 |
| 学習履歴の保存 | localStorage + IndexedDB | 設定・進行中セッションは localStorage、解答履歴（Attempt）は IndexedDB。→ [data/storage.md](../data/storage.md) |
| 問題データ | リポジトリ内 JSON（`public/data/`） | コード外管理（NFR-03）。追記＝JSONコミットで完結 |
| ホスティング | GitHub Pages | 0円。Public リポジトリで無制限配信 |
| CI/CD | GitHub Actions | Public リポジトリは無料枠無制限。push で自動デプロイ |
| IaC | 不要 | インフラが存在しないため（v1.0 の AWS CDK を削除） |

### v1.0（AWS構成）からの変更まとめ

| v1.0 | v2.0（本書） | 理由 |
|------|-------------|------|
| Next.js (App Router) | Vite + React SPA | SSR不要。静的ホスティング前提を単純化 |
| S3 + CloudFront | GitHub Pages | 0円保証。転送量課金リスク排除 |
| API Gateway + Lambda | なし（クライアント完結） | サーバー不要のワークロード |
| DynamoDB | localStorage + IndexedDB | 単一ユーザーの履歴は端末内で十分 |
| Cognito 認証 | なし | 守るべきサーバーサイド資源が存在しない（NFR-04改訂） |
| AWS CDK | なし | インフラレス |
| TanStack Query | なし | サーバーデータ取得が存在しない |

## ディレクトリ構成

```
awsprint/
├── docs/                        # 設計ドキュメント（本ディレクトリ）
├── public/
│   └── data/
│       ├── index.json           # 問題ファイルのマニフェスト
│       └── questions.*.json     # 問題＋DiagramSpec（分野/バッチ単位で分割可）
├── data/
│   └── questions.sample.json    # Phase 1 サンプル（スキーマ確定用の原本）
├── src/
│   ├── app/                     # ルーティング＝画面（SCR-xx に対応）
│   │   ├── DashboardPage.tsx    # SCR-01
│   │   ├── PracticeSetupPage.tsx# SCR-02
│   │   ├── QuizPage.tsx         # SCR-03
│   │   ├── ResultPage.tsx       # SCR-04 ★図解連動
│   │   ├── BookmarksPage.tsx    # SCR-05
│   │   ├── ProgressPage.tsx     # SCR-06
│   │   └── AdminPage.tsx        # SCR-07（インポート検証・プレビュー）
│   ├── features/
│   │   ├── quiz/                # 出題・採点・模試タイマー
│   │   ├── diagram/             # ★ 図レンダラ＋連動ハイライト
│   │   │   ├── DiagramView.tsx  # React Flow ラッパ（DiagramSpec→Flow変換）
│   │   │   ├── nodes/           # AWSサービス別カスタムノード
│   │   │   └── useHighlight.ts  # refId ⇄ nodeId の相互強調ストア
│   │   ├── explanation/         # 解説 <ref> パースと連動
│   │   ├── progress/            # 正解率・スコア集計
│   │   └── admin/               # JSON検証・プレビュー・エクスポート
│   ├── lib/
│   │   ├── repository/          # データアクセス抽象（QuizRepository）
│   │   │   ├── types.ts         # interface（将来のバックエンド差替口）
│   │   │   └── local.ts         # LocalRepository（JSON + IndexedDB）
│   │   ├── schema/              # 型定義 + zod スキーマ（正規のソース）
│   │   └── scoring.ts           # 採点・合否判定
│   ├── components/              # 汎用UI
│   └── main.tsx
└── .github/workflows/deploy.yml # CI（lint/型/zod検証/ビルド）→ Pages デプロイ
```

## データアクセス抽象化（将来拡張の保険）

画面は `QuizRepository` interface のみに依存させる。v2.0 の実装は `LocalRepository` のみだが、
将来マルチデバイス同期等が必要になった場合に、UIを書き換えずに実装を差し替えられる。

```ts
interface QuizRepository {
  listQuestions(filter: QuestionFilter): Promise<Question[]>;
  getQuestion(id: string): Promise<Question>;
  saveAttempt(a: Attempt): Promise<void>;
  getProgress(): Promise<ProgressSummary>;
  listBookmarks(): Promise<Bookmark[]>;
  toggleBookmark(questionId: string): Promise<void>;
}
```

## デプロイ・CI/CD

| 項目 | 方針 |
|------|------|
| ホスティング | GitHub Pages（`gh-pages` 環境へ Actions からデプロイ） |
| リポジトリ | **Public**（Private の Pages は有料プランが必要なため）。問題・解説はオリジナル作成なので公開可 |
| CI | push 時に lint / `tsc --noEmit` / 問題JSONの zod 検証 / vitest / build |
| CD | main ブランチへの push で自動デプロイ（`actions/deploy-pages`） |
| 環境 | 単一環境（prod のみ）。プレビューはローカル `vite dev` で代替 |
| 代替ホスティング | Cloudflare Pages（Private リポジトリでも無料）。GitHub Pages が制約になった場合の乗り換え先 |

## 制約・既知のトレードオフ

- **マルチデバイス同期不可**: 学習履歴は端末内保存のため、PC/タブレット間で共有されない。緩和策として進捗データのJSONエクスポート/インポート機能を管理画面に用意する（→ [feature/admin_import.md](../feature/admin_import.md)）
- **ブラウザデータ消去で履歴消失**: 同上のエクスポート機能でバックアップ可能とする
- **問題データの追加はGit経由**: 管理画面はブラウザ内で検証・プレビュー・JSON出力まで行い、リポジトリへの反映は手動コミット（サーバーレスの代償。単一運用者なので許容）

## セキュリティ（NFR-04 改訂）

- サーバー・DB・秘密情報が存在しないため、認証は不要
- 学習履歴は端末内に閉じており、外部送信は一切行わない
- 依存パッケージは Dependabot で脆弱性監視（無料）
