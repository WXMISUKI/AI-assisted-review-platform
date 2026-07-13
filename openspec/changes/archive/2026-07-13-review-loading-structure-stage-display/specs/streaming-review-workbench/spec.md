## ADDED Requirements

### Requirement: Structure-aware loading stage display
The streaming review workbench SHALL render structure-aware review-preparation stages when recovered structure is available.

#### Scenario: Task has recovered structure
- **WHEN** a locked loading task has a recovered structure snapshot
- **THEN** the loading page can render the stage title, detail, outline, and issue summaries from the structure-derived review-preparation stages

#### Scenario: Task has no recovered structure
- **WHEN** a locked loading task does not have recovered structure
- **THEN** the loading page continues to use the existing fallback loading stages without changing the page contract
