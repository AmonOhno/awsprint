// AwsService → 表示アイコン（短縮ラベル＋色）。
// 自己完結（外部アセット非依存）のため、公式アイコンSVGの代わりに
// サービス頭字と色でノードを識別する。未登録は汎用フォールバック。
export type ServiceStyle = { abbr: string; color: string };

const MAP: Record<string, ServiceStyle> = {
  EC2: { abbr: "EC2", color: "#ed7100" },
  S3: { abbr: "S3", color: "#7aa116" },
  S3Glacier: { abbr: "GLC", color: "#7aa116" },
  S3Lifecycle: { abbr: "LC", color: "#7aa116" },
  NATGateway: { abbr: "NAT", color: "#8c4fff" },
  InternetGateway: { abbr: "IGW", color: "#8c4fff" },
  VPCEndpoint: { abbr: "VPCE", color: "#8c4fff" },
  ALB: { abbr: "ALB", color: "#8c4fff" },
  AutoScaling: { abbr: "ASG", color: "#ed7100" },
  CloudFront: { abbr: "CF", color: "#8c4fff" },
  Route53: { abbr: "R53", color: "#8c4fff" },
  RDS: { abbr: "RDS", color: "#2e73b8" },
  DynamoDB: { abbr: "DDB", color: "#2e73b8" },
  Lambda: { abbr: "λ", color: "#ed7100" },
  Users: { abbr: "者", color: "#232f3e" },
};

const FALLBACK: ServiceStyle = { abbr: "?", color: "#64748b" };

export function serviceStyle(service: string): ServiceStyle {
  return MAP[service] ?? { ...FALLBACK, abbr: service.slice(0, 4) };
}

export function isKnownService(service: string): boolean {
  return service in MAP;
}
