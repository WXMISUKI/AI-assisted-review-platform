import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "docs/dual-portal-mvp-boundaries.md",
  "docs/code-ownership-map.md",
  "src/shared/platformBoundary.ts",
  "src/shared/statusDisplay.ts",
  "src/styles/theme-tokens.css",
  "src/styles/shared-foundation.css",
  "src/styles/construction-plan.css",
  "src/styles/opening-condition.css",
];

const missingFiles = requiredFiles.filter((file) => !existsSync(file));
if (missingFiles.length > 0) {
  console.error(`Governance check failed. Missing files:\n${missingFiles.join("\n")}`);
  process.exit(1);
}

const ownershipMap = readFileSync("docs/code-ownership-map.md", "utf8");
const requiredMarkers = [
  "src/shared",
  "ConstructionPlanReviewApp.tsx",
  "productWorkspacePages.tsx",
  "openingConditionPilotStore.mjs",
];
const missingMarkers = requiredMarkers.filter((marker) => !ownershipMap.includes(marker));
if (missingMarkers.length > 0) {
  console.error(`Governance check failed. Missing ownership markers:\n${missingMarkers.join("\n")}`);
  process.exit(1);
}

const result = spawnSync("pnpm typecheck", {
  shell: true,
  stdio: "inherit",
});

if (result.status !== 0) {
  if (result.error) {
    console.error(`Governance typecheck could not start: ${result.error.message}`);
  }
  process.exit(result.status ?? 1);
}

console.log("Governance check passed.");
