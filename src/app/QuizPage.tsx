import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizSession } from "@/features/quiz/useQuizSession";
import { useSettings } from "@/features/settings/useSettings";
import { isSelectionComplete } from "@/lib/scoring";
import { DiagramView } from "@/features/diagram/DiagramView";
import { DomainBadge } from "@/components/DomainBadge";
import { ExamTimer } from "@/features/quiz/ExamTimer";

export function QuizPage() {
  const nav = useNavigate();
  const {
    mode,
    questions,
    currentIndex,
    answers,
    flags,
    setAnswer,
    toggleFlag,
    goTo,
    next,
    finish,
    finished,
  } = useQuizSession();
  const { diagramTiming } = useSettings();

  const question = questions[currentIndex];
  const [selected, setSelected] = useState<string[]>([]);
  const shownAt = useRef<number>(Date.now());

  // 現在の問題が変わったら、既存回答を復元しタイマーを起点リセット。
  useEffect(() => {
    if (!question) return;
    setSelected(answers[question.id] ?? []);
    shownAt.current = Date.now();
  }, [question, answers]);

  // セッションが無ければ設定へ、終了なら結果へ。
  useEffect(() => {
    if (!mode) nav("/practice/setup", { replace: true });
    else if (finished) nav("/practice/result", { replace: true });
  }, [mode, finished, nav]);

  if (!mode || !question) return null;

  const showHint =
    mode !== "exam" && diagramTiming === "question" && !!question.diagram;
  const needCount =
    question.type === "multiple"
      ? question.choices.filter((c) => c.correct).length
      : 1;

  function choose(id: string) {
    if (question.type === "single") setSelected([id]);
    else
      setSelected((cur) =>
        cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      );
  }

  function submit() {
    const elapsed = Math.round((Date.now() - shownAt.current) / 1000);
    setAnswer(question.id, selected, elapsed);
    next();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
          <DomainBadge domain={question.domain} />
        </div>
        <div className="flex items-center gap-3">
          {mode === "exam" && <ExamTimer onExpire={finish} />}
          {mode === "exam" && (
            <button
              onClick={() => toggleFlag(question.id)}
              className={[
                "rounded border px-2 py-1 text-xs",
                flags.has(question.id)
                  ? "border-amber-500 bg-amber-100 text-amber-800"
                  : "border-slate-300 text-slate-500",
              ].join(" ")}
            >
              {flags.has(question.id) ? "★ 見直し" : "☆ 見直し"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="whitespace-pre-wrap leading-relaxed">{question.stem}</p>

        {showHint && question.diagram && (
          <div className="mt-4">
            <div className="mb-1 text-xs font-medium text-slate-500">
              ヒント: 構成図
            </div>
            <DiagramView spec={question.diagram} height={280} />
          </div>
        )}

        {question.type === "multiple" && (
          <p className="mt-3 text-sm font-medium text-slate-600">
            {needCount}個 選択してください
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {question.choices.map((c) => {
            const on = selected.includes(c.id);
            return (
              <li key={c.id}>
                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    on
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-400",
                  ].join(" ")}
                >
                  <input
                    type={question.type === "single" ? "radio" : "checkbox"}
                    name="choice"
                    checked={on}
                    onChange={() => choose(c.id)}
                    className="mt-1"
                  />
                  <span className="text-sm leading-relaxed">{c.text}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        {mode === "exam" ? (
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            前へ
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          {mode === "exam" && (
            <button
              onClick={finish}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
            >
              採点する
            </button>
          )}
          <button
            onClick={submit}
            disabled={!isSelectionComplete(question, selected)}
            className="rounded-lg bg-slate-900 px-6 py-2 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
          >
            {mode === "exam"
              ? currentIndex === questions.length - 1
                ? "回答して採点"
                : "回答して次へ"
              : currentIndex === questions.length - 1
                ? "回答する"
                : "回答して次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
