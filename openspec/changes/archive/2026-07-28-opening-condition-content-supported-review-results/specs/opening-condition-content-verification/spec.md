## ADDED Requirements

### Requirement: Content facts drive conservative check-item semantics
The platform SHALL use packet content facts when deriving opening-condition check-item semantic match status and final disposition.

#### Scenario: Content fact supports expected evidence
- **WHEN** a packet content fact contains bounded summary, snippet, or locator text that supports a checklist item's expected evidence
- **THEN** the check item records a content-supported semantic match note
- **AND** the item can pass only if no other rule, retrieval conflict, visual assertion, or master-data gap requires human review

#### Scenario: Content fact is pending or unsupported
- **WHEN** a filename or manifest entry matches but its content fact is missing, pending, unsupported, or failed
- **THEN** the check item SHALL NOT pass solely because of the filename
- **AND** the item is routed to human review with a reason explaining that content accuracy is not yet proven

#### Scenario: Content fact conflicts with expected evidence
- **WHEN** a candidate file name matches but bounded content facts do not support the expected evidence
- **THEN** the check item records a mismatch diagnostic
- **AND** the item is failed or routed to human review instead of passing
