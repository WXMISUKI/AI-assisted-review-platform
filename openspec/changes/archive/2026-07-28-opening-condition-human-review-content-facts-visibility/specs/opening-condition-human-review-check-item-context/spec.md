## ADDED Requirements

### Requirement: Human-review detail shows content-verification context
The human-review detail page SHALL show content-verification context for the selected checklist item when task-owned facts are available.

#### Scenario: Operator opens a content-mismatched item
- **WHEN** the selected checklist item has semantic mismatch or unavailable content diagnostics
- **THEN** the detail page shows the semantic note and matching content-fact rows so the operator can understand why the item needs review

#### Scenario: Content facts are unsupported or pending
- **WHEN** matching content facts are pending, unsupported, partial, or failed
- **THEN** the detail page shows a readable Chinese status and makes clear that content accuracy has not been proven
