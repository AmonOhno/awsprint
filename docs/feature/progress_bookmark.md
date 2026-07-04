# 進捗管理・ブックマーク（FR-10〜13）

学習履歴（Attempt）を元にした進捗可視化と、要復習リストの設計。データはすべて端末内（IndexedDB / localStorage）に保存する。→ [data/storage.md](../data/storage.md)

## ブックマーク（FR-10）

- SCR-04（結果・解説）の各問にブックマークのトグルボタンを置く
- SCR-05 で一覧表示。分野・正誤（直近の Attempt 基準）で絞り込みできる
- 一覧から「この問題を解く」「ブックマークだけで演習」の導線を持つ（SCR-03 へ）
- 保存形式: `Bookmark = { questionId, createdAt }`（IndexedDB）

## 分野別正解率グラフ（FR-11）

- Attempt 全件から分野別に集計し、Recharts のレーダーチャートで4分野を表示（SCR-01 / SCR-06）
- `correctPct = 正解Attempt数 / 該当分野Attempt数`。Attempt が0件の分野は「未演習」として区別する（0%と混同しない）
- 同一問題を複数回解いた場合はすべての Attempt を分母に含める（学習の現在地を反映するため直近重み付けは Phase 4 で検討）

```ts
type ProgressSummary = {
  totalAnswered: number;                 // 解答済みユニーク問題数
  overallPct: number;                    // 全Attemptの正解率
  byDomain: Record<Domain, { answered: number; correctPct: number }>;
};
```

## 総合進捗率（FR-12）

- SCR-01 に「解答済み問題数 / 総問題数」「平均正解率」「直近の模試スコア」をカード表示
- 集計は `QuizRepository.getProgress()` に集約する。100問規模なら都度全件集計で性能要件（NFR-01）を満たせる。将来問題数が大幅に増えた場合のみ集計キャッシュを検討

## 模試スコア履歴（FR-13）

- ExamSession（出題セット・回答・スコア・合否）を IndexedDB に受験ごと保存
- SCR-06 に時系列の折れ線（スコア推移）＋合格ライン（既定72%）の基準線を表示
- 過去の模試結果は SCR-04 相当の画面で再閲覧できる（回答・解説・図も再表示）

## 弱点抽出（SCR-06）

- 分野別正解率の最低2分野を「重点復習」として提示し、その分野のミニテスト開始（SCR-02 プリセット）への導線を置く
- 未演習分野は正解率と関係なく「まず演習」として別枠で提示する
