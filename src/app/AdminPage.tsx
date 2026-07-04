import { useState } from "react";
import { validateQuestions, type ValidationResult } from "@/lib/schema/validate";
import { DiagramView } from "@/features/diagram/DiagramView";
import { downloadJson } from "@/lib/download";
import {
  exportBackup,
  importBackup,
  isBackupFile,
  type ImportMode,
} from "@/features/admin/backup";

type Tab = "import" | "backup";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("import");
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">管理</h1>
      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "import"} onClick={() => setTab("import")}>
          問題JSON検証
        </TabButton>
        <TabButton active={tab === "backup"} onClick={() => setTab("backup")}>
          学習履歴バックアップ
        </TabButton>
      </div>
      {tab === "import" ? <ImportTab /> : <BackupTab />}
    </div>
  );
}

function ImportTab() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  function run() {
    try {
      const data = JSON.parse(text);
      setResult(validateQuestions(data));
    } catch (e) {
      setResult({
        ok: false,
        total: 0,
        okCount: 0,
        questions: [],
        issues: [
          { level: "error", path: "(JSON)", message: `JSONの構文エラー: ${(e as Error).message}` },
        ],
      });
    }
  }

  const errors = result?.issues.filter((i) => i.level === "error") ?? [];
  const warns = result?.issues.filter((i) => i.level === "warn") ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        問題JSON（配列）を貼り付けて検証します。CIでも同じ検証が走ります。
        検証に通れば <code>public/data/</code> に置いてコミットすると演習に反映されます。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='[{ "id": "Q-0001", "domain": "SECURE_ARCH", ... }]'
        className="h-48 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
      />
      <div className="flex gap-2">
        <button
          onClick={run}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          検証する
        </button>
        {result?.ok && (
          <button
            onClick={() =>
              downloadJson("questions.validated.json", result.questions)
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            検証済みJSONをダウンロード
          </button>
        )}
      </div>

      {result && (
        <div
          className={[
            "rounded-lg p-3 text-sm",
            result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {result.ok
            ? `✓ ${result.total}問すべて検証OK${warns.length ? `（警告 ${warns.length}件）` : ""}`
            : `✗ エラー ${errors.length}件`}
        </div>
      )}

      {(errors.length > 0 || warns.length > 0) && (
        <ul className="space-y-1 text-xs">
          {errors.map((i, k) => (
            <li key={`e${k}`} className="text-red-700">
              <span className="font-mono">{i.path}</span> — {i.message}
            </li>
          ))}
          {warns.map((i, k) => (
            <li key={`w${k}`} className="text-amber-700">
              <span className="font-mono">{i.path}</span> — {i.message}（警告）
            </li>
          ))}
        </ul>
      )}

      {result?.ok &&
        result.questions.filter((q) => q.diagram).length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">DiagramSpec プレビュー</h3>
            {result.questions
              .filter((q) => q.diagram)
              .map((q) => (
                <div key={q.id}>
                  <div className="mb-1 text-xs text-slate-500">{q.id}</div>
                  {q.diagram && <DiagramView spec={q.diagram} height={280} />}
                </div>
              ))}
          </div>
        )}
    </div>
  );
}

function BackupTab() {
  const [msg, setMsg] = useState<string>();
  const [mode, setMode] = useState<ImportMode>("merge");

  async function doExport() {
    downloadJson(
      `awsprint-backup-${new Date().toISOString().slice(0, 10)}.json`,
      await exportBackup()
    );
    setMsg("エクスポートしました。");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isBackupFile(data)) {
        setMsg("バックアップ形式ではありません。");
        return;
      }
      await importBackup(data, mode);
      setMsg(`インポートしました（${mode === "merge" ? "マージ" : "置き換え"}）。`);
    } catch (err) {
      setMsg(`失敗: ${(err as Error).message}`);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        学習履歴（解答・模試・ブックマーク・設定）は端末内に保存されます。ブラウザデータ消去や端末移行に備えてバックアップできます（FR-18）。
      </p>
      <button
        onClick={doExport}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        エクスポート
      </button>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="mb-2 text-sm font-medium">インポート</div>
        <div className="mb-3 flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "merge"}
              onChange={() => setMode("merge")}
            />
            マージ（重複除外）
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "replace"}
              onChange={() => setMode("replace")}
            />
            置き換え
          </label>
        </div>
        <input type="file" accept="application/json" onChange={onFile} className="text-sm" />
      </div>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "border-b-2 px-4 py-2 text-sm font-medium",
        active
          ? "border-slate-900 text-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
