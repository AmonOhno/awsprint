import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { DiagramSpec } from "@/lib/schema/types";

// DiagramSpec を React Flow の nodes/edges へ変換（docs/feature/diagram_highlight.md）。
// 位置情報を持たない宣言的スペックから、入れ子コンテナを考慮した簡易レイアウトを計算する。

const NODE_W = 148;
const NODE_H = 62;
const GAP = 20;
const PAD_TOP = 34; // コンテナのラベル領域
const PAD = 16;
const MAX_COLS = 3;

export type ServiceNodeData = {
  kind: "service";
  service: string;
  label: string;
  faulty: boolean;
};
export type ContainerNodeData = {
  kind: "container";
  label: string;
  type: string;
};

type Sized = { id: string; w: number; h: number };

function childContainers(spec: DiagramSpec, parentId: string | undefined) {
  return (spec.containers ?? []).filter((c) => c.parent === parentId);
}
function childNodes(spec: DiagramSpec, parentId: string | undefined) {
  return spec.nodes.filter((n) => n.parent === parentId);
}

// items を格子状に並べ、各 item の相対位置を out に書き込み、内容の総サイズを返す。
function arrange(
  items: Sized[],
  place: (id: string, x: number, y: number) => void
): { w: number; h: number } {
  if (items.length === 0) return { w: NODE_W, h: NODE_H };
  const cols = Math.min(MAX_COLS, items.length);
  let x = PAD;
  let y = PAD_TOP;
  let rowH = 0;
  let maxRight = 0;
  let colInRow = 0;

  for (const it of items) {
    if (colInRow === cols) {
      // 改行
      x = PAD;
      y += rowH + GAP;
      rowH = 0;
      colInRow = 0;
    }
    place(it.id, x, y);
    x += it.w + GAP;
    maxRight = Math.max(maxRight, x - GAP);
    rowH = Math.max(rowH, it.h);
    colInRow += 1;
  }
  return { w: maxRight + PAD, h: y + rowH + PAD };
}

export function specToFlow(spec: DiagramSpec): { nodes: Node[]; edges: Edge[] } {
  const rfNodes: Node[] = [];
  const pos = new Map<string, { x: number; y: number }>();
  const size = new Map<string, Sized>();

  // コンテナを深さ優先でサイズ決定（子→親）。
  function sizeContainer(id: string): Sized {
    if (size.has(id)) return size.get(id)!;
    const kids = childContainers(spec, id).map((c) => sizeContainer(c.id));
    const leaves = childNodes(spec, id).map(
      (n): Sized => ({ id: n.id, w: NODE_W, h: NODE_H })
    );
    const items = [...kids, ...leaves];
    const { w, h } = arrange(items, (cid, x, y) => pos.set(cid, { x, y }));
    const s: Sized = { id, w, h };
    size.set(id, s);
    return s;
  }

  const topContainers = childContainers(spec, undefined).map((c) =>
    sizeContainer(c.id)
  );
  const topNodes = childNodes(spec, undefined).map(
    (n): Sized => ({ id: n.id, w: NODE_W, h: NODE_H })
  );

  // 最上位アイテムを配置（絶対座標）。
  const topPos = new Map<string, { x: number; y: number }>();
  arrange([...topContainers, ...topNodes], (id, x, y) =>
    topPos.set(id, { x, y })
  );

  // コンテナノードを生成（親→子の順で配列に積む）。
  const containerById = new Map((spec.containers ?? []).map((c) => [c.id, c]));
  function emitContainer(id: string, absolute: { x: number; y: number }) {
    const c = containerById.get(id)!;
    const s = size.get(id)!;
    rfNodes.push({
      id: `c:${id}`,
      type: "container",
      position: absolute,
      data: { kind: "container", label: c.label, type: c.type } as ContainerNodeData,
      style: { width: s.w, height: s.h },
      selectable: false,
      draggable: false,
      zIndex: 0,
    });
    // 子コンテナ
    for (const child of childContainers(spec, id)) {
      const rel = pos.get(child.id)!;
      emitContainer(child.id, { x: absolute.x + rel.x, y: absolute.y + rel.y });
    }
  }

  for (const tc of topContainers) emitContainer(tc.id, topPos.get(tc.id)!);

  // サービスノードを生成（親コンテナがあれば parentId 付き・相対座標）。
  for (const n of spec.nodes) {
    const data: ServiceNodeData = {
      kind: "service",
      service: n.service,
      label: n.label,
      faulty: n.state === "faulty",
    };
    if (n.parent) {
      rfNodes.push({
        id: n.id,
        type: "service",
        position: pos.get(n.id) ?? { x: PAD, y: PAD_TOP },
        parentId: `c:${n.parent}`,
        extent: "parent",
        data,
        zIndex: 1,
      });
    } else {
      rfNodes.push({
        id: n.id,
        type: "service",
        position: topPos.get(n.id) ?? { x: 0, y: 0 },
        data,
        zIndex: 1,
      });
    }
  }

  const edges: Edge[] = spec.edges.map((e, i) => ({
    id: `e${i}:${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    label: e.label,
    markerEnd:
      e.directed === false ? undefined : { type: MarkerType.ArrowClosed },
    labelStyle: { fontSize: 11, fill: "#475569" },
    labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
    style: { stroke: "#94a3b8" },
  }));

  return { nodes: rfNodes, edges };
}
