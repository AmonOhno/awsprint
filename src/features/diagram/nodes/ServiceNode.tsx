import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { serviceStyle } from "../iconMap";
import { useHighlight } from "../useHighlight";
import type { ServiceNodeData } from "../toFlow";

function ServiceNodeImpl({ id, data }: NodeProps) {
  const d = data as ServiceNodeData;
  const style = serviceStyle(d.service);
  const active = useHighlight((s) => s.activeId === id);
  const setActive = useHighlight((s) => s.setActive);

  return (
    <div
      onMouseEnter={() => setActive(id)}
      onMouseLeave={() => setActive(undefined)}
      onClick={() => setActive(active ? undefined : id)}
      className={[
        "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition-all",
        "w-[148px] h-[62px] cursor-pointer select-none",
        d.faulty
          ? "border-red-500 ring-2 ring-red-200"
          : "border-slate-200",
        active
          ? "scale-105 ring-4 ring-sky-300 border-sky-500 shadow-md"
          : "",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-300" />
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
        style={{ backgroundColor: style.color }}
        aria-hidden
      >
        {style.abbr}
      </span>
      <span className="text-xs leading-tight text-slate-700 line-clamp-2">
        {d.label}
        {d.faulty && (
          <span className="ml-1 font-bold text-red-600" title="欠陥箇所">
            ⚠
          </span>
        )}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-300"
      />
    </div>
  );
}

export const ServiceNode = memo(ServiceNodeImpl);
