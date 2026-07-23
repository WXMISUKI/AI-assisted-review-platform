## MODIFIED Requirements

### Requirement: Current trial run tracking
The opening-condition execution console SHALL keep operator actions scoped to the currently selected or newly bootstrapped pilot run.

#### Scenario: Backend workspace facts are visible before formal matching
- **WHEN** the operator opens the material-intake page for the current run
- **THEN** the console shows the backend basis, master-data, and knowledge-base facts that support this run before the operator starts formal matching

#### Scenario: Trial bootstrap reuses a ready workspace knowledge base
- **WHEN** the operator bootstraps a new real-file trial run without explicitly choosing a knowledge base
- **AND** the workspace already has exactly one knowledge base that is ready for formal review
- **THEN** the new run binds that ready knowledge base instead of creating or preferring a provisional placeholder knowledge base

#### Scenario: Intake re-initialization upgrades a provisional binding
- **WHEN** the current run is re-initialized without explicitly choosing a knowledge base
- **AND** the run is still bound to a provisional knowledge base from an earlier attempt
- **AND** the workspace already has exactly one knowledge base that is ready for formal review
- **THEN** re-initialization rebinds the run to the ready knowledge base instead of preserving the historical provisional binding
