import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { parseDocxFile } from "./docxParser.mjs";
import {
  convertRuleFindingsToIssues,
  mergeReviewIssues,
  runRuleEngine,
  summarizeRuleFindings,
} from "./reviewRuleEngine.mjs";

const sampleDocxPath = resolve(
  process.cwd(),
  "docs/施工方案测试文件/G15-10标承（桥）台施工方案2024.10.11.docx",
);

test("construction-plan DOCX smoke parses sample file into structure", async () => {
  const structure = await parseDocxFile(sampleDocxPath);

  assert.equal(structure.status, "done");
  assert.equal(structure.sourceFormat, "docx-xml");
  assert.ok(structure.sections.length > 10, "expected multi-section construction plan");
  assert.ok(structure.paragraphs.length > 100, "expected substantial paragraph recovery");
  assert.ok(
    structure.paragraphs.some((paragraph) => paragraph.text.includes("表格：")),
    "expected table rows converted into paragraphs",
  );
});

test("construction-plan DOCX smoke converts rule findings into limited review issues", async () => {
  const structure = await parseDocxFile(sampleDocxPath);
  const findings = runRuleEngine(structure.paragraphs);
  const summaries = summarizeRuleFindings(findings);
  const ruleIssues = convertRuleFindingsToIssues(findings, { limit: 20 });
  const merged = mergeReviewIssues([], ruleIssues, { limit: 20 });

  assert.ok(findings.length > 0, "expected rule engine findings on real construction plan");
  assert.ok(summaries.length > 0, "expected summarized risk paragraphs");
  assert.ok(ruleIssues.length > 0, "expected convertible review issues");
  assert.ok(ruleIssues.length <= 20, "issues must be capped for human review");
  assert.equal(merged.length, ruleIssues.length);
  assert.equal(ruleIssues[0].status, "pending");
  assert.ok(ruleIssues[0].anchor.paragraphId);
  assert.ok(ruleIssues[0].finding.title);
});

test("construction-plan DOCX smoke stays isolated from opening-condition modules", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./reviewDocxMvpSmoke.test.mjs", import.meta.url), "utf8"),
  );
  const fromPaths = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);

  assert.ok(fromPaths.includes("./docxParser.mjs"));
  assert.ok(fromPaths.includes("./reviewRuleEngine.mjs"));
  assert.equal(
    fromPaths.some((path) => path.includes("openingCondition") || path.includes("productWorkspacePages")),
    false,
  );
});
