## ADDED Requirements

### Requirement: Operator-triggered formal execution path
The system SHALL let the opening-condition pilot portal trigger intake/init and formal checklist matching explicitly instead of auto-running formal execution during workspace hydration.

#### Scenario: Workspace context is opened
- **WHEN** the portal loads a workspace
- **THEN** the system may hydrate basis, master-data, knowledge-base, and existing task state, but it SHALL NOT automatically run formal checklist matching

#### Scenario: Operator starts formal execution
- **WHEN** the operator explicitly triggers intake/init and then formal checklist matching
- **THEN** the pilot workflow proceeds through packet-ready, matching, human-review, and report gates using backend task state as the source of truth
