# Design

The review-loading experience should answer three questions at a glance:

1. Has the OCR result been hydrated into a review-ready structure?
2. Which structure source is driving the current loading snapshot?
3. Is the task still on a safe fallback path if hydration failed?

The change should stay inside the existing shell language:

- Reuse the current loading page and its review-preparation layout.
- Add a compact provenance signal for hydrated structure or fallback recovery.
- Keep the workbench unlock behavior driven by the hydrated task snapshot.

This keeps the handoff legible without introducing a new route or a separate recovery workflow.
