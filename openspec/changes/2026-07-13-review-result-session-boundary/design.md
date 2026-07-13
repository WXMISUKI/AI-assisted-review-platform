# Design

The result preview should follow the same aggregate-first pattern as the workbench.

1. The persisted `ReviewTask` remains the source of truth.
2. `createReviewSession(...)` should expose the task's `resultAsset` when present.
3. The result preview page should prefer the session snapshot asset and fall back to the task aggregate only when the session snapshot is unavailable.
4. The app should keep routing decisions simple: completed tasks go to the result page, everything else follows the existing lifecycle.

This keeps the contract easy to replace later with backend data while avoiding a second result-specific state assembly path.
