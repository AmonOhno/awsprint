# ローカルストレージ設計（端末内永続化）

v1.0 の DynamoDB 設計を置き換える。学習履歴はすべて端末内に保存し、外部送信しない（NFR-04/06）。
バックアップ・移行は学習履歴のエクスポート/インポート（FR-18 → [feature/admin_import.md](../feature/admin_import.md)）で担保する。

## 保存先の使い分け

| データ | 保存先 | 理由 |
|--------|--------|------|
| UserSettings | localStorage | 小さい・同期読み出ししたい（初期描画で必要） |
| 進行中の模試セッション | localStorage | 中断・再開（FR-04）とタイマー継続（FR-05）。単一・小サイズ |
| Attempt（解答履歴） | IndexedDB | 件数が増える（100問×反復）。インデックスで集計を効率化 |
| ExamSession（完了済み模試） | IndexedDB | 65問分の回答を含み比較的大きい |
| Bookmark | IndexedDB | 件数可変。questionId でキーアクセス |
| 問題データ | 保存しない（`public/data/*.json` を fetch） | コンテンツはGit管理（NFR-03）。HTTPキャッシュに任せる |

## localStorage キー設計

プレフィックス `awsprint.` で名前空間を区切る。

| キー | 値 | 対応FR |
|------|----|--------|
| `awsprint.settings` | `UserSettings` のJSON | FR-17 |
| `awsprint.activeExam` | 進行中模試（出題ID列・回答・フラグ・`endsAt`） | FR-04, 05 |
| `awsprint.storageVersion` | スキーマバージョン（数値） | 移行用 |

## IndexedDB 設計

DB名 `awsprint`、バージョン管理は `onupgradeneeded` で行う。ラッパーとして [idb](https://github.com/jakearchibald/idb)（軽量・無料）を使用する。

| オブジェクトストア | keyPath | インデックス | 用途 |
|------------------|---------|------------|------|
| `attempts` | 自動採番 | `questionId`, `domain`, `answeredAt` | 正解率集計（FR-11/12）、直近正誤の参照 |
| `examSessions` | `id` | `startedAt` | 模試スコア履歴（FR-13） |
| `bookmarks` | `questionId` | `createdAt` | ブックマーク一覧（FR-10） |

### 主要アクセスパターン

| 操作 | 実装 |
|------|------|
| 分野別正解率 | `attempts` を `domain` インデックスで走査し集計（100問規模なら全件走査でも NFR-01 を満たす） |
| ある問題の直近正誤 | `attempts` を `questionId` インデックスで取得し `answeredAt` 最大を採用 |
| 模試履歴の時系列表示 | `examSessions` を `startedAt` で降順取得 |
| ブックマーク判定/トグル | `bookmarks` を `questionId` で get / put / delete |

## リポジトリ層

画面・機能コードは IndexedDB を直接触らず、`QuizRepository` interface（[architecture/overview.md](../architecture/overview.md) 参照）の実装 `LocalRepository` 経由でアクセスする。テストでは in-memory 実装（`fake-indexeddb` または Map ベースのモック）に差し替える。

## データ保全

- **容量**: localStorage 上限（~5MB）に対し想定データは数十KB、IndexedDB は実質無制限。問題なし
- **消失リスク**: ブラウザのサイトデータ消去で全履歴が消える。SCR-07 のエクスポート（FR-18）を定期的に行う運用でカバー
- **スキーマ移行**: `storageVersion` / IndexedDB バージョンを上げ、`onupgradeneeded` とマイグレーション関数で移行する
