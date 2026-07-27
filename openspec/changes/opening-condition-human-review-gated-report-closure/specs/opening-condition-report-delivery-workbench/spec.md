## MODIFIED Requirements

### Requirement: Acceptance-oriented report workbench
The opening-condition report workbench SHALL prioritize a concise delivery-ready Markdown report over dense internal diagnostics.

#### Scenario: Current run is report ready
- **WHEN** the selected current run has a generated report asset with `markdownContent`
- **THEN** the workbench renders that Markdown content as the primary report surface
- **AND** supporting diagnostics remain secondary to the operator-facing report result

#### Scenario: Historical archived run is selected
- **WHEN** the selected run is archived and has a report asset
- **THEN** the workbench renders the archived Markdown report as read-only history
- **AND** it does not promote mutation actions for that historical selection

### Requirement: Prioritized delivery findings
The system SHALL keep detailed diagnostics subordinate to the final report handoff.

#### Scenario: Report asset includes dense package diagnostics
- **WHEN** the selected run includes package diagnostics, delivery package rows, or decision ledger data
- **THEN** the workbench may still expose them
- **BUT** it does not make those dense structures the first thing the operator reads instead of the final report summary

### Requirement: Report and human-review closure stay aligned
The report workbench SHALL reflect the result of the selected task's human-review closure path.

#### Scenario: Human review is not yet complete
- **WHEN** the selected task still has blocking human-review items or has not completed the review stage
- **THEN** the report area shows that report delivery is not ready yet
- **AND** it points the operator back to the selected-task review workbench rather than rendering a fake final report
