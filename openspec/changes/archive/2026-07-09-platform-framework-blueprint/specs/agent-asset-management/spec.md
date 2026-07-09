## ADDED Requirements

### Requirement: Agent asset navigation
The system SHALL expose an agent management entry under data assets for authorized users.

#### Scenario: Admin views data assets
- **WHEN** an authorized admin opens data assets
- **THEN** the system displays agent management and prompt asset entries

### Requirement: Agent prompt binding
The system SHALL allow agents to be associated with dedicated prompt assets.

#### Scenario: Admin configures agent
- **WHEN** an admin edits an agent configuration
- **THEN** the admin can select or update the prompt asset used by that agent

### Requirement: Initial agent inventory
The system SHALL reserve entries for a construction plan review agent and a review report generation agent.

#### Scenario: Agent list is shown
- **WHEN** the agent management page is opened
- **THEN** the construction plan review agent and review report generation agent are visible as configurable assets
