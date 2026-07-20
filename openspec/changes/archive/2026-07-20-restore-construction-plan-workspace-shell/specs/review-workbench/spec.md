## ADDED Requirements

### Requirement: Workbench is not product landing page
The construction-plan review workbench SHALL remain a review task/detail surface and MUST NOT be the default screen shown immediately after selecting the construction-plan product.

#### Scenario: Product is selected
- **WHEN** the user selects construction-plan review from the product launcher
- **THEN** the system opens the construction-plan product shell at the document library instead of directly rendering the review workbench

#### Scenario: Review task is opened
- **WHEN** the user starts or opens a reviewable construction-plan task
- **THEN** the system renders the review workbench with the selected task context

