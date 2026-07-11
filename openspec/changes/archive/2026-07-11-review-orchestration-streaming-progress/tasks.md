## 1. State Model and Orchestration Plumbing

- [x] 1.1 Extend review task and streaming types to carry pipeline stage, active agent, and current paragraph or section metadata.
- [x] 1.2 Update the mock streaming stage fixtures and review session helpers to emit and persist the richer orchestration snapshot.
- [x] 1.3 Normalize the backend event mapping so review progress events can hydrate the same task snapshot used by the mock flow.

## 2. Review Loading and Detail Experience

- [x] 2.1 Update the loading page to show the active review stage, current paragraph or section, and active agent while the workbench remains locked.
- [x] 2.2 Update the review detail experience to surface the same pipeline snapshot in a compact, readable way when a task is still preparing.
- [x] 2.3 Keep the unlocked review workbench behavior unchanged once the orchestration stage reports ready.

## 3. Data Assets and Validation

- [x] 3.1 Expand the data-assets surface with the structure-restoration agent, construction review agent, report-generation agent, and prompt asset placeholders.
- [x] 3.2 Add lightweight verification for the new lifecycle, including OCR-to-review handoff and in-progress task reopening.
- [x] 3.3 Smoke-check the updated UI in the browser and confirm the new orchestration state remains mock-friendly and type-safe.
