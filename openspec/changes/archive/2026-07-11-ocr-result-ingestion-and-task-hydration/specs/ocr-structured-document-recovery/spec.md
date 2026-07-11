## ADDED Requirements

### Requirement: PaddleOCR JSONL structure recovery
The system SHALL convert PaddleOCR JSONL or markdown output into a normalized recovered document structure with sections, paragraphs, and recovery progress.

#### Scenario: PaddleOCR JSONL is recovered
- **WHEN** the backend receives a PaddleOCR JSONL result payload
- **THEN** the system can extract markdown text, split it into ordered paragraphs, and infer section boundaries where possible

#### Scenario: PaddleOCR markdown is recovered
- **WHEN** the backend receives only markdown text output
- **THEN** the system can normalize the markdown into the same recovered structure contract used by the review workbench

### Requirement: OCR result hydration snapshot
The system SHALL preserve the recovered structure snapshot produced from OCR results so the review task can reopen without recomputing the remote result.

#### Scenario: OCR hydration completes
- **WHEN** the recovered structure is produced from a PaddleOCR result
- **THEN** the recovered structure is stored on the task aggregate and marked ready for review
