# Opening Condition Review Task Workbench

## MVP Interaction Model

The opening-condition MVP should start from a review-task register instead of raw basis, master-data, or provider diagnostics.

Target operator flow:

1. Upload the required inputs: contract/basis files, checklist table, and material packet.
2. The workspace creates a review task row for the current run.
3. The row shows current state, owner, issue counts, human-review count, report status, and next action.
4. The operator clicks the row action to enter the recommended existing page: intake, checklist matching, human review, or report/archive.
5. Archived rounds remain read-only history and keep report access visible.
6. Rectification creates a new run while preserving previous rounds for comparison.

## Product Positioning

This workbench is the MVP entry point. Governance assets remain useful, but they should not be the first thing a normal supervisor has to interpret.

The screen should answer five questions quickly:

- What was submitted?
- What state is it in?
- Who owns the next action?
- What problems or manual decisions remain?
- Where is the report or archive record?

## Operator Shell Rule

The opening-condition sidebar should expose operator goals, not every internal execution step.

Primary entries:

- Task workbench / review task ledger.
- Human review.
- Report archive and history.
- Asset governance as follow-up capability.

Secondary execution pages:

- Material intake.
- Checklist matching details.

Secondary pages remain reachable from task-row recommended actions. This keeps the current MVP chain runnable while making the first-level shell closer to mature review platforms: operators start from a register, then drill into the next action for a specific task.

## Selected Task Detail Layer

The task ledger should not behave only as a list of jump buttons. When a task row is selected, the workbench should show a compact handoff panel for that round:

- Stage progress: intake, matching, human review, report delivery, archive.
- Current owner and next action.
- Problem count, human-review count, checklist count, evidence count.
- Report/archive state and read-only state.
- Primary action to continue the recommended next step.
- Secondary report/archive action when the selected task has reached report or archive relevance.

This selected-task layer is the near-term bridge between a simple register and a future evidence-preview workbench. It should stay compact and avoid expanding every row at once.

## Report Rectification Delivery List

The report page should expose a scan-friendly rectification delivery list before lower-level grouped issue cards.

Each delivery row should carry the fields needed by supervisors and by later DOCX/original-table export:

- Sequence number.
- Check item and category.
- Issue description.
- Risk level.
- Review disposition.
- Basis.
- Rectification requirement.
- Evidence or human-review notes when available.

This list is the platform-owned handoff layer. Future `docxToHtml` / `htmlToDocx`, original-table backfill, legal-rectification agents, or issue-review agents should consume this structured handoff rather than scraping UI copy.

## Report Export Delivery Package

The rectification delivery list should also be wrapped as a bounded report delivery package.

The package is the stable input boundary for:

- DOCX export.
- Original checklist/table backfill.
- The twelve issue-type review agents.
- Legal-basis and rectification-suggestion agents.
- Later evidence-preview or archive replay workers.

Minimum package fields:

- Schema version and package id.
- Source task id and read-only state.
- Row count, blocking count, pending-human-review count.
- Adapter status when a downstream exporter is connected.
- Next action for the operator or downstream worker.
- Structured rectification rows with checklist context, issue description, risk, disposition, basis, rectification requirement, and bounded notes.

This package must not include raw OCR text, raw prompts, credentials, private object URLs, or unbounded provider output. Downstream adapters should consume this package and fetch additional source objects through explicit object references or adapter contracts later, not through report-page copy.

## Future Evidence Preview Direction

The next substantial interaction upgrade should be issue-centered evidence preview:

- Each AI issue row should link to a file and page or locator when available.
- The preview can initially be lightweight: show the relevant file/page and highlighted excerpt.
- Human reviewers should be able to accept, reject, correct, or annotate the AI issue.
- Saved human decisions should feed the report and archived decision ledger.

This should be implemented after the task workbench and multi-round report loop are stable, not before.
