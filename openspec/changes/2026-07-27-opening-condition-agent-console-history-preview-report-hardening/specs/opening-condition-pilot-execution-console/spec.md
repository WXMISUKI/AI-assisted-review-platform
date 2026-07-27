# opening-condition-pilot-execution-console Delta

## ADDED Requirements

### Requirement: Agent history keeps explicit delete actions
The opening-condition agent console SHALL keep a visible delete action for project-scoped history rows so operators can remove mistaken or obsolete runs without leaving the workbench.

#### Scenario: Operator deletes a visible history row
- **WHEN** the history list renders a task row in the opening-condition agent console
- **THEN** the row exposes a delete action
- **AND** deleting the row removes it from the current list without requiring a manual browser refresh

#### Scenario: Deleted task is already absent in the current backend instance
- **WHEN** the delete request returns a safe `not_found` response
- **THEN** the UI still clears that row from local history
- **AND** it explains that the record no longer exists in the current backend instance

### Requirement: Inventory preview degrades clearly for old packet entries
The opening-condition selected-task preview workbench SHALL explain when a packet inventory entry cannot be previewed inline because it has no standalone stored object.

#### Scenario: Inventory entry has its own preview object
- **WHEN** a selected document-library entry has a standalone stored object reference
- **THEN** the preview workbench resolves the preview from that object as usual

#### Scenario: Inventory entry only comes from an old packet manifest
- **WHEN** a selected inventory entry has no standalone stored object
- **THEN** the preview workbench clearly states that the entry comes from a historical or old packet manifest without an independent preview object
- **AND** the message does not present the situation as an unknown platform failure

#### Scenario: Original packet archive is still available
- **WHEN** the selected old inventory entry can still be traced back to its original uploaded packet archive
- **THEN** the preview workbench offers a bounded open/download path for that original archive

### Requirement: Progress pane finishes with rendered report content
The opening-condition agent progress pane SHALL present the final report as rendered Markdown content instead of raw preformatted text.

#### Scenario: Report asset exists
- **WHEN** the selected task has a generated report asset with `markdownContent`
- **THEN** the right-side progress pane renders headings, lists, table rows, and links as structured report content
- **AND** the report appears inside the same agent progress surface as the final delivery step

#### Scenario: Report asset is not ready
- **WHEN** the selected task has no generated report asset
- **THEN** the progress pane still explains that the final report will appear there after workflow and human review complete
