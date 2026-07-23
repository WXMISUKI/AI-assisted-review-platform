## Context

The opening-condition pilot already has backend domain functions and API endpoints for task intake, formal checklist matching, human-review decisions, report generation, archive, and rerun history. The highest production risk is not a missing UI widget, but a broken transition that allows an archived run to mutate, report generation to bypass unresolved human-review blockers, or a new rectification round to overwrite prior evidence.

Mature review platforms make version, status, current owner, next action, and history traceability first-class. For the current project stage, the fastest way to move toward production is to turn that principle into a retained smoke gate that verifies the backend delivery chain every time we touch the workflow.

## Goals / Non-Goals

**Goals:**

- Provide a single npm script for opening-condition pilot chain smoke verification.
- Exercise the backend store/domain functions without requiring a running browser or external provider.
- Verify state-machine guardrails: preflight readiness, human-review blocking, report-ready transition, archive immutability, and independent next-run creation.
- Keep the test data safe and bounded, using object refs rather than raw local paths or provider secrets.

**Non-Goals:**

- Do not add new UI layout work in this change.
- Do not introduce a full E2E browser runner.
- Do not add a production database migration.
- Do not improve OCR, MaxKB, or semantic matching accuracy in this change.

## Decisions

1. **Use the existing Node test runner.**
   - Rationale: The repo already uses `node:test` in backend test files and has no dedicated test framework dependency.
   - Alternative considered: Playwright E2E. Rejected for this change because it would add setup weight before the backend state chain is stable.

2. **Keep the smoke at the domain/store layer.**
   - Rationale: The state machine and persistence semantics live in `server/openingConditionPilotStore.mjs`; testing there catches the highest-risk workflow regressions quickly.
   - Alternative considered: HTTP-only smoke against port 5173. Useful later, but more brittle for CI/local environments because it depends on a running dev server.

3. **Retain the smoke as a formal project script.**
   - Rationale: This is not a throwaway debug script. It is a production-readiness gate for future trial iterations.

## Risks / Trade-offs

- Smoke does not prove visual interaction quality -> Pair it later with a small Playwright click-path once the UI flow stabilizes.
- Domain-level smoke does not catch route wiring issues -> Keep the backend smoke as the fast gate, then add HTTP/UI smoke as a follow-up if needed.
- Deterministic filename matching may not represent every real packet -> The smoke validates lifecycle correctness, not provider accuracy.
