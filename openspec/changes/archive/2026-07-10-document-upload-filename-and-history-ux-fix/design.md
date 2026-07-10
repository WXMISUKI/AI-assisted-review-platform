## Context

The current flow waits until MinIO upload and OCR job submission have both completed before calling `createDocumentTask`. That makes the selected file invisible in history during network work. The backend uses Busboy without a UTF-8 `defParamCharset`, which can decode browser multipart filenames as latin1 and produce mojibake for Chinese filenames.

## Goals / Non-Goals

**Goals:**
- Preserve Chinese filenames in upload responses and object metadata.
- Make selected/dropped files appear in recent history immediately.
- Keep task status accurate as upload and OCR submission progress.
- Prevent long history titles from expanding the sidebar.

**Non-Goals:**
- Implement OCR polling or result ingestion.
- Add custom tooltip components; native `title` is sufficient for this small fix.
- Change MinIO object key generation beyond using the corrected filename.

## Decisions

1. **Set Busboy `defParamCharset` to `utf8`.**  
   Browser multipart filenames are UTF-8 in practice. This fixes the observed mojibake at the parser boundary rather than altering MinIO or server fonts.

2. **Create task before async upload finishes.**  
   The UI inserts a task with `uploading` status and then updates it with `sourceObject`, `ocrJob`, and final submission state.

3. **Add `uploading` document status.**  
   This is clearer than overloading `uploaded` or `parsing` before storage succeeds.

4. **Use CSS ellipsis plus native title.**  
   This solves overflow with minimal UI code and works for long Chinese and mixed filenames.

## Risks / Trade-offs

- **Upload failure leaves a failed task in history** -> This is intentional; users can see what failed instead of losing context.
- **Native title is basic** -> It is acceptable for MVP and avoids adding a custom popover.
- **Existing tasks lack `uploading`** -> Status additions are backward compatible.
