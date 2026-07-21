# opening-condition-real-sample-trial-package Specification

## Purpose
TBD - created by archiving change opening-condition-real-sample-repeatable-trial-package. Update Purpose after archive.
## Requirements
### Requirement: Repeatable trial package summary
The system SHALL persist a bounded trial package summary on opening-condition pilot tasks so one real sample run can be replayed without raw document text, secrets, private URLs, or server-local file paths.

#### Scenario: Trial package is created from real intake
- **WHEN** real-file trial bootstrap or intake initializes a pilot task
- **THEN** the task contains a trial package summary with task id, workspace id, submitted actor, input object filenames, checklist-definition resolution, packet inventory resolution, provider readiness summary, blocking reasons, and latest run state

#### Scenario: Trial package updates across the loop
- **WHEN** matching, human-review decisions, report generation, or archive actions complete
- **THEN** the trial package summary reflects the latest counts, blocking status, report asset status, archive status, and last updated time

### Requirement: Bounded evidence handoff diagnostics
The system SHALL allow task-owned evidence to carry bounded OCR or provider handoff status without making external provider output a final approval decision.

#### Scenario: Evidence records provider handoff status
- **WHEN** OCR or knowledge-provider handoff information is available for a source object or evidence record
- **THEN** the evidence stores only safe status fields such as provider, job id, state, summary, document ref id, and updated time

#### Scenario: Provider output remains advisory
- **WHEN** matching uses evidence with OCR or provider diagnostics
- **THEN** final disposition still comes from platform rules and human review state rather than provider status alone

### Requirement: Auxiliary trial report package
The system SHALL generate a report package summary that includes real trial inputs, matching results, human decisions, diagnostics, and archive state.

#### Scenario: Report package is generated
- **WHEN** the operator generates a report for a report-ready task
- **THEN** the report asset includes bounded package diagnostics with input filenames, checklist count, evidence count, human-review decision counts, provider/readiness blockers, and disclaimer

#### Scenario: Archived package is immutable
- **WHEN** the operator archives a report package
- **THEN** the archived task and report package cannot be mutated by later report-generation requests

### Requirement: Report package decision traceability
The real-sample trial report package SHALL preserve bounded human-review decision traceability for archived replay.

#### Scenario: Report package contains decision ledger
- **WHEN** a report package is generated for a real-sample pilot task
- **THEN** the package diagnostics include bounded human-review decision ledger entries in addition to aggregate human-review counts

### Requirement: Operator runbook support
The system SHALL document operator steps and developer observation points for real sample trial runs.

#### Scenario: Operator follows the runbook
- **WHEN** the operator runs a real sample through the portal
- **THEN** the runbook tells them which page to open, which files to select, which buttons to press, what status text to expect, and what logs or blockers to report
