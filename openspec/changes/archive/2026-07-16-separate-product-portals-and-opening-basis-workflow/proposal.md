## Why

The current implementation and documentation treat opening-condition review as a sibling menu item inside the construction-plan review shell, but the product direction requires two business platforms with separate entrances, navigation, context, and lifecycle boundaries while reusing shared AI/OCR/storage infrastructure.

This change corrects that product boundary before deeper implementation, and defines the next production-oriented opening-condition workflow around organization/project context, versioned basis sets, human-confirmed master data, Dify workflow bridging, and internal auxiliary review output.

## What Changes

- Introduce a unified login and product launcher that can route users into independent construction-plan review and opening-condition review portals.
- Refine the platform shell contract so opening-condition review is no longer specified as a direct navigation item inside the construction-plan review portal.
- Define opening-condition review as an independent portal with its own route namespace, left navigation, workspace context, and domain state machine.
- Add an enterprise context model for opening-condition review: tenant/customer, project, contract package or section, participating organization, workspace/group, and user role.
- Add a versioned basis-set workflow where contracts, checklist versions, regulations, project rules, and confirmed project requirements must be OCR/AI extracted, human confirmed, and published before formal check tasks rely on them.
- Add a master-data publication workflow for personnel, equipment, certificates, companies, and system documents, where AI extraction remains provisional until human confirmation and publication.
- Define the Dify boundary: Dify may orchestrate unzip/OCR/LLM extraction, Human Input, and report drafting, but platform-owned records remain the source of truth for basis, master data, check results, evidence, decisions, and audit summaries.
- Define storage direction: PostgreSQL-style structured persistence is the target source of truth, MinIO/object storage keeps original files and evidence artifacts, vector index is retrieval support only, and SQLite is limited to local prototype/testing.
- Record the product/architecture decision in project docs as future-iteration guidance.

## Capabilities

### New Capabilities
- `product-portal-boundary`: Defines unified identity, product launcher, independent product portals, route namespaces, and shared platform-service boundaries.
- `opening-condition-context`: Defines opening-condition tenant/project/contract-package/organization/workspace context and role framing.
- `opening-condition-basis-workflow`: Defines versioned basis-set ingestion, human confirmation, publication, and binding to review tasks.
- `opening-condition-master-data`: Defines provisional extraction, human confirmation, publication, and reuse of personnel, equipment, certificate, company, and system-document records.
- `opening-condition-dify-bridge`: Defines the platform/Dify responsibility boundary and safe callback/persistence expectations.

### Modified Capabilities
- `platform-shell`: Remove the requirement that opening-condition review is a direct first-class menu item inside the construction-plan review shell, replacing it with product-launcher routing and product-specific shells.
- `opening-condition-review`: Refine the existing review-packet requirements so formal checking depends on selected context, published basis set, published master data, and internal auxiliary-output framing.

## Impact

- Frontend architecture: future implementation should introduce a product launcher and separate portal shells instead of growing one shared sidebar indefinitely.
- Routing: construction-plan review and opening-condition review should use independent route namespaces and business contexts.
- Domain model: opening-condition review needs explicit context, basis-set, master-data, packet, check item, evidence, human decision, and report summary contracts.
- Backend/API: future APIs should expose platform-owned persistence contracts and treat Dify as an execution/orchestration adapter rather than the system of record.
- Storage: future production persistence should favor structured relational records plus object storage, with vector search as an auxiliary retrieval layer.
- Documentation: product positioning and architecture docs should be corrected to reflect shared infrastructure with separate business products.
