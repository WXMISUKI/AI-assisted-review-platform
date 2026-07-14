# review-workbench Specification

## Purpose

Expose safe recovery actions for failed review generation while preserving degraded workbench entry.

## Requirements

### Requirement: Failed generation shows retry action
The document library SHALL expose a retry action for failed review generation tasks.

#### Scenario: Failed generation task is listed
- **WHEN** a document task has a failed review generation run or failed task status
- **THEN** the document library shows a clear retry action that restarts the locked generation flow

#### Scenario: Retry starts
- **WHEN** the user activates retry
- **THEN** the UI routes to the review-loading flow rather than opening the editable workbench immediately

### Requirement: Degraded generation remains openable
The document library SHALL keep degraded review generation tasks openable in the workbench.

#### Scenario: Degraded task is listed
- **WHEN** a document task has a degraded review generation run
- **THEN** the primary open action can enter the workbench while safe degraded context remains visible in summaries

### Requirement: Recovery diagnostics remain safe
The workbench and document library SHALL only display safe recovery summaries.

#### Scenario: Failure details are shown
- **WHEN** a failed generation run has diagnostics
- **THEN** the UI displays only high-level status/message fields and never exposes prompts, secrets, provider traces, raw document text, or private object URLs
