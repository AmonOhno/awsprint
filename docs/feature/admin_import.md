# 管理機能（FR-14〜16, 18）

バックエンドを持たないため、v1.0 の「管理API＋DB書き込み」は **「ブラウザ内で検証・プレビュー・エクスポート → リポジトリへJSONコミット」** のワークフローに置き換える。単一運用者（本人）前提。認証は不要（NFR-04 v2.0）。

## 問題データの反映フロー

```
① SCR-07 でJSONを貼り付け / ファイル選択
② zodスキーマ検証＋整合性チェック（FR-14）
③ DiagramSpecプレビューで見え方確認（FR-16）
④ 検証済みJSONをダウンロード（エクスポート）
⑤ public/data/ に配置して git commit & push
⑥ GitHub Actions が再検証 → Pages へ自動デプロイ（演習側に反映）
```

CI（⑥）でも同じ zod 検証を実行するため、手元の検証をすり抜けた不正データが本番に載ることはない。

## JSON一括インポート検証（FR-14）

- 入力: 問題配列のJSON（`data/questions.sample.json` と同形式）
- 検証内容:
  1. **zodスキーマ検証**: 型・必須項目・enum値（→ [data/schema.md](../data/schema.md)）
  2. **参照整合性**: `explanation.refIds` および解説文中 `<ref id>` ⊆ DiagramSpec の `node.id ∪ container.id`（NFR-05）
  3. **図の整合性**: `edge.from/to` と `node.parent` が実在IDを指すこと、コンテナ入れ子の循環がないこと
  4. **問題の整合性**: `type:"single"` は正解がちょうど1つ、`type:"multiple"` は2つ以上、ID重複なし
- エラーは「何件中何件OK / エラー箇所（配列インデックス・JSONパス）と理由」の形式で一覧報告する

## 問題の作成・編集（FR-15）

- SCR-07 に問題単位の編集フォーム（問題文・選択肢・解説・docLinks・DiagramSpecのJSONエディタ）を用意
- 保存＝検証済みJSONのエクスポート。リポジトリの `public/data/` を置き換えてコミットすると演習側に反映される
- Phase 4 で拡張（MVP では FR-14 のバリデータ＋エクスポートを優先）

## DiagramSpecプレビュー（FR-16）

- 編集中の DiagramSpec を本番同一の `DiagramView`（→ [diagram_highlight.md](diagram_highlight.md)）で即時描画
- `refIds` との対応もプレビュー上でハイライト確認できる（解説文パース込み）

## 学習履歴のエクスポート/インポート（FR-18・v2.0新設）

端末内保存（IndexedDB / localStorage）の弱点であるデータ消失・端末間移行に備える。

- **エクスポート**: Attempt・ExamSession・Bookmark・UserSettings を1つのJSONにまとめてダウンロード

```json
{
  "formatVersion": 1,
  "exportedAt": "2026-07-04T12:00:00+09:00",
  "attempts": [],
  "examSessions": [],
  "bookmarks": [],
  "settings": {}
}
```

- **インポート**: zod検証のうえ復元。既存データがある場合は「置き換え / マージ（answeredAtで重複排除）」を選択
- `formatVersion` でスキーマ移行に備える
