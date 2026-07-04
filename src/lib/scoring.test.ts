import { describe, expect, it } from "vitest";
import { isCorrect, isSelectionComplete, scoreExam } from "./scoring";
import type { Question } from "@/lib/schema/types";

const single: Question = {
  id: "Q-0001",
  domain: "SECURE_ARCH",
  type: "single",
  stem: "s",
  choices: [
    { id: "a", text: "a", correct: true },
    { id: "b", text: "b", correct: false },
  ],
  explanation: { summary: "x", refIds: [] },
};

const multiple: Question = {
  id: "Q-0002",
  domain: "SECURE_ARCH",
  type: "multiple",
  stem: "s",
  choices: [
    { id: "a", text: "a", correct: true },
    { id: "b", text: "b", correct: true },
    { id: "c", text: "c", correct: false },
  ],
  explanation: { summary: "x", refIds: [] },
};

describe("isCorrect", () => {
  it("single: 正解IDのみで正解", () => {
    expect(isCorrect(single, ["a"])).toBe(true);
    expect(isCorrect(single, ["b"])).toBe(false);
  });

  it("multiple: 集合が完全一致で正解（部分点なし）", () => {
    expect(isCorrect(multiple, ["a", "b"])).toBe(true);
    expect(isCorrect(multiple, ["b", "a"])).toBe(true);
    expect(isCorrect(multiple, ["a"])).toBe(false); // 不足
    expect(isCorrect(multiple, ["a", "b", "c"])).toBe(false); // 過剰
  });

  it("未選択は不正解", () => {
    expect(isCorrect(single, [])).toBe(false);
  });
});

describe("isSelectionComplete", () => {
  it("single はちょうど1つ", () => {
    expect(isSelectionComplete(single, [])).toBe(false);
    expect(isSelectionComplete(single, ["a"])).toBe(true);
  });
  it("multiple は正解数と同数", () => {
    expect(isSelectionComplete(multiple, ["a"])).toBe(false);
    expect(isSelectionComplete(multiple, ["a", "c"])).toBe(true);
    expect(isSelectionComplete(multiple, ["a", "b", "c"])).toBe(false);
  });
});

describe("scoreExam", () => {
  it("未回答を分母に含めて得点率と合否を返す", () => {
    const attempts = [{ correct: true }, { correct: true }, { correct: false }];
    // 65問中2問正解 → 3%
    expect(scoreExam(attempts, 65, 72)).toEqual({ scorePct: 3, passed: false });
  });
  it("合格ライン以上で passed", () => {
    const attempts = Array.from({ length: 50 }, () => ({ correct: true }));
    expect(scoreExam(attempts, 65, 72)).toEqual({ scorePct: 77, passed: true });
  });
  it("total=0 は 0%", () => {
    expect(scoreExam([], 0, 72)).toEqual({ scorePct: 0, passed: false });
  });
});
