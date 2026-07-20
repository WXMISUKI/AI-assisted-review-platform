## ADDED Requirements

### Requirement: MaxKB knowledge-base provider support
The system SHALL support MaxKB as an optional external knowledge-base provider while preserving platform-owned facts as the source of truth.

#### Scenario: MaxKB provider is configured
- **WHEN** server-side MaxKB configuration is present and the selected knowledge provider is `maxkb`
- **THEN** backend diagnostics expose a safe readiness summary with provider name, configured flag, ready flag, status, source, and bounded diagnostics without exposing API keys or auth headers

#### Scenario: MaxKB provider is unavailable
- **WHEN** MaxKB is disabled, not configured, times out, or returns an error
- **THEN** the platform reports degraded, disabled, or unconfigured readiness without corrupting platform knowledge-base records

#### Scenario: MaxKB references are stored
- **WHEN** a platform knowledge-base record is linked to MaxKB
- **THEN** the platform stores safe provider refs such as `knowledgeId`, document id, chunk id, sync status, and last sync time without treating MaxKB as the owner of project, team, review task, or human decision facts
