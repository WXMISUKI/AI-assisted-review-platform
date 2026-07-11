## 1. Spec and Contract

- [ ] 1.1 Add spec requirements for OCR result ingestion and structure hydration.
- [ ] 1.2 Define the normalized OCR result shape returned by the backend.

## 2. Backend Bridge

- [ ] 2.1 Add a backend helper that fetches PaddleOCR `jsonUrl` content.
- [ ] 2.2 Parse PaddleOCR JSONL / markdown output into normalized sections and paragraphs.
- [ ] 2.3 Expose a backend API for frontend hydration requests.

## 3. Task Hydration

- [ ] 3.1 Update OCR completion handling to fetch and persist recovered structure.
- [ ] 3.2 Preserve fallback behavior when OCR result hydration fails.
- [ ] 3.3 Keep the review detail page compatible with the hydrated structure snapshot.

## 4. Verification

- [ ] 4.1 Run a lightweight typecheck or smoke verification.
- [ ] 4.2 Archive the change and sync updated specs.
