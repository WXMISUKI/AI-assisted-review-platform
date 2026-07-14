## 1. Spec and Contract

- [x] 1.1 Define draft issue generation snapshot state in `review-session-state`.
- [x] 1.2 Extend `review-issue-model` with generated issue provenance metadata.
- [x] 1.3 Extend `review-workbench` with compact provenance presentation requirements.
- [x] 1.4 Extend `llm-agent-adapter` with generation result provenance requirements.

## 2. Session Persistence

- [x] 2.1 Add generation snapshot and issue provenance types.
- [x] 2.2 Extend generated issue merge to tag generated AI issues with run metadata.
- [x] 2.3 Persist the latest generation snapshot on the review task aggregate.
- [x] 2.4 Preserve deterministic fallback and no-candidate results without blocking workbench entry.

## 3. Workbench Visibility

- [x] 3.1 Show compact source labels for LLM-generated, deterministic fallback, and manual issues.
- [x] 3.2 Keep existing issue card decision controls unchanged.
- [x] 3.3 Avoid displaying unsafe diagnostics or raw provider output in the workbench.

## 4. Verification

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Smoke check that fallback generation can store a snapshot and provenance-tagged issues.
- [x] 4.3 Archive the completed OpenSpec change.
