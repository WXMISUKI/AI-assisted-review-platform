## ADDED Requirements

### Requirement: Export content consumes delivery package
The opening-condition report export content SHALL use the backend delivery package as the primary source for rectification rows.

#### Scenario: Delivery package rows exist
- **WHEN** report HTML or DOCX content is generated for a report asset that has `packageDiagnostics.deliveryPackage.rows`
- **THEN** the exported issue table is built from those rows
- **AND** each exported row includes checklist item, category, issue description, risk, disposition, basis, and rectification requirement from the delivery package

#### Scenario: Delivery package is absent
- **WHEN** report HTML or DOCX content is generated for an older report asset without `deliveryPackage`
- **THEN** the export falls back to structured findings without failing
 
