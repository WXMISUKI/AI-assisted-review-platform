## Why

The construction-plan review workbench still shows recovered paragraphs as a flattened text surface. Task group A already stopped obvious false-positive review input from cover and table-of-contents content, but users still cannot inspect the uploaded DOCX in a source-faithful way or jump from a finding to an approximate original location.

For the fastest MVP progress, we should not jump to full PDF coordinates, Word-native comments, or heavyweight editors yet. The highest-value next slice is a near-source DOCX preview that keeps the current issue workflow intact while adding original-document visibility and finding-to-preview focus.

## What Changes

- Add a frontend DOCX preview surface powered by `docx-preview` for stored `.docx` review tasks.
- Add a backend-connectivity helper that requests a safe presigned object URL for the stored source document.
- Pass task `sourceObject` metadata into the review workbench so the preview can load the original upload.
- Synchronize the active review issue with the rendered preview by approximate text matching, scroll-to-focus, and temporary highlight styling.
- Preserve the existing paragraph-based workbench and processed-preview flow as the fallback review surface.

## Capabilities

### New Capabilities
- `review-workbench`: a ready `.docx` task can display a near-source original preview alongside the existing issue workflow.

### Modified Capabilities
- `backend-connectivity`: the frontend can request a safe presigned URL for a stored review document object.
- `document-review-task`: a reviewable task can hand its stored source object into the workbench detail surface.

## Impact

- Frontend workbench: `src/ReviewWorkbenchPage.tsx`
- Construction-plan task handoff: `src/ConstructionPlanReviewApp.tsx`
- Backend connectivity helpers: `src/domain/backendConnectivity.ts`
- Shared review types: `src/domain/reviewTypes.ts`
- New preview component: `src/SourceFaithfulDocxPreview.tsx`
- Dependency: `docx-preview`
