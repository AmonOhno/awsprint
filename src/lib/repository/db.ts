import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Attempt, Bookmark, ExamSession } from "@/lib/schema/types";

// docs/data/storage.md の IndexedDB 設計。
export interface AwsprintDB extends DBSchema {
  attempts: {
    key: number;
    value: Attempt;
    indexes: { questionId: string; domain: string; answeredAt: string };
  };
  examSessions: {
    key: string;
    value: ExamSession;
    indexes: { startedAt: string };
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { createdAt: string };
  };
}

const DB_NAME = "awsprint";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AwsprintDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<AwsprintDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AwsprintDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // attempts は out-of-line の自動採番キー（Attempt 型に採番フィールドを持たせない）
        const attempts = db.createObjectStore("attempts", {
          autoIncrement: true,
        });
        attempts.createIndex("questionId", "questionId");
        attempts.createIndex("domain", "domain");
        attempts.createIndex("answeredAt", "answeredAt");

        const exams = db.createObjectStore("examSessions", { keyPath: "id" });
        exams.createIndex("startedAt", "startedAt");

        const bookmarks = db.createObjectStore("bookmarks", {
          keyPath: "questionId",
        });
        bookmarks.createIndex("createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}
