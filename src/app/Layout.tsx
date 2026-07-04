import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  { to: "/", label: "ホーム", end: true },
  { to: "/practice/setup", label: "演習" },
  { to: "/bookmarks", label: "ブックマーク" },
  { to: "/progress", label: "進捗分析" },
  { to: "/admin", label: "管理" },
];

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="rounded bg-slate-900 px-2 py-1 text-sm font-bold text-white">
              awsprint
            </span>
            <span className="hidden text-sm text-slate-500 sm:inline">
              AWS SAA 学習アプリ
            </span>
          </NavLink>
          <nav className="ml-auto flex flex-wrap gap-1 text-sm">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  [
                    "rounded px-3 py-1.5 transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
