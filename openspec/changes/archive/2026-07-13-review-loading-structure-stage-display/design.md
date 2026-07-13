# Design

## Stage source selection

The App shell should derive the loading stage set from the selected task:

- if a task has recovered structure, build review-preparation stages from that structure
- otherwise, fall back to the existing static loading stage templates

The loading page already accepts a `stages` array and a current `stage`, so the implementation can stay small by switching the source used by `App.tsx` rather than introducing a new page contract.

## Compatibility

This change is additive and preserves the current fallback behavior for OCR-processing and mock-loading tasks. It only changes which visible stage set is preferred when structure-aware review preparation is available.

## Risks

- If the visible stage source diverges from the stored pipeline snapshot, the page could show a stale stage name.

## Mitigation

- Always derive the stage set from the same recovered structure used by the session state.
- Keep the fallback stages in place so older or incomplete tasks remain readable.
