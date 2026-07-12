# review-workbench Specification

## Purpose
TBD - created by archiving change interactive-review-mvp. Update Purpose after archive.
## Requirements
### Requirement: Review workbench layout
The system SHALL present a usable construction plan review workbench as the first screen, with project context, review progress, document content, and issue handling controls visible without a marketing or landing page.

#### Scenario: User opens the application
- **WHEN** the user opens the MVP application
- **THEN** the system displays the construction plan document area and the review issue panel

### Requirement: Inline issue highlighting
The system SHALL render AI and manual review issues at their corresponding document text positions using visually distinct inline markers.

#### Scenario: Pending issue is rendered
- **WHEN** a pending issue has an anchor pointing to a paragraph text range
- **THEN** the anchored text is displayed with a visible warning marker

#### Scenario: Resolved issue is rendered
- **WHEN** an issue is accepted or rejected
- **THEN** the document marker reflects the resolved status without losing the location relationship

### Requirement: Bidirectional issue navigation
The system SHALL link document markers and side-panel issue cards so users can move between the problem location and its explanation.

#### Scenario: User selects an issue card
- **WHEN** the user clicks an issue card in the side panel
- **THEN** the document scrolls to the anchored paragraph and visually focuses the matching issue

#### Scenario: User selects a document marker
- **WHEN** the user clicks a highlighted issue marker in the document
- **THEN** the matching side-panel card becomes the active issue

### Requirement: Issue status filtering
The system SHALL allow users to filter review issues by processing status.

#### Scenario: User filters pending issues
- **WHEN** the user selects the pending filter
- **THEN** only pending issue cards are shown in the side panel

### Requirement: Issue handling actions
The system SHALL support accepting an AI suggestion, rejecting an issue, and editing a suggestion before accepting it.

#### Scenario: User accepts an AI suggestion
- **WHEN** the user clicks accept on a pending issue
- **THEN** the issue status changes to accepted and the processed document preview uses the suggested replacement

#### Scenario: User rejects an issue
- **WHEN** the user clicks reject on a pending issue
- **THEN** the issue status changes to rejected and the processed document preview keeps the original text

#### Scenario: User edits and accepts a suggestion
- **WHEN** the user changes the suggestion text and clicks modified accept
- **THEN** the issue status changes to modified and the processed document preview uses the user-edited replacement

### Requirement: Processed document preview
The system SHALL show a preview of the processed construction plan text based on issue actions.

#### Scenario: User resolves issues
- **WHEN** one or more issues are accepted or modified
- **THEN** the processed preview reflects the accepted or modified replacements in document order

### Requirement: Review progress summary
The system SHALL display a review progress summary based on issue statuses.

#### Scenario: User changes issue status
- **WHEN** an issue status changes
- **THEN** the progress summary updates pending, accepted, rejected, and modified counts

### Requirement: Manual text selection annotation
The system SHALL allow users to create a manual review issue from selected text in the document body.

#### Scenario: User selects text in one paragraph
- **WHEN** the user selects text within a single document paragraph
- **THEN** the system captures the paragraph identity, start offset, end offset, and selected text

#### Scenario: User submits manual annotation
- **WHEN** the user fills the manual annotation form and submits it
- **THEN** the system adds a pending manual issue linked to the selected text

#### Scenario: User cancels manual annotation
- **WHEN** the user cancels the selected annotation draft
- **THEN** the system clears the selection draft without adding a review issue

### Requirement: Manual annotation visibility
The system SHALL render newly created manual annotations in both the document and the issue panel.

#### Scenario: Manual issue is created
- **WHEN** a manual issue is added from selected text
- **THEN** the selected text is highlighted in the document and a matching issue card appears in the side panel
 
#### Scenario: Manual issue card is processed
- **WHEN** the user accepts, rejects, or edits a manual issue
- **THEN** the issue follows the same status and preview behavior as AI issues

### Requirement: Selection anchored annotation popover
The system SHALL display the manual annotation form near the selected document text instead of moving the user to a top-of-document form.

#### Scenario: User selects valid text
- **WHEN** the user selects valid text within one document paragraph
- **THEN** the system displays a manual annotation popover anchored near the selected text

#### Scenario: Selection is near viewport edge
- **WHEN** the selected text is close to a viewport edge
- **THEN** the popover remains visible within the viewport bounds

### Requirement: Review mode switch
The system SHALL provide a mode switch between review mode and review-revise mode, with review mode selected by default.

#### Scenario: User opens the application
- **WHEN** the workbench loads
- **THEN** review mode is selected by default

#### Scenario: User switches mode
- **WHEN** the user selects review-revise mode
- **THEN** accepted issues can affect the processed document preview

### Requirement: Reversible issue decision
The system SHALL allow users to switch an issue decision between accepted and rejected without locking the issue card.

#### Scenario: User accepts an issue
- **WHEN** the user clicks accept
- **THEN** the accept button is highlighted and the issue is marked accepted

#### Scenario: User changes accepted issue to rejected
- **WHEN** the user clicks reject on an accepted issue
- **THEN** the reject button is highlighted and the issue is marked rejected

#### Scenario: User changes rejected issue back to accepted
- **WHEN** the user clicks accept on a rejected issue
- **THEN** the accept button is highlighted and the issue returns to the accepted state

### Requirement: Mode-specific preview behavior
The system SHALL render the processed preview according to the selected mode.

#### Scenario: Review mode preview
- **WHEN** review mode is selected
- **THEN** the preview keeps original document text even if issues are accepted

#### Scenario: Review-revise mode preview
- **WHEN** review-revise mode is selected and an issue is accepted
- **THEN** the preview applies the accepted suggestion text

### Requirement: Manual issue deletion
The system SHALL allow users to delete manually created issues after confirmation.

#### Scenario: User requests deleting a manual issue
- **WHEN** the user clicks delete on a manual issue
- **THEN** the system shows a confirmation prompt before removing the issue

### Requirement: Long document preview
The system SHALL display the processed preview as a continuous document flow suitable for long content.

#### Scenario: Preview is rendered
- **WHEN** the processed preview is displayed
- **THEN** paragraphs appear in document order in a scrollable continuous preview instead of separate cards

### Requirement: Workbench as document detail page
The review workbench SHALL function as the document detail page entered from the document library and review task flow.

#### Scenario: User opens completed review task
- **WHEN** the user opens a document whose AI review task is ready
- **THEN** the system displays the review workbench with document content and review issues

#### Scenario: User opens workbench from shell
- **WHEN** the user clicks a ready document in the library
- **THEN** the system loads the workbench inside the platform shell without losing shell navigation

### Requirement: Draggable annotation popover
The system SHALL allow the manual annotation popover to be dragged without losing the current selection draft.

#### Scenario: User drags the popover
- **WHEN** the user drags the popover header to a new position
- **THEN** the popover moves to the new position and keeps the selected text context intact

### Requirement: Document-like processed preview
The review workbench SHALL display processed preview content as a document-like reading surface with readable paragraph spacing and bounded width.

#### Scenario: Preview is rendered
- **WHEN** processed paragraphs are displayed
- **THEN** the preview uses a centered document canvas, padding, section rhythm, and subtle separators instead of cramped full-width rows

### Requirement: Long preview containment
The review workbench SHALL contain long processed preview content inside a scrollable preview region.

#### Scenario: Preview content is long
- **WHEN** the processed preview contains more content than fits on screen
- **THEN** the preview region scrolls without forcing unrelated workbench panels to grow unexpectedly

### Requirement: Basis-backed issue presentation
The review workbench SHALL expose the main review basis for each AI issue.

#### Scenario: User opens an AI issue card
- **WHEN** the issue has structured basis references
- **THEN** the card shows the primary clause or project document reference, check domain, engine source, and判定标准 without requiring the user to read raw JSON

### Requirement: Traceability detail disclosure
The review workbench SHALL allow users to inspect detailed traceability for a finding.

#### Scenario: User expands issue details
- **WHEN** the issue has multiple normative or project references
- **THEN** the workbench displays source title, version or document locator, clause number where available, summary, and priority

### Requirement: Scenario output distinction
The review workbench SHALL distinguish construction-unit self-check, supervisor formal review, and expert-review assistance findings.

#### Scenario: User scans the issue list
- **WHEN** issues from different output scenarios are shown
- **THEN** each issue indicates its scenario so the user can understand whether it supports整改自查, formal supervisor opinion, or expert论证 assistance

### Requirement: Closed-loop rectification display
The review workbench SHALL display整改闭环 fields when available.

#### Scenario: Supervisor issue includes rectification fields
- **WHEN** an issue includes整改要求,核验标准,整改时限, or复核流程
- **THEN** the issue card exposes those fields in a readable section

### Requirement: Completion gating
The review workbench SHALL enable completion only when every issue has an accepted or rejected decision.

#### Scenario: Issues remain pending
- **WHEN** one or more review issues are pending
- **THEN** the completion action is disabled and shows the remaining pending count

#### Scenario: All issues decided
- **WHEN** every review issue is accepted or rejected
- **THEN** the completion action becomes available

### Requirement: Completion confirmation
The review workbench SHALL ask for confirmation before generating a result asset.

#### Scenario: User clicks completion action
- **WHEN** the user starts completion
- **THEN** the system displays a confirmation dialog explaining the result type that will be generated

### Requirement: Completion payload
The review workbench SHALL emit a completion payload containing mode, issues, decisions, and processed paragraphs.

#### Scenario: User confirms completion
- **WHEN** the user confirms completion
- **THEN** the parent application receives enough data to create the correct report or revised-plan result asset

### Requirement: Session-backed workbench loading
The review workbench SHALL load document paragraphs, issues, draft suggestions, and review mode from the review session service boundary.

#### Scenario: Workbench opens
- **WHEN** a ready review task is opened
- **THEN** the workbench displays paragraphs and issues loaded from the task's review session state

### Requirement: Session-backed issue resolution
The review workbench SHALL persist issue decisions through the review session service boundary.

#### Scenario: Issue decision changes
- **WHEN** a user accepts or rejects an issue
- **THEN** the updated issue status and resolution snapshot are stored in the task session state

#### Scenario: User returns to task
- **WHEN** a user leaves and reopens a task
- **THEN** previously resolved issue decisions are restored in the workbench

### Requirement: Section-aware outline navigation
The review workbench SHALL render the document outline from recovered sections when available.

#### Scenario: Recovered sections exist
- **WHEN** the task includes a recovered document structure with sections
- **THEN** the outline panel shows section titles and paragraph counts instead of repeating each paragraph's section label

#### Scenario: No recovered sections exist
- **WHEN** the task does not yet have recovered sections
- **THEN** the outline can fall back to the existing paragraph-based structure without blocking the workbench

### Requirement: Current section visibility
The review workbench SHALL surface the current section and current paragraph location in the detail context.

#### Scenario: Current section is known
- **WHEN** the recovered structure or stream snapshot includes a current section
- **THEN** the workbench displays that section as the active reading location

#### Scenario: Current paragraph is known
- **WHEN** the recovered structure or stream snapshot includes a current paragraph id
- **THEN** the workbench can expose that paragraph as the current processing anchor

### Requirement: Section-linked issue grouping
The review workbench SHALL group issues in the side panel by their document section when section information is available.

#### Scenario: Issues belong to sections
- **WHEN** the workbench has recovered sections or paragraph section labels
- **THEN** the issue panel shows section headers with the issue cards belonging to each section

#### Scenario: Section data is unavailable
- **WHEN** the workbench cannot determine section boundaries
- **THEN** the issue panel can fall back to the existing flat list without blocking review actions

### Requirement: Current section synchronization
The review workbench SHALL keep the active section synchronized between outline navigation, document focus, and issue panel context.

#### Scenario: User clicks a section
- **WHEN** the user selects a section in the outline
- **THEN** the workbench updates the active section context and keeps the matching issue group visually emphasized

#### Scenario: User focuses an issue
- **WHEN** the user clicks an issue card or highlighted text
- **THEN** the workbench can promote that issue's section to the active section context

### Requirement: Recovered structure summary on workbench
The review workbench SHALL show a compact summary of the hydrated recovered structure when available.

#### Scenario: Workbench opens with recovered structure
- **WHEN** a ready review task includes recovered sections and paragraphs
- **THEN** the workbench displays the source format, section count, paragraph count, current section, and recovery time in the detail summary area
