# opening-condition-human-review-check-item-context Specification

## Purpose
Ensure backend human-review items remain understandable to operators and archived reports by retaining bounded checklist context for each checklist-targeted review decision.

## Requirements

### Requirement: Human-review items retain check-item context

The system SHALL retain bounded checklist context on a human-review item when the item targets a formal checklist item.

#### Scenario: Formal matching creates a review item
- **WHEN** formal matching creates a human-review item with `targetType=check_item`
- **THEN** the item includes the target checklist ID, category, optional subcategory, checklist name, rule explanation, bounded expected-evidence hints, and evidence IDs

#### Scenario: Historical review item lacks a snapshot
- **WHEN** a stored human-review item targets a checklist item but lacks one or more context fields
- **THEN** task normalization backfills missing fields from the task check item or checklist definition without changing the stable review ID or target ID

### Requirement: Human-review page shows review context

The system SHALL show enough bounded context for an operator to identify and judge each checklist review item.

#### Scenario: Operator reviews a checklist item
- **WHEN** the human-review page renders a backend review item targeting a checklist item
- **THEN** it shows category, subcategory when present, checklist name, target ID, status, reason, rule explanation, and evidence references when available

#### Scenario: Context cannot be resolved
- **WHEN** the review item has no stored or recoverable checklist context
- **THEN** the page still shows target ID and reason and indicates that the checklist snapshot is unavailable

### Requirement: Report ledger preserves review context

The system SHALL include bounded checklist context in the human-review decision ledger when a checklist review item is decided.

#### Scenario: Decided checklist item is included in a report
- **WHEN** report generation projects a decided checklist review item into the decision ledger
- **THEN** the ledger entry includes the checklist name, category/subcategory when present, target ID, reason, decision status, evidence IDs, and safe decision note

### Requirement: Human-review reasons explain content-verification uncertainty
Human-review items created from formal matching SHALL include operator-facing reason text that distinguishes missing materials, manifest-only matches, unsupported content extraction, content mismatch, retrieval conflict, visual uncertainty, and master-data authorization gaps.

#### Scenario: Content extraction is not available
- **WHEN** a checklist item has a candidate file but no usable packet content fact
- **THEN** the human-review item reason explains that the file content has not been proven and cannot be accepted based only on the file name

#### Scenario: Content fact mismatches expected evidence
- **WHEN** bounded content facts do not support the expected material
- **THEN** the human-review item reason explains that file name or manifest matching is insufficient and identifies the content-verification mismatch category

### Requirement: Human-review detail shows content-verification context
The human-review detail page SHALL show content-verification context for the selected checklist item when task-owned facts are available.

#### Scenario: Operator opens a content-mismatched item
- **WHEN** the selected checklist item has semantic mismatch or unavailable content diagnostics
- **THEN** the detail page shows the semantic note and matching content-fact rows so the operator can understand why the item needs review

#### Scenario: Content facts are unsupported or pending
- **WHEN** matching content facts are pending, unsupported, partial, or failed
- **THEN** the detail page shows a readable Chinese status and makes clear that content accuracy has not been proven
