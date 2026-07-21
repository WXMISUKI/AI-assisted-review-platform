## MODIFIED Requirements

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

#### Scenario: Intake result enters preview gate
- **WHEN** a real-file intake run is created or re-initialized
- **THEN** the material-intake page presents the returned basis, required master data, knowledge-base binding, and gate status as preview facts to be confirmed before formal matching
