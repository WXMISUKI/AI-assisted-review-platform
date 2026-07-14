# document-review-task Delta

## ADDED Requirements

### Requirement: Backend-generated reviewable task state
The document review task SHALL become reviewable from backend-owned materialized generation output.

#### Scenario: Generation output is materialized
- **WHEN** backend generation produces a reviewable preparation package
- **THEN** the persisted task transitions to ready status and can unlock the workbench from backend task state

#### Scenario: Generation is degraded but reviewable
- **WHEN** backend generation falls back or produces no candidates but still has a safe preparation package
- **THEN** the task remains reviewable with degraded diagnostics rather than becoming a failed document

### Requirement: Materialization preserves task ownership data
The document review task SHALL preserve existing document metadata and reviewer state when backend generation output is applied.

#### Scenario: Existing task has manual or reviewed issues
- **WHEN** backend materialization adds generated issue candidates
- **THEN** existing manual issues, reviewer decisions, OCR metadata, source object metadata, and result assets are preserved
