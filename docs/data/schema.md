# データモデル（型定義・zodスキーマ）

TypeScript 型定義が**正規のソース**（`src/lib/schema/`）。zodスキーマも同定義から書き、
問題JSONのインポート検証（NFR-05 / FR-14）と CI 検証の両方で使う。

## 分野（Domain）

```ts
type Domain =
  | "SECURE_ARCH"   // 安全なアーキテクチャの設計
  | "RESILIENT"     // 高レジリエンスアーキテクチャの設計
  | "HIGH_PERF"     // 高性能アーキテクチャの設計
  | "COST_OPT";     // コスト最適化アーキテクチャの設計
```

## 問題（Question）

```ts
type Choice = {
  id: string;                      // "a" | "b" | ... 問題内で一意
  text: string;
  correct: boolean;
  why?: string;                    // 正誤の理由（FR-08）。<ref id="..."> を含められる
};

type Explanation = {
  summary: string;                 // <ref id="..."> を含むミニマークアップ（FR-07）
  refIds: string[];                // 図ノードと対応。summary中の<ref>のid一覧と一致させる
};

type Question = {
  id: string;                      // "Q-0001" 形式。全体で一意
  domain: Domain;
  type: "single" | "multiple";     // multiple は correct:true が2つ以上
  stem: string;                    // 問題文
  choices: Choice[];
  explanation: Explanation;
  diagram?: DiagramSpec;           // 図（コア）。未整備の問題は省略可
  docLinks?: { title: string; url: string }[];  // AWS公式ドキュメント（FR-09）
  tags?: string[];
};
```

## 構成図（DiagramSpec）★コア

```ts
type DiagramSpec = {
  renderer: "spec" | "image";      // spec=動的描画 / image=静的URL(代替・連動なし)
  imageUrl?: string;               // renderer=image のとき必須
  containers?: Container[];        // VPC / AZ / Subnet などの入れ子枠
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

type Container = {
  id: string;
  type: "Region" | "VPC" | "AZ" | "PublicSubnet" | "PrivateSubnet";
  label: string;                   // "VPC 10.0.0.0/16" など
  parent?: string;                 // 入れ子（AZ ⊂ VPC など）。Container.id を参照
};

type DiagramNode = {
  id: string;                      // ★ 解説の refId と一致させる（連動ハイライトの前提）
  service: AwsService;             // "EC2" | "S3" | "NATGateway" ...（iconMapのキー）
  label: string;
  parent?: string;                 // 所属コンテナ（Container.id）
  state?: "normal" | "faulty";     // faulty=誤答説明で欠陥箇所を赤表示
};

type DiagramEdge = {
  from: string;                    // DiagramNode.id
  to: string;                      // DiagramNode.id
  label?: string;                  // "HTTPS 443" など
  directed?: boolean;              // 既定 true
};
```

`AwsService` は文字列 enum として `iconMap.ts` のキーと同期させる（未登録値は検証で警告、描画は汎用アイコンでフォールバック）。

## 学習履歴（端末内保存）

```ts
type Attempt = {
  questionId: string;
  domain: Domain;                  // 集計高速化のため非正規化して保持
  selected: string[];              // Choice.id の配列
  correct: boolean;
  elapsedSec: number;
  answeredAt: string;              // ISO8601
};

type ExamSession = {
  id: string;
  questionIds: string[];           // 65問
  startedAt: string;
  durationSec: number;             // 130 * 60
  attempts: Attempt[];
  scorePct?: number;
  passed?: boolean;                // 合格目安ライン（settings.passLinePct）による判定
};

type Bookmark = {
  questionId: string;
  createdAt: string;
};

type UserSettings = {
  diagramTiming: "explanation" | "question";  // FR-17（既定 "explanation"）
  passLinePct: number;                        // 合格目安ライン（既定 72）
};

type ProgressSummary = {
  totalAnswered: number;
  overallPct: number;
  byDomain: Record<Domain, { answered: number; correctPct: number }>;
};
```

## 問題データファイル（public/data/）

```ts
// index.json — 問題ファイルのマニフェスト（起動時にまずこれを取得）
type DataIndex = {
  formatVersion: number;           // スキーマ移行用
  files: string[];                 // ["questions.secure.json", ...]
};

// questions.*.json — Question の配列
type QuestionFile = Question[];
```

分野やバッチ単位でファイル分割でき、追記＝ファイル追加＋index.json更新で完結する（NFR-03）。

## 検証ルール（zod ＋ カスタム検証）

インポート（FR-14）と CI で共通実行する。

| # | ルール | レベル |
|---|--------|:-----:|
| 1 | zodスキーマ適合（型・必須・enum） | エラー |
| 2 | Question.id の重複なし | エラー |
| 3 | `type:"single"` → correct がちょうど1つ / `"multiple"` → 2つ以上 | エラー |
| 4 | `explanation.refIds` および summary/why 中の `<ref id>` が図の `node.id ∪ container.id` に存在 | エラー |
| 5 | `edge.from/to`・`node.parent`・`container.parent` が実在IDを参照、入れ子循環なし | エラー |
| 6 | `renderer:"image"` なのに imageUrl なし / `"spec"` なのに nodes 空 | エラー |
| 7 | `refIds` にあるが summary 中に `<ref>` が出現しないID | 警告 |
| 8 | `AwsService` が iconMap 未登録 | 警告 |

実データ例は `data/questions.sample.json` を参照。
