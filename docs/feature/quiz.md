# 問題演習機能（FR-01〜05, 08, 09）

出題・回答・採点・模擬試験・タイマーの設計。すべてクライアント内で完結する（バックエンドなし）。

## 出題ロジック

### 分野別ミニテスト（FR-01）

- SCR-02 で分野（1つ以上）と問題数（10 / 20）を選択
- `QuizRepository.listQuestions({ domains, limit })` で対象分野の問題を取得し、Fisher–Yates でシャッフルして出題
- 対象分野の問題数が指定数に満たない場合は、その旨を表示して全問出題

### ランダム1問1答（FR-02）

- 全問題プールから1問を無作為抽出し、回答→即時採点→解説（SCR-04）→次の問題、を反復
- **直近N問除外**: 直近に出題した問題ID（N=10、プール数が少ない場合は `min(10, プール数-1)`）を除外して抽選。出題履歴は演習セッション状態（Zustand）で保持

### 模擬試験（FR-04）

- 65問 / 130分。全分野からSAA本番の分野比率（目安: 安全30% / レジリエンス26% / 高性能24% / コスト20%）で抽出。プールが65問未満の期間は全問＋比率無視で代替し、画面に注記を出す
- **見直しフラグ**: 各問にフラグを付けられ、問題一覧ナビから未回答・フラグ付きへジャンプできる
- **中断・再開**: セッション状態（出題ID列・回答・フラグ・開始時刻）を localStorage に保存。再訪時に「再開しますか？」を提示
- **自動採点**: 残り時間0で回答を締め切り自動採点。未回答は誤答扱い
- 図の表示タイミング設定（FR-17）は無視し、常に「解説時のみ」

## タイマー（FR-05）

- 残り時間はヘッダーに常時表示。残り10分で色を警告色に変更（点滅などの過度なアニメーションは行わない）
- **リロード耐性**: 「残り秒数」ではなく**終了予定時刻（`endsAt` エポックms）**を localStorage に保存し、描画時に `endsAt - now` で残りを算出する。リロード・タブ復帰でも正しく継続する
- タブが非アクティブでも時間は実時間で進行する（`setInterval` のズレに依存しない）

## 採点ロジック（FR-03）

`src/lib/scoring.ts` に純関数として実装する（vitest でユニットテスト対象）。

```ts
// 単一選択: 選択IDが正解IDと一致
// 複数選択: 選択集合 === 正解集合（部分点なし＝本番準拠）
function isCorrect(q: Question, selected: string[]): boolean;

// 模試: 得点率(%) と合否（合格目安ライン settings.passLinePct、既定72%）
function scoreExam(attempts: Attempt[], total: number, passLinePct: number): {
  scorePct: number;
  passed: boolean;
};
```

- 複数選択問題は出題時に「N個選択してください」と明示し、N個選択するまで回答ボタンを無効化する
- 回答確定後に Attempt（選択・正誤・所要秒・日時）を `QuizRepository.saveAttempt()` で IndexedDB に記録する（進捗集計の元データ。→ [data/storage.md](../data/storage.md)）

## 正誤別解説（FR-08）・公式リンク（FR-09）

- SCR-04 で選択肢ごとに ◯/✗ と理由（`choice.why`）を表示。ユーザーが選んだ選択肢には「あなたの回答」バッジを付ける
- 正解選択肢は緑系・誤答は赤系＋アイコンで区別する（色のみに依存しない。NFR-07）
- `docLinks` は `target="_blank" rel="noopener noreferrer"` で別タブ表示

## セッション状態（Zustand）

```ts
type QuizSession = {
  mode: "mini" | "random" | "exam";
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, string[]>;   // questionId → 選択
  flags: Set<string>;                  // 見直しフラグ（模試）
  endsAt?: number;                     // 模試の終了予定時刻（epoch ms）
  recentIds: string[];                 // 1問1答の直近N問除外用
};
```

模試のみ localStorage へ永続化（中断・再開のため）。ミニテスト/1問1答はメモリ内でよい。
