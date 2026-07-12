# platform-architecture Specification Update

## ADDED Requirements

### Requirement: Project development standards reference
The system documentation SHALL provide a single project-level development standards document that serves as the default reference for frontend and backend implementation decisions.

#### Scenario: A contributor starts a new feature
- **WHEN** a developer begins work on a new frontend or backend change
- **THEN** the project documentation can point them to the development standards before implementation starts

#### Scenario: Architecture guidance is updated
- **WHEN** the platform architecture document is read
- **THEN** it can direct readers to the standards document for coding, security, state, and verification rules
