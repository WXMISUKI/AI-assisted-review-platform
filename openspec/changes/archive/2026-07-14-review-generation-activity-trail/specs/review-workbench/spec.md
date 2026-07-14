# review-workbench Specification

## Purpose

Expose compact generation activity context to improve reviewer trust and recovery clarity without adding a full audit-log module.

## Requirements

### Requirement: Compact generation activity visibility
The workbench and document task surfaces SHALL expose recent safe generation activity summaries when available.

#### Scenario: Document task is listed
- **WHEN** a task has review generation activity events
- **THEN** the document card can show the latest safe activity summary alongside lifecycle status

#### Scenario: Loading view is open
- **WHEN** a task is in locked loading or observation mode and has generation activity events
- **THEN** the loading view can show recent safe activities to explain current progress

### Requirement: Activity visibility does not replace decisions
The workbench SHALL keep issue decision controls and workbench unlock behavior unchanged while showing activity context.

#### Scenario: User reviews issues
- **WHEN** generation activity summaries are visible
- **THEN** accept, reject, edit, manual annotation, and completion behavior remain unchanged

### Requirement: Activity summaries remain safe
The workbench SHALL never display unsafe generation diagnostics through activity summaries.

#### Scenario: Activity event has diagnostics
- **WHEN** the UI renders activity context
- **THEN** it displays only safe labels/counts/statuses and excludes prompts, secrets, provider raw traces, raw document text, and private object URLs
