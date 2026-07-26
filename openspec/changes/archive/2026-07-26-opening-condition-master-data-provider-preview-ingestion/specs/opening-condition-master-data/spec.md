## MODIFIED Requirements

### Requirement: Master-data candidate preview contract
The opening-condition portal SHALL expose bounded candidate preview fields for master-data records before they are treated as reusable published facts.

#### Scenario: Provider-derived candidate record is displayed
- **WHEN** a workspace master-data record receives provider structured preview output
- **THEN** the record can expose safe source evidence, candidate facts, missing fields, confidence, provider provenance, and next action
- **AND** it does not expose raw provider traces, prompts, raw OCR text, private URLs, cookies, sessions, or credentials

### Requirement: Master-data preview decisions
The opening-condition portal SHALL support bounded operator decisions for master-data candidates.

#### Scenario: Provider preview is ingested
- **WHEN** provider structured output is ingested into a master-data candidate preview
- **THEN** the record remains a candidate requiring operator confirmation or publication according to its lifecycle
- **AND** the provider preview cannot directly bypass human approval or publication governance
