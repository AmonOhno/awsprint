import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { repository } from "@/lib/repository/local";
import { useAsync } from "@/lib/useAsync";
import { useQuizSession } from "@/features/quiz/useQuizSession";
import { shuffle } from "@/features/quiz/selection";
import { DomainBadge } from "@/components/DomainBadge";
import { DOMAINS, DOMAIN_LABELS, type Domain, type Question } from "@/lib/schema/types";

export function BookmarksPage() {
  const nav = useNavigate();
  const start = useQuizSession((s) => s.start);
  const [filter, setFilter] = useState<Domain | "ALL">("ALL");

  const data = useAsync(async () => {
    const bms = await repository.listBookmarks();
    const ids = bms.map((b) => b.questionId);
    const qs = await repository.listQuestions({ ids });
    // 並びをブックマーク順（新しい順）に合わせる
    const byId = new Map(qs.map((q) => [q.id, q]));
    return ids.map((id) => byId.get(id)).filter((q): q is Question => !!q);
  }, []);

  const filtered = useMemo(
    () =>
      (data.data ?? []).filter((q) => filter === "ALL" || q.domain === filter),
    [data.data, filter]
  );

  function practice(questions: Question[]) {
    if (questions.length === 0) return;
    start("mini", shuffle(questions));
    nav("/practice/quiz");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ブックマーク</h1>
        {filtered.length > 0 && (
          <button
            onClick={() => practice(filtered)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            この一覧で演習（{filtered.length}問）
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          すべて
        </FilterChip>
        {DOMAINS.map((d) => (
          <FilterChip key={d} active={filter === d} onClick={() => setFilter(d)}>
            {DOMAIN_LABELS[d]}
          </FilterChip>
        ))}
      </div>

      {data.loading && <p className="text-slate-500">読み込み中…</p>}
      {data.data && filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          ブックマークはありません。結果画面の「☆ 復習に追加」から登録できます。
        </p>
      )}

      <ul className="space-y-2">
        {filtered.map((q) => (
          <li
            key={q.id}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="min-w-0 flex-1">
              <DomainBadge domain={q.domain} />
              <p className="mt-1 truncate text-sm text-slate-700">{q.stem}</p>
            </div>
            <button
              onClick={() => practice([q])}
              className="shrink-0 rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              解く
            </button>
            <button
              onClick={async () => {
                await repository.toggleBookmark(q.id);
                data.reload();
              }}
              className="shrink-0 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              解除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-sm",
        active ? "border-slate-900 bg-slate-100" : "border-slate-200 text-slate-500",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
