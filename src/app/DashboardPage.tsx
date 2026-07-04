import { Link } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { repository } from "@/lib/repository/local";
import { useAsync } from "@/lib/useAsync";
import { useSettings } from "@/features/settings/useSettings";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/schema/types";

export function DashboardPage() {
  const progress = useAsync(() => repository.getProgress(), []);
  const total = useAsync(() => repository.countQuestions(), []);
  const exams = useAsync(() => repository.listExamSessions(), []);

  const latestExam = exams.data?.[0];
  const radarData = DOMAINS.map((d) => ({
    domain: DOMAIN_LABELS[d],
    pct: progress.data?.byDomain[d].correctPct ?? 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="解答済み問題"
          value={
            progress.data
              ? `${progress.data.totalAnswered} / ${total.data ?? "…"}`
              : "…"
          }
        />
        <Stat
          label="平均正解率"
          value={progress.data ? `${progress.data.overallPct}%` : "…"}
        />
        <Stat
          label="直近の模試"
          value={
            latestExam?.scorePct != null
              ? `${latestExam.scorePct}% ${latestExam.passed ? "合格" : "不合格"}`
              : "未受験"
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 font-semibold">分野別 正解率</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fontSize: 11, fill: "#475569" }}
                />
                <Radar
                  dataKey="pct"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">演習をはじめる</h2>
          <div className="grid gap-2">
            <ModeLink to="/practice/setup" title="ミニテスト" desc="分野別に10/20問" />
            <ModeLink to="/practice/setup" title="1問1答" desc="ランダムに1問ずつ即採点" />
            <ModeLink to="/practice/setup" title="模擬試験" desc="65問 / 130分の本番形式" />
          </div>
        </section>
      </div>

      <SettingsCard />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function ModeLink({
  to,
  title,
  desc,
}: {
  to: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-slate-900 hover:bg-slate-50"
    >
      <span>
        <span className="font-medium">{title}</span>
        <span className="ml-2 text-sm text-slate-500">{desc}</span>
      </span>
      <span aria-hidden>→</span>
    </Link>
  );
}

function SettingsCard() {
  const { diagramTiming, passLinePct, setDiagramTiming, setPassLinePct } =
    useSettings();
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">学習設定</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-sm font-medium">図の表示タイミング</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="timing"
              checked={diagramTiming === "explanation"}
              onChange={() => setDiagramTiming("explanation")}
            />
            解説時のみ（既定）
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="timing"
              checked={diagramTiming === "question"}
              onChange={() => setDiagramTiming("question")}
            />
            出題時（ヒント）
          </label>
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">合格目安ライン</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={passLinePct}
              onChange={(e) => setPassLinePct(Number(e.target.value))}
              className="w-20 rounded border border-slate-300 px-2 py-1"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
