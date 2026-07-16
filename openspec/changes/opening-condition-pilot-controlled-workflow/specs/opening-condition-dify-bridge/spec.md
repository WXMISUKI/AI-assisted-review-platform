## MODIFIED Requirements

### Requirement: Dify workflow execution boundary
The platform SHALL treat Dify as an optional workflow execution adapter or reference workflow for opening-condition review rather than the required execution path or durable owner of business records.

#### Scenario: Platform-controlled workflow is used
- **WHEN** the opening-condition pilot workflow runs without Dify
- **THEN** the platform still creates task state, events, extraction summaries, matching results, human-review items, and report records through platform-owned contracts

#### Scenario: Workflow is started
- **WHEN** the platform starts a Dify opening-condition workflow
- **THEN** it sends only bounded workspace, basis, task, and file references required for execution

#### Scenario: Workflow returns output
- **WHEN** Dify returns extraction, matching, human-input, or report-draft output
- **THEN** the platform normalizes the output into platform-owned contracts before displaying it as task state

#### Scenario: Dify is unavailable
- **WHEN** Dify is disabled, unavailable, or not selected for the pilot workflow
- **THEN** the platform keeps the pilot task executable through its controlled workflow path or marks unsupported steps with safe diagnostics
