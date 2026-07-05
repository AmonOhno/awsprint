import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import * as Dialog from "@radix-ui/react-dialog";
import type { DiagramSpec } from "@/lib/schema/types";
import { specToFlow } from "./toFlow";
import { ServiceNode } from "./nodes/ServiceNode";
import { ContainerNode } from "./nodes/ContainerNode";

const nodeTypes: NodeTypes = {
  service: ServiceNode,
  container: ContainerNode,
};

type Props = {
  spec: DiagramSpec;
  height?: number;
  /** 拡大表示ボタンを出すか（モーダル内の描画では非表示にする） */
  expandable?: boolean;
};

// メイン表示とモーダル表示は別々の React Flow インスタンス（内部状態を共有させないため、
// それぞれ独立した ReactFlowProvider の下で描画する）。
function FlowCanvas({ spec, height }: { spec: DiagramSpec; height: number }) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner spec={spec} height={height} />
    </ReactFlowProvider>
  );
}

function FlowCanvasInner({ spec, height }: { spec: DiagramSpec; height: number }) {
  const { nodes, edges } = useMemo(() => {
    if (spec.renderer === "image") return { nodes: [], edges: [] };
    return specToFlow(spec);
  }, [spec]);

  if (spec.renderer === "image") {
    return (
      <img
        src={spec.imageUrl}
        alt="アーキテクチャ構成図"
        className="mx-auto max-h-full w-auto rounded-lg border border-slate-200"
      />
    );
  }

  return (
    <div
      className="w-full rounded-lg border border-slate-200 bg-slate-50"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background gap={16} color="#e2e8f0" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// docs/feature/diagram_highlight.md: DiagramSpec → React Flow の描画ラッパ。
// FR-06 AC「拡大表示できる」: 全画面モーダルで同じ図を大きく再描画する。
// useHighlight はグローバルストアのため、モーダル内外のハイライトは自動的に同期する。
export function DiagramView({ spec, height = 360, expandable = true }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <FlowCanvas spec={spec} height={height} />
      {expandable && spec.renderer === "spec" && (
        <div className="flex justify-end">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                ⤢ 拡大表示
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
              <Dialog.Content
                className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-xl"
                aria-describedby={undefined}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Dialog.Title className="text-sm font-semibold text-slate-700">
                    アーキテクチャ図（拡大表示）
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="閉じる"
                      className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  </Dialog.Close>
                </div>
                <FlowCanvas spec={spec} height={Math.round(window.innerHeight * 0.75)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
    </div>
  );
}
