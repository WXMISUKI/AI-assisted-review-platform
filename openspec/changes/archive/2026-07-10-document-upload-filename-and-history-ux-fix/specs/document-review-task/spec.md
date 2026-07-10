## ADDED Requirements

### Requirement: Immediate visible task after file selection
The document review task SHALL create a visible document entry immediately after a user selects or drops a file.

#### Scenario: File is selected
- **WHEN** the user selects a file from the upload control
- **THEN** the document appears in the recent history and document library while upload and OCR submission continue

#### Scenario: Upload or OCR submission fails
- **WHEN** storage upload or OCR submission fails after the entry is created
- **THEN** the document entry remains visible with failed status and a non-secret failure message

### Requirement: Recent history filename containment
The document library SHALL constrain recent-history filenames within the sidebar and expose the full filename on hover.

#### Scenario: Long filename is listed
- **WHEN** a recent document has a long filename
- **THEN** the visible title is truncated within the history item and the full title is available through hover text
