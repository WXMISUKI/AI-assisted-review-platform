import test from "node:test";
import assert from "node:assert/strict";

import { normalizeBasisReferences } from "./reviewBasisReferenceNormalizer.mjs";

test("normalizes normative basis with title and version", () => {
  const references = normalizeBasisReferences({
    basisText: "《建筑基坑支护技术规程》JGJ120",
    reason: "深基坑施工应明确围护结构、降水方案、监测要求和应急预案。",
    priority: "primary",
  });

  assert.equal(references.length, 1);
  assert.equal(references[0].type, "normative-standard");
  assert.equal(references[0].sourceTitle, "建筑基坑支护技术规程");
  assert.equal(references[0].version, "JGJ120");
  assert.equal(references[0].priority, "primary");
});

test("normalizes regulatory order basis", () => {
  const references = normalizeBasisReferences({
    basisText: "《危险性较大的分部分项工程安全管理规定》（住建部令第37号）",
    reason: "危大工程专项方案应按规定履行编制、审核、审批、交底、验收程序。",
    priority: "primary",
  });

  assert.equal(references.length, 1);
  assert.equal(references[0].type, "law-regulation");
  assert.equal(references[0].sourceTitle, "危险性较大的分部分项工程安全管理规定");
  assert.equal(references[0].version, "住建部令第37号");
});

test("keeps partial fallback when basis cannot be fully parsed", () => {
  const references = normalizeBasisReferences({
    basisText: "施工方案应明确验收、复核、整改闭环和资料归档要求。",
    reason: "验收资料不应只停留在原则性描述。",
    fallbackTitle: "施工方案审查通用规则",
    fallbackType: "project-document",
  });

  assert.equal(references.length, 1);
  assert.equal(references[0].type, "project-document");
  assert.ok(references[0].sourceTitle.length > 0);
  assert.ok(references[0].summary.length > 0);
});
