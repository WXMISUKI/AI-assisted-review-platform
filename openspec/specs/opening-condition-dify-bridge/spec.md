# opening-condition-dify-bridge Specification

## Purpose
TBD - created by archiving change separate-product-portals-and-opening-basis-workflow. Update Purpose after archive.
## Requirements
### Requirement: Dify workflow execution boundary
The platform SHALL treat Dify as a workflow execution adapter for opening-condition review rather than the durable owner of business records.

#### Scenario: Workflow is started
- **WHEN** the platform starts a Dify opening-condition workflow
- **THEN** it sends only bounded workspace, basis, task, and file references required for execution

#### Scenario: Workflow returns output
- **WHEN** Dify returns extraction, matching, human-input, or report-draft output
- **THEN** the platform normalizes the output into platform-owned contracts before displaying it as task state

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

