import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Domain } from "@/lib/schema/types";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/schema/types";
import { startSession } from "@/features/quiz/startSession";
import type { QuizMode } from "@/features/quiz/useQuizSession";

const MODES: { id: QuizMode; title: string; desc: string }[] = [
  { id: "mini", title: "ミニテスト", desc: "分野を選んで10/20問" },
  { id: "random", title: "1問1答", desc: "ランダムに1問ずつ即採点" },
  { id: "exam", title: "模擬試験", desc: "65問 / 130分・図はヒント表示不可" },
];

export function PracticeSetupPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<QuizMode>("mini");
  const [domains, setDomains] = useState<Domain[]>([...DOMAINS]);
  const [limit, setLimit] = useState(10);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  function toggleDomain(d: Domain) {
    setDomains((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
  }

  async function begin() {
    setBusy(true);
    setError(undefined);
    const res = await startSession(mode, {
      domains: domains.length ? domains : undefined,
      limit,
    });
    setBusy(false);
    if (res.ok) nav("/practice/quiz");
    else setError(res.reason);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">演習設定</h1>

      <section>
        <h2 className="mb-2 font-semibold">モード</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={[
                "rounded-lg border p-3 text-left transition-colors",
                mode === m.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400",
              ].join(" ")}
            >
              <div className="font-medium">{m.title}</div>
              <div
                className={`text-xs ${mode === m.id ? "text-slate-200" : "text-slate-500"}`}
              >
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {mode === "mini" && (
        <>
          <section>
            <h2 className="mb-2 font-semibold">分野（複数選択可）</h2>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDomain(d)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    domains.includes(d)
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {DOMAIN_LABELS[d]}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 font-semibold">問題数</h2>
            <div className="flex gap-2">
              {[10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setLimit(n)}
                  className={[
                    "rounded-lg border px-4 py-2 text-sm",
                    limit === n
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {n}問
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {mode === "exam" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          模擬試験は全分野から65問を出題し、制限時間は130分です。公平性のため図は解説時のみ表示されます。
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={begin}
        disabled={busy || (mode === "mini" && domains.length === 0)}
        className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
      >
        {busy ? "準備中…" : "はじめる"}
      </button>
    </div>
  );
}
