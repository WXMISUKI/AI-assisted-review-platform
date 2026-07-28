## Why

The platform can now persist packet content facts, but formal matching still needs stronger operator-facing output: checklist filtering must stay within material review scope, human review reasons must explain content uncertainty, and the final Markdown report must reflect platform-owned content verification and human decisions.

## What Changes

- Keep opening-condition MVP matching scoped to material/document review and fix corrupted Chinese scope filters.
- Surface content-fact support, mismatch, pending, and unsupported states in check-item semantics and human-review reasons.
- Ensure report findings and Markdown output include nonconforming/pending items derived from platform facts, including latest human-review notes.
- Keep large-PDF page splitting/OCR annotation and legal rectification LLM generation out of this batch.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `opening-condition-content-verification`: Content facts must drive check-item disposition, semantic notes, and human-review reasons in a conservative platform-owned way.
- `opening-condition-report-findings-delivery`: Final Markdown report must include a populated rectification table from check items, content-verification diagnostics, and human-review decisions.
- `opening-condition-human-review-check-item-context`: Human-review items must retain enough content-verification reason detail for operators to decide accept/reject/correct.
- `opening-condition-pilot-workflow`: The MVP workflow must explicitly exclude现场核查/应急/现场观测 items from material-review matching.

## Impact

- Backend opening-condition pilot store matching/report generation.
- Store tests for scope filtering, content-supported/mismatched review results, human-review reason clarity, and report Markdown rows.
- No new provider dependency or browser-to-provider route.
