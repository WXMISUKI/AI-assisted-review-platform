## Why

The opening-condition MVP can generate and archive report assets, but the report page still reads too much like internal findings cards. To be useful in a real pilot, the report must expose a整改交付清单 close to the Dify workflow output: check item, issue description, risk level, basis, and rectification requirement.

## What Changes

- Add a report-page rectification delivery list built from existing `ReportFinding` data.
- Present nonconforming and pending findings in a table-like structure with sequence number, check item/category, issue description, risk level, basis, rectification requirement, and evidence/human-review notes.
- Keep the existing grouped finding cards for detail context, but make the delivery list the first scan-friendly handoff section.
- Document the report handoff rule so future DOCX/export work consumes the same fields instead of scraping page text.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-report-findings-delivery`: Report findings must be expressible as a scan-friendly rectification delivery list.
- `opening-condition-report-handoff`: Report handoff must expose the fields needed by later DOCX/original-table export.

## Impact

- Frontend report page and opening-condition CSS.
- Documentation and OpenSpec specs.
- No backend API change, database migration, provider integration, or export adapter change.
