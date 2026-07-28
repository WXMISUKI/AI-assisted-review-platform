## Why

The previous change made opening-condition matching capable of consuming packet content facts, but most tasks still need those facts to be manually supplied. The next MVP step is to make packet intake create safe content-fact placeholders automatically and provide a bounded backend ingestion path for OCR/MaxKB Provider results.

## What Changes

- Generate initial packet content facts for packet inventory entries that have standalone preview assets or safe metadata.
- Mark generated facts as `pending`, `ready`, `partial`, or `unsupported` using bounded platform rules.
- Add a backend store operation and HTTP route for provider batch ingestion of packet content facts.
- Merge provider facts into the existing task packet without exposing raw OCR text, private URLs, credentials, or provider traces.
- Keep real OCR execution, large-PDF page splitting, visual annotations, and legal rectification LLM generation out of this batch.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `opening-condition-content-verification`: Packet content facts are automatically initialized during packet intake and can be safely updated from provider ingestion.
- `maxkb-material-packet-coordination`: Provider packet ingestion has a concrete platform endpoint and merge semantics.

## Impact

- Backend opening-condition pilot store.
- Opening-condition HTTP routes and backend connectivity contracts.
- Store and HTTP smoke tests for content fact initialization and provider ingestion.
- No new external runtime dependency is introduced.
