## Why

Testing exposed three upload UX defects: selected files do not appear in history until the full upload/OCR submission chain finishes, Chinese filenames are mojibake in the backend upload response, and long filenames stretch the recent-history rail.

## What Changes

- Decode multipart filenames as UTF-8 so Chinese filenames round-trip correctly.
- Rename the manual mock button to make its prototype-only behavior clear.
- Create a document history entry immediately after file selection/drop so the user can see the task while upload/OCR continues.
- Update the created task from uploading/parsing to failed when storage or OCR submission fails.
- Constrain recent-history item text with ellipsis and expose the full filename on hover.

## Capabilities

### New Capabilities

### Modified Capabilities
- `document-object-storage`: Upload responses preserve UTF-8 filenames.
- `document-review-task`: File selection/drop creates an immediately visible task and recent-history titles are layout-safe.

## Impact

- Backend multipart parsing in `server/index.mjs`.
- Review task model/service to support an uploading status.
- Document library upload flow and history list styling in `src/App.tsx` and `src/styles.css`.
