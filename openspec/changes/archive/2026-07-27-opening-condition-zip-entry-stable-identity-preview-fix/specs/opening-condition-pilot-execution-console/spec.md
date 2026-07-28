## ADDED Requirements

### Requirement: Document library uses collision-free packet file row identity
The selected-task document library SHALL render packet inventory rows with collision-free UI keys and preview selectors, even when historical backend records contain duplicate inventory entry ids.

#### Scenario: Historical inventory rows have duplicate ids
- **WHEN** a selected task contains two document-library packet inventory rows with the same stored entry id
- **THEN** the UI renders both rows with distinct keys
- **AND** clicking either row opens the preview or fallback state for that specific row

#### Scenario: Derived packet asset exists
- **WHEN** a packet inventory row has a derived file asset reference
- **THEN** the UI preview selector targets that derived asset row rather than the original ZIP archive row
