import { describe, expect, it } from "vitest";
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
});
