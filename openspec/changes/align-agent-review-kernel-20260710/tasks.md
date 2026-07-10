## 1. Domain Contract Alignment

- [ ] 1.1 Extend review domain types with kernel metadata: engine source, check domain, check item, output scenario, schema version, compliance category, and basis priority.
- [ ] 1.2 Add structured reference types for normative standards and project-specific documents.
- [ ] 1.3 Add rectification loop fields for整改要求,核验标准,整改时限, and复核流程.
- [ ] 1.4 Add optional expert-review assistance fields for超危大工程论证 findings.

## 2. Mock Kernel Data

- [ ] 2.1 Update mock review issues to include representative findings from preparation-content, procedure-compliance, and professional-technical check domains.
- [ ] 2.2 Add mock references for JT/T 1495-2024, JTG F90-2015, JTG G10-2016, and project-specific bid/contract/drawing documents.
- [ ] 2.3 Add mock hazard classification data indicating whether expert论证 checks are required.
- [ ] 2.4 Preserve current accept/reject/manual annotation behavior while adding the new kernel fields.

## 3. Review Workbench Presentation

- [ ] 3.1 Update issue cards to show scenario, engine source, check domain, compliance category, and primary basis reference.
- [ ] 3.2 Add an expandable traceability section for multiple references and source priority.
- [ ] 3.3 Add a readable rectification section for整改要求,核验标准,整改时限, and复核流程 when present.
- [ ] 3.4 Ensure review mode and review-revise mode continue to render decisions and preview behavior correctly.

## 4. Agent Assets And Task Stages

- [ ] 4.1 Update construction plan review agent mock configuration with kernel profile, supported basis categories, check domains, engine types, output scenarios, and schema version.
- [ ] 4.2 Add placeholder knowledge binding entries for normative knowledge and project-specific files.
- [ ] 4.3 Update document review task mock stages to include parsing, basis retrieval, hazard classification, rule matching, semantic review, issue structuring, and output generation.
- [ ] 4.4 Surface basis trace status counts in mock task state where the UI already has a suitable status location.

## 5. Verification And Spec Closure

- [ ] 5.1 Run TypeScript typecheck after implementation.
- [ ] 5.2 Manually inspect the review workbench in light and dark themes for readability of the new dense issue fields.
- [ ] 5.3 Run OpenSpec status/validation for this change.
- [ ] 5.4 Archive the change only after implementation is complete and accepted.
