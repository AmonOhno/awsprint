import { getDB } from "@/lib/repository/db";
import { loadSettings, saveSettings } from "@/lib/settings";
import type { Attempt, Bookmark, ExamSession, UserSettings } from "@/lib/schema/types";

// 学習履歴のエクスポート/インポート（FR-18）。端末内保存のバックアップ手段。
export type BackupFile = {
  formatVersion: 1;
  exportedAt: string;
  attempts: Attempt[];
  examSessions: ExamSession[];
  bookmarks: Bookmark[];
  settings: UserSettings;
};

export async function exportBackup(): Promise<BackupFile> {
  const db = await getDB();
  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    attempts: await db.getAll("attempts"),
    examSessions: await db.getAll("examSessions"),
    bookmarks: await db.getAll("bookmarks"),
    settings: loadSettings(),
  };
}

export type ImportMode = "replace" | "merge";

export async function importBackup(
  data: BackupFile,
  mode: ImportMode
): Promise<void> {
  const db = await getDB();

  if (mode === "replace") {
    await db.clear("attempts");
    await db.clear("examSessions");
    await db.clear("bookmarks");
  }

  const existing =
    mode === "merge"
      ? new Set((await db.getAll("attempts")).map(attemptKey))
      : new Set<string>();

  const tx = db.transaction(["attempts", "examSessions", "bookmarks"], "readwrite");
  for (const a of data.attempts) {
    if (mode === "merge" && existing.has(attemptKey(a))) continue;
    await tx.objectStore("attempts").add(a);
  }
  for (const e of data.examSessions) {
    await tx.objectStore("examSessions").put(e);
  }
  for (const b of data.bookmarks) {
    await tx.objectStore("bookmarks").put(b);
  }
  await tx.done;

  saveSettings(data.settings);
}

function attemptKey(a: Attempt): string {
  return `${a.questionId}|${a.answeredAt}`;
}

export function isBackupFile(v: unknown): v is BackupFile {
  const o = v as Partial<BackupFile>;
  return (
    !!o &&
    o.formatVersion === 1 &&
    Array.isArray(o.attempts) &&
    Array.isArray(o.examSessions) &&
    Array.isArray(o.bookmarks) &&
    !!o.settings
  );
}
