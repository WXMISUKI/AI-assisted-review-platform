## ADDED Requirements

### Requirement: Repeatable real-file intake diagnostics
The single-project trial intake SHALL make real-file intake repeatable by returning and displaying bounded diagnostics for uploaded basis, checklist, and material packet objects.

#### Scenario: Real-file bootstrap returns repeatable diagnostics
- **WHEN** the operator uploads basis, checklist, and material packet files through the portal
- **THEN** the backend returns safe object filenames, checklist-definition resolution, packet inventory resolution, manifest entry count, bounded sample entry names, provider readiness summary, and next action

#### Scenario: Checklist adaptation is unresolved
- **WHEN** the checklist object cannot be adapted by direct input, controlled template derivation, or existing-task fallback
- **THEN** the task remains usable but diagnostics mark manual checklist definition as required before deterministic matching

#### Scenario: ZIP manifest extraction falls back
- **WHEN** ZIP manifest extraction cannot run or produces no entries
- **THEN** the task stores fallback inventory entries from source objects and records a bounded fallback reason

### Requirement: Browser upload is authoritative for real samples
The trial intake SHALL rely on the existing browser upload channel for real sample files and SHALL NOT accept arbitrary local filesystem paths.

#### Scenario: Operator selects files in the browser
- **WHEN** the operator chooses real sample files using the file picker
- **THEN** the frontend uploads them to object storage and passes only safe object refs to trial bootstrap

#### Scenario: Local path is provided
- **WHEN** an intake request attempts to use a raw local path instead of an uploaded object ref
- **THEN** the backend rejects or ignores that path and returns only safe diagnostics
