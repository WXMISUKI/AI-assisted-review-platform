## ADDED Requirements

### Requirement: OCR result hydration in session state
The review session service SHALL support hydrating recovered structure from a completed OCR result before review analysis begins.

#### Scenario: OCR job completes successfully
- **WHEN** the OCR job reaches `done` and a `resultUrl.jsonUrl` is available
- **THEN** the session state can store the hydrated recovered structure snapshot alongside the task aggregate

#### Scenario: OCR hydration fails
- **WHEN** OCR result hydration fails due to remote fetch or parse errors
- **THEN** the task remains visible with a non-secret failure message and can still fall back to the existing mock recovery path
