# Design

## Boundary choice

The session service already knows how to assemble a review session from a task aggregate. The UI should reuse that assembly result when opening the workbench so the page no longer needs to infer its own initial review context.

## UI contract

The workbench component can remain mostly unchanged. We only add a small session snapshot prop and let the page derive its initial paragraph/section focus from that snapshot when present.

## Compatibility

If the session snapshot is missing, the workbench falls back to its current behavior based on recovered structure and paragraph props.

## Risks

- Duplicate data between `selectedDocument` and `sessionSnapshot`.

## Mitigation

- Keep the snapshot additive and prefer it only for initialization and derived context, not for direct editing state.
