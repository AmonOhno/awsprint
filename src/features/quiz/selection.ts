import type { Domain, Question } from "@/lib/schema/types";
import { DOMAINS, DOMAIN_EXAM_WEIGHT } from "@/lib/schema/types";

// Fisher–Yates
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickMini(pool: Question[], limit: number): Question[] {
  return shuffle(pool).slice(0, limit);
}

// 直近N問を除外して1問抽選（docs/feature/quiz.md FR-02）
export function pickRandom(
  pool: Question[],
  recentIds: string[],
  n = 10
): Question | undefined {
  if (pool.length === 0) return undefined;
  const exclude = new Set(recentIds.slice(-Math.min(n, pool.length - 1)));
  const candidates = pool.filter((q) => !exclude.has(q.id));
  const from = candidates.length > 0 ? candidates : pool;
  return from[Math.floor(Math.random() * from.length)];
}

// 分野比率で65問を抽出。プールが不足する場合は全問＋シャッフルで代替。
export function pickExam(pool: Question[], total = 65): {
  questions: Question[];
  ratioApplied: boolean;
} {
  if (pool.length <= total) {
    return { questions: shuffle(pool), ratioApplied: false };
  }
  const byDomain: Record<Domain, Question[]> = {
    SECURE_ARCH: [],
    RESILIENT: [],
    HIGH_PERF: [],
    COST_OPT: [],
  };
  for (const q of pool) byDomain[q.domain].push(q);

  const picked: Question[] = [];
  for (const d of DOMAINS) {
    const want = Math.round(total * DOMAIN_EXAM_WEIGHT[d]);
    picked.push(...shuffle(byDomain[d]).slice(0, want));
  }
  // 端数調整（不足分をプール全体から補充）
  if (picked.length < total) {
    const chosen = new Set(picked.map((q) => q.id));
    const rest = shuffle(pool.filter((q) => !chosen.has(q.id)));
    picked.push(...rest.slice(0, total - picked.length));
  }
  return { questions: shuffle(picked).slice(0, total), ratioApplied: true };
}
