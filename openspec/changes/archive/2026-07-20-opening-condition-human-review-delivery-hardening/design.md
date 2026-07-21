## Context

The current pilot now reaches `awaiting_human_review` with real task-owned human-review items. This is aligned with mature construction document review systems: automated checks help route and summarize, while human reviewers record formal responses before report/closeout. The current UI exposes decisions, but it does not strongly explain the handoff or fully gate report generation by task state.

## Goals / Non-Goals

**Goals:**
- Make the next operator action obvious after formal matching produces blockers.
- Show human-review progress in terms that map to delivery: blocking, closed, rejected/deferred, and report readiness.
- Ensure report generation only appears actionable when the task is `report_ready`.
- Keep the implementation small and aligned with the existing state machine.

**Non-Goals:**
- No redesigned workflow engine or multi-step approver routing.
- No custom reviewer assignment model.
- No OCR/MaxKB quality tuning.
- No downloadable formal report asset.

## Decisions

1. Treat human-review queue as the delivery handoff.
   - Decision: the UI derives counts from backend `humanReviewQueue` and `trialPackage`, and presents the queue as the authoritative blocker list.
   - Rationale: this matches the platform-owner model and avoids local demo data taking precedence.

2. Keep backend state as the final gate.
   - Decision: the report button requires `pilotTask.state === "report_ready"` in addition to no open/deferred blockers and no existing report.
   - Rationale: empty queues can occur in intermediate states; the backend state remains the workflow contract.

3. Preserve existing decision meanings.
   - Decision: confirm/correct/reject close a blocker; defer remains blocking.
   - Rationale: rejected items should still be reportable as a formal negative conclusion; deferred items still require action before report.

## Risks / Trade-offs

- [Risk] The UI still does not collect custom reviewer notes per click. -> Mitigation: existing backend records a bounded safe note; richer note capture can be a later slice after the basic delivery loop is proven.
- [Risk] No assignment/SLA model yet. -> Mitigation: not needed for the single-project pilot; add after repeated runs show real reviewer handoff pain.
