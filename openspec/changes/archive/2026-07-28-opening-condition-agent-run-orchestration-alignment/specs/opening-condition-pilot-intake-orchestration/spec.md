## ADDED Requirements

### Requirement: Basis remains matching context, not packet evidence
The opening-condition intake and matching workflow SHALL keep contract/qualification basis as contextual guidance and SHALL NOT treat the basis object as a material-packet evidence candidate.

#### Scenario: Trial bootstrap receives basis and packet files
- **WHEN** the frontend submits basis object, checklist object, and material packet source objects
- **THEN** the task stores the basis object under the published basis/version context
- **AND** checklist matching candidates are derived from packet source objects and packet inventory entries
- **AND** the basis object is not added to packet `sourceObjects` or `inventoryEntries`

#### Scenario: Checklist item references personnel or equipment
- **WHEN** a checklist item requires personnel or equipment validation
- **THEN** matching can use published basis/master-data context to explain authorization constraints
- **AND** passing evidence must still come from packet evidence or human confirmation rather than the basis file alone
