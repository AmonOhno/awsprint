import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizSession } from "@/features/quiz/useQuizSession";
import { useSettings } from "@/features/settings/useSettings";
import { repository } from "@/lib/repository/local";
import { isCorrect, scoreExam } from "@/lib/scoring";
import type { Attempt, ExamSession, Question } from "@/lib/schema/types";
import { startSession } from "@/features/quiz/startSession";
import { QuestionResult } from "@/features/quiz/QuestionResult";

export function ResultPage() {
  const nav = useNavigate();
  const { mode, questions, answers, elapsed, finished, saved, markSaved, reset } =
    useQuizSession();
  const { passLinePct } = useSettings();
  const [busy, setBusy] = useState(false);

  const answered = useMemo(
    () => questions.filter((q) => answers[q.id] != null),
    [questions, answers]
  );
  const correctCount = useMemo(
    () => answered.filter((q) => isCorrect(q, answers[q.id])).length,
    [answered, answers]
  );

  // 履歴保存（結果画面で一度だけ）。saved フラグで二重保存を防止。
  useEffect(() => {
    if (!mode || !finished || saved) return;
    markSaved();
    void persist(mode, questions, answers, elapsed, passLinePct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, finished, saved]);

  useEffect(() => {
    if (!mode || !finished) nav("/practice/setup", { replace: true });
  }, [mode, finished, nav]);

  if (!mode || !finished) return null;

  const scorePct = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;
  // 模試は未回答も分母（総出題数）に含めて合否判定（FR-04）。
  const examScore = mode === "exam" ? { scorePct, passed: scorePct >= passLinePct } : null;

  async function nextRandom() {
    setBusy(true);
    const res = await startSession("random");
    setBusy(false);
    if (res.ok) nav("/practice/quiz");
  }

  function exit() {
    reset();
    nav("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-bold">結果</h1>
        {mode === "random" ? (
          <p className="mt-1 text-slate-600">
            {correctCount === 1 ? "正解！" : "不正解"}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-baseline gap-4">
            <div>
              <span className="text-3xl font-bold">{scorePct}%</span>
              <span className="ml-2 text-slate-500">
                （{correctCount} / {questions.length} 問正解）
              </span>
            </div>
            {examScore && (
              <span
                className={[
                  "rounded px-3 py-1 text-sm font-medium",
                  examScore.passed
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-700",
                ].join(" ")}
              >
                {examScore.passed ? "合格" : "不合格"}（目安 {passLinePct}%）
              </span>
            )}
          </div>
        )}
      </section>

      <div className="space-y-8">
        {questions.map((q, i) => (
          <QuestionResult
            key={q.id}
            index={i}
            question={q}
            selected={answers[q.id] ?? []}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === "random" && (
          <button
            onClick={nextRandom}
            disabled={busy}
            className="rounded-lg bg-slate-900 px-6 py-2.5 font-medium text-white hover:bg-slate-700 disabled:opacity-40"
          >
            {busy ? "…" : "次の問題"}
          </button>
        )}
        <button
          onClick={exit}
          className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
        >
          ホームへ戻る
        </button>
      </div>
    </div>
  );
}

async function persist(
  mode: string,
  questions: Question[],
  answers: Record<string, string[]>,
  elapsed: Record<string, number>,
  passLinePct: number
): Promise<void> {
  const attempts: Attempt[] = [];
  for (const q of questions) {
    const sel = answers[q.id];
    if (sel == null) continue; // 未回答（模試）は履歴に残さない
    const a: Attempt = {
      questionId: q.id,
      domain: q.domain,
      selected: sel,
      correct: isCorrect(q, sel),
      elapsedSec: elapsed[q.id] ?? 0,
      answeredAt: new Date().toISOString(),
    };
    attempts.push(a);
    await repository.saveAttempt(a);
  }

  if (mode === "exam") {
    const { scorePct, passed } = scoreExam(
      attempts,
      questions.length,
      passLinePct
    );
    const session: ExamSession = {
      id: `exam-${Date.now()}`,
      questionIds: questions.map((q) => q.id),
      startedAt: new Date().toISOString(),
      durationSec: 130 * 60,
      attempts,
      scorePct,
      passed,
    };
    await repository.saveExamSession(session);
  }
}
