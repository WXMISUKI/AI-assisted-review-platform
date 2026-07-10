## ADDED Requirements

### Requirement: UTF-8 upload filename preservation
The document object storage upload endpoint SHALL preserve UTF-8 filenames in returned upload metadata.

#### Scenario: Chinese filename is uploaded
- **WHEN** a client uploads a file whose original filename contains Chinese characters
- **THEN** the upload response returns the original filename without mojibake
