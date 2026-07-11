## ADDED Requirements

### Requirement: Structure-restoration stage
The review pipeline SHALL include a structure-restoration stage that consumes OCR output before review analysis begins.

#### Scenario: OCR completes
- **WHEN** a document finishes OCR processing
- **THEN** the pipeline enters structure restoration before basis binding and review analysis

#### Scenario: Structure restoration is running
- **WHEN** the structure-restoration agent is active
- **THEN** the system can report the current paragraph or section being normalized and the progress of that recovery step
