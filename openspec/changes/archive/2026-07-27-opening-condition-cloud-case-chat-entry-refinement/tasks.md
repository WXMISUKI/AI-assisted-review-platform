## 1. Simplify The New-Review Home

- [x] 1.1 Replace the default multi-panel opening-condition home JSX with one centered chat-style new-review entry.
- [x] 1.2 Keep completeness/compliance scope selection and existing upload-modal opening behavior inside the centered entry.
- [x] 1.3 Ensure selected task detail and advanced governance content render only after an explicit task/detail navigation action.

## 2. Clean Project Context And Visuals

- [x] 2.1 Remove the duplicate project-name paragraph below the sidebar project selector.
- [x] 2.2 Add responsive styles for the centered entry, scope row, upload prompt, and empty home state using existing theme tokens.
- [x] 2.3 Preserve left history rows, project switching, and task progress indicators without duplicating history in the main home.

## 3. Verification And Archive

- [x] 3.1 Extend opening-condition UI smoke to assert the centered chat entry and absence of the old peer-level home panels.
- [x] 3.2 Run OpenSpec strict validation, `npm run typecheck`, and `npm run smoke:opening-condition:ui`.
- [x] 3.3 Sync the main spec, review the scoped diff, and archive the completed OpenSpec change.
