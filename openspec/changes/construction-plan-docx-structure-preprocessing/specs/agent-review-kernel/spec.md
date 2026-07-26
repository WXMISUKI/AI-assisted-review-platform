## ADDED Requirements

### Requirement: Rule and semantic review gate non-body DOCX content
The agent review kernel SHALL ignore DOCX paragraphs that are marked non-reviewable by structure recovery.

#### Scenario: TOC paragraph contains safety keywords
- **WHEN** a DOCX directory line contains keywords such as `基坑`, `吊装`, or `脚手架`
- **THEN** rule review and semantic review do not generate findings from that TOC paragraph

#### Scenario: Body paragraph contains review risk
- **WHEN** a review-eligible body paragraph contains risk content
- **THEN** downstream rule or semantic review can still generate findings normally
