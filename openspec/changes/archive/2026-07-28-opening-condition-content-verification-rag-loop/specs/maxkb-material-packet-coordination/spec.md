## ADDED Requirements

### Requirement: Provider content ingestion returns bounded file facts
The provider coordination contract SHALL allow packet file ingestion outputs to be normalized into bounded platform content facts.

#### Scenario: Platform receives provider ingestion output
- **WHEN** OCR Worker or MaxKB Provider Proxy returns per-file ingestion results
- **THEN** the platform stores safe status, summaries, snippets, locators, scores, provider document ids, and provider chunk ids
- **AND** the platform omits raw OCR full text, private URLs, credentials, and unbounded traces

### Requirement: Retrieval checks are item-scoped
The provider coordination contract SHALL treat retrieval checks as checklist-item-scoped support rather than task ownership.

#### Scenario: Platform records retrieval-check output
- **WHEN** a provider returns retrieval-check output for a checklist item
- **THEN** the platform records bounded hits and diagnostics linked to the item and related evidence
- **AND** MaxKB does not own checklist conclusions, human decisions, or report status
