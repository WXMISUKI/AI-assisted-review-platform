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

### Requirement: Packet intake initializes content facts
The platform SHALL initialize bounded packet content facts during opening-condition packet intake.

#### Scenario: Inventory entry has standalone preview asset
- **WHEN** packet intake creates or receives an inventory entry with a standalone derived object or non-archive source object
- **THEN** the platform creates a packet content fact linked to that entry
- **AND** the fact records safe file metadata and a pending or ready extraction status without claiming full OCR verification

#### Scenario: Inventory entry has no standalone preview asset
- **WHEN** packet intake receives a manifest-only entry without a standalone derived object
- **THEN** the platform creates a bounded unsupported or partial content fact
- **AND** later semantic matching remains eligible for human review

### Requirement: Provider ingestion updates packet content facts
The platform SHALL accept task-scoped provider ingestion output and merge it into packet content facts.

#### Scenario: Provider returns extracted facts for packet files
- **WHEN** a provider submits safe per-file extraction results for a task packet
- **THEN** the platform normalizes and merges the results by packet entry id, derived object id, source object id, or normalized file name
- **AND** the task records a content ingestion event with safe diagnostics

#### Scenario: Provider output contains unsafe fields
- **WHEN** provider output includes raw text, private URLs, credentials, or provider traces
- **THEN** the platform redacts those fields before persisting the content facts

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

### Requirement: Content facts are renderable for checklist review
The platform SHALL expose enough bounded packet content-fact information for the frontend to render checklist-specific content-verification diagnostics.

#### Scenario: Checklist item has evidence-linked content facts
- **WHEN** a checklist item references evidence that can be linked to packet content facts
- **THEN** the review UI can render fact status, confidence, file name, locator, safe summary, bounded snippets, and provider/extractor metadata for that item

#### Scenario: Checklist item has no usable content facts
- **WHEN** a checklist item has no matching packet content facts
- **THEN** the review UI indicates that content verification has not produced item-level facts rather than implying the content was checked
