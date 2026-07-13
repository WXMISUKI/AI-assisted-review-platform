## MODIFIED Requirements

### Requirement: Recovered structure in task aggregate
The document review task SHALL store recovered document structure as part of the task aggregate and use it as the source of truth for review issue anchor rebinding after OCR hydration.

#### Scenario: Structure recovery succeeds
- **WHEN** OCR output is normalized into sections and paragraphs
- **THEN** the task stores the recovered structure together with the review task metadata and can use it to rebind issue anchors

#### Scenario: Recovered paragraphs are reopened
- **WHEN** a user opens a task that already has recovered structure
- **THEN** the detail page can render the recovered sections and paragraphs without recomputing OCR

### Requirement: Review task OCR result hydration
The document review task SHALL transition from OCR completion into structure hydration when PaddleOCR result content is available and use the hydrated structure to align issue anchors.

#### Scenario: OCR completion returns structured result
- **WHEN** the OCR job reaches `done` and returns a readable `resultUrl.jsonUrl`
- **THEN** the document task hydrates its recovered structure from the remote result before the workbench is unlocked and rebinds compatible issue anchors

#### Scenario: OCR completion returns no usable result
- **WHEN** the OCR job reaches `done` but the result content cannot be fetched or parsed
- **THEN** the task keeps a clear failure or fallback state and does not silently fabricate recovered structure
