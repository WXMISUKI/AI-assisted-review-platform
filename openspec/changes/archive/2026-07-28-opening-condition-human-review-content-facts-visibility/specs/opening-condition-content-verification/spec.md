## ADDED Requirements

### Requirement: Content facts are renderable for checklist review
The platform SHALL expose enough bounded packet content-fact information for the frontend to render checklist-specific content-verification diagnostics.

#### Scenario: Checklist item has evidence-linked content facts
- **WHEN** a checklist item references evidence that can be linked to packet content facts
- **THEN** the review UI can render fact status, confidence, file name, locator, safe summary, bounded snippets, and provider/extractor metadata for that item

#### Scenario: Checklist item has no usable content facts
- **WHEN** a checklist item has no matching packet content facts
- **THEN** the review UI indicates that content verification has not produced item-level facts rather than implying the content was checked
