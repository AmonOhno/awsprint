import { useEffect, useRef } from "react";
import { parseRefs } from "./parseRefs";
import { useHighlight } from "../diagram/useHighlight";

// <ref> を RefSpan に変換して描画。図と双方向にハイライト連動する（FR-07）。
export function ExplanationText({ source }: { source: string }) {
  const segments = parseRefs(source);
  return (
    <span>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <RefSpan key={i} id={seg.id} text={seg.text} />
        )
      )}
    </span>
  );
}

function RefSpan({ id, text }: { id: string; text: string }) {
  const active = useHighlight((s) => s.activeId === id);
  const setActive = useHighlight((s) => s.setActive);
  const ref = useRef<HTMLButtonElement>(null);

  // 図→テキスト: activeId が自分になったらスクロールして可視化。
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      onMouseEnter={() => setActive(id)}
      onMouseLeave={() => setActive(undefined)}
      onFocus={() => setActive(id)}
      onBlur={() => setActive(undefined)}
      onClick={() => setActive(active ? undefined : id)}
      className={[
        "mx-0.5 rounded px-1 font-medium underline decoration-dotted underline-offset-2 transition-colors",
        active
          ? "bg-sky-200 text-sky-900 decoration-sky-500"
          : "bg-sky-50 text-sky-700 decoration-sky-300 hover:bg-sky-100",
      ].join(" ")}
    >
      {text}
    </button>
  );
}
