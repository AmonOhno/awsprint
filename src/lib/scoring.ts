import type { Attempt, Question } from "@/lib/schema/types";

// docs/feature/quiz.md「採点ロジック」。純関数（テスト対象）。

// 単一選択は一致、複数選択は集合の完全一致（部分点なし＝本番準拠）。
export function isCorrect(q: Question, selected: string[]): boolean {
  const correctIds = q.choices.filter((c) => c.correct).map((c) => c.id);
  const sel = new Set(selected);
  if (sel.size !== correctIds.length) return false;
  return correctIds.every((id) => sel.has(id));
}

// 回答が確定可能か（single=1つ、multiple=正解数と同数を選択）。
export function isSelectionComplete(q: Question, selected: string[]): boolean {
  if (selected.length === 0) return false;
  if (q.type === "single") return selected.length === 1;
  const need = q.choices.filter((c) => c.correct).length;
  return selected.length === need;
}

export type ExamScore = { scorePct: number; passed: boolean };

// 模試スコア。total は出題総数（未回答は誤答＝分母に含む）。
export function scoreExam(
  attempts: Pick<Attempt, "correct">[],
  total: number,
  passLinePct: number
): ExamScore {
  const correct = attempts.filter((a) => a.correct).length;
  const scorePct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { scorePct, passed: scorePct >= passLinePct };
}
