## ADDED Requirements

### Requirement: DOCX object parsing uses backend runtime fetch
The document review task SHALL use the backend runtime fetch capability for DOCX object download during object-review parsing.

#### Scenario: DOCX object review starts
- **WHEN** the backend receives a DOCX object-review request
- **THEN** it downloads the source object through the active backend runtime fetch implementation without requiring `node-fetch` as a current-source dependency

#### Scenario: Local runtime lacks fetch support
- **WHEN** the active backend runtime cannot provide the fetch capability required for DOCX object download
- **THEN** the backend returns a safe actionable parsing failure message describing the runtime limitation
