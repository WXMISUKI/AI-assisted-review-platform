## 1. Backend Contract

- [x] 1.1 Extend the domain types and backend normalization for bounded checklist context on human-review items and decision-ledger entries.
- [x] 1.2 Populate the context snapshot when formal matching creates a checklist human-review item.
- [x] 1.3 Add legacy-task backfill from `checkItems` and `checklistDefinition`, preserving existing IDs and decisions.

## 2. Operator Rendering

- [x] 2.1 Render category, subcategory, checklist name, target ID, reason, rule explanation, and evidence references in the backend human-review view.
- [x] 2.2 Render checklist context in the archived report decision ledger with a safe fallback when context is unavailable.

## 3. Verification

- [x] 3.1 Add focused store tests for context creation, legacy backfill, and decision-ledger projection.
- [x] 3.2 Run `node --test server/openingConditionPilotStore.test.mjs`, `pnpm typecheck`, and `openspec validate opening-condition-human-review-check-item-context`.
- [x] 3.3 Refresh the current real pilot task in the running UI and verify each open review item can be identified without relying on its ID alone.
