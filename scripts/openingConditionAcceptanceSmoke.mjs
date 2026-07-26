import { spawn } from "node:child_process";

const steps = [
  {
    id: "domain",
    label: "Opening-condition domain smoke",
    command: process.execPath,
    args: ["--test", "server/openingConditionPilotStore.test.mjs"],
  },
  {
    id: "http",
    label: "Opening-condition HTTP smoke",
    command: process.execPath,
    args: [
      "--test",
      "server/openingConditionPilotHttpSmoke.test.mjs",
      "server/openingConditionPilotWorkspaceAssetRegistrySmoke.test.mjs",
    ],
  },
  {
    id: "ui",
    label: "Opening-condition UI smoke",
    command: process.execPath,
    args: ["--test", "server/openingConditionPilotUiBoundarySmoke.test.mjs"],
  },
];

function runStep(step) {
  return new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      shell: false,
    });

    child.once("exit", (code, signal) => {
      resolve({
        ...step,
        ok: code === 0,
        code: typeof code === "number" ? code : 1,
        signal: signal ?? null,
      });
    });
  });
}

async function main() {
  const results = [];

  console.log("Opening-condition acceptance smoke started.");
  for (const step of steps) {
    console.log(`\n[acceptance] Running ${step.label}...`);
    const result = await runStep(step);
    results.push(result);

    if (!result.ok) {
      console.error(`\n[acceptance] ${step.label} failed.`);
      break;
    }

    console.log(`[acceptance] ${step.label} passed.`);
  }

  const passedCount = results.filter((item) => item.ok).length;
  const failedStep = results.find((item) => !item.ok) ?? null;

  console.log("\nOpening-condition acceptance smoke summary:");
  for (const result of results) {
    console.log(`- ${result.label}: ${result.ok ? "PASS" : `FAIL (exit ${result.code})`}`);
  }

  if (failedStep) {
    console.error(
      `\nAcceptance smoke failed at ${failedStep.label}. Review that layer before real sample trial verification.`,
    );
    process.exitCode = failedStep.code || 1;
    return;
  }

  console.log(
    `\nAcceptance smoke passed (${passedCount}/${steps.length} layers). The opening-condition pilot is ready for focused trial verification.`,
  );
}

await main();
