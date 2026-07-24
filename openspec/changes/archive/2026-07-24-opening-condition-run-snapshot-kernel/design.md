## Context

The current portal already has state gates, action ownership, run history, and report/archive pages, but the same workflow facts are recalculated in multiple places. `OpeningConditionReportDeliveryWorkbench` and `OpeningConditionReportArchivePage` both independently derive history lists, selected runs, current-run checks, rerun-entry availability, and report action guards. Separately, rectification closure compares problem items using helper functions in the same page file, but the closure category logic still leaks intermediate `needs_human_review` semantics into operator-facing summaries.

This is now a product-risk issue more than a UI issue: the operator can still reach a mostly correct outcome, but the system does not present one stable source of truth for "what am I looking at, what can I still do, and what is the one next step?".

## Goals / Non-Goals

**Goals:**
- Extract a shared run-snapshot derivation for workspace history/report/archive views.
- Make current-run vs historical-run semantics consistent across report and archive workbenches.
- Make rerun-entry availability depend on a single shared rule.
- Normalize rectification closure and pending-human summaries from final operator-facing dispositions.

**Non-Goals:**
- No redesign of the full report visual language.
- No backend model or API changes.
- No new workspace CRUD, permissions, or database migration.
- No overhaul of all portal pages; this change is limited to report/archive/history semantics.

## Decisions

1. **Create a dedicated run-snapshot helper module.**
   - Decision: Move shared derivation out of `productWorkspacePages.tsx` into a focused helper module.
   - Rationale: The issue is duplicated semantics, so the fix should be a reusable fact layer rather than more conditional rendering.

2. **Treat the selected run snapshot as the page source of truth.**
   - Decision: Derive a single snapshot containing selected run, current-run flag, historical-readonly flag, rerun-entry eligibility, and history ordering metadata.
   - Rationale: Report and archive pages should render from the same snapshot semantics even if their page copy differs.

3. **Resolve closure categories from final operator-facing disposition.**
   - Decision: Rectification closure summary must use normalized dispositions such as `confirm`, `correct`, `reject`, `fail`, `blocked`, and only treat truly open/deferred review items as pending.
   - Rationale: This directly fixes the user's confusion where "人工驳回" still reads like "待人工判断".

4. **Keep rerun entry singular and explicit.**
   - Decision: Only the current archived run can expose the forward action for the next rectification rerun; historical snapshots remain read-only drill-in.
   - Rationale: This preserves the user's desired "single approved entrance" and prevents history pages from feeling like hidden mutation panels.

## Risks / Trade-offs

- **Risk: Shared helper extraction may feel like over-abstraction.** → Mitigation: Keep it narrowly scoped to selected-run, history, and closure facts used by report/archive pages only.
- **Risk: Small copy differences between report and archive pages might still remain.** → Mitigation: Unify semantics first; UI wording can continue to differ where page intent differs.
- **Risk: Historical selections hidden locally could interact oddly with the new snapshot selection defaults.** → Mitigation: Keep existing hidden-run audit behavior and only centralize how visible history is derived.
