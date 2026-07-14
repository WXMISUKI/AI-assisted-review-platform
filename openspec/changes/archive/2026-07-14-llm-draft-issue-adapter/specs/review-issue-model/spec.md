# review-issue-model Specification

## Purpose

Ensure generated LLM candidates are normalized into the existing structured review issue model before entering the workbench.

## Requirements

### Requirement: Validated AI issue candidates
The system SHALL validate AI-generated draft issue candidates before storing them as review issues.

#### Scenario: Candidate has valid anchor
- **WHEN** an AI candidate references a known paragraph and resolvable anchor text
- **THEN** the system converts it into a pending `ReviewIssue` with stable paragraph offsets

#### Scenario: Candidate anchor is invalid
- **WHEN** an AI candidate references an unknown paragraph or unresolvable anchor text
- **THEN** the system drops the candidate or returns it as invalid diagnostics rather than rendering it as a review issue

### Requirement: Candidate deduplication
The system SHALL deduplicate generated AI candidates against existing deterministic draft issues.

#### Scenario: LLM and deterministic issue overlap
- **WHEN** a generated candidate has the same title, paragraph, and anchor text as an existing draft issue
- **THEN** the system stores only one review issue for that finding

#### Scenario: Candidate adds new finding
- **WHEN** a generated candidate points to a distinct paragraph anchor and finding title
- **THEN** it can be appended as a new pending AI issue
