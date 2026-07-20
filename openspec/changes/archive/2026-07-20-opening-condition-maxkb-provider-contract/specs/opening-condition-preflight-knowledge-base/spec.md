## ADDED Requirements

### Requirement: MaxKB-backed preflight knowledge binding
Opening-condition preflight knowledge-base records SHALL support MaxKB project-level knowledge bindings as external support metadata.

#### Scenario: Project-level MaxKB knowledge base is bound
- **WHEN** a preflight workspace or subcontract-team knowledge base is linked to a MaxKB project knowledge base
- **THEN** the platform stores provider refs and metadata that bind the MaxKB knowledge id to platform workspace, project, contract package, organization, subcontract team, and review task context

#### Scenario: MaxKB sync status affects readiness
- **WHEN** a bound MaxKB provider ref is provisional, stale, unreachable, or disabled
- **THEN** the opening-condition readiness summary marks the knowledge-base support source as provisional or blocked instead of ready

#### Scenario: MaxKB retrieval supports review only
- **WHEN** MaxKB retrieval or retrieval-check returns hits for a material review item
- **THEN** the system treats those hits as supporting evidence recall and still requires platform basis, master data, evidence records, and human decisions for formal conclusions
