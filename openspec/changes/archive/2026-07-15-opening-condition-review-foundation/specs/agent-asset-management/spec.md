## ADDED Requirements

### Requirement: Opening condition agent asset visibility
The agent asset catalog SHALL show the opening-condition review agent/workflow bridge as a distinct asset.

#### Scenario: Data assets are displayed
- **WHEN** the data assets page lists agent capabilities
- **THEN** it includes an opening-condition review asset describing Dify workflow orchestration, Human Input review points, master-data comparison, and report generation responsibilities

### Requirement: Dify bridge boundary
The agent asset catalog SHALL distinguish Dify workflow responsibilities from platform-owned records.

#### Scenario: Opening condition bridge is inspected
- **WHEN** a user reads the opening-condition agent asset details
- **THEN** the system identifies Dify as responsible for workflow orchestration, OCR/LLM extraction, Human Input, and report drafting while platform records own basis versions, master data, check outcomes, evidence, and audit state
