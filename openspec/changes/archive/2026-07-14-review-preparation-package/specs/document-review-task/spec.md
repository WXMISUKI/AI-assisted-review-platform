# document-review-task Specification

## Purpose

Make the OCR-to-review handoff explicit by storing a review-preparation package before the workbench unlocks.

## Requirements

### Requirement: Preparation package before workbench unlock
The document review task SHALL store a review-preparation package after OCR structure hydration and before opening the review workbench.

#### Scenario: OCR structure is hydrated
- **WHEN** OCR output is normalized into recovered sections and paragraphs
- **THEN** the task starts review preparation and stores the resulting package before the workbench becomes editable

#### Scenario: Preparation package is restored
- **WHEN** the user reopens a prepared task
- **THEN** the task can restore the package stage history and issue summaries from the task aggregate

### Requirement: Preparation fallback does not block review
The document review task SHALL keep a safe fallback path when backend package generation is unavailable.

#### Scenario: Backend preparation fails
- **WHEN** backend SSE cannot provide a package
- **THEN** the task stores a local fallback package and can continue to the existing workbench handoff using recovered structure and deterministic draft issues

#### Scenario: Recovered structure is absent
- **WHEN** no recovered structure is available
- **THEN** the task continues to use the existing mock or fallback loading behavior without fabricating a preparation package
