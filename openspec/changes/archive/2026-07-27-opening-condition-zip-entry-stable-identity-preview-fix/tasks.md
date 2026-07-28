## 1. Backend ZIP Identity

- [x] 1.1 Replace order-only ZIP manifest entry ids with source-object plus normalized-relative-path ids.
- [x] 1.2 Add regression coverage that duplicate basenames in different ZIP folders produce unique, stable entry ids.

## 2. Frontend Document Library

- [x] 2.1 Compose a UI-safe material file id for packet inventory rows using entry/source/path/derived asset facts.
- [x] 2.2 Ensure preview-mode lookup uses the UI-safe id so duplicated legacy entry ids do not select the wrong row.

## 3. Verification And Archive

- [x] 3.1 Run focused TypeScript and opening-condition regression checks.
- [x] 3.2 Archive the completed OpenSpec change after tasks pass.
