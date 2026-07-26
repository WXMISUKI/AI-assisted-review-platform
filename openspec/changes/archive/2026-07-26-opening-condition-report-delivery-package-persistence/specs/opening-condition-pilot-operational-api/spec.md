## ADDED Requirements

### Requirement: Report package delivery package API field
The pilot operational API SHALL include the backend-persisted delivery package in report package diagnostics whenever a report asset is generated, archived, exported, or listed.

#### Scenario: Report API returns delivery package
- **WHEN** report generation succeeds for a pilot task
- **THEN** the returned report asset package diagnostics include `deliveryPackage`
- **AND** the frontend can display that package without deriving rows from UI state

#### Scenario: Export API preserves delivery package
- **WHEN** DOCX export succeeds and updates report export handoff metadata
- **THEN** the returned report asset preserves or refreshes `deliveryPackage` alongside `exportHandoff`
