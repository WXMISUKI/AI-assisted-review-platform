# AI Assisted Review Platform Context

This context defines the project-specific business language for construction plan review and opening-condition material review.

## Language

**Product Portal**:
A business entry with its own route namespace, navigation, and workflow context under the shared platform identity.
_Avoid_: Menu item, sidebar module

**Opening-Condition Workspace**:
A selected project, contract package, participating organization, and review purpose used to scope one opening-condition review flow.
_Avoid_: Folder, generic project

**Basis Version**:
A published set of contract, supplemental agreement, checklist, regulation, or project-rule facts that defines the review boundary for a workspace.
_Avoid_: Knowledge base, prompt context

**Contract Boundary**:
The participating organization and work-scope boundary established by contract or supplemental basis records.
_Avoid_: Personnel roster, equipment registry

**Project Master Data**:
Human-confirmed or published personnel, equipment, certificate, company, or system-document facts used by opening-condition checks.
_Avoid_: OCR output, vector chunk

**Preflight Gate**:
A mandatory opening-condition stage that must publish the basis version and required project master data before formal material review can start.
_Avoid_: Optional setup, upload checklist

**Subcontract Team Knowledge Base**:
An organization-scoped and subcontract-team-scoped evidence library that supports material verification with reusable documents, extracted fields, and references.
_Avoid_: Global vector store, Dify dataset

**Material Review Item**:
A checklist item that can be checked from submitted documents or published master data in the current pilot.
_Avoid_: On-site inspection item, emergency drill item

**Visual Assertion**:
A reviewable claim about a signature, stamp, checkbox, handwritten date, or similar visual field, with confidence and evidence locator.
_Avoid_: Legal authenticity proof

**Auxiliary Opinion**:
The platform's internal AI-assisted review output that supports, but does not replace, responsible human review.
_Avoid_: Final approval, regulatory decision
