# Change Proposal

This change reduces `src/App.tsx` by extracting page-level UI and shared display helpers into dedicated modules.

The current app shell has grown to include login, document library, review loading, result preview, data assets, knowledge base, and helper formatting logic in one file. This refactor keeps behavior unchanged while improving maintainability and making future workflow changes safer.

The intended outcome is:

- `App.tsx` keeps shell orchestration and navigation state
- page-level UI lives in dedicated component files
- shared labels and lifecycle formatting move into a reusable display helper module
- review workbench stays in its own file
