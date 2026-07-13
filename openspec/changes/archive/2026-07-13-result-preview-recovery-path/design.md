# Design

The result preview should make two things visible:

1. Where the result came from: session snapshot, persisted task aggregate, or missing.
2. How to get back to the workbench for recovery or inspection.

The added controls should stay within the existing shell language:

- Keep the top bar and hero layout.
- Add a small provenance chip or summary.
- Add a recovery action that reopens the task workbench.

This keeps the page useful in both normal and degraded states without introducing a second route or a more complex recovery workflow.
