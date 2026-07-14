# Design

The workbench should store the current human focus, not just the current document location.

When the reviewer changes issue focus:

- store the active issue id.
- store the current paragraph and section context.
- restore those three values on reopen.

This keeps the session useful for refresh recovery without changing the review decision model.
