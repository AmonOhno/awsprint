import type {
  Attempt,
  Bookmark,
  DataIndex,
  Domain,
  ExamSession,
  ProgressSummary,
  Question,
} from "@/lib/schema/types";
import { DOMAINS } from "@/lib/schema/types";
import { dataIndexSchema, questionFileSchema } from "@/lib/schema/question";
import { getDB } from "./db";
import type { QuestionFilter, QuizRepository } from "./types";

// public/data/ を fetch し、端末内（IndexedDB）に履歴を保存する実装。
// バックエンドを持たない v2.0 の唯一の実装（docs/architecture/overview.md）。
export class LocalRepository implements QuizRepository {
  private cache: Question[] | null = null;
  private byId: Map<string, Question> | null = null;

  private base(path: string): string {
    // Vite の BASE_URL（GitHub Pages のサブパス）に合わせる。
    return `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");
  }

  private async loadAll(): Promise<Question[]> {
    if (this.cache) return this.cache;

    const idxRes = await fetch(this.base("data/index.json"));
    if (!idxRes.ok) throw new Error("data/index.json を取得できません");
    const index: DataIndex = dataIndexSchema.parse(await idxRes.json());

    const files = await Promise.all(
      index.files.map(async (f) => {
        const res = await fetch(this.base(`data/${f}`));
        if (!res.ok) throw new Error(`data/${f} を取得できません`);
        return questionFileSchema.parse(await res.json());
      })
    );

    const all = files.flat();
    this.cache = all;
    this.byId = new Map(all.map((q) => [q.id, q]));
    return all;
  }

  async listQuestions(filter: QuestionFilter = {}): Promise<Question[]> {
    let qs = await this.loadAll();
    if (filter.ids) {
      const set = new Set(filter.ids);
      qs = qs.filter((q) => set.has(q.id));
    }
    if (filter.domains && filter.domains.length > 0) {
      const set = new Set(filter.domains);
      qs = qs.filter((q) => set.has(q.domain));
    }
    if (filter.limit != null) qs = qs.slice(0, filter.limit);
    return qs;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    await this.loadAll();
    return this.byId?.get(id);
  }

  async countQuestions(): Promise<number> {
    return (await this.loadAll()).length;
  }

  async saveAttempt(a: Attempt): Promise<void> {
    const db = await getDB();
    await db.add("attempts", a);
  }

  async listAttempts(): Promise<Attempt[]> {
    const db = await getDB();
    return db.getAll("attempts");
  }

  async getProgress(): Promise<ProgressSummary> {
    const attempts = await this.listAttempts();
    const byDomain = {} as ProgressSummary["byDomain"];
    for (const d of DOMAINS) byDomain[d] = { answered: 0, correctPct: 0 };

    const correctByDomain: Record<Domain, number> = {
      SECURE_ARCH: 0,
      RESILIENT: 0,
      HIGH_PERF: 0,
      COST_OPT: 0,
    };

    let correctTotal = 0;
    for (const a of attempts) {
      byDomain[a.domain].answered += 1;
      if (a.correct) {
        correctByDomain[a.domain] += 1;
        correctTotal += 1;
      }
    }
    for (const d of DOMAINS) {
      const ans = byDomain[d].answered;
      byDomain[d].correctPct = ans ? Math.round((correctByDomain[d] / ans) * 100) : 0;
    }

    const uniqueAnswered = new Set(attempts.map((a) => a.questionId)).size;
    return {
      totalAnswered: uniqueAnswered,
      overallPct: attempts.length
        ? Math.round((correctTotal / attempts.length) * 100)
        : 0,
      byDomain,
    };
  }

  async saveExamSession(s: ExamSession): Promise<void> {
    const db = await getDB();
    await db.put("examSessions", s);
  }

  async listExamSessions(): Promise<ExamSession[]> {
    const db = await getDB();
    const all = await db.getAll("examSessions");
    return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async listBookmarks(): Promise<Bookmark[]> {
    const db = await getDB();
    const all = await db.getAll("bookmarks");
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async isBookmarked(questionId: string): Promise<boolean> {
    const db = await getDB();
    return (await db.get("bookmarks", questionId)) != null;
  }

  async toggleBookmark(questionId: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get("bookmarks", questionId);
    if (existing) {
      await db.delete("bookmarks", questionId);
      return false;
    }
    await db.put("bookmarks", {
      questionId,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
}

export const repository: QuizRepository = new LocalRepository();
