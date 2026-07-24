## Context

The project already has a hierarchical object model and static workspace catalog. The overview page can switch context by project, review object, and participating entity, but it does not help an operator answer the operational questions that matter for repeatable pilot delivery: which basis records belong here, how many master-data facts are ready here, whether the knowledge base is organization-scoped and ready here, and whether this context already has historical runs.

The goal of this change is to make those answers visible without introducing a new persistence system. The existing mock/domain layer is enough for a first registry slice.

## Goals / Non-Goals

**Goals:**
- Derive a workspace asset registry summary from existing packet/workspace/task facts.
- Render that registry on the overview so context switching is based on asset ownership and readiness, not just names.
- Make neighboring workspaces easy to compare at a glance inside the same project/review object.

**Non-Goals:**
- No create/edit workspace CRUD.
- No formal tenant or RBAC model.
- No backend storage redesign.
- No report-page redesign or full asset audit history UI.

## Decisions

1. **Keep registry derivation in the existing domain layer.**
   - Decision: Add derived summary helpers alongside `buildOpeningConditionWorkspaceCatalog`.
   - Rationale: Asset ownership in this slice is a view-model concern over existing packet/workspace metadata.

2. **Render registry on the overview, not in intake/governance first.**
   - Decision: Place the first asset registry slice where operators choose context.
   - Rationale: The biggest risk is selecting the wrong context before entering a run page.

3. **Treat run history as workspace-scoped, not project-global.**
   - Decision: Registry summaries must distinguish project neighbors from the selected workspace's own run history.
   - Rationale: This is the exact isolation rule the user wants to make visible before multi-project pilot rollout.

## Risks / Trade-offs

- **Risk: Registry data looks authoritative while still being mocked locally.** → Mitigation: Use wording that reflects "current workspace facts" and keep the implementation tied to existing packet/task sources.
- **Risk: Overview becomes visually crowded.** → Mitigation: Keep the first slice summary-first: counts, readiness, ownership, latest run presence; deeper drill-in can follow in a later change.
- **Risk: Shared project assets versus workspace-specific assets become confusing.** → Mitigation: Separate project-level grouping from workspace-level asset cards and label organization-scoped knowledge clearly.
