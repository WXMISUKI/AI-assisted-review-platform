## ADDED Requirements

### Requirement: Final review state normalization
The system SHALL derive one operator-facing final state for each opening-condition checklist item from raw matching verdicts and human review outcomes.

#### Scenario: Human review rejects an item
- **WHEN** a checklist item was previously in `needs_human_review`
- **AND** the latest human review outcome for that item is `rejected`
- **THEN** the operator-facing state is shown as rejected and requiring supplementation
- **AND** it is no longer shown as pending human review

#### Scenario: Human review confirms or corrects an item
- **WHEN** a checklist item has a latest human review outcome of `confirmed` or `corrected`
- **THEN** the operator-facing state is treated as resolved for delivery views
- **AND** the item is not listed as an outstanding rectification problem

#### Scenario: Human review remains open or deferred
- **WHEN** a checklist item has a latest human review outcome of `open` or `deferred`
- **THEN** the operator-facing state is shown as pending human handling
