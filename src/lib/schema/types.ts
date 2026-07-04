// データモデルの正規のソース。docs/data/schema.md と一致させる。

export type Domain = "SECURE_ARCH" | "RESILIENT" | "HIGH_PERF" | "COST_OPT";

export const DOMAINS: Domain[] = [
  "SECURE_ARCH",
  "RESILIENT",
  "HIGH_PERF",
  "COST_OPT",
];

export const DOMAIN_LABELS: Record<Domain, string> = {
  SECURE_ARCH: "安全なアーキテクチャ",
  RESILIENT: "高レジリエンス",
  HIGH_PERF: "高性能",
  COST_OPT: "コスト最適化",
};

// 本番SAAの分野比率の目安（模試の抽出に使用）
export const DOMAIN_EXAM_WEIGHT: Record<Domain, number> = {
  SECURE_ARCH: 0.3,
  RESILIENT: 0.26,
  HIGH_PERF: 0.24,
  COST_OPT: 0.2,
};

export type Choice = {
  id: string;
  text: string;
  correct: boolean;
  why?: string;
};

export type Explanation = {
  summary: string;
  refIds: string[];
};

export type ContainerType =
  | "Region"
  | "VPC"
  | "AZ"
  | "PublicSubnet"
  | "PrivateSubnet";

export type Container = {
  id: string;
  type: ContainerType;
  label: string;
  parent?: string;
};

export type DiagramNode = {
  id: string;
  service: string;
  label: string;
  parent?: string;
  state?: "normal" | "faulty";
};

export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  directed?: boolean;
};

export type DiagramSpec = {
  renderer: "spec" | "image";
  imageUrl?: string;
  containers?: Container[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export type DocLink = { title: string; url: string };

export type Question = {
  id: string;
  domain: Domain;
  type: "single" | "multiple";
  stem: string;
  choices: Choice[];
  explanation: Explanation;
  diagram?: DiagramSpec;
  docLinks?: DocLink[];
  tags?: string[];
};

// 学習履歴（端末内保存）
export type Attempt = {
  questionId: string;
  domain: Domain;
  selected: string[];
  correct: boolean;
  elapsedSec: number;
  answeredAt: string;
};

export type ExamSession = {
  id: string;
  questionIds: string[];
  startedAt: string;
  durationSec: number;
  attempts: Attempt[];
  scorePct?: number;
  passed?: boolean;
};

export type Bookmark = {
  questionId: string;
  createdAt: string;
};

export type DiagramTiming = "explanation" | "question";

export type UserSettings = {
  diagramTiming: DiagramTiming;
  passLinePct: number;
};

export const DEFAULT_SETTINGS: UserSettings = {
  diagramTiming: "explanation",
  passLinePct: 72,
};

export type ProgressSummary = {
  totalAnswered: number;
  overallPct: number;
  byDomain: Record<Domain, { answered: number; correctPct: number }>;
};

export type DataIndex = {
  formatVersion: number;
  files: string[];
};
