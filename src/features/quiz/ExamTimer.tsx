import { useEffect, useState } from "react";
import { useQuizSession } from "./useQuizSession";

// endsAt（終了予定時刻）から残りを算出するため、リロード・タブ復帰でも継続する（FR-05）。
export function ExamTimer({ onExpire }: { onExpire: () => void }) {
  const endsAt = useQuizSession((s) => s.endsAt);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (endsAt != null && now >= endsAt) onExpire();
  }, [now, endsAt, onExpire]);

  if (endsAt == null) return null;
  const remainMs = Math.max(0, endsAt - now);
  const totalSec = Math.floor(remainMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const warn = totalSec <= 10 * 60; // 残り10分で警告

  return (
    <span
      role="timer"
      className={[
        "rounded px-2 py-1 font-mono text-sm tabular-nums",
        warn ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700",
      ].join(" ")}
      title="残り時間"
    >
      ⏱ {mm}:{ss}
    </span>
  );
}
