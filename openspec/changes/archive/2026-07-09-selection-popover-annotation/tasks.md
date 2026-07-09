## 1. Specification

- [x] 1.1 Create OpenSpec proposal, design, and delta spec for selection-anchored annotation.

## 2. Popover State and Positioning

- [x] 2.1 Extend the selection draft with viewport popover coordinates.
- [x] 2.2 Clamp popover coordinates so the form stays within the viewport.

## 3. UI Refactor

- [x] 3.1 Replace the top manual annotation form with a lightweight hint bar.
- [x] 3.2 Render the manual annotation form as a fixed-position popover near the selected text.

## 4. Interaction Preservation

- [x] 4.1 Keep manual issue creation, cancellation, highlights, cards, filters, and preview behavior working from the popover.
- [x] 4.2 Ensure selection creation no longer scrolls the document to the top.

## 5. Verification and Archive

- [x] 5.1 Run lightweight type checking.
- [x] 5.2 Update implementation notes, validate, and archive the OpenSpec change.
