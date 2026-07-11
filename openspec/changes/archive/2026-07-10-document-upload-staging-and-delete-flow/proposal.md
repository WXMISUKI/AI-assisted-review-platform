## Why

The current upload flow creates a document task as soon as a file is selected, before the user confirms the optional filename/project metadata. Users also cannot delete document tasks once they are added to the library.

## What Changes

- Stage selected/dropped files inside the upload card instead of immediately adding them to the document library.
- Allow users to remove a staged file before adding it.
- Use the add-document action to upload the staged file, submit OCR, and then create the document task.
- Preserve demo document creation when no file is staged.
- Add delete actions for library documents with a confirmation dialog.

## Capabilities

### New Capabilities

### Modified Capabilities
- `document-review-task`: Supports staged uploads before task creation and deletion of existing document tasks with confirmation.

## Impact

- Frontend document library upload state and document row actions.
- Review session service gains a delete task operation.
- Local mock persistence is updated through the service boundary.
