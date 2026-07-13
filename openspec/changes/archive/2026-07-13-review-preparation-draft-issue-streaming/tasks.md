## 1. Spec and Contract

- [x] 1.1 Update `review-session-state` and `streaming-review-workbench` specs to define structure-driven draft issue summaries during review preparation.
- [x] 1.2 Clarify fallback behavior when recoveredStructure does not produce any draft issues.

## 2. Implementation

- [x] 2.1 Add a domain helper that derives stable issue summaries from deterministic draft issues.
- [x] 2.2 Update review-preparation stage construction to prefer structure-derived summaries.
- [x] 2.3 Keep loading UI consumption unchanged except for the richer summaries it receives.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Review the loading flow contract in the updated spec docs.
- [x] 3.3 Archive the completed OpenSpec change.
