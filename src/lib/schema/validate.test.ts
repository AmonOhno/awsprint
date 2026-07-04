import { describe, expect, it } from "vitest";
import { validateQuestions } from "./validate";
import type { Question } from "./types";

function base(): Question {
  return {
    id: "Q-0001",
    domain: "SECURE_ARCH",
    type: "single",
    stem: "s",
    choices: [
      { id: "a", text: "a", correct: true },
      { id: "b", text: "b", correct: false },
    ],
    explanation: { summary: '<ref id="nat">NAT</ref>', refIds: ["nat"] },
    diagram: {
      renderer: "spec",
      nodes: [{ id: "nat", service: "NATGateway", label: "NAT" }],
      edges: [],
    },
  };
}

describe("validateQuestions", () => {
  it("整合の取れた問題は ok", () => {
    const res = validateQuestions([base()]);
    expect(res.ok).toBe(true);
    expect(res.issues.filter((i) => i.level === "error")).toHaveLength(0);
  });

  it("refId が図に無ければエラー", () => {
    const q = base();
    q.explanation = { summary: '<ref id="missing">X</ref>', refIds: ["missing"] };
    const res = validateQuestions([q]);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.message.includes("missing"))).toBe(true);
  });

  it("single で正解が2つならエラー", () => {
    const q = base();
    q.choices[1].correct = true;
    const res = validateQuestions([q]);
    expect(res.ok).toBe(false);
  });

  it("id 重複はエラー", () => {
    const res = validateQuestions([base(), base()]);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.message.includes("重複"))).toBe(true);
  });

  it("edge が存在しない node を指すとエラー", () => {
    const q = base();
    q.diagram!.edges = [{ from: "nat", to: "ghost" }];
    const res = validateQuestions([q]);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.message.includes("ghost"))).toBe(true);
  });
});
