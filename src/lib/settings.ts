import { DEFAULT_SETTINGS, type UserSettings } from "@/lib/schema/types";

// docs/data/storage.md: 設定は localStorage（同期読み出し）。
const KEY = "awsprint.settings";

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      diagramTiming:
        parsed.diagramTiming === "question" ? "question" : "explanation",
      passLinePct:
        typeof parsed.passLinePct === "number" ? parsed.passLinePct : DEFAULT_SETTINGS.passLinePct,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: UserSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
