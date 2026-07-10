## 1. Review Session Domain

- [x] 1.1 Add review task, review session, streaming event, and storage snapshot types.
- [x] 1.2 Move reusable mock task seeds into a domain module without changing existing mock issue content.

## 2. Mock Repository And Service

- [x] 2.1 Add a localStorage-backed mock repository with schema version fallback.
- [x] 2.2 Add review session service operations for listing tasks, creating tasks, starting review, updating stream stage, resolving issues, deleting manual issues, adding manual issues, and completing review.
- [x] 2.3 Ensure processed paragraphs and result assets are generated through the service layer.

## 3. Page Migration

- [x] 3.1 Update `App.tsx` to read and mutate document/task state through the review session service.
- [x] 3.2 Update `ReviewWorkbenchPage.tsx` to receive session paragraphs/issues and emit issue mutations through callbacks.
- [x] 3.3 Preserve existing role mode permissions, streaming mock behavior, completion flow, and result preview navigation.

## 4. Verification And Archive

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Run a browser smoke test for login, create task, start review, resolve issues, complete review, and refresh-persistence behavior.
- [x] 4.3 Validate and archive the OpenSpec change.
