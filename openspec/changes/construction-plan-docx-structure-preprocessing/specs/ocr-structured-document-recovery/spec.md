## ADDED Requirements

### Requirement: DOCX recovered structure distinguishes non-body blocks
The OCR structured-document recovery capability SHALL classify DOCX-recovered paragraphs into safe structural block types before review.

#### Scenario: DOCX contains cover and TOC content
- **WHEN** the backend recovers structure from a DOCX file
- **THEN** cover and table-of-contents paragraphs are marked with non-body block metadata
- **AND** those paragraphs are not treated as ordinary body review content

#### Scenario: DOCX contains reviewable body content
- **WHEN** numbered or styled body sections and their paragraphs are recovered
- **THEN** the recovered structure preserves those paragraphs as review-eligible body content
- **AND** body sections are built from those review-eligible paragraphs
