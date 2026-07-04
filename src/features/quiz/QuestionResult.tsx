import type { Question } from "@/lib/schema/types";
import { isCorrect } from "@/lib/scoring";
import { DiagramView } from "@/features/diagram/DiagramView";
import { ExplanationText } from "@/features/explanation/ExplanationText";
import { DomainBadge } from "@/components/DomainBadge";
import { BookmarkButton } from "./BookmarkButton";

// 結果・解説（SCR-04）の1問分。図（左）と正誤別解説（右）を双方向連動させる。
export function QuestionResult({
  index,
  question,
  selected,
}: {
  index: number;
  question: Question;
  selected: string[];
}) {
  const answered = selected.length > 0;
  const correct = answered && isCorrect(question, selected);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">Q{index + 1}</span>
          <DomainBadge domain={question.domain} />
          <span
            className={[
              "rounded px-2 py-0.5 text-xs font-bold",
              !answered
                ? "bg-slate-100 text-slate-500"
                : correct
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
            ].join(" ")}
          >
            {!answered ? "未回答" : correct ? "◯ 正解" : "✗ 不正解"}
          </span>
        </div>
        <BookmarkButton questionId={question.id} />
      </div>

      <p className="whitespace-pre-wrap leading-relaxed">{question.stem}</p>

      {/* 選択肢別 ◯✗ と理由（FR-08） */}
      <ul className="mt-4 space-y-2">
        {question.choices.map((c) => {
          const chosen = selected.includes(c.id);
          return (
            <li
              key={c.id}
              className={[
                "rounded-lg border p-3",
                c.correct
                  ? "border-green-300 bg-green-50"
                  : chosen
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold" aria-hidden>
                  {c.correct ? "◯" : "✗"}
                </span>
                <div className="text-sm">
                  <span className="leading-relaxed">{c.text}</span>
                  {chosen && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                      あなたの回答
                    </span>
                  )}
                  {c.why && (
                    <p className="mt-1 text-slate-600">
                      <ExplanationText source={c.why} />
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 図（コア）と解説サマリの連動 */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {question.diagram && (
          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">
              正解構成のアーキテクチャ図
            </div>
            <DiagramView spec={question.diagram} height={320} />
          </div>
        )}
        <div className={question.diagram ? "" : "md:col-span-2"}>
          <div className="mb-1 text-xs font-medium text-slate-500">解説</div>
          <p className="leading-relaxed text-slate-700">
            <ExplanationText source={question.explanation.summary} />
          </p>
          {question.docLinks && question.docLinks.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-slate-500">
                公式ドキュメント
              </div>
              <ul className="space-y-1">
                {question.docLinks.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sky-700 underline hover:text-sky-900"
                    >
                      {l.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
