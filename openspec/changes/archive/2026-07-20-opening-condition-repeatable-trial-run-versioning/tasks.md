## 1. Regression Guard

- [x] 1.1 Add a backend regression test proving archived pilot tasks still reject reinitialization with the same task id.

## 2. Frontend Run Tracking

- [x] 2.1 Track the current opening-condition pilot run id through returned backend task state.
- [x] 2.2 Update refresh and knowledge-base binding actions to use the current run id when present.
- [x] 2.3 Update real-file bootstrap to generate a run-specific task id when the current task is archived.

## 3. Operator Documentation

- [x] 3.1 Update the single-project trial runbook with repeat-run behavior after archive.

## 4. Verification And Archive

- [x] 4.1 Run targeted backend test and TypeScript typecheck.
- [x] 4.2 Validate and archive the OpenSpec change after implementation.
