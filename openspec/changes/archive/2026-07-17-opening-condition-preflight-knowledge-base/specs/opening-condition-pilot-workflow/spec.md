## ADDED Requirements

### Requirement: Preflight-gated formal review
The system SHALL gate formal opening-condition pilot matching behind published basis, required master data, and workspace-bound subcontract-team knowledge-base readiness.

#### Scenario: Formal review is requested before preflight completion
- **WHEN** a user requests formal checklist matching before the workspace has completed required preflight gates
- **THEN** the system rejects or blocks the formal review with a safe readiness summary instead of running a best-effort match

#### Scenario: Draft setup remains allowed
- **WHEN** preflight is incomplete
- **THEN** the system still allows draft basis, draft master data, knowledge-base setup, and packet intake actions that do not produce formal auxiliary conclusions

### Requirement: Platform-first workflow path
The system SHALL treat Dify workflow behavior as reference or optional adapter behavior, not as the main opening-condition pilot workflow path.

#### Scenario: Dify is not configured
- **WHEN** Dify is unavailable, disabled, or not selected
- **THEN** the opening-condition pilot workflow still supports platform-owned preflight readiness, material matching, human-review queue, and auxiliary report archive

#### Scenario: External output is imported
- **WHEN** OCR, LLM, Dify, or another adapter contributes extraction or matching output
- **THEN** the output must normalize into platform-owned records before it affects readiness, review results, or reporting
