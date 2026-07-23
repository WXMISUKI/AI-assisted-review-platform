## 1. Backend Provider Preview Core

- [x] 1.1 Add provider preview payload normalization for common `facts`, `fields`, `entities`, `summary`, and safe snippet shapes.
- [x] 1.2 Map provider facts into existing basis preview fact keys and compute missing fields, confidence, provenance, and next action.
- [x] 1.3 Add a provider preview ingestion mutation that sets the basis to `pending_confirmation` and preview to `needs_confirmation`.
- [x] 1.4 Keep publication blocked until provider-derived previews are human-confirmed.

## 2. HTTP And Domain Wiring

- [x] 2.1 Expose a provider preview ingestion API route for workspace basis records.
- [x] 2.2 Add frontend domain/client helper types and API call.
- [x] 2.3 Wire the app action through existing basis refresh status handling without creating duplicate state.

## 3. Governance Surface

- [x] 3.1 Show provider name/job/document provenance in basis preview detail blocks.
- [x] 3.2 Add a bounded demo ingestion action for current run basis records to support local pilot smoke without live OCR jobs.
- [x] 3.3 Keep publish, confirm, report, and history semantics unchanged except for provider provenance display.

## 4. Smoke, Docs, And Archive

- [x] 4.1 Add backend smoke for provider output -> preview -> blocked publish -> confirm -> publish -> readiness.
- [x] 4.2 Add HTTP smoke for the provider preview ingestion route.
- [x] 4.3 Update runbook and roadmap with provider ingestion semantics.
- [x] 4.4 Run `npm run smoke:opening-condition`.
- [x] 4.5 Run `npm run smoke:opening-condition:http`.
- [x] 4.6 Run `npm run smoke:opening-condition:ui`.
- [x] 4.7 Run `npm run typecheck`.
- [x] 4.8 Run `openspec validate --changes opening-condition-provider-preview-ingestion`.
