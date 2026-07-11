## ADDED Requirements

### Requirement: OCR output normalization contract
The backend SHALL expose OCR results in a shape that can be normalized into a review-ready document structure.

#### Scenario: OCR result is received
- **WHEN** the backend receives OCR markdown, JSONL, or page text output
- **THEN** the result can be mapped into a normalized structure recovery input without losing ordering metadata

### Requirement: Structured OCR handoff
The backend SHALL preserve enough OCR output metadata for a downstream structure-recovery stage to rebuild document order and anchors.

#### Scenario: OCR result is handed off
- **WHEN** OCR completes successfully
- **THEN** the backend can provide the downstream stage with page, block, and text metadata needed for structure recovery
