## Context

The opening-condition pilot stores packet `inventoryEntries` as platform-owned facts. For ZIP uploads, the backend can create both manifest rows and bounded derived preview objects. The current entry id generation is order-based, and preview extraction counts only previewable rows, so a file's manifest id and derived-preview id can diverge. Historical data can also contain duplicate inventory ids, which surfaces as React duplicate key warnings such as `docx-4`.

## Goals / Non-Goals

**Goals:**
- Derive new ZIP entry ids from `sourceObjectId` and normalized ZIP relative path.
- Preserve a stable relationship between `inventoryEntries` and `derivedObjectRef` for the same ZIP path.
- Ensure the agent document library renders collision-free keys and opens the intended file even when legacy entry ids are duplicated.

**Non-Goals:**
- Rebuild the full ZIP/OCR/deep-review pipeline.
- Treat browser-extension console messages as platform asset-loading failures.
- Change construction-review platform behavior.

## Decisions

- Use a path-derived id instead of a display name or entry order. This makes identity stable when manifest and preview passes filter different subsets of entries.
- Encode the normalized relative path with URL-safe base64 and cap the path segment to keep ids ASCII and bounded while preserving deterministic behavior.
- Keep frontend fallback identity separate from stored backend `entry.id`. This avoids mutating historical task facts while still preventing React key collisions and preview misrouting.

## Risks / Trade-offs

- Very long or unusual ZIP paths can produce long ids -> cap the encoded path segment and fall back to the entry index only when the normalized path is empty.
- Existing historical data may still contain duplicated backend ids -> compose the UI id from entry id, source object id, relative path, and derived storage key.
- Two files with the same normalized path inside one malformed archive remain ambiguous -> the backend still exposes bounded rows, while the UI fallback adds enough context to keep rendered rows distinct when other fields differ.
