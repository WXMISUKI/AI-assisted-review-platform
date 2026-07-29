## ADDED Requirements

### Requirement: Basis and checklist files are context, not material evidence
The opening-condition material matching pipeline SHALL NOT use uploaded basis or checklist objects as evidence candidates for satisfying checklist material items.

#### Scenario: Uploaded basis mentions a required material
- **WHEN** the contract or qualification basis file contains text related to personnel, equipment, contracts, qualifications, or other required materials
- **THEN** matching treats that basis content as context or master-data support
- **AND** it does not create material evidence records that point to the basis file as the submitted material package evidence

#### Scenario: Uploaded checklist defines required items
- **WHEN** the uploaded checklist file contains the extracted check items
- **THEN** matching treats that checklist as the definition source
- **AND** it does not satisfy any checklist item with the checklist file itself

#### Scenario: Material package has matching evidence
- **WHEN** the material package source object or ZIP-derived inventory entry matches a checklist item
- **THEN** matching may create evidence records from that packet object or derived packet entry
- **AND** the evidence remains traceable to the material package rather than the basis or checklist upload
