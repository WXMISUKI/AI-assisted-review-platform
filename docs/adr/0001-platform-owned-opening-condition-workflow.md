# Platform-owned opening-condition workflow

The opening-condition review portal uses platform-owned task, basis, master-data, evidence, human-decision, and report records as the source of truth. Dify or another external orchestrator can be connected later as an adapter for OCR, extraction, or workflow assistance, but imported outputs must be normalized into platform records before display, reporting, or archive.

## Considered Options

- Use the old Dify workflow as the primary workflow and fact store.
- Build the pilot around platform-owned records and keep external workflows as adapters.

## Consequences

The pilot stays controllable and auditable inside the product, while still allowing Dify-like workflow capabilities to be reintroduced behind bounded integration contracts.
