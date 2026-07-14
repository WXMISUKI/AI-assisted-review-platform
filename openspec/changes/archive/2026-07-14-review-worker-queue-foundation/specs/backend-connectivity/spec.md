# backend-connectivity Specification

## Purpose

Expose safe backend queue readiness diagnostics alongside existing provider and persistence health summaries.

## Requirements

### Requirement: Queue readiness summary
The backend connectivity surface SHALL include safe review worker queue readiness information.

#### Scenario: Connectivity status is requested
- **WHEN** the frontend or developer diagnostics request backend connectivity information
- **THEN** the backend can return queue adapter type, readiness, job counts by status, active worker summary, and oldest queued job age

#### Scenario: Queue is unavailable
- **WHEN** the queue adapter cannot be read or the worker loop is unavailable
- **THEN** the connectivity surface reports a degraded queue summary without exposing storage paths or unsafe job payload data

### Requirement: Queue diagnostics remain non-secret
Queue diagnostics SHALL never expose prompts, secrets, provider raw traces, private URLs, raw document text, or unbounded job payloads.

#### Scenario: Job diagnostics include sensitive source data
- **WHEN** queue status or job summaries are returned through backend connectivity helpers
- **THEN** only safe counts, statuses, identifiers, timestamps, and bounded messages are exposed
