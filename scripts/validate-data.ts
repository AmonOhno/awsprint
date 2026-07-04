import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateQuestions } from "../src/lib/schema/validate.ts";
import { dataIndexSchema } from "../src/lib/schema/question.ts";

// CI 用: public/data 配下の全問題JSONを検証（FR-14 と同一ロジック）。
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "public", "data");

async function main() {
  const index = dataIndexSchema.parse(
    JSON.parse(await readFile(join(dataDir, "index.json"), "utf8"))
  );

  let errorCount = 0;
  let warnCount = 0;
  let questionCount = 0;

  for (const file of index.files) {
    const data = JSON.parse(await readFile(join(dataDir, file), "utf8"));
    const res = validateQuestions(data);
    questionCount += res.total;
    for (const issue of res.issues) {
      const tag = issue.level === "error" ? "ERROR" : "warn ";
      console.log(`[${tag}] ${file} ${issue.path} — ${issue.message}`);
      if (issue.level === "error") errorCount += 1;
      else warnCount += 1;
    }
  }

  console.log(
    `\n検証完了: ${questionCount}問 / エラー ${errorCount}件 / 警告 ${warnCount}件`
  );
  if (errorCount > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
