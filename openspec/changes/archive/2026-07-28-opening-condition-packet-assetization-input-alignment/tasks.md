## 1. Backend Packet Assetization

- [x] 1.1 Inspect current ZIP manifest and derived-object creation path against the new spec.
- [x] 1.2 Fix supported ZIP entry assetization so readable child files keep derived object refs and path-stable ids.
- [x] 1.3 Preserve manifest-only fallback reasons for unsupported or failed child files.

## 2. Matching Input Alignment

- [x] 2.1 Ensure material matching prefers derived packet assets over source ZIP archives.
- [x] 2.2 Ensure basis objects remain context only and cannot become packet evidence or checklist review rows.
- [x] 2.3 Ensure manifest-only matches produce explicit human-review uncertainty copy.

## 3. Preview Boundary

- [x] 3.1 Ensure document-library preview targets derived object refs before source archives.
- [x] 3.2 Ensure manifest-only preview fallback explains the missing standalone object without pretending the ZIP is the child file.

## 4. Verification And Archive

- [x] 4.1 Add focused store/UI smoke coverage for derived assets, basis context, and preview selection.
- [x] 4.2 Run focused opening-condition tests and TypeScript smoke.
- [x] 4.3 Sync specs and archive the OpenSpec change.
