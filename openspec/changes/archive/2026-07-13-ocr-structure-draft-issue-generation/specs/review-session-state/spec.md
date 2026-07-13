## MODIFIED Requirements

### Requirement: Recovered issue anchor rebinding
The review session state SHALL reuse recovered structure to rebind compatible issue anchors before the workbench opens.

#### Scenario: OCR hydration completes
- **WHEN** the task receives a hydrated recovered structure
- **THEN** the session state can align existing issue anchors to recovered paragraphs before the workbench renders

#### Scenario: No recovered match exists
- **WHEN** an issue cannot be matched to a recovered paragraph
- **THEN** the session state preserves the original issue semantics and falls back to a safe paragraph anchor

### Requirement: Structure-driven issue drafts
The review session state SHALL add deterministic issue drafts from recovered structure before the workbench opens.

#### Scenario: Drafts are generated
- **WHEN** OCR hydration produces recovered paragraphs that match known review-risk patterns
- **THEN** the session state can append deterministic draft issues with stable ids and anchors

#### Scenario: Draft generation finds no matches
- **WHEN** the recovered structure does not trigger any draft rules
- **THEN** the session state preserves the existing issue list without fabricating new issues
