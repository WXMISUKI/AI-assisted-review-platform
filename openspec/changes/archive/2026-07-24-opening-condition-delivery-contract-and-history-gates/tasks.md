## 1. Specification

- [x] 1.1 Create proposal, design, delta specs, and task list for delivery handoff and history gates.
- [x] 1.2 Validate the OpenSpec change before implementation.

## 2. Backend Contract

- [x] 2.1 Add a normalized report delivery handoff field to opening-condition report package diagnostics.
- [x] 2.2 Derive delivery handoff facts from task state, human-review queue, report asset, findings, and archive status.
- [x] 2.3 Preserve delivery handoff facts when archiving a report asset.

## 3. Frontend Rendering

- [x] 3.1 Extend frontend opening-condition pilot types for the delivery handoff contract.
- [x] 3.2 Render delivery handoff facts on the report page with a fallback to existing run ownership summary.
- [x] 3.3 Keep historical report detail actions read-only and route continued work through the explicit rectification rerun entry.

## 4. Verification And Archive

- [x] 4.1 Add or update focused smoke assertions for delivery handoff diagnostics.
- [x] 4.2 Run targeted validation and smoke commands.
- [x] 4.3 Sync affected main specs and archive the change.
