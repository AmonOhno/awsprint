import { repository } from "@/lib/repository/local";
import type { Domain } from "@/lib/schema/types";
import { useQuizSession, type QuizMode } from "./useQuizSession";
import { pickExam, pickMini, pickRandom } from "./selection";
import { getRecent, pushRecent } from "./recent";

const EXAM_DURATION_SEC = 130 * 60;

export type StartResult = { ok: true; count: number } | { ok: false; reason: string };

// モードに応じて出題を組み立て、セッションを開始する。
export async function startSession(
  mode: QuizMode,
  opts: { domains?: Domain[]; limit?: number } = {}
): Promise<StartResult> {
  const start = useQuizSession.getState().start;

  if (mode === "mini") {
    const pool = await repository.listQuestions({ domains: opts.domains });
    if (pool.length === 0) return { ok: false, reason: "対象分野の問題がありません" };
    const picked = pickMini(pool, opts.limit ?? 10);
    start("mini", picked);
    return { ok: true, count: picked.length };
  }

  if (mode === "random") {
    const pool = await repository.listQuestions();
    const q = pickRandom(pool, getRecent());
    if (!q) return { ok: false, reason: "問題がありません" };
    pushRecent(q.id);
    start("random", [q]);
    return { ok: true, count: 1 };
  }

  // exam
  const pool = await repository.listQuestions();
  if (pool.length === 0) return { ok: false, reason: "問題がありません" };
  const { questions } = pickExam(pool, 65);
  start("exam", questions, EXAM_DURATION_SEC);
  return { ok: true, count: questions.length };
}
