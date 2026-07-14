# Backend task persistence foundation

## Why

The platform is moving from an MVP workbench toward a mature human-in-the-loop review platform. Recent changes added backend provider guardrails, review generation run snapshots, recovery actions, activity trails, preparation packages, draft issue provenance, and a backend generation run bridge.

The remaining architectural gap is persistence ownership. Review documents, tasks, generation runs, issues, and activity trails are still primarily assembled and stored through frontend/localStorage. That is acceptable for early MVP iteration, but it cannot support mature review-platform requirements such as refresh recovery across devices, backend worker handoff, auditability, permissions, and future Python agent services.

The next step should not be a wholesale rewrite into Python. The next step should be a backend-owned durable task contract behind the existing Node BFF. This gives the frontend a stable review-task interface and gives future queue/worker/Python services a persistent state model to update.

## What Changes

- Introduce a backend review task persistence contract for document review tasks.
- Add backend endpoints for listing, reading, creating/upserting, and updating review task snapshots.
- Persist review task state to a simple development storage adapter first, while shaping the interface so PostgreSQL can replace it later.
- Include review generation run, preparation package, draft issue snapshot, review issues, activity trail, OCR job, source object, failure, and result asset fields in the backend-owned task snapshot.
- Update frontend session repository usage to prefer backend task persistence when available and keep localStorage as a compatibility fallback.
- Keep current review-generation and workbench behavior unchanged from the user's perspective.
- Document that Node remains the BFF/API seam while durable worker/Python agent services come later.

## Non-goals

- No Python worker implementation in this change.
- No Redis/Celery/BullMQ/Temporal queue in this change.
- No production PostgreSQL migration in this first slice.
- No real authentication or tenant permission enforcement yet.
- No destructive migration of existing localStorage tasks.
- No full immutable audit-log service.

## Impact

- `server/index.mjs`
- new backend review task persistence module under `server/`
- `src/domain/reviewTaskRepository.ts`
- `src/domain/backendConnectivity.ts`
- `src/domain/reviewTypes.ts` only if transport shape needs a narrow wrapper
- `docs/architecture-evolution-decisions.md`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/document-review-task/spec.md`
- `openspec/specs/review-workbench/spec.md`
- `openspec/specs/local-development-runtime/spec.md`
