## Purpose
Define platform-owned content verification for opening-condition material review, including bounded packet content facts, file-level semantic matching, and basis-assisted verification diagnostics.

## Requirements

### Requirement: Packet content facts are platform owned
The platform SHALL persist bounded content facts for packet-derived material files before using file content in formal opening-condition review.

#### Scenario: Provider returns extracted content
- **WHEN** a provider returns extracted content for a packet file
- **THEN** the platform stores only safe summaries, bounded snippets, locators, confidence, extraction status, and provider references
- **AND** the platform does not persist raw OCR full text, private URLs, credentials, or unbounded provider traces

#### Scenario: Provider cannot extract content
- **WHEN** a packet file cannot be OCRed, parsed, or ingested by the provider
- **THEN** the platform records a safe failed or unsupported content fact
- **AND** matching that depends on that file content remains eligible for human review

### Requirement: File-level semantic matching uses substantive content
The platform SHALL use available packet content facts to judge whether a file substantively matches a checklist material expectation.

#### Scenario: Content supports the expected material
- **WHEN** a packet file contains substantive content supporting an expected material name
- **THEN** the platform records a content-supported semantic match with bounded rationale and related evidence ids
- **AND** the checklist item may be treated as matched unless other rules require human review

#### Scenario: Filename matches but content does not support the material
- **WHEN** a packet file name matches an expected material but extracted content does not substantively support the material
- **THEN** the platform records the semantic mismatch
- **AND** the checklist item is marked failed or routed to human review instead of passing solely because of the filename

### Requirement: Basis-assisted verification remains supporting context
The platform SHALL compare submitted packet evidence against published basis, master data, and knowledge-base retrieval hits as supporting verification context.

#### Scenario: Retrieval supports packet evidence
- **WHEN** basis or knowledge-base retrieval supports the packet evidence for a checklist item
- **THEN** the platform records safe retrieval refs, scores, snippets, locators, and a bounded verification note
- **AND** the item remains governed by platform facts and human decisions

#### Scenario: Retrieval conflicts with packet evidence
- **WHEN** retrieval context conflicts with packet evidence, published master data, or a human decision
- **THEN** the platform records the conflict as a safe diagnostic
- **AND** the item is routed to human review
