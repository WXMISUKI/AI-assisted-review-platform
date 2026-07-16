## MODIFIED Requirements

### Requirement: Opening condition review packet
The system SHALL represent an opening-condition review as a workspace-scoped, platform-owned review packet containing selected context, bound basis-set version, master-data readiness, submitted material status, check item outcomes, evidence summaries, human-review triggers, report summary, and task/event identifiers.

#### Scenario: Review packet is displayed
- **WHEN** a user opens an opening-condition review packet
- **THEN** the system displays the workspace context, packet stage, bound basis-set version, master-data readiness, check outcome counts, task status, event summary, and report summary from one typed domain contract

#### Scenario: Packet lacks context
- **WHEN** a review packet has no selected workspace context
- **THEN** the system treats the packet as invalid for formal checking and requires context selection first

#### Scenario: Packet is backed by platform task state
- **WHEN** a formal review packet is created for the pilot workflow
- **THEN** the packet references platform-owned task, packet, checklist item, evidence, human-review, and report records instead of relying only on frontend mock data or external workflow memory
