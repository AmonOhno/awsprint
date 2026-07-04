import { useEffect, useState } from "react";
import { repository } from "@/lib/repository/local";

// 要復習リストへの登録／解除（FR-10）。
export function BookmarkButton({ questionId }: { questionId: string }) {
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    repository.isBookmarked(questionId).then((v) => alive && setOn(v));
    return () => {
      alive = false;
    };
  }, [questionId]);

  async function toggle() {
    const next = await repository.toggleBookmark(questionId);
    setOn(next);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on ?? false}
      className={[
        "rounded border px-2 py-1 text-xs transition-colors",
        on
          ? "border-amber-400 bg-amber-50 text-amber-700"
          : "border-slate-300 text-slate-500 hover:bg-slate-50",
      ].join(" ")}
    >
      {on ? "★ 復習リスト" : "☆ 復習に追加"}
    </button>
  );
}
