## Context

Previous work added a review-task workbench to the workspace overview, but the surrounding shell still presents `material-intake`, `check-tasks`, `human-review`, `reports`, and governance pages as equal left-nav entries. That makes the MVP feel like a collection of diagnostic panels rather than a mature review register.

Project docs already point to the target model: mature construction platforms expose registers, review status, current owner, next action, report/archive, and version history. Internal processing steps are still available, but they are reached from a task or document context.

## Goals / Non-Goals

**Goals:**

- Make the primary left nav match the operator mental model.
- Keep the task workbench as the default first entry.
- Preserve existing execution pages and the current smoke-tested chain.
- Make hidden internal pages show accurate titles when opened by task-row actions.
- Record the interaction rule in docs so future UI work does not re-expand the nav into implementation steps.

**Non-Goals:**

- No full visual redesign.
- No new route system.
- No backend status model change.
- No document evidence preview implementation in this change.

## Decisions

1. Use two navigation concepts:
   - Primary nav: pages normal operators should scan directly.
   - Secondary execution pages: pages opened from task-row next actions.

2. Primary nav entries:
   - `workspace-context`: task workbench / task ledger.
   - `human-review`: human review decisions.
   - `reports`: report archive and history.
   - `basis-sets`: asset governance as follow-up capability.

3. Secondary pages:
   - `material-intake`: upload, initialize, publish/confirm, and formal match controls.
   - `check-tasks`: checklist matrix and matching details.

4. Do not delete secondary pages. They are still required for the current MVP and should remain accessible through the task workbench row action.

## Risks / Trade-offs

- [Risk] Users who are used to clicking left-nav `资料接入` may need a new starting habit.
  → Mitigation: task rows and empty state keep a clear upload/intake button.

- [Risk] Active page may not be present in the primary nav.
  → Mitigation: use a complete page-label map for topbar titles while only rendering primary nav entries.

- [Risk] This is still not a full interaction redesign.
  → Mitigation: treat it as an information-architecture correction before later issue-preview and evidence-location work.
