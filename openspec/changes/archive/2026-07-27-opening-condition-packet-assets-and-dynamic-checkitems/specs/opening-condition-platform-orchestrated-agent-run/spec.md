## MODIFIED Requirements

### Requirement: Checklist extraction follows the Dify check_items schema
The platform SHALL normalize checklist-derived review items using the Dify workflow's `check_items` contract as the schema reference, while persisting them as platform-owned facts.

#### Scenario: Uploaded checklist content is available
- **WHEN** the uploaded checklist document can be parsed into `资料核查` rows
- **THEN** the platform creates checklist/check item records containing item id, category, sub-category, content, mandatory flag, as-needed flag, expected material names, pass state, match files, remark, and row index
- **AND** the extracted items are persisted on the task as platform facts

#### Scenario: Checklist template fallback is required
- **WHEN** the platform cannot derive checklist items from the uploaded checklist content but the checklist filename matches a known controlled adapter
- **THEN** the platform uses the controlled template as a bounded fallback
- **AND** it records a safe diagnostic indicating that uploaded content extraction did not supply the formal checklist items

#### Scenario: Checklist cannot be derived
- **WHEN** the platform cannot derive checklist items from either uploaded content or a controlled template
- **THEN** the task records a safe diagnostic explaining that checklist definition needs human input
- **AND** it does not invent formal review items

### Requirement: Material matching produces review statuses
The platform SHALL match checklist item material names against task packet entries and derived packet file assets to produce review-item status.

#### Scenario: Required material has matching derived files
- **WHEN** a checklist item's expected material names are represented by packet inventory entries that have derived file assets
- **THEN** the task records matched evidence against those derived file assets
- **AND** the item is marked as matched unless a visual or ambiguity rule requires human review

#### Scenario: Required material is only represented by manifest-only entries
- **WHEN** a checklist item's expected material names can only be matched to manifest-only packet inventory entries
- **THEN** the task records the manifest-level match as bounded evidence context
- **AND** it may still route the item to human review if stable preview or downstream verification is unavailable

#### Scenario: Required material is missing or ambiguous
- **WHEN** a checklist item has no stable material match or requires visual/manual judgement
- **THEN** the task records a failed or human-review-needed check item
- **AND** a human-review queue item is created for blocking uncertainty
