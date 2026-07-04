import { create } from "zustand";
import type { Question } from "@/lib/schema/types";

// docs/feature/quiz.md「セッション状態」。
export type QuizMode = "mini" | "random" | "exam";

type QuizState = {
  mode: QuizMode | null;
  questions: Question[]; // 出題順に並んだ実体
  currentIndex: number;
  answers: Record<string, string[]>; // questionId → 選択
  elapsed: Record<string, number>; // questionId → 所要秒
  flags: Set<string>; // 見直しフラグ（模試）
  endsAt: number | null; // 模試の終了予定時刻（epoch ms）
  finished: boolean;
  saved: boolean; // 履歴保存済みか（結果画面の二重保存防止）

  start: (mode: QuizMode, questions: Question[], durationSec?: number) => void;
  setAnswer: (questionId: string, selected: string[], elapsedSec: number) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  finish: () => void;
  markSaved: () => void;
  reset: () => void;
};

export const useQuizSession = create<QuizState>((set, get) => ({
  mode: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  elapsed: {},
  flags: new Set(),
  endsAt: null,
  finished: false,
  saved: false,

  start: (mode, questions, durationSec) =>
    set({
      mode,
      questions,
      currentIndex: 0,
      answers: {},
      elapsed: {},
      flags: new Set(),
      endsAt: durationSec ? Date.now() + durationSec * 1000 : null,
      finished: false,
      saved: false,
    }),

  setAnswer: (questionId, selected, elapsedSec) =>
    set((s) => ({
      answers: { ...s.answers, [questionId]: selected },
      elapsed: { ...s.elapsed, [questionId]: elapsedSec },
    })),

  toggleFlag: (questionId) =>
    set((s) => {
      const flags = new Set(s.flags);
      if (flags.has(questionId)) flags.delete(questionId);
      else flags.add(questionId);
      return { flags };
    }),

  goTo: (index) =>
    set((s) => ({
      currentIndex: Math.max(0, Math.min(index, s.questions.length - 1)),
    })),

  next: () => {
    const { currentIndex, questions } = get();
    if (currentIndex >= questions.length - 1) set({ finished: true });
    else set({ currentIndex: currentIndex + 1 });
  },

  finish: () => set({ finished: true }),
  markSaved: () => set({ saved: true }),

  reset: () =>
    set({
      mode: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      elapsed: {},
      flags: new Set(),
      endsAt: null,
      finished: false,
      saved: false,
    }),
}));
