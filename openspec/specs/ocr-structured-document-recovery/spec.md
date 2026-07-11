# ocr-structured-document-recovery Specification

## Purpose
TBD - created by archiving change ocr-structured-document-recovery. Update Purpose after archive.
## Requirements
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
