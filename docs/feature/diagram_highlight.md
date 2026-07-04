# アーキテクチャ図表示・連動ハイライト ★コア機能（FR-06, 07, 17）

本アプリの差別化価値を担う中心モジュール。要件は [requirements.md 第5章](../requirement/requirements.md)。

## 方式: DiagramSpec → React Flow

問題データ内の `DiagramSpec`（宣言的なノード・エッジ・コンテナ。スキーマは [data/schema.md](../data/schema.md)）を、
変換関数で React Flow の `nodes` / `edges` にマッピングして描画する。
**各ノードは DiagramSpec の `id` を保持し、解説側の `refId` と一致させる**（連動ハイライトの前提）。

```
DiagramSpec (JSON)
   │ toFlow() 変換
   ▼
React Flow nodes/edges
   ├─ コンテナ（VPC/AZ/Subnet）→ グループノード（入れ子・破線枠）
   ├─ サービスノード → カスタムノード（AWSアイコン＋ラベル）
   └─ エッジ → 方向・ラベル付きエッジ
```

## モジュール構成

```
src/features/diagram/
├── DiagramView.tsx      # React Flow ラッパ。props: spec, mode("full"|"hint"), 拡大モーダル
├── toFlow.ts            # DiagramSpec → Flow nodes/edges 変換（純関数・テスト対象）
├── nodes/
│   ├── ServiceNode.tsx  # AWSアイコン＋ラベル。activeId一致でring/glow強調
│   ├── ContainerNode.tsx# VPC/AZ/Subnet の入れ子枠
│   └── iconMap.ts       # AwsService → アイコンのマップ（一元管理）
└── useHighlight.ts      # refId ⇄ nodeId 相互強調の共有ストア

src/features/explanation/
├── ExplanationText.tsx  # <ref id="...">語句</ref> をパースして RefSpan に変換
└── RefSpan.tsx          # hover/tap で setActive(id)、active時に背景ハイライト
```

## 連動ハイライトの仕組み（FR-07）

解説文はミニマークアップ `<ref id="nat">NATゲートウェイ</ref>` を含む。パーサがこれを `RefSpan` に変換する。

```ts
// features/diagram/useHighlight.ts — 図とテキストが共有する単一ストア
const useHighlight = create<{
  activeId?: string;
  setActive: (id?: string) => void;
}>((set) => ({ activeId: undefined, setActive: (id) => set({ activeId: id }) }));
```

- **テキスト→図**: RefSpan の hover（PC）/ tap（タッチ）で `setActive(id)` → `activeId === node.id` のノードに ring/glow クラスを付与して発光・拡大
- **図→テキスト**: ノードの hover/tap で同ストアを更新 → 対応 RefSpan を背景ハイライトし `scrollIntoView({ block:"nearest" })` で可視化
- hover離脱 / 図の余白タップで `setActive(undefined)`。タッチ環境ではタップのトグルで代替する
- 強調は色変化に加えて枠線・拡大を伴わせる（色覚多様性への配慮。NFR-07）

### 誤答の可視化

`node.state: "faulty"` のノード（欠落・誤配置の説明用）は赤系＋警告アイコンで描画し、
誤答選択肢の解説（`choice.why` 内の `<ref>`）から同じ仕組みでハイライトできる。

## 表示要件の実装方針（FR-06）

- SCR-04 の中央カラムに配置し、`fitView` で全体が収まる初期表示にする
- パン／ズーム操作対応（React Flow標準）。「拡大表示」ボタンで全画面モーダル表示
- モバイル幅では図を上・解説を下の縦積みに切り替える
- `renderer: "image"` の問題は `imageUrl` の静的画像を表示（連動ハイライトなしの暫定表示）。`diagram` が無い問題は図エリア自体を出さない

## 図の表示タイミング（FR-17）

同一の `DiagramView` を、設定 `settings.diagramTiming` に応じて SCR-03（出題時）と SCR-04（解説時）のどちらにマウントするかを切り替える。図コンポーネントは表示位置に依存しないため、追加実装は「どこに置くか」の分岐と hint モードのマスクのみ。

| 設定値 | 挙動 |
|--------|------|
| `"explanation"`（既定） | SCR-04 でのみ描画。連動ハイライトも解説と同時に有効化 |
| `"question"` | SCR-03 の問題文下に `mode="hint"` で描画。`choice.correct` / `explanation` / `node.state="faulty"` は回答確定まで非表示にマスクする |

模試（FR-04）は `examMode` のとき設定を無視し、常に `"explanation"` 相当に固定する。

## 性能（NFR-01: 図描画2秒以内）

- DiagramSpec は1問あたり高々十数ノードの想定であり、React Flow の描画性能上の問題はない
- ハイライトは `activeId` を参照するノードのみ再レンダリングされるよう、ノードコンポーネントをメモ化しストア購読をノード単位にする

## AWSアイコン

- `iconMap.ts` で `AwsService`（"EC2" | "S3" | ...）→ アイコンコンポーネントを一元管理。未登録サービスは汎用アイコン＋サービス名ラベルでフォールバック
- アイコン資産は AWS 公式「AWS Architecture Icons」（無料配布・利用条件に従う）を SVG で同梱する

## 将来拡張（MVP対象外）

- Mermaid レンダラ: 連動不要な補足図向けに `renderer` を拡張可能な構造にしておく
- LLMによる DiagramSpec 自動生成（Phase 4+ の検討課題）
