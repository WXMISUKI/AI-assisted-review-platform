## 1. Specification and Planning

- [x] 1.1 Create proposal, design, and delta specs for real single-project trial intake.
- [x] 1.2 Document mature-platform flow alignment and current platform prerequisites/gaps.

## 2. Backend Trial Bootstrap

- [x] 2.1 Add a safe bootstrap orchestrator that creates basis, trial master data, knowledge-base binding, and pilot intake from uploaded object refs.
- [x] 2.2 Expose `POST /api/opening-condition/pilot-tasks/trial-bootstrap`.
- [x] 2.3 Add focused tests for ZIP manifest-backed bootstrap and MaxKB provider refs.

## 3. Frontend Trial Entry

- [x] 3.1 Add typed frontend API for trial bootstrap.
- [x] 3.2 Add a portal panel to upload basis/checklist/ZIP through MinIO and call bootstrap with object refs.
- [x] 3.3 Display bootstrap status, ZIP inventory count, and resulting readiness.

## 4. Verification and Archive

- [x] 4.1 Run lightweight backend checks, focused tests, and typecheck.
- [x] 4.2 Archive the OpenSpec change after validation.
