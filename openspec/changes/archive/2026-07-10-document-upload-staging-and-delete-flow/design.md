## Context

The upload card already has optional filename and project fields. Creating the task immediately on file selection skips the user's chance to edit those fields or cancel the selected file. Existing document tasks are stored through the review session service and localStorage, but no delete operation exists.

## Goals / Non-Goals

**Goals:**
- File selection/drop creates a staged file preview in the upload card, not a library task.
- The staged file can be removed before task creation.
- Clicking add creates a real stored/OCR-submitted task when a file is staged.
- Clicking add without a staged file creates a demo task.
- Existing tasks can be deleted after a confirmation dialog.

**Non-Goals:**
- Delete the corresponding MinIO object from storage.
- Add batch delete or undo.
- Add a custom file re-upload queue.

## Decisions

1. **Stage the browser `File` in page state.**  
   This avoids uploading or creating backend state until the user confirms. The selected file is cleared after add or remove.

2. **Reuse existing upload/OCR submission logic on add.**  
   The confirmed staged file goes through MinIO upload and OCR object submission, then creates the task with `parsing` or `failed` status.

3. **Use a local confirmation dialog for delete.**  
   This matches existing modal styling and avoids destructive `window.confirm` behavior.

4. **Delete local task only.**  
   Storage cleanup should be a separate backend capability because it affects object lifecycle and permissions.

## Risks / Trade-offs

- **Staged file is lost on refresh** -> Acceptable for MVP because it was never committed.
- **MinIO object remains if a stored task is deleted** -> Explicitly out of scope and should be handled by later storage lifecycle work.
- **Demo task button can be confusing** -> Button copy and staged-file preview distinguish real file add from demo creation.
