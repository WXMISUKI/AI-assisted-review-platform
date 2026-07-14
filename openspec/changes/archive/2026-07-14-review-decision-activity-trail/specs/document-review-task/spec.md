# document-review-task Delta

## ADDED Requirements

### Requirement: Backend reviewer activity read endpoint
The backend SHALL expose a task-scoped endpoint for reading recent reviewer decision activities.

#### Scenario: Client reads reviewer activities
- **WHEN** the frontend requests decision activities for a persisted review task
- **THEN** the backend returns the task's recent safe activity records in chronological order

#### Scenario: Task is absent
- **WHEN** the requested task id does not exist
- **THEN** the backend returns a safe not-found response without leaking storage details
