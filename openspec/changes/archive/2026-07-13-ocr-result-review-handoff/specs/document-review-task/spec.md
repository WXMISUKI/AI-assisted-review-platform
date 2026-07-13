# document-review-task Specification

## Purpose

Clarify the review task lifecycle once OCR has completed so the loading flow can distinguish hydrated review-preparation from fallback recovery.

## Requirements

### Requirement: Hydrated review-loading state
The system SHALL expose whether a review-loading task is being driven by hydrated OCR structure or by fallback recovery.

#### Scenario: OCR hydration succeeds
- **WHEN** the OCR job finishes and the structure is hydrated successfully
- **THEN** the loading page can indicate that the task is using hydrated review structure

#### Scenario: OCR hydration fails
- **WHEN** the OCR result cannot be hydrated into a usable structure
- **THEN** the task remains visible with a safe fallback loading state and a non-secret failure message

### Requirement: Review-preparation handoff
The system SHALL keep OCR-completed tasks locked until review preparation has a hydrated structure snapshot.

#### Scenario: OCR completes and review preparation starts
- **WHEN** the backend reports OCR completion and hydration succeeds
- **THEN** the task transitions into review preparation with the hydrated structure carried forward

#### Scenario: Hydration is not ready
- **WHEN** OCR completion is reported but no usable structure can be recovered
- **THEN** the task does not unlock review actions and stays in the recoverable loading path
