## ADDED Requirements

### Requirement: Material matching uses packet assets only
The platform SHALL match checklist material expectations against packet inventory entries and their derived packet file assets, while keeping basis objects as context.

#### Scenario: Derived packet asset matches expected material
- **WHEN** a checklist item expects a material name and a packet inventory entry with `derivedObjectRef` matches that material name
- **THEN** the produced evidence references the derived object rather than the original ZIP archive
- **AND** the check item can be marked matched or routed to human review using that derived asset as evidence context

#### Scenario: Basis object is present
- **WHEN** a task includes contract or qualification basis source objects
- **THEN** those objects remain basis context for interpreting material expectations
- **AND** they are not emitted as packet evidence candidates, checklist review rows, or matched files for submitted material completeness

### Requirement: Manifest-only matches are explicit uncertainty
The platform SHALL treat manifest-only matches as bounded evidence context and route them to human review when a stable preview asset is required.

#### Scenario: Only manifest entry matches
- **WHEN** a checklist expected material matches only a manifest-only packet entry with no derived object
- **THEN** the check item records the manifest match context
- **AND** the human-review reason explains that the file name exists but no standalone preview asset is available
