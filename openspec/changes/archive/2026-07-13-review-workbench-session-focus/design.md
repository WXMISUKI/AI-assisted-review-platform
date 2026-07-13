# Design

The workbench should reopen at the same cognitive spot the reviewer was using before refresh:

1. Restore the active paragraph and section from the session snapshot.
2. Choose an issue anchored to that paragraph when one exists.
3. Fall back to the section's first issue or the first available issue when no anchor match exists.

This keeps the reopened workbench anchored without introducing new state surfaces.
