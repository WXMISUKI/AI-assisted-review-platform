import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { parseDocxFile, parseDocumentXmlToStructure } from "./docxParser.mjs";
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

test("construction-plan DOCX smoke anchors map back to recovered paragraphs", async () => {
  const structure = await parseDocxFile(sampleDocxPath);
  const findings = runRuleEngine(structure.paragraphs);
  const ruleIssues = convertRuleFindingsToIssues(findings, { limit: 20 });
  const paragraphIds = new Set(structure.paragraphs.map((paragraph) => paragraph.id));

  assert.ok(ruleIssues.length > 0, "expected rule issues for anchor validation");
  for (const issue of ruleIssues) {
    assert.ok(
      paragraphIds.has(issue.anchor.paragraphId),
      `missing paragraph for issue anchor ${issue.anchor.paragraphId}`,
    );
    assert.ok(issue.anchor.text, "anchor text should not be empty");
  }
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

test("construction-plan DOCX smoke gates cover and TOC paragraphs before review", async () => {
  const structure = parseDocumentXmlToStructure(`
    <w:document>
      <w:body>
        <w:p>
          <w:pPr><w:pStyle w:val="Title"/></w:pPr>
          <w:r><w:t>G15-10标承（桥）台施工方案</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr>
          <w:r><w:t>目录</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="TOC1"/></w:pPr>
          <w:r><w:t>4.3.1 基坑开挖技术措施 43</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="1"/></w:pPr>
          <w:r><w:t>4.3 基坑工程</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>基坑开挖深度 5m，需补充围护、监测和应急措施。</w:t></w:r>
        </w:p>
      </w:body>
    </w:document>
  `);

  const coverParagraph = structure.paragraphs.find((paragraph) => paragraph.section === "封面");
  const tocParagraph = structure.paragraphs.find((paragraph) => paragraph.section === "目录");
  const bodyParagraph = structure.paragraphs.find((paragraph) => paragraph.reviewEligible !== false);

  assert.equal(coverParagraph?.reviewEligible, false);
  assert.equal(coverParagraph?.blockType, "cover");
  assert.equal(tocParagraph?.reviewEligible, false);
  assert.equal(tocParagraph?.blockType, "toc");
  assert.equal(bodyParagraph?.blockType, "body_paragraph");
  assert.equal(structure.sections.length, 1);
  assert.equal(structure.sections[0].title, "4.3 基坑工程");

  const findings = runRuleEngine(structure.paragraphs);
  assert.ok(findings.length >= 1);
  assert.equal(findings.some((finding) => /技术措施 43/.test(finding.matchedText)), false);
  assert.equal(findings.some((finding) => /基坑开挖深度/.test(finding.matchedText)), true);
});
