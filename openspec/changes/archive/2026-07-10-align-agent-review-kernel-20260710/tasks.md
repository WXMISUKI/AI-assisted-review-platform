## 1. Domain Contract Alignment

- [x] 1.1 Extend review domain types with kernel metadata: engine source, check domain, check item, output scenario, schema version, compliance category, and basis priority.
- [x] 1.2 Add structured reference types for normative standards and project-specific documents.
- [x] 1.3 Add rectification loop fields for整改要求,核验标准,整改时限, and复核流程.
- [x] 1.4 Add optional expert-review assistance fields for超危大工程论证 findings.

## 2. Mock Kernel Data

- [x] 2.1 Update mock review issues to include representative findings from preparation-content, procedure-compliance, and professional-technical check domains.
- [x] 2.2 Add mock references for JT/T 1495-2024, JTG F90-2015, JTG G10-2016, and project-specific bid/contract/drawing documents.
- [x] 2.3 Add mock hazard classification data indicating whether expert论证 checks are required.
- [x] 2.4 Preserve current accept/reject/manual annotation behavior while adding the new kernel fields.

## 3. Review Workbench Presentation

- [x] 3.1 Update issue cards to show scenario, engine source, check domain, compliance category, and primary basis reference.
- [x] 3.2 Add an expandable traceability section for multiple references and source priority.
- [x] 3.3 Add a readable rectification section for整改要求,核验标准,整改时限, and复核流程 when present.
- [x] 3.4 Ensure review mode and review-revise mode continue to render decisions and preview behavior correctly.

## 4. Agent Assets And Task Stages

- [x] 4.1 Update construction plan review agent mock configuration with kernel profile, supported basis categories, check domains, engine types, output scenarios, and schema version.
- [x] 4.2 Add placeholder knowledge binding entries for normative knowledge and project-specific files.
- [x] 4.3 Update document review task mock stages to include parsing, basis retrieval, hazard classification, rule matching, semantic review, issue structuring, and output generation.
- [x] 4.4 Surface basis trace status counts in mock task state where the UI already has a suitable status location.

## 5. Verification And Spec Closure

- [x] 5.1 Run TypeScript typecheck after implementation.
- [x] 5.2 Manually inspect the review workbench in light and dark themes for readability of the new dense issue fields.
- [x] 5.3 Run OpenSpec status/validation for this change.
- [x] 5.4 Archive the change only after implementation is complete and accepted.
