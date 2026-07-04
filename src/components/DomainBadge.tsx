import type { Domain } from "@/lib/schema/types";
import { DOMAIN_LABELS } from "@/lib/schema/types";

const COLOR: Record<Domain, string> = {
  SECURE_ARCH: "bg-blue-100 text-blue-800",
  RESILIENT: "bg-green-100 text-green-800",
  HIGH_PERF: "bg-orange-100 text-orange-800",
  COST_OPT: "bg-purple-100 text-purple-800",
};

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COLOR[domain]}`}
    >
      {DOMAIN_LABELS[domain]}
    </span>
  );
}
