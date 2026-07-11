## ADDED Requirements

### Requirement: Review task OCR result hydration
The document review task SHALL transition from OCR completion into structure hydration when PaddleOCR result content is available.

#### Scenario: OCR completion returns structured result
- **WHEN** the OCR job reaches `done` and returns a readable `resultUrl.jsonUrl`
- **THEN** the document task hydrates its recovered structure from the remote result before the workbench is unlocked

#### Scenario: OCR completion returns no usable result
- **WHEN** the OCR job reaches `done` but the result content cannot be fetched or parsed
- **THEN** the task keeps a clear failure or fallback state and does not silently fabricate recovered structure
