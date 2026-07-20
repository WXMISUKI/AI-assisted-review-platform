## ADDED Requirements

### Requirement: Pilot completion frontend contract
The frontend contract SHALL expose typed calls for backend human-review decisions, report generation, and task archive as part of the single-project opening-condition pilot completion loop.

#### Scenario: Human review decision is submitted
- **WHEN** the portal submits a human-review decision for a pilot task
- **THEN** the typed client posts the decision, actor, and bounded safe note to the backend human-review decision endpoint and returns the updated task payload

#### Scenario: Report is generated
- **WHEN** the portal requests report generation for a pilot task
- **THEN** the typed client calls the backend report endpoint and returns the report asset and refreshed task

#### Scenario: Task is archived
- **WHEN** the portal requests archive for a pilot task
- **THEN** the typed client calls the backend archive endpoint and returns the archived task payload

### Requirement: Completion-loop operator diagnostics
The pilot completion loop SHALL display bounded operator diagnostics for completion actions without exposing provider secrets, raw OCR text, raw prompts, or private object URLs.

#### Scenario: Completion action succeeds
- **WHEN** a human-review decision, report generation, or archive action succeeds
- **THEN** the portal displays a concise success message and refreshed backend state

#### Scenario: Completion action fails
- **WHEN** a human-review decision, report generation, or archive action fails
- **THEN** the portal displays the backend-safe error message and keeps the rest of the opening-condition workspace usable
