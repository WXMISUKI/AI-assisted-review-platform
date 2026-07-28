## ADDED Requirements

### Requirement: Markdown report includes content-supported findings
The opening-condition Markdown report SHALL populate its nonconforming item table from platform-derived findings, including content-verification diagnostics and latest human-review decisions.

#### Scenario: Report has content-verification findings
- **WHEN** report generation runs after matching and human review
- **THEN** the Markdown report includes one table row per failed, blocked, rejected, corrected, warning, or pending-human-review finding
- **AND** each row includes issue description, risk label, basis fallback, rectification requirement, and human-review note when present

#### Scenario: No blocking findings exist
- **WHEN** platform facts contain no reportable findings
- **THEN** the report states that no nonconforming item was found rather than rendering an empty table
