## ADDED Requirements

### Requirement: Shared run snapshot semantics
The system SHALL derive one shared run snapshot for workspace report and archive views.

#### Scenario: Operator opens a run-backed delivery page
- **WHEN** the page is backed by current workspace run history
- **THEN** the page derives one selected run, one visible history list, and one current-vs-historical snapshot state
- **AND** both report and archive views can render from that same snapshot instead of recalculating separate semantics

#### Scenario: Selected run is historical
- **WHEN** the selected run is not the current mutable run
- **THEN** the snapshot marks it as read-only history
- **AND** mutation actions are not exposed from that historical selection

### Requirement: Normalized closure-state derivation
The system SHALL derive rectification closure and pending-human summaries from final operator-facing disposition.

#### Scenario: Human review already rejected or corrected an item
- **WHEN** the latest human decision for a checklist item is `rejected`, `confirmed`, or `corrected`
- **THEN** closure summaries use that final operator-facing state
- **AND** the item is not counted as pending human judgement unless its latest review remains open or deferred

#### Scenario: Operator compares current round with previous archived round
- **WHEN** the selected run has a previous archived run in the same workspace
- **THEN** the closure comparison labels items as rectified, carried over, newly added, or pending human judgement using normalized final disposition rules
