## 1. Clean Opening-Condition Facts

- [x] 1.1 Replace the static G15 opening-condition packet with a clean current-project fixture containing no historical check items, evidence, human reviews, master data, or report findings; preserve required types, labels, and derived helper functions.
- [x] 1.2 Update app initialization and workspace switching so an empty backend task list cannot fall back to fabricated historical opening-condition facts.
- [x] 1.3 Verify that construction-review mock files remain untouched and add a focused source assertion that opening-condition default fixtures contain no G15 report/finding payload.

## 2. Review-Scope Contract

- [x] 2.1 Add the `completeness | completeness_and_compliance` review-scope type to the opening-condition task intake contract and client bootstrap input.
- [x] 2.2 Normalize and safely persist or echo `reviewScope` in the opening-condition pilot store/task response without generating compliance findings.
- [x] 2.3 Pass the selected review scope from the agent upload modal through the real bootstrap path and keep completeness-only copy source-bound.

## 3. Cloud-Case Style Shell

- [x] 3.1 Reduce the opening-condition sidebar to project context, `新建审核`, and compact project-scoped history; move governance routes behind task/detail advanced entry.
- [x] 3.2 Make the agent home a clean new-review entry with required completeness scope, optional compliance scope, and a three-row upload modal whose parse action is gated by all three files.
- [x] 3.3 Make task detail explicit: clicking a history row enters the left-file/right-progress-and-report view, and the home view remains free of task detail when no task is selected.
- [x] 3.4 Keep material preview rows derived only from persisted task objects and show an explicit empty state when no task exists.

## 4. Verification And Archive

- [x] 4.1 Extend opening-condition UI smoke to cover clean empty state, compact navigation, explicit detail entry, three-file gate, and review-scope wiring.
- [x] 4.2 Run `openspec validate opening-condition-cloud-case-shell-and-clean-fixtures --strict`, `npm run typecheck`, `npm run smoke:opening-condition:ui`, and the targeted opening-condition backend smoke.
- [x] 4.3 Mark completed tasks, review the diff for scope isolation, and archive the OpenSpec change only after all verification passes.
