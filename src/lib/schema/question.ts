import { z } from "zod";

// docs/data/schema.md の型に対応する zod スキーマ。
// インポート検証（FR-14）と CI 検証（scripts/validate-data.ts）で共用する。

export const domainSchema = z.enum([
  "SECURE_ARCH",
  "RESILIENT",
  "HIGH_PERF",
  "COST_OPT",
]);

export const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
  why: z.string().optional(),
});

export const explanationSchema = z.object({
  summary: z.string().min(1),
  refIds: z.array(z.string()),
});

export const containerSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["Region", "VPC", "AZ", "PublicSubnet", "PrivateSubnet"]),
  label: z.string().min(1),
  parent: z.string().optional(),
});

export const diagramNodeSchema = z.object({
  id: z.string().min(1),
  service: z.string().min(1),
  label: z.string().min(1),
  parent: z.string().optional(),
  state: z.enum(["normal", "faulty"]).optional(),
});

export const diagramEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  directed: z.boolean().optional(),
});

export const diagramSpecSchema = z
  .object({
    renderer: z.enum(["spec", "image"]),
    imageUrl: z.string().url().optional(),
    containers: z.array(containerSchema).optional(),
    nodes: z.array(diagramNodeSchema),
    edges: z.array(diagramEdgeSchema),
  })
  .refine((d) => d.renderer !== "image" || !!d.imageUrl, {
    message: 'renderer="image" のとき imageUrl は必須です',
    path: ["imageUrl"],
  })
  .refine((d) => d.renderer !== "spec" || d.nodes.length > 0, {
    message: 'renderer="spec" のとき nodes は1つ以上必要です',
    path: ["nodes"],
  });

export const questionSchema = z
  .object({
    id: z.string().regex(/^Q-\d{4,}$/, "id は Q-0001 形式にしてください"),
    domain: domainSchema,
    type: z.enum(["single", "multiple"]),
    stem: z.string().min(1),
    choices: z.array(choiceSchema).min(2),
    explanation: explanationSchema,
    diagram: diagramSpecSchema.optional(),
    docLinks: z
      .array(z.object({ title: z.string().min(1), url: z.string().url() }))
      .optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (q) => {
      const n = q.choices.filter((c) => c.correct).length;
      return q.type === "single" ? n === 1 : n >= 2;
    },
    {
      message:
        "single は正解ちょうど1つ、multiple は正解2つ以上にしてください",
      path: ["choices"],
    }
  );

export const questionFileSchema = z.array(questionSchema);

export const dataIndexSchema = z.object({
  formatVersion: z.number(),
  files: z.array(z.string()),
});
