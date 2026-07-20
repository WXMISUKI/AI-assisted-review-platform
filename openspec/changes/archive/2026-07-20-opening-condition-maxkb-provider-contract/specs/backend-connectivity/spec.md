## ADDED Requirements

### Requirement: MaxKB provider readiness summary
The backend connectivity surface SHALL include a safe readiness summary for MaxKB when it is selected as the knowledge-base provider.

#### Scenario: MaxKB is selected and configured
- **WHEN** backend connectivity or knowledge-base provider status is requested
- **THEN** the response includes MaxKB provider status, configured flag, ready flag, selected provider name, timeout summary, and safe diagnostics without exposing secrets

#### Scenario: Another knowledge provider is selected
- **WHEN** RAGFlow or mock provider is selected instead of MaxKB
- **THEN** the backend reports the selected knowledge provider without requiring MaxKB configuration
