## MODIFIED Requirements

### Requirement: Report readiness is derived from task facts
The platform SHALL derive report readiness and report content from persisted check items and human-review decisions.

#### Scenario: Blocking human review remains
- **WHEN** at least one human-review queue item is open or deferred
- **THEN** the task remains `awaiting_human_review`
- **AND** report generation remains blocked

#### Scenario: Human review decisions are recorded before report readiness
- **WHEN** the reviewer confirms, corrects, rejects, or defers an individual human-review item
- **THEN** the platform records the decision, reviewer, safe note, and event
- **AND** it keeps the task in the human-review stage until the operator explicitly completes human review

#### Scenario: Operator completes human review
- **WHEN** matching has produced check items, all blocking human-review items are closed, and the operator submits completion
- **THEN** the task can enter `report_ready`
- **AND** the generated report asset summarizes total, passed, failed, general failures, serious failures, legal basis, rectification, and the internal AI-assisted disclaimer

#### Scenario: Human-reviewed item is accepted
- **WHEN** a human-review item is confirmed by the operator
- **THEN** the final Markdown report treats that item as accepted for the current run
- **AND** it does not keep the item in the non-compliant Markdown table solely because the automatic verdict was previously blocking

#### Scenario: Human-reviewed item is corrected or rejected
- **WHEN** a human-review item is corrected or rejected by the operator
- **THEN** the final Markdown report includes the item as a reportable finding
- **AND** the problem description includes the platform reason and the operator safe note when present

### Requirement: Checklist extraction follows the uploaded checklist content
The platform SHALL prefer checklist items extracted from the uploaded checklist document over static built-in templates.

#### Scenario: Uploaded checklist can be parsed
- **WHEN** the uploaded checklist document contains table rows for `资料核查`
- **THEN** the platform extracts checklist items from those rows
- **AND** it persists item id, category, sub-category, content, mandatory flag, as-needed flag, expected material names, and row index as platform facts

#### Scenario: Uploaded checklist contains `现场核查` rows
- **WHEN** a parsed checklist row belongs to `现场核查`
- **THEN** the platform excludes that row from the current MVP material-review checklist
- **AND** it does not create a pending material-review item for that row
- **AND** final reports do not include that row as a compliant or non-compliant material-review finding

#### Scenario: Uploaded checklist cannot be parsed
- **WHEN** request-level items and document extraction do not produce items
- **THEN** the platform MAY use a known template fallback if the checklist filename is recognized
- **AND** otherwise records `manual_definition_required`
