## ADDED Requirements

### Requirement: OCR structure recovery
The system SHALL convert OCR output into a normalized review-ready document structure with sections, paragraphs, and anchorable text spans.

#### Scenario: OCR output is recovered
- **WHEN** OCR returns markdown, JSONL, or page text output
- **THEN** the system can map that output into an ordered document structure containing sections and paragraphs

#### Scenario: Anchorable text is generated
- **WHEN** the structure recovery stage identifies text spans
- **THEN** the system can store paragraph ids, section labels, and anchor offsets for later review annotations

### Requirement: Structure recovery progress
The system SHALL expose progress for the structure-recovery stage after OCR completes.

#### Scenario: Structure recovery is running
- **WHEN** OCR has finished and the structure-restoration agent is processing the document
- **THEN** the system can report the active stage, progress percentage, and current paragraph or section

#### Scenario: Structure recovery completes
- **WHEN** the recovered document structure is ready
- **THEN** the system can hand the normalized structure to the review pipeline

### Requirement: Persisted recovered structure
The document review task SHALL persist recovered document structure as part of the task aggregate so it can be reopened later.

#### Scenario: User reopens an in-progress task
- **WHEN** a user refreshes or reopens a document after structure recovery has started
- **THEN** the system restores the current recovery snapshot and the recovered paragraphs already produced

#### Scenario: Recovered structure is available to review
- **WHEN** the pipeline advances from structure recovery to review analysis
- **THEN** the task exposes the recovered paragraphs and sections to the review workbench
