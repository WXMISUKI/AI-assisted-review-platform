## ADDED Requirements

### Requirement: Kernel-aligned review stages
The document review task SHALL expose stages that match the construction plan review kernel flow.

#### Scenario: Review task is processing
- **WHEN** the task is running
- **THEN** the task can report stages for document parsing, basis retrieval,危大/超危大 classification, rule matching, semantic review, issue structuring, and output generation

### Requirement: Hazard classification stage
The document review task SHALL reserve a stage for危大/超危大工程 classification before scenario-specific checks are finalized.

#### Scenario: Hazard classification completes
- **WHEN** the kernel determines the工程等级 from configured rules or mock data
- **THEN** the task stores the classification result and whether expert论证 checks are required

### Requirement: Basis trace status
The document review task SHALL indicate whether findings have traceable basis references.

#### Scenario: Issue structuring completes
- **WHEN** review issues are generated
- **THEN** the task can report counts for issues with complete basis references, partial basis references, and missing basis references
