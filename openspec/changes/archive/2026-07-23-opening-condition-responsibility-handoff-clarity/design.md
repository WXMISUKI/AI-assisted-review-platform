## Context

The platform is moving from a runnable pilot toward a repeatable review workflow. Mature construction review platforms emphasize handoff clarity: current owner, next action, due state, blockers, and history. This project already derives `OpeningConditionRunActionOwnership` in `src/openingConditionPortalState.ts` and renders it in `src/productWorkspacePages.tsx`, but several labels are unreadable and the human-review grouping still feels like a developer queue rather than an operator handoff.

## Goals / Non-Goals

**Goals:**

- Make responsibility ownership readable in Chinese on overview, human-review, and report-adjacent views.
- Show due state, blocker count, current owner, recommended page, and primary action as a clear handoff panel.
- Group human-review items into pending, deferred-blocking, and resolved sections with explicit delivery impact.
- Keep archived or historical runs read-only and avoid introducing duplicate mutation entries.

**Non-Goals:**

- Do not add a database migration, user/role permission system, or server-side SLA model.
- Do not change the backend task state machine.
- Do not create a cross-project workqueue yet.
- Do not redesign the whole visual system.

## Decisions

### 1. Improve existing derived ownership instead of adding a new model

`deriveOpeningConditionRunActionOwnership` already provides the fields needed for a pilot handoff. This change keeps that shape and normalizes labels, reducing risk while improving operator clarity.

### 2. Treat the responsibility board as a navigation handoff

The board should not only display metrics. It should tell the operator what the current stage means and provide one recommended page/action. This mirrors the project direction: state, owner, next action, history.

### 3. Human review remains item-level, but grouped by delivery impact

Pending and deferred items both block report delivery, while resolved items are evidence trail. Grouping makes this explicit without changing review decisions.

## Risks / Trade-offs

- [Some older Chinese literals remain elsewhere] -> This change only normalizes responsibility and human-review surfaces to avoid a wide risky rewrite.
- [Due windows are still derived frontend hints] -> Keep them labelled as pilot handoff hints, not contractual SLA.
- [No cross-project queue yet] -> This is intentional; single-project production readiness comes before multi-project expansion.
