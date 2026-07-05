import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { specToFlow } from "./toFlow";
import type { DiagramSpec } from "@/lib/schema/types";

const spec: DiagramSpec = {
  renderer: "spec",
  containers: [{ id: "vpc", type: "VPC", label: "VPC" }],
  nodes: [
    { id: "ec2", service: "EC2", label: "App", parent: "vpc" },
    { id: "igw", service: "InternetGateway", label: "IGW" },
  ],
  edges: [{ from: "ec2", to: "igw", label: "out" }],
};

// コンテナノードは絶対座標、親を持つリーフノードは親からの相対座標（React Flow の
// parentId 仕様）で返る。そのためテストでの containment 判定は、リーフノードのみ
// 親の絶対座標を加算して真の絶対座標に解決する必要がある。
function resolveAbsolute(nodes: Node[], id: string): { x: number; y: number } {
  const n = nodes.find((x) => x.id === id)!;
  if (!n.parentId) return n.position;
  const parent = resolveAbsolute(nodes, n.parentId);
  return { x: parent.x + n.position.x, y: parent.y + n.position.y };
}

function rect(nodes: Node[], id: string) {
  const n = nodes.find((x) => x.id === id)!;
  const pos = resolveAbsolute(nodes, id);
  const style = n.style as { width?: number; height?: number } | undefined;
  return { x: pos.x, y: pos.y, w: style?.width ?? 148, h: style?.height ?? 62 };
}

function within(
  inner: { x: number; y: number; w: number; h: number },
  outer: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

describe("specToFlow", () => {
  it("コンテナ・ノード・エッジを React Flow 形式へ変換する", () => {
    const { nodes } = specToFlow(spec);

    // コンテナノード（id は c: プレフィックス）とサービスノード2つ
    expect(nodes.find((n) => n.id === "c:vpc")?.type).toBe("container");
    expect(nodes.filter((n) => n.type === "service")).toHaveLength(2);
  });

  it("親コンテナを持つノードに parentId を付与する", () => {
    const nodes = specToFlow(spec).nodes;
    const ec2 = nodes.find((n) => n.id === "ec2");
    const igw = nodes.find((n) => n.id === "igw");
    expect(ec2?.parentId).toBe("c:vpc");
    expect(igw?.parentId).toBeUndefined();
  });

  it("エッジの source/target を保持する", () => {
    const { edges } = specToFlow(spec);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: "ec2", target: "igw", label: "out" });
  });

  // 回帰テスト: コンテナ入れ子（VPC > Public/Private Subnet）の絶対座標が
  // 実際に親の内側に収まることを検証する。
  // 過去に src/index.css の `.react-flow__node-container { position: relative }` が
  // React Flow 本体の `.react-flow__node { position: absolute }` を後勝ちで上書きし、
  // コンテナが通常のドキュメントフローで描画されて親の外にはみ出す不具合があった
  // （原因はCSSだが、座標計算そのものの回帰も併せて防ぐ）。
  it("入れ子コンテナと配下ノードが親の範囲内に収まる（ネスト崩れの回帰防止）", () => {
    const nested: DiagramSpec = {
      renderer: "spec",
      containers: [
        { id: "vpc", type: "VPC", label: "VPC 10.0.0.0/16" },
        { id: "pub", type: "PublicSubnet", label: "Public Subnet", parent: "vpc" },
        { id: "priv", type: "PrivateSubnet", label: "Private Subnet", parent: "vpc" },
      ],
      nodes: [
        { id: "ec2", service: "EC2", label: "App Server", parent: "priv" },
        { id: "nat", service: "NATGateway", label: "NAT GW", parent: "pub" },
        { id: "igw", service: "InternetGateway", label: "IGW" },
      ],
      edges: [
        { from: "ec2", to: "nat", label: "outbound 443" },
        { from: "nat", to: "igw" },
      ],
    };

    const { nodes } = specToFlow(nested);
    const vpc = rect(nodes, "c:vpc");
    const pub = rect(nodes, "c:pub");
    const priv = rect(nodes, "c:priv");

    expect(within(pub, vpc)).toBe(true);
    expect(within(priv, vpc)).toBe(true);
    expect(within(rect(nodes, "nat"), pub)).toBe(true);
    expect(within(rect(nodes, "ec2"), priv)).toBe(true);
    // igw は無所属コンテナのため vpc の外にあってよい
    expect(within(rect(nodes, "igw"), vpc)).toBe(false);
  });
});
