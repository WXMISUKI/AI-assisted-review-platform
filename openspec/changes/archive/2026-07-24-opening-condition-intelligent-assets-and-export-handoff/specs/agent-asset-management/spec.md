## ADDED Requirements

### Requirement: Opening-condition specialized agent inventory
The agent asset catalog SHALL expose specialized opening-condition intelligent assets instead of only one broad review entry.

#### Scenario: Data assets page lists opening-condition assets
- **WHEN** the user opens agent assets
- **THEN** the catalog includes separate entries for issue-type review, rectification/regulation guidance, and original-form backfill or export adapters

### Requirement: Opening-condition asset binding metadata
The asset catalog SHALL show how opening-condition assets bind to prompts, templates, schemas, and issue taxonomy hooks.

#### Scenario: Operator inspects an opening-condition asset
- **WHEN** a specialized opening-condition asset entry is displayed
- **THEN** the page shows its prompt asset, template or adapter binding, schema version, and current readiness or placeholder status

