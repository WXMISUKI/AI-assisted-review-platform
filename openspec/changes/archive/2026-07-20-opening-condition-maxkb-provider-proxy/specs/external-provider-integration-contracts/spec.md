## MODIFIED Requirements

### Requirement: MaxKB knowledge-base provider support
The system SHALL support MaxKB as an optional external knowledge-base provider through a platform-owned adapter and, for the opening-condition pilot, through the OCR Worker / MaxKB Provider Proxy boundary while preserving platform-owned facts as the source of truth.

#### Scenario: MaxKB provider is configured
- **WHEN** server-side MaxKB proxy configuration is present and the selected knowledge provider is `maxkb`
- **THEN** backend diagnostics expose a safe readiness summary with provider name, configured flag, ready flag, status, source, proxy status path, and bounded diagnostics without exposing API keys, auth headers, or MaxKB administrator credentials

#### Scenario: MaxKB provider is unavailable
- **WHEN** MaxKB is disabled, not configured, times out, or returns an error through the proxy
- **THEN** the platform reports degraded, disabled, or unconfigured readiness without corrupting platform knowledge-base records

#### Scenario: MaxKB references are stored
- **WHEN** a platform knowledge-base record is linked to MaxKB
- **THEN** the platform stores safe provider refs such as `knowledgeId`, document id, chunk id, sync status, and last sync time without treating MaxKB as the owner of project, team, review task, or human decision facts

#### Scenario: Proxy owns MaxKB login
- **WHEN** the platform invokes MaxKB retrieval or provider status for the opening-condition pilot
- **THEN** it calls the Worker/Proxy with a server-side Bearer token and does not require `MAXKB_USERNAME` or `MAXKB_PASSWORD` in the platform runtime
