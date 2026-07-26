## Context

The opening-condition MVP now supports focused routing from the task ledger and report findings into checklist and human-review pages. Focused destinations show the selected item, but do not preserve where the operator came from. This creates a small workflow gap: after checking the item, the operator must manually navigate back to the task ledger or report page.

## Goals / Non-Goals

**Goals:**
- Track the source page for focused checklist and human-review navigation.
- Render a return action in focused checklist and human-review banners.
- Clear stale focus when returning to the source page or navigating generically.
- Keep the behavior local to the React shell.

**Non-Goals:**
- Do not add URL query params, browser history integration, or shareable deep links.
- Do not change task state, report state, human-review decision APIs, archive behavior, or backend payloads.
- Do not redesign the full workbench layout or change visual design beyond existing scoped focus controls.
- Do not touch construction-plan review flows.

## Decisions

1. Add a `focusedRouteOrigin` local state beside the existing focused ids.
   - Rationale: origin is navigation context, not a durable domain fact.
   - Alternative considered: infer origin from active page. That loses source information after navigation.

2. Reuse focused destination banners for return actions.
   - Rationale: the banner already explains what is focused, so it is the least noisy place to provide a return affordance.
   - Alternative considered: add page-level breadcrumbs. That is broader UI work and less MVP-focused.

3. Clear focus before returning to origin.
   - Rationale: returning to the source page should leave the destination focus state behind and avoid stale highlights later.

## Risks / Trade-offs

- [Risk] Focus return is lost on refresh.
  - Mitigation: acceptable for MVP because focused routing itself is transient.
- [Risk] More buttons in the focus banner could add minor visual density.
  - Mitigation: only render return actions when focus exists and an origin is known.
