# awsprint — AWS SAA 学習アプリ

アーキテクチャ図解の連動ハイライトで「文章要件 → 構成図」への変換力を鍛える、SAA合格のための個人学習アプリ。

## コアバリュー

- 正解構成の**アーキテクチャ図**を解説画面に大きく表示（FR-06）
- 解説文の語句と図中ノードを `refId` ⇄ `node.id` で対応づけ、**双方向にハイライト連動**（FR-07）
- 誤答の「なぜダメか」を図の欠落・誤配置箇所として視覚化

## アーキテクチャ方針: ランニングコスト0円

バックエンドを持たない完全静的SPA。サーバー・DB・認証基盤・従量課金サービスは一切使わない。

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Vite + React + TypeScript |
| 図レンダリング ★ | React Flow |
| UI / グラフ | Tailwind CSS + Radix UI / Recharts |
| 状態管理 / 検証 | Zustand / zod |
| 問題データ | リポジトリ内 JSON（`public/data/`） |
| 学習履歴 | localStorage + IndexedDB（端末内・外部送信なし） |
| ホスティング / CI | GitHub Pages / GitHub Actions（いずれも無料） |

詳細は [docs/architecture/overview.md](docs/architecture/overview.md) を参照。

## ドキュメント

設計ドキュメントは [docs/](docs/README.md) に集約。

| 分類 | 場所 | 内容 |
|------|------|------|
| 要件定義 | [docs/requirement/](docs/requirement/requirements.md) | FR/NFR・画面・データ要件（**何を作るか**） |
| アーキテクチャ | [docs/architecture/](docs/architecture/overview.md) | ゼロコスト構成・技術選定・デプロイ（**どう作るか**） |
| 機能設計 | [docs/feature/](docs/feature/overview.md) | 図解連動★・演習・進捗・管理の各設計 |
| データ設計 | [docs/data/](docs/data/schema.md) | 型定義・zodスキーマ・ローカル保存設計 |
| UI設計 | [docs/ui/](docs/ui/specification.md) | 画面仕様（SCR-01〜07） |
| サンプルデータ | [data/questions.sample.json](data/questions.sample.json) | 図解連動つき5問（Phase 1 成果物） |
| アーカイブ | [docs/archive/](docs/archive/) | v1.0 HTML文書（AWS構成時代の原本） |

### 読む順番

1. [要件定義書](docs/requirement/requirements.md) — 全体像とコア価値（第5章: 図解連動）
2. [アーキテクチャ](docs/architecture/overview.md) — ゼロコスト構成と技術選定
3. [データスキーマ](docs/data/schema.md) ＋ [図解連動設計](docs/feature/diagram_highlight.md) — 実装の起点
4. [data/questions.sample.json](data/questions.sample.json) — スキーマと照合して Phase 1 を確定

## 開発フェーズ

| フェーズ | ゴール |
|---------|--------|
| Phase 1 | データ設計。スキーマ確定・図解付きサンプル5〜10問 ← **サンプル5問まで完了** |
| Phase 2 | MVPコア。1問1答＋結果解説画面での図表示・連動ハイライト |
| Phase 3 | 模擬試験（65問/130分）とダッシュボード（苦手分析） |
| Phase 4 | データ拡充（100問以上）、管理画面強化、履歴バックアップ |

## トレーサビリティ

要件（FR/NFR）→ 設計の対応は [docs/feature/overview.md](docs/feature/overview.md) の対応表を参照。要件変更時は要件定義書と該当設計文書のバージョンを併せて更新すること。
