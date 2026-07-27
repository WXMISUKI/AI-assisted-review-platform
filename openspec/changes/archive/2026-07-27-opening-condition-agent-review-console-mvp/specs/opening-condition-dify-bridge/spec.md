# opening-condition-dify-bridge Delta

## ADDED Requirements

### Requirement: Workflow prompt semantics may guide progress labels but not fabricate facts
The opening-condition UI MAY use the Dify workflow's bounded stage semantics to label progress, but SHALL NOT treat frontend labels as review findings.

#### Scenario: Checklist parsing progress is displayed
- **WHEN** the platform is organizing checklist items from the material checklist
- **THEN** the UI may describe the stage as checklist parsing or checklist item organization
- **AND** any extracted checklist facts must still come from platform-normalized task data

#### Scenario: File-by-file review progress is displayed
- **WHEN** material package files are being reviewed
- **THEN** the UI may display safe progress labels such as file review or report generation
- **AND** personnel, equipment, material, or other compliance conclusions must come from workflow/backend outputs before being shown as findings
