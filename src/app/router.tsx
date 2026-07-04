import { createHashRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { DashboardPage } from "./DashboardPage";
import { PracticeSetupPage } from "./PracticeSetupPage";
import { QuizPage } from "./QuizPage";
import { ResultPage } from "./ResultPage";
import { BookmarksPage } from "./BookmarksPage";
import { ProgressPage } from "./ProgressPage";
import { AdminPage } from "./AdminPage";

// GitHub Pages のパスフォールバック不在に対応するため HashRouter を使用。
export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "practice/setup", element: <PracticeSetupPage /> },
      { path: "practice/quiz", element: <QuizPage /> },
      { path: "practice/result", element: <ResultPage /> },
      { path: "bookmarks", element: <BookmarksPage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
]);
