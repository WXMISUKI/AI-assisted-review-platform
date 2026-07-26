## Why

The construction-plan review MVP still audits DOCX content as if every extracted paragraph were equivalent body text. That causes two high-cost failures:

- cover and table-of-contents lines are flattened into ordinary review paragraphs
- rule and LLM review then misfire on non-body text such as TOC titles and page-number lines

Before we invest in a page viewer or near-source preview, the highest-value MVP step is to make the structure layer distinguish reviewable body content from non-reviewable presentation content.

## What Changes

- Classify DOCX-extracted paragraphs into safe structural block types such as `cover`, `toc`, `body_paragraph`, and `table_row`.
- Mark whether each paragraph is eligible for review so downstream review logic can gate non-body content.
- Build body sections only from review-eligible content while still preserving non-body paragraphs in recovered structure for future source-faithful preview work.
- Update rule and LLM review flows to ignore non-reviewable blocks.
- Add focused DOCX smoke coverage proving TOC-style content no longer enters review findings.

## Capabilities

### New Capabilities
- `ocr-structured-document-recovery`: DOCX recovered structure can distinguish non-body blocks from reviewable body blocks.

### Modified Capabilities
- `document-review-task`: recovered DOCX paragraphs preserve safe block metadata and review eligibility.
- `agent-review-kernel`: rule and semantic review only consume review-eligible DOCX body content.

## Impact

- Backend parser: `server/docxParser.mjs`
- Review pipelines: `server/reviewRuleEngine.mjs`, `server/reviewLlmGenerator.mjs`
- Shared task types: `src/domain/reviewTypes.ts`
- Tests: extend `server/reviewDocxMvpSmoke.test.mjs`
- No viewer dependency or route redesign in this slice
