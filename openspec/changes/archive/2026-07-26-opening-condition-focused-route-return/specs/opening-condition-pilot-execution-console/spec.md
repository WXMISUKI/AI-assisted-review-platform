## ADDED Requirements

### Requirement: Focused detail return routing
The opening-condition portal SHALL let operators return from a focused checklist or human-review destination to the page that initiated the focused navigation.

#### Scenario: Operator returns from focused checklist detail
- **WHEN** the operator opens a checklist item from the task ledger or report page
- **AND** the focused checklist banner is shown
- **THEN** the banner provides a return action to the originating page
- **AND** returning clears the focused checklist context

#### Scenario: Operator returns from focused human-review detail
- **WHEN** the operator opens a human-review item from the task ledger or report page
- **AND** the focused human-review banner is shown
- **THEN** the banner provides a return action to the originating page
- **AND** returning clears the focused human-review context

### Requirement: Focus origin remains transient
The opening-condition portal SHALL treat focus origin as local navigation context rather than business state.

#### Scenario: Operator uses generic navigation
- **WHEN** the operator navigates through the sidebar or another generic route action
- **THEN** the focused id and focused origin are cleared
- **AND** no task, report, review decision, or archive state is changed
