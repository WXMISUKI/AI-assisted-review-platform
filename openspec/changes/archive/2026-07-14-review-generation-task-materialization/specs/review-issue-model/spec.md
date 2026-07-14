# review-issue-model Delta

## ADDED Requirements

### Requirement: Materialized generated issues keep provenance
The review issue model SHALL attach generation provenance to issues materialized from backend generation runs.

#### Scenario: Backend candidate is stored
- **WHEN** a backend generation run candidate is merged into a review task
- **THEN** the issue records generation run id, source, and generated timestamp

### Requirement: Materialized issue merge is deduplicated
The review issue model SHALL deduplicate backend-generated issue candidates against existing task issues.

#### Scenario: Same candidate appears again
- **WHEN** the same candidate title, paragraph anchor, and anchor text are materialized again
- **THEN** only one review issue is stored for that finding
