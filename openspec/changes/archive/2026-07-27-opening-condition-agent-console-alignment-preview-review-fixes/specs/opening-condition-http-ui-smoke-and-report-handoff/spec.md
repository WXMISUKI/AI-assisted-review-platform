## ADDED Requirements

### Requirement: UI smoke protects opening-condition agent console alignment and review refresh
The opening-condition MVP SHALL keep a lightweight UI smoke gate that protects the new-review home alignment, derived inventory preview wiring, and in-place human-review refresh behavior.

#### Scenario: Agent home is rendered without a selected task
- **WHEN** the UI smoke inspects the opening-condition agent console source
- **THEN** the workspace content and agent home keep explicit centering and self-sizing hooks

#### Scenario: Derived inventory preview remains preferred
- **WHEN** the UI smoke inspects the agent document-library source
- **THEN** inventory entries preserve derived asset references and clear fallback messaging for manifest-only or historical items

#### Scenario: Human-review decision updates the active task
- **WHEN** the UI smoke inspects the app state wiring for human-review decisions
- **THEN** successful decisions update both the current task snapshot and the task collections that feed the workbench
