import { useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
};

// docs/feature/diagram_highlight.md: DiagramSpec → React Flow の描画ラッパ。
function DiagramInner({ spec, height = 360 }: Props) {
  const { nodes, edges } = useMemo(() => {
    if (spec.renderer === "image") return { nodes: [], edges: [] };
    return specToFlow(spec);
  }, [spec]);

  if (spec.renderer === "image") {
    return (
      <img
        src={spec.imageUrl}
        alt="アーキテクチャ構成図"
        className="mx-auto max-h-[360px] w-auto rounded-lg border border-slate-200"
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
        fitViewOptions={{ padding: 0.15 }}
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

export function DiagramView(props: Props) {
  return (
    <ReactFlowProvider>
      <DiagramInner {...props} />
    </ReactFlowProvider>
  );
}
