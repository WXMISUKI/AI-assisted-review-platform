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

## Future Evidence Preview Direction

The next substantial interaction upgrade should be issue-centered evidence preview:

- Each AI issue row should link to a file and page or locator when available.
- The preview can initially be lightweight: show the relevant file/page and highlighted excerpt.
- Human reviewers should be able to accept, reject, correct, or annotate the AI issue.
- Saved human decisions should feed the report and archived decision ledger.

This should be implemented after the task workbench and multi-round report loop are stable, not before.
