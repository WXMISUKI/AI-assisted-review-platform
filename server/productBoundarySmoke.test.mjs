import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readProjectFile(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("product boundary smoke keeps the two MVP contracts independent", async () => {
  const boundaryDoc = await readProjectFile("docs/dual-portal-mvp-boundaries.md");
  const ownershipDoc = await readProjectFile("docs/code-ownership-map.md");
  const portalSource = await readProjectFile("src/domain/productPortal.ts");
  const packageJson = JSON.parse(await readProjectFile("package.json"));

  assert.match(boundaryDoc, /施工方案审查独立能力/);
  assert.match(boundaryDoc, /开工条件核查独立能力/);
  assert.match(boundaryDoc, /共用能力/);
  assert.match(ownershipDoc, /ReviewTask/);
  assert.match(ownershipDoc, /openingConditionPilotStore\.mjs/);
  assert.match(portalSource, /construction-plan-review/);
  assert.match(portalSource, /opening-condition-review/);
  assert.equal(
    packageJson.scripts["smoke:opening-condition"],
    "node --test server/openingConditionPilotStore.test.mjs",
  );
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
});

test("product boundary smoke keeps the construction-plan entry independent", async () => {
  const constructionSource = await readProjectFile("src/ConstructionPlanReviewApp.tsx");
  const openingSource = await readProjectFile("src/productWorkspacePages.tsx");

  assert.match(constructionSource, /Construction-plan product boundary/);
  assert.match(openingSource, /Opening-condition product boundary/);
  assert.doesNotMatch(constructionSource, /openingConditionPilotStore/);
  assert.doesNotMatch(openingSource, /ReviewWorkbenchPage/);
});

