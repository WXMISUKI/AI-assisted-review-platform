# Design

## Snapshot shape

We keep the snapshot intentionally small and aligned with the existing task stream fields:

- stage index
- stage type
- agent key
- current paragraph id / index / total
- current paragraph label
- current section
- updated timestamp

This keeps it useful for recovery while still safe to persist in browser storage and easy to replace with a backend payload later.

## Compatibility strategy

The new snapshot is additive. Existing `streamStageIndex`, `streamStageType`, and related fields remain the source of truth for older code paths during the transition.

When a stored task does not yet contain a snapshot, the repository backfills one from the legacy fields so refresh and reopen continue to work.

## Recovery flow

1. The loading flow receives a backend SSE event or falls back to a local stage.
2. The task service writes both the legacy stream fields and the normalized snapshot.
3. The repository persists the task as-is.
4. When the app reloads, orchestration resolves the locked loading context from the snapshot first.

## Risks

- Snapshot drift if one code path updates the legacy stream fields but forgets the snapshot.
- Overfitting the snapshot with extra UI concerns.

## Mitigation

- Centralize snapshot creation in one helper.
- Keep the snapshot field business-oriented, not visual.
