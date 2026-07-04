import type {
  Attempt,
  Bookmark,
  Domain,
  ExamSession,
  ProgressSummary,
  Question,
} from "@/lib/schema/types";

export type QuestionFilter = {
  domains?: Domain[];
  limit?: number;
  ids?: string[];
};

// 画面・機能はこの interface のみに依存する（実装差替の口）。
export interface QuizRepository {
  listQuestions(filter?: QuestionFilter): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  countQuestions(): Promise<number>;

  saveAttempt(a: Attempt): Promise<void>;
  listAttempts(): Promise<Attempt[]>;
  getProgress(): Promise<ProgressSummary>;

  saveExamSession(s: ExamSession): Promise<void>;
  listExamSessions(): Promise<ExamSession[]>;

  listBookmarks(): Promise<Bookmark[]>;
  isBookmarked(questionId: string): Promise<boolean>;
  toggleBookmark(questionId: string): Promise<boolean>;
}
