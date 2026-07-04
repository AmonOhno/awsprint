// 1問1答の直近N問除外用（FR-02）。アプリ実行中はメモリ、永続化は localStorage。
const KEY = "awsprint.recentRandom";
const MAX = 20;

export function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function pushRecent(id: string): void {
  const list = [...getRecent(), id].slice(-MAX);
  localStorage.setItem(KEY, JSON.stringify(list));
}
