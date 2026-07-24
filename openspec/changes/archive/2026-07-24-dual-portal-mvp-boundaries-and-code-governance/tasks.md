## 1. Boundary and governance foundation

- [x] 1.1 Add a shared-vs-product ownership document covering platform shell, construction-plan review, and opening-condition review.
- [x] 1.2 Add typed shared platform metadata for product ownership, route namespace, and MVP acceptance entry points.
- [x] 1.3 Add a lightweight governance verification script that checks required ownership markers and runs `pnpm typecheck`.

## 2. Shared state and style seams

- [x] 2.1 Extract shared status/action display metadata from product page modules without changing business state values.
- [x] 2.2 Make the root stylesheet load shared tokens/base rules and product feature styles through explicit layers.
- [x] 2.3 Add a construction-plan feature stylesheet entry and move only newly touched construction-plan selectors into it.

## 3. Product isolation verification

- [x] 3.1 Add construction-plan MVP boundary assertions for document intake, review lifecycle, result asset, and local/backend fallback.
- [x] 3.2 Add opening-condition MVP boundary assertions for preflight, matching, human review, archive, rerun, and DOCX export.
- [x] 3.3 Verify that switching products does not initialize or mutate the other product's task state.

## 4. Incremental implementation guardrails

- [x] 4.1 Add module ownership comments and import boundaries to the shared/domain entry points.
- [x] 4.2 Update development standards and architecture notes with the two-product MVP matrix and refactor rules.
- [x] 4.3 Run typecheck and all existing opening-condition smoke tests, then record remaining large-module refactor work as follow-up tasks.

## 5. Checkpoint

- [x] 5.1 Confirm both product flows remain manually runnable at their existing entry points.
- [x] 5.2 Confirm no new dependency, database migration, or provider contract change was introduced.
