## Purpose
Define the platform-owned opening-condition agent run after upload, including deterministic checklist extraction, material matching, explicit human-review completion, and report readiness without making Dify a runtime dependency.

## Requirements

### Requirement: Platform orchestrates the opening-condition agent run
The platform SHALL own the opening-condition agent run state after the operator uploads contract/qualification basis, checklist, and material package files.

#### Scenario: Upload creates an orchestrated task
- **WHEN** the operator submits the three required material groups
- **THEN** the backend creates or updates the pilot task using the returned task id
- **AND** the task records platform run events for checklist extraction, packet inventory preparation, material matching, and review readiness
- **AND** the browser does not need to call Dify, OCR Worker, or MaxKB directly

### Requirement: Checklist extraction follows the Dify check_items schema
The platform SHALL normalize checklist-derived review items using the Dify workflow's `check_items` contract as the schema reference.

#### Scenario: Known checklist template is uploaded
- **WHEN** the checklist filename or known adapter identifies the 承台施工条件核查表 template
- **THEN** the platform creates checklist/check item records containing item id, category, sub-category, content, mandatory flag, as-needed flag, expected material names, pass state, match files, remark, and row index
- **AND** the extracted items are persisted on the task as platform facts

#### Scenario: Checklist template cannot be recognized
- **WHEN** the platform cannot derive checklist items from the uploaded checklist
- **THEN** the task records a safe diagnostic explaining that checklist definition needs human input
- **AND** it does not invent formal review items

### Requirement: Material matching produces review statuses
The platform SHALL match checklist item material names against the task material inventory and derive review-item status.

#### Scenario: Required material has matching files
- **WHEN** a checklist item's expected material names are represented in the packet inventory
- **THEN** the task records matched evidence and marks the item as matched unless a visual or ambiguity rule requires human review

#### Scenario: Required material is missing or ambiguous
- **WHEN** a checklist item has no stable material match or requires visual/manual judgement
- **THEN** the task records a failed or human-review-needed check item
- **AND** a human-review queue item is created for blocking uncertainty

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

### Requirement: Checklist extraction follows the uploaded checklist content
The platform SHALL prefer checklist items extracted from the uploaded checklist document over static built-in templates.

#### Scenario: Uploaded checklist can be parsed
- **WHEN** the uploaded checklist document contains table rows for `资料核查`
- **THEN** the platform extracts checklist items from those rows
- **AND** it persists item id, category, sub-category, content, mandatory flag, as-needed flag, expected material names, and row index as platform facts

#### Scenario: Uploaded checklist contains现场核查 rows
- **WHEN** a parsed checklist row belongs to `现场核查`
- **THEN** the platform excludes that row from the current MVP material-review checklist
- **AND** it does not create a pending material-review item for that row

#### Scenario: Uploaded checklist cannot be parsed
- **WHEN** request-level items and document extraction do not produce items
- **THEN** the platform MAY use a known template fallback if the checklist filename is recognized
- **AND** otherwise records `manual_definition_required`

### Requirement: Agent run pauses only for human review
The platform SHALL run automatic workflow stages until human review is required, then wait for explicit operator input before final report generation.

#### Scenario: Automatic stages complete
- **WHEN** the task has uploaded files and extracted checklist items
- **THEN** the platform records extraction, inventory, matching, and review-readiness events without requiring intermediate operator clicks

#### Scenario: Human review is required
- **WHEN** matching produces open or deferred human-review items
- **THEN** the task remains `awaiting_human_review`
- **AND** final report generation waits for the operator to complete human review
