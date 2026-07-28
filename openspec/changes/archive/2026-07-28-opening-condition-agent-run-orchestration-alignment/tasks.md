## 1. Run Task Identity And Refresh

- [x] 1.1 Change the agent upload flow so every new-review bootstrap uses a run-specific task id.
- [x] 1.2 Harden current-run refresh so empty workspaces do not fetch the fallback workspace task id.
- [x] 1.3 Add focused smoke coverage for new upload append behavior and fallback-detail avoidance.

## 2. Checklist Row Identity

- [x] 2.1 Add UI-safe checklist review row ids while preserving backend target ids.
- [x] 2.2 Update review detail selection and decision routing to use UI row ids for navigation and backend ids for task facts.
- [x] 2.3 Add focused smoke coverage that duplicate checklist ids such as `docx-4` do not appear as React keys.

## 3. Basis And Evidence Boundary

- [x] 3.1 Verify and guard that basis objects are not added to packet evidence candidates during trial bootstrap/intake.
- [x] 3.2 Add regression coverage or smoke assertions for the basis-as-context boundary.

## 4. Verification And Archive

- [x] 4.1 Run TypeScript and focused opening-condition tests.
- [x] 4.2 Sync delta specs to main specs and archive the change.
