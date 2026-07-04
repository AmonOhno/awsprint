import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { repository } from "@/lib/repository/local";
import { useAsync } from "@/lib/useAsync";
import { useSettings } from "@/features/settings/useSettings";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/schema/types";

export function ProgressPage() {
  const progress = useAsync(() => repository.getProgress(), []);
  const exams = useAsync(() => repository.listExamSessions(), []);
  const { passLinePct } = useSettings();

  const domainData = DOMAINS.map((d) => ({
    domain: DOMAIN_LABELS[d],
    pct: progress.data?.byDomain[d].correctPct ?? 0,
    answered: progress.data?.byDomain[d].answered ?? 0,
  }));

  const weak = [...domainData]
    .filter((d) => d.answered > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2);
  const untouched = domainData.filter((d) => d.answered === 0);

  const examData = (exams.data ?? [])
    .slice()
    .reverse()
    .map((e, i) => ({ name: `#${i + 1}`, pct: e.scorePct ?? 0 }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">進捗分析</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">分野別 正解率</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                formatter={(v, _n, p) => [
                  `${v}%（${(p.payload as { answered: number }).answered}問）`,
                  "正解率",
                ]}
              />
              <Bar dataKey="pct" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          {weak.length > 0 && (
            <p className="text-slate-600">
              重点復習:{" "}
              <span className="font-medium text-red-600">
                {weak.map((w) => w.domain).join("、")}
              </span>
            </p>
          )}
          {untouched.length > 0 && (
            <p className="text-slate-500">
              未演習: {untouched.map((u) => u.domain).join("、")}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">模試スコア推移</h2>
        {examData.length === 0 ? (
          <p className="text-slate-500">まだ模試の受験履歴がありません。</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, "スコア"]} />
                <ReferenceLine
                  y={passLinePct}
                  stroke="#16a34a"
                  strokeDasharray="4 4"
                  label={{ value: `合格 ${passLinePct}%`, fontSize: 10, fill: "#16a34a" }}
                />
                <Line
                  dataKey="pct"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
