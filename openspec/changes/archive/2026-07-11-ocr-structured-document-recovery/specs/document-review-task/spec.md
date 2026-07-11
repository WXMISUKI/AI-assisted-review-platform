## ADDED Requirements

### Requirement: Recovered structure in task aggregate
The document review task SHALL store recovered document structure as part of the task aggregate.

#### Scenario: Structure recovery succeeds
- **WHEN** OCR output is normalized into sections and paragraphs
- **THEN** the task stores the recovered structure together with the review task metadata

#### Scenario: Recovered paragraphs are reopened
- **WHEN** a user opens a task that already has recovered structure
- **THEN** the detail page can render the recovered sections and paragraphs without recomputing OCR

### Requirement: Structure recovery stage visibility
The document review task SHALL expose a distinct structure-recovery stage between OCR completion and review preparation.

#### Scenario: Structure recovery is active
- **WHEN** OCR has completed but structure recovery is still running
- **THEN** the task remains locked while showing the active structure-recovery progress
