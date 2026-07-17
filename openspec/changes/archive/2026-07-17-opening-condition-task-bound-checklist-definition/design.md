# Design

## Decision

Do not jump to checklist file parsing yet. First, persist a normalized checklist definition on the pilot task.

This is the right intermediate step because it:

1. removes execution-time dependence on frontend-local checklist state;
2. preserves the current mock/demo checklist adapter as a temporary source;
3. creates the backend contract that future DOCX/XLSX parsing can feed into.

## Scope

### In scope

- task-bound checklist definition model;
- intake/init support for checklist-definition persistence;
- match fallback to stored checklist definition;
- frontend use of stored task-bound checklist definition after initialization.

### Out of scope

- parsing checklist files from DOCX, XLSX, or OCR results;
- ZIP inventory extraction;
- semantic checklist generation from LLMs;
- database migration.

## Data model

Add a new task-level field:

```text
task.checklistDefinition[]
```

Each item should capture the normalized, execution-ready input for deterministic matching:

- id
- category
- subCategory
- name
- required
- expectedEvidenceHints
- basisVersionId
- masterDataIds
- scopeStatus
- visualAssertions

This field is distinct from:

- `task.packet`: uploaded object references
- `task.checkItems`: matching results

## Execution behavior

### Intake/init

- If intake provides checklist-definition items, persist them on the task.
- If omitted, keep any existing checklist definition on the task.

### Formal match

- If request body provides checklist items, use them and refresh the stored task definition.
- Else, use `task.checklistDefinition`.
- If neither exists, reject the match request.

## Frontend behavior

- During intake/init, the current packet-derived checklist items are sent once and stored on the task.
- During formal match, the frontend may omit checklist items and rely on the stored definition.

This preserves the current demo adapter while shifting the execution truth into the backend.
