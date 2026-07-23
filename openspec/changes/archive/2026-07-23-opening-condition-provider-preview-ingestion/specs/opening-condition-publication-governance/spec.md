## ADDED Requirements

### Requirement: Provider provenance in publication governance
The publication governance surface SHALL show provider provenance for provider-derived basis previews before publication.

#### Scenario: Provider-derived preview is shown
- **WHEN** a basis preview was refreshed from provider structured output
- **THEN** the governance surface shows the provider source, extractor, confidence, missing fields, and next action alongside the preview facts
- **AND** the publish action remains unavailable until the preview is human-confirmed

#### Scenario: Provider-derived preview is rejected
- **WHEN** an operator rejects a provider-derived preview
- **THEN** the system keeps the provider provenance and rejection note visible as an exception record for follow-up
