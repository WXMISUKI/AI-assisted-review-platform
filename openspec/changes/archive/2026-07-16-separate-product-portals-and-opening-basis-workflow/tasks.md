## 1. Spec And Documentation Alignment

- [x] 1.1 Update product requirements to state that construction-plan review and opening-condition review are independent business portals under unified identity.
- [x] 1.2 Update platform architecture docs with product launcher, shared service boundaries, and opening-condition portal ownership.
- [x] 1.3 Update architecture evolution decisions with the storage direction: structured relational records as source of truth, MinIO for files/evidence, vector index for retrieval only, SQLite for prototype/testing only.
- [x] 1.4 Remove or revise wording that frames opening-condition review as a direct construction-plan shell menu item.

## 2. Product Launcher And Portal Boundary

- [x] 2.1 Introduce product-portal domain types for product id, product access, launcher entry, and active product context.
- [x] 2.2 Add mock product access data for construction-plan review and opening-condition review.
- [x] 2.3 Add a product launcher view after login or as the default authenticated entry for users with multiple product permissions.
- [x] 2.4 Add independent route or view-state namespace for the construction-plan review portal.
- [x] 2.5 Add independent route or view-state namespace for the opening-condition review portal.
- [x] 2.6 Ensure switching products resets product-specific context while retaining the logged-in user identity.

## 3. Construction-Plan Shell Correction

- [x] 3.1 Remove the direct opening-condition review navigation item from the construction-plan review shell.
- [x] 3.2 Preserve existing construction-plan pages and review task behavior after the shell correction.
- [x] 3.3 Add a return-to-launcher affordance that does not confuse construction-plan navigation with opening-condition workflow navigation.

## 4. Opening-Condition Portal Foundation

- [x] 4.1 Create an opening-condition portal shell with its own left navigation and restrained enterprise layout.
- [x] 4.2 Add opening-condition navigation entries for workspace context, basis sets, master data, check tasks, human review queue, and reports.
- [x] 4.3 Move the existing opening-condition review page behind the opening-condition portal namespace.
- [x] 4.4 Keep the page framed as internal auxiliary review for construction-unit self-check and supervisor assisted review.

## 5. Workspace Context Model

- [x] 5.1 Add opening-condition context domain types for tenant/customer, project, contract package or section, participating organization, workspace, and workspace role.
- [x] 5.2 Add mock/local workspace records that demonstrate different participating organizations and contract packages.
- [x] 5.3 Add workspace selection and creation UI before basis upload, master-data publication, or formal check tasks.
- [x] 5.4 Bind opening-condition pages and packets to the selected workspace context.
- [x] 5.5 Show an empty or blocked state when no workspace is selected.

## 6. Basis Set Workflow

- [x] 6.1 Add domain types for basis set, basis version, basis component, provisional extraction, confirmation decision, and publication status.
- [x] 6.2 Add mock basis-set data covering contract, checklist version, regulation, project rule, and project-specific requirement components.
- [x] 6.3 Add a basis-set page that separates draft/provisional candidates from confirmed and published basis versions.
- [x] 6.4 Add human confirmation actions for basis candidates, including correction note, evidence summary, and optional score.
- [x] 6.5 Block formal opening-condition check task creation when no published basis-set version is selected.

## 7. Master Data Workflow

- [x] 7.1 Add domain types for provisional and published personnel, equipment, certificate, company, and system-document master-data records.
- [x] 7.2 Add mock extracted master-data records with confidence, evidence, validity, and review-needed reasons.
- [x] 7.3 Add a master-data page that separates provisional records from published catalog records.
- [x] 7.4 Add human confirm, reject, and publish actions for master-data records.
- [x] 7.5 Ensure check items reference published master-data ids instead of only raw text labels where mock data is available.

## 8. Opening-Condition Review Packet Refinement

- [x] 8.1 Extend the opening-condition review packet contract with workspace context, bound basis-set version, and master-data readiness.
- [x] 8.2 Update mock check items to distinguish deterministic rule verdicts from semantic AI notes.
- [x] 8.3 Mark check items as blocked or needing human review when required basis or master data is not published.
- [x] 8.4 Update report summary to include workspace context, basis-set version, human-review count, and internal auxiliary disclaimer.

## 9. Dify Bridge Contract

- [x] 9.1 Add domain types for Dify workflow run summary, bridge input, bridge output, normalized callback, and safe diagnostic summary.
- [x] 9.2 Add a normalization function that converts mock Dify outputs into platform-owned basis, master-data, check-item, human-review, and report-draft structures.
- [x] 9.3 Reject or redact unsafe callback fields such as secrets, private object URLs, raw provider traces, and unbounded document text.
- [x] 9.4 Represent Dify Human Input requirements as platform human-review queue items.
- [x] 9.5 Keep Dify report output in draft status until reconciled with platform records and human decisions.

## 10. Verification And Archive

- [x] 10.1 Run OpenSpec validation for the change and fix any spec formatting or scenario issues.
- [x] 10.2 Run TypeScript typecheck after implementation slices that touch TypeScript.
- [x] 10.3 Smoke-test the login-to-launcher-to-each-portal flow.
- [x] 10.4 Smoke-test opening-condition workspace selection, basis publication, master-data publication, packet display, and report summary.
- [x] 10.5 Archive the OpenSpec change only after implementation and verification complete.
