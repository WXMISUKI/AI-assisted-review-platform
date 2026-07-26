## ADDED Requirements

### Requirement: Rectification delivery list
The opening-condition report page SHALL expose nonconforming and pending findings as a scan-friendly rectification delivery list.

#### Scenario: Report has findings
- **WHEN** the selected report task has failed, rejected, blocked, warning, or pending-human-review findings
- **THEN** the report page shows a delivery list with sequence number, check item/category, issue description, risk level, basis, rectification requirement, and evidence or human-review notes

#### Scenario: Findings come from fallback check items
- **WHEN** packaged report findings are absent but task check items exist
- **THEN** the delivery list is still derived from the platform check-item and human-review facts

### Requirement: Delivery list precedes detail groups
The opening-condition report page SHALL present the rectification delivery list before lower-level grouped finding cards.

#### Scenario: Operator scans the report page
- **WHEN** the operator opens report archive for a selected run
- **THEN** the operator can first read the整改交付清单
- **AND** grouped issue cards remain available below for detailed context
