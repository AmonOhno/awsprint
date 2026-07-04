# ドキュメント索引

AWS SAA 学習アプリ（awsprint）の設計ドキュメント一覧。

## 要件定義

| ファイル | 内容 |
|---------|------|
| [requirement/requirements.md](requirement/requirements.md) | 要件定義書 v2.0。機能要件（FR）・非機能要件（NFR）・画面・データ要件。**何を作るか** |

## アーキテクチャ設計

| ファイル | 内容 |
|---------|------|
| [architecture/overview.md](architecture/overview.md) | システム概要・**ゼロコスト方針**・技術スタック・ディレクトリ構成・デプロイ（GitHub Pages） |

## 機能設計

| ファイル | 内容 |
|---------|------|
| [feature/overview.md](feature/overview.md) | 機能一覧・画面遷移・フェーズ計画 |
| [feature/diagram_highlight.md](feature/diagram_highlight.md) | ★コア: アーキテクチャ図表示・解説連動ハイライト（FR-06, 07, 17） |
| [feature/quiz.md](feature/quiz.md) | 出題・採点・模擬試験・タイマー（FR-01〜05, 08, 09） |
| [feature/progress_bookmark.md](feature/progress_bookmark.md) | 進捗管理・ブックマーク（FR-10〜13） |
| [feature/admin_import.md](feature/admin_import.md) | 管理・JSON検証・学習履歴バックアップ（FR-14〜16, 18） |

## データ設計

| ファイル | 内容 |
|---------|------|
| [data/schema.md](data/schema.md) | 型定義・zodスキーマ・DiagramSpec・検証ルール |
| [data/storage.md](data/storage.md) | 端末内永続化（localStorage / IndexedDB）設計 |
| [../data/questions.sample.json](../data/questions.sample.json) | 図解連動つきサンプル問題データ（Phase 1 成果物） |

## UI設計

| ファイル | 内容 |
|---------|------|
| [ui/specification.md](ui/specification.md) | ルーティング・画面構成（SCR-01〜07）・共通UI原則 |

## 読む順番

1. [requirement/requirements.md](requirement/requirements.md) で全体像とコア価値（第5章: 図解連動）を把握
2. [architecture/overview.md](architecture/overview.md) でゼロコスト構成と技術選定を確認
3. [data/schema.md](data/schema.md) と [feature/diagram_highlight.md](feature/diagram_highlight.md) が実装の起点
4. `data/questions.sample.json` を型定義と照合し、Phase 1 のデータ設計を確定

## アーカイブ

| ファイル | 内容 |
|---------|------|
| [archive/要件定義書_詳細版.dc.html](archive/要件定義書_詳細版.dc.html) | v1.0 要件定義書（HTML原本） |
| [archive/技術仕様書.dc.html](archive/技術仕様書.dc.html) | v1.0 技術仕様書（AWSサーバーレス構成。**ゼロコスト方針により v2.0 で置き換え済み**） |

> v1.0 → v2.0 の主な変更: AWSフルサーバーレス構成（S3/CloudFront + API Gateway + Lambda + DynamoDB + Cognito + CDK）を廃止し、Vite + React SPA + GitHub Pages + 端末内保存の**ランニングコスト0円構成**へ全面改訂。機能要件（FR-01〜17）は不変、FR-18（履歴バックアップ）を新設。
