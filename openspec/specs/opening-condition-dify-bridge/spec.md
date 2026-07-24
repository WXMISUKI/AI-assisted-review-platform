# opening-condition-dify-bridge Specification

## Purpose
TBD - created by archiving change separate-product-portals-and-opening-basis-workflow. Update Purpose after archive.
## Requirements
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

### Requirement: Safe workflow payloads
Dify bridge payloads SHALL exclude secrets, private object URLs, raw provider traces, and unbounded document text from persisted summaries.

#### Scenario: Unsafe field appears
- **WHEN** a Dify callback or imported workflow result includes unsafe fields
- **THEN** the platform omits or redacts those fields before persistence

#### Scenario: Evidence is needed
- **WHEN** a result needs evidence
- **THEN** the platform stores bounded file names, object ids, page or locator summaries, extracted values, and confidence labels instead of raw full-document text

### Requirement: Human Input synchronization
The Dify bridge SHALL represent Human Input requirements as platform human-review tasks or decisions.

#### Scenario: Dify requests human input
- **WHEN** Dify marks a basis entry, master-data record, or check item as needing Human Input
- **THEN** the platform creates or updates a human-review queue item with reason, target type, evidence, and status

#### Scenario: Human decision is completed
- **WHEN** a human reviewer completes a platform review decision
- **THEN** the bridge can provide the normalized decision back to Dify if the workflow requires continuation

### Requirement: Workflow status mapping
The Dify bridge SHALL map external workflow progress into platform task statuses.

#### Scenario: Workflow progresses
- **WHEN** Dify reports extraction, matching, review, human-input, or report stages
- **THEN** the platform maps them into bounded task progress events for the opening-condition portal

#### Scenario: Workflow fails
- **WHEN** Dify workflow execution fails or times out
- **THEN** the platform marks the related operation as failed with a safe diagnostic summary and keeps prior confirmed records intact

### Requirement: Report draft normalization
The platform SHALL treat Dify-generated reports as drafts until platform records and human decisions have been reconciled.

#### Scenario: Report draft is received
- **WHEN** Dify returns a report draft
- **THEN** the platform links it to check items, evidence summaries, basis-set version, and human-review status before showing it as an internal auxiliary report

### Requirement: Document adapter boundary
The opening-condition bridge SHALL treat original-form backfill and document export adapters as optional integration points rather than owners of platform review state.

#### Scenario: Platform prepares original-form backfill
- **WHEN** a report-ready opening-condition run needs original-form backfill or document export
- **THEN** the platform prepares a bounded export handoff package first
- **AND** any Dify or external adapter consumes that handoff package without becoming the durable owner of findings, human decisions, or archive state

### Requirement: Adapter result normalization
The bridge SHALL normalize document-adapter results into platform-safe summaries.

#### Scenario: External adapter returns a conversion or backfill result
- **WHEN** a Dify workflow or document adapter returns output metadata
- **THEN** the platform stores only bounded adapter status, template identity, generated object references, and safe diagnostics
