## ADDED Requirements

### Requirement: Human-review reasons explain content-verification uncertainty
Human-review items created from formal matching SHALL include operator-facing reason text that distinguishes missing materials, manifest-only matches, unsupported content extraction, content mismatch, retrieval conflict, visual uncertainty, and master-data authorization gaps.

#### Scenario: Content extraction is not available
- **WHEN** a checklist item has a candidate file but no usable packet content fact
- **THEN** the human-review item reason explains that the file content has not been proven and cannot be accepted based only on the file name

#### Scenario: Content fact mismatches expected evidence
- **WHEN** bounded content facts do not support the expected material
- **THEN** the human-review item reason explains that file name or manifest matching is insufficient and identifies the content-verification mismatch category
