# opening-condition-report-findings-delivery Specification

## Purpose
TBD - created by archiving change opening-condition-rectification-rerun-and-report-delivery. Update Purpose after archive.
## Requirements
### Requirement: Findings-oriented auxiliary report
The system SHALL render the opening-condition auxiliary report as a findings-oriented delivery view rather than a statistics-only summary.

#### Scenario: Report contains failed or blocked items
- **WHEN** a report-ready task generates a report asset
- **THEN** the report view shows each failed, blocked, or warning item with checklist name, category, problem description, basis reference, risk level, and rectification suggestion

#### Scenario: Report contains human-review outcomes
- **WHEN** the report asset includes human-review decisions
- **THEN** the report view shows which findings were confirmed, corrected, rejected, or deferred by a human reviewer

#### Scenario: Report contains mixed delivery priorities
- **WHEN** the selected run contains blocked, failed, pending-human-review, and warning findings
- **THEN** the report view groups those findings by operator-facing delivery priority instead of one undifferentiated list
- **AND** each group remains visually scannable as part of the report handoff

### Requirement: Rectification handoff summary
The report SHALL provide a concise handoff summary for the next rectification round, including adjacent-run closure status when history is available.

#### Scenario: Current round is not approved
- **WHEN** the report concludes that work should not proceed or requires supplementation
- **THEN** the report view shows the outstanding item count, major blockers, and the expected next operator action for re-submission

#### Scenario: Current round has previous history
- **WHEN** the report view can compare the selected run with a previous archived run
- **THEN** the report view shows rectified, carried-over, newly-added, and pending-human-review counts as part of the handoff summary

### Requirement: Human-readable delivery semantics
The report SHALL present review outcomes in operator-facing language rather than raw internal enum values.

#### Scenario: Findings are rendered for supervisors
- **WHEN** the report view displays findings, risk levels, or handling outcomes
- **THEN** the system shows readable Chinese labels for category, risk level, handling conclusion, and current status
- **AND** the report visually distinguishes blocked, failed, pending-human-review, and not-in-scope items so the operator can scan priorities quickly

#### Scenario: Human review has already resolved the item
- **WHEN** a finding has a latest human review outcome of `confirmed`, `corrected`, or `rejected`
- **THEN** the displayed handling conclusion follows that human review outcome instead of continuing to show the raw `needs_human_review` verdict

### Requirement: Report handoff ownership summary
The report SHALL show the current run's owner, next action, and due-state as part of the delivery handoff.

#### Scenario: Current run still requires follow-up
- **WHEN** the selected run is current and still has unresolved findings or pending delivery actions
- **THEN** the report view shows who currently owns the follow-up
- **AND** it states what the next required action is for advancing or restarting the review loop

#### Scenario: Archived run is viewed as history
- **WHEN** the selected run is archived
- **THEN** the report view shows that the archived run is read-only history
- **AND** it states that the next action, if any, is to start the next rectification rerun rather than mutate the archived run

### Requirement: Trial report handoff checklist
The opening-condition report SHALL render a trial handoff checklist that makes the selected run's delivery result understandable without reading internal task events.

#### Scenario: Report handoff is generated from platform facts
- **WHEN** a report asset exists for the selected run
- **THEN** the report page shows a handoff checklist derived from task-owned check items, evidence, human-review decisions, package diagnostics, and run history
- **AND** it does not rely on raw provider output as the source of final delivery status

#### Scenario: Report explains failed and rejected findings
- **WHEN** a finding is failed, blocked, or rejected by human review
- **THEN** the report handoff shows the checklist item name, parent category, missing or non-compliant file reason, expected evidence hints, risk level, and rectification suggestion

#### Scenario: Report explains resolved findings
- **WHEN** a finding has been confirmed or corrected by human review
- **THEN** the report handoff shows that the item has been manually resolved and keeps the reviewer note visible as part of the decision ledger

### Requirement: Historical report detail entry
The opening-condition report SHALL allow operators to inspect the complete details of historical archived rounds without mutating them.

#### Scenario: Operator opens archived round detail
- **WHEN** the operator selects an archived historical round
- **THEN** the report page shows the full selected-run report facts, findings, decision ledger, closure comparison, and archive status
- **AND** no mutation action for that archived run is exposed

#### Scenario: Operator compares current and previous round
- **WHEN** the selected run has a previous archived round
- **THEN** the report page shows which prior findings are resolved, carried over, newly added, or still pending human judgement

### Requirement: Structured issue-delivery package
The opening-condition report SHALL include a structured issue-delivery package in addition to summary diagnostics.

#### Scenario: Report is generated for a failed or mixed-result run
- **WHEN** a report-ready or archived run contains findings that are failed, blocked, warning, rejected, or manually corrected
- **THEN** the report asset includes a structured findings package with issue type, checklist context, risk level, legal basis, rectification requirement, and latest human-review conclusion when available

### Requirement: Issue-type oriented report grouping
The report SHALL support grouping and summarizing findings by issue taxonomy and delivery priority.

#### Scenario: Multiple problem classes exist in one run
- **WHEN** the selected run contains findings from different opening-condition problem classes
- **THEN** the report can show grouped summaries by issue type and delivery priority rather than one flat undifferentiated list

### Requirement: Export-ready finding semantics
The report package SHALL expose bounded export-ready fields for future original-form backfill and document generation.

#### Scenario: External exporter reads the report package
- **WHEN** a future exporter or original-form backfill worker consumes the report asset
- **THEN** it can read stable checklist context, issue type, legal basis, rectification requirement, handling conclusion, and reviewer note fields without needing provider raw output

### Requirement: Export-handoff visibility in report delivery
The opening-condition report delivery view SHALL expose export-handoff readiness as part of the operator-facing delivery summary.

#### Scenario: Report package includes export handoff
- **WHEN** a selected run has exporter-ready handoff metadata
- **THEN** the report page shows the selected adapter or template, current handoff status, and the next action for original-form backfill or document export

### Requirement: Report delivery handoff contract
The opening-condition report SHALL expose a bounded delivery handoff that explains the selected run's delivery status, action owner, next action, recommended page, and read-only state.

#### Scenario: Current report-ready run is rendered
- **WHEN** a current opening-condition run has generated a report asset
- **THEN** the report package includes a delivery handoff derived from task-owned state, findings, human-review decisions, and archive status
- **AND** the report page displays that handoff without requiring the operator to inspect raw task events

#### Scenario: Archived run is rendered
- **WHEN** an archived opening-condition run is inspected as history
- **THEN** the report delivery handoff marks the run as read-only
- **AND** the next action explains that continued work must start through a new rectification rerun rather than mutating the archived run

#### Scenario: Report is blocked by human review
- **WHEN** report delivery facts are derived for a run with open or deferred human-review items
- **THEN** the handoff identifies human review as the current owner
- **AND** it includes the blocking count and the next action to close the review queue before report delivery
