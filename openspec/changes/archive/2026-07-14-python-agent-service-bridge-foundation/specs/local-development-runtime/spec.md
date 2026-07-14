# local-development-runtime Delta

## ADDED Requirements

### Requirement: Local runtime supports agent-service fallback
The local development runtime SHALL remain usable without a configured Python agent service.

#### Scenario: Developer starts only the Node backend
- **WHEN** no agent service configuration is present
- **THEN** review generation jobs continue through local fallback and connectivity reports the fallback source

#### Scenario: Developer configures an agent service
- **WHEN** an agent service base configuration is present
- **THEN** the Node worker can attempt delegated execution within configured timeout bounds

### Requirement: Agent bridge configuration is server-only
The local development runtime SHALL keep agent bridge configuration on the backend side.

#### Scenario: Frontend reads connectivity
- **WHEN** the frontend requests backend readiness
- **THEN** it receives safe readiness fields without raw service URLs, auth values, or headers
