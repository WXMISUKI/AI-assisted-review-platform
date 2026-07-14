# review-issue-model Specification

## Purpose

Track provenance for generated AI issues without changing the core issue decision model.

## Requirements

### Requirement: Generated issue provenance metadata
The review issue model SHALL allow AI-generated issues to reference the generation run that produced them.

#### Scenario: LLM issue is stored
- **WHEN** a validated LLM issue candidate is merged into the task
- **THEN** the issue can store generation run id, generation source, and generated timestamp

#### Scenario: Fallback issue is stored
- **WHEN** deterministic fallback produces an AI issue candidate
- **THEN** the issue can store fallback generation provenance while remaining a pending AI issue

#### Scenario: Manual issue is stored
- **WHEN** a reviewer creates a manual issue
- **THEN** the issue remains distinguishable as manual and does not require generation provenance
