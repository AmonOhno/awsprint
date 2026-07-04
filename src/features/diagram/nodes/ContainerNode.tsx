import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { ContainerNodeData } from "../toFlow";

const TYPE_COLOR: Record<string, string> = {
  Region: "#64748b",
  VPC: "#2563eb",
  AZ: "#0891b2",
  PublicSubnet: "#16a34a",
  PrivateSubnet: "#9333ea",
};

function ContainerNodeImpl({ data }: NodeProps) {
  const d = data as ContainerNodeData;
  const color = TYPE_COLOR[d.type] ?? "#64748b";
  return (
    <div
      className="h-full w-full rounded-lg border-2 border-dashed"
      style={{ borderColor: color, backgroundColor: `${color}0d` }}
    >
      <span
        className="absolute left-2 top-1 text-[11px] font-semibold"
        style={{ color }}
      >
        {d.label}
      </span>
    </div>
  );
}

export const ContainerNode = memo(ContainerNodeImpl);
