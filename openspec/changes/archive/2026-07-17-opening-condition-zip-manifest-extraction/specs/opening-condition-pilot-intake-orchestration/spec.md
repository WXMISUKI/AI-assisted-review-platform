## ADDED Requirements

### Requirement: ZIP manifest extraction during intake
The system SHALL attempt to derive packet inventory manifest entries from readable ZIP source objects during opening-condition intake/init.

#### Scenario: Intake derives inventory from a ZIP source object
- **WHEN** intake/init omits explicit inventory entries and the submitted packet contains a readable ZIP source object with a storage key
- **THEN** the backend extracts bounded ZIP manifest entries, stores them on the packet, and reports that inventory resolution came from ZIP manifest extraction

#### Scenario: Intake falls back when ZIP manifest extraction is unavailable
- **WHEN** intake/init omits explicit inventory entries and ZIP manifest extraction fails or no readable ZIP source object is available
- **THEN** the backend safely falls back to deriving inventory from `sourceObjects` and returns a bounded fallback reason in intake diagnostics
