## ADDED Requirements

### Requirement: Recovered DOCX paragraphs preserve review eligibility
The document review task SHALL store DOCX recovered paragraphs with safe block metadata and review eligibility.

#### Scenario: Task receives DOCX recovered structure
- **WHEN** a DOCX parsing result is persisted on the review task aggregate
- **THEN** each recovered paragraph can include block type and review eligibility metadata

#### Scenario: Frontend later reopens the task
- **WHEN** the task is reopened after DOCX recovery
- **THEN** the recovered structure still preserves which paragraphs are reviewable body content versus non-reviewable presentation content
