## Context

The opening-condition agent detail currently renders list, preview, and review modes inside the left file pane while the progress pane remains fixed on the right. This makes DOCX/PDF previews too small and leaves less room for human-review reasoning. History rows already have progress data but display it as percent text, and timeline labels are partly English.

## Goals / Non-Goals

**Goals:**
- Preserve the existing two-pane list mode while allowing the progress pane to collapse.
- Use full-detail modes for file preview and checklist review so the operator gets a larger reading area.
- Use Chinese labels for platform workflow events and status badges.
- Improve review summary wording using existing task facts only.

**Non-Goals:**
- Add PDF page extraction, OCR chunking, or page-level annotation.
- Add legal-regulation retrieval or rectification-generation LLM nodes.
- Rebuild the whole agent console information architecture.

## Decisions

- Keep `workbenchMode` as the main local navigation state, but render preview/review branches at the `opening-agent-detail` root instead of inside `opening-agent-file-pane`.
- Add a local `progressPaneCollapsed` boolean for the selected task detail page. Collapsing hides the right pane in list mode and uses token-backed layout classes.
- Introduce small helper copy builders for timeline labels and review reasoning. These derive display text from existing task state, evidence, review scope, and human-review item fields.
- Reuse existing semantic tokens and button classes instead of adding new one-off colors.

## Risks / Trade-offs

- Full-width preview/review mode means progress is not always visible at the same time -> provide an obvious return button and keep progress accessible when returning to list mode.
- Review reasoning remains bounded by current platform facts -> copy should clearly state when the mode is completeness-only and avoid inventing compliance findings.
