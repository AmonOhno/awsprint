import type { Question } from "./types";
import { questionFileSchema } from "./question";

// docs/data/schema.md「検証ルール」の実装。
// zod（型・enum・単複正解数）に加えて、参照整合性のクロスチェックを行う。

export type Issue = {
  level: "error" | "warn";
  path: string; // 例: "[2].explanation.refIds"
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  total: number;
  okCount: number;
  issues: Issue[];
  questions: Question[]; // zod を通過した問題（クロスチェック警告は含みうる）
};

const REF_RE = /<ref\s+id="([^"]+)"/g;

function refIdsInText(text: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(text)) !== null) ids.push(m[1]);
  return ids;
}

function checkDiagramRefs(q: Question, idx: number, issues: Issue[]): void {
  const d = q.diagram;
  const base = `[${idx}]`;
  if (!d) return;

  const nodeIds = new Set(d.nodes.map((n) => n.id));
  const containerIds = new Set((d.containers ?? []).map((c) => c.id));
  const allIds = new Set([...nodeIds, ...containerIds]);

  // ルール4: refIds と本文 <ref> が図のIDに存在
  const textRefs = [
    q.explanation.summary,
    ...q.choices.map((c) => c.why ?? ""),
  ].flatMap(refIdsInText);
  for (const r of [...q.explanation.refIds, ...textRefs]) {
    if (!allIds.has(r)) {
      issues.push({
        level: "error",
        path: `${base} ref "${r}"`,
        message: `解説の refId "${r}" が図の node/container id に存在しません`,
      });
    }
  }

  // ルール5: エッジ・親参照の実在と入れ子循環
  for (const [i, e] of d.edges.entries()) {
    if (!nodeIds.has(e.from))
      issues.push({
        level: "error",
        path: `${base}.diagram.edges[${i}].from`,
        message: `edge.from "${e.from}" が node に存在しません`,
      });
    if (!nodeIds.has(e.to))
      issues.push({
        level: "error",
        path: `${base}.diagram.edges[${i}].to`,
        message: `edge.to "${e.to}" が node に存在しません`,
      });
  }
  for (const n of d.nodes) {
    if (n.parent && !containerIds.has(n.parent))
      issues.push({
        level: "error",
        path: `${base}.diagram node "${n.id}"`,
        message: `parent "${n.parent}" が container に存在しません`,
      });
  }
  for (const c of d.containers ?? []) {
    if (c.parent && !containerIds.has(c.parent))
      issues.push({
        level: "error",
        path: `${base}.diagram container "${c.id}"`,
        message: `parent "${c.parent}" が container に存在しません`,
      });
  }
  if (hasContainerCycle(d.containers ?? [])) {
    issues.push({
      level: "error",
      path: `${base}.diagram.containers`,
      message: "コンテナの入れ子に循環があります",
    });
  }

  // ルール7（警告）: refIds にあるが summary 中に <ref> が無い
  const summaryRefs = new Set(refIdsInText(q.explanation.summary));
  for (const r of q.explanation.refIds) {
    if (!summaryRefs.has(r))
      issues.push({
        level: "warn",
        path: `${base}.explanation.refIds`,
        message: `refId "${r}" が summary 中の <ref> に出現しません`,
      });
  }
}

function hasContainerCycle(
  containers: { id: string; parent?: string }[]
): boolean {
  const parentOf = new Map(containers.map((c) => [c.id, c.parent]));
  for (const c of containers) {
    const seen = new Set<string>();
    let cur: string | undefined = c.id;
    while (cur) {
      if (seen.has(cur)) return true;
      seen.add(cur);
      cur = parentOf.get(cur);
    }
  }
  return false;
}

export function validateQuestions(data: unknown): ValidationResult {
  const issues: Issue[] = [];

  const parsed = questionFileSchema.safeParse(data);
  if (!parsed.success) {
    for (const e of parsed.error.errors) {
      issues.push({
        level: "error",
        path: e.path.join(".") || "(root)",
        message: e.message,
      });
    }
    return { ok: false, total: 0, okCount: 0, issues, questions: [] };
  }

  const questions = parsed.data;

  // ルール2: id 重複
  const seen = new Set<string>();
  questions.forEach((q, idx) => {
    if (seen.has(q.id))
      issues.push({
        level: "error",
        path: `[${idx}].id`,
        message: `id "${q.id}" が重複しています`,
      });
    seen.add(q.id);
    checkDiagramRefs(q, idx, issues);
  });

  const hasError = issues.some((i) => i.level === "error");
  return {
    ok: !hasError,
    total: questions.length,
    okCount: questions.length,
    issues,
    questions,
  };
}
