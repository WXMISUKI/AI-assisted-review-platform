# review-session-state Specification

## Purpose

Extend the review session boundary so OCR hydration clearly becomes the source of truth for the review-preparation handoff, while keeping a safe fallback path when the OCR result cannot be normalized.

## Requirements

### Requirement: OCR hydration handoff
The system SHALL hydrate recovered structure from a completed OCR result before the review-preparation snapshot is created.

#### Scenario: OCR result is available
- **WHEN** an OCR job finishes with a usable `resultUrl.jsonUrl`
- **THEN** the session service can hydrate a recovered structure snapshot and store it on the task aggregate before review-preparation begins

#### Scenario: OCR result cannot be hydrated
- **WHEN** OCR result hydration fails because the remote payload is missing, unreachable, or unparsable
- **THEN** the task remains visible with a non-secret failure message and can still fall back to the existing mock recovery path

### Requirement: Hydrated review session snapshot
The system SHALL use the hydrated recovered structure as the source of truth for the review-session snapshot that initializes review preparation.

#### Scenario: Review preparation starts after hydration
- **WHEN** OCR hydration succeeds and review preparation begins
- **THEN** the session snapshot exposes the recovered paragraphs, current section, and current paragraph context derived from the hydrated structure

#### Scenario: Hydrated snapshot is reopened
- **WHEN** a user reopens an in-progress task after hydration
- **THEN** the restored snapshot preserves the hydrated structure instead of recomputing a separate page-local recovery state

### Requirement: Backend-replaceable hydration contract
The session boundary SHALL keep the hydrated OCR contract compatible with a future backend implementation.

#### Scenario: Backend event arrives
- **WHEN** a backend event provides OCR result metadata and recovered structure data
- **THEN** the session layer can map it into the same hydrated snapshot used by the mock flow
