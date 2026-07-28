## ADDED Requirements

### Requirement: Gateway routing config readiness
The system SHALL expose a safe readiness summary for MaxKB AI gateway app-routing configuration.

#### Scenario: Routing config is present
- **WHEN** a server-side routing config source contains MaxKB gateway app mappings
- **THEN** the platform reports the config as configured and lists bounded per-app readiness facts by stable `app_code`
- **AND** the summary omits MaxKB API keys, bearer tokens, authorization headers, and raw provider traces

#### Scenario: Routing config is absent
- **WHEN** no server-side routing config source is configured
- **THEN** the platform reports gateway routing readiness as disabled or unconfigured without failing unrelated provider readiness checks

### Requirement: App-level protocol and policy validation
The system SHALL validate the minimum app-level fields required by the MaxKB gateway M0 contract.

#### Scenario: App route is complete
- **WHEN** an app mapping has `app_code`, `workspace_id`, `maxkb_application_id`, `maxkb_api_key`, enabled route policy, protocol flags, and rate-limit policy
- **THEN** the platform marks that app route as ready for the corresponding OpenAI-compatible or MCP protocol

#### Scenario: App route is incomplete
- **WHEN** an app mapping is missing required route fields, protocol flags, or rate-limit policy
- **THEN** the platform marks that app route as degraded and returns bounded missing-field diagnostics

### Requirement: Gateway contract remains non-authoritative
The system SHALL treat MaxKB gateway routing as an invocation boundary rather than a business fact source.

#### Scenario: Opening-condition review consumes MaxKB support
- **WHEN** opening-condition review uses MaxKB-backed retrieval or agent calls
- **THEN** platform-owned basis versions, master data, evidence, human decisions, check item results, and report assets remain authoritative
- **AND** MaxKB gateway diagnostics are stored or displayed only as safe provider readiness and routing support facts
