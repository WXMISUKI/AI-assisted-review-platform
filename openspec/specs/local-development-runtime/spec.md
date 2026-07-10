# local-development-runtime Specification

## Purpose
TBD - created by archiving change dev-command-starts-frontend-and-backend. Update Purpose after archive.
## Requirements
### Requirement: Full-stack local dev command
The project SHALL provide a default local development command that starts both the frontend and backend required by proxied API workflows.

#### Scenario: Developer starts the platform
- **WHEN** a developer runs `pnpm dev`
- **THEN** the backend BFF listens on the configured backend port and the Vite frontend starts with `/api` proxy support

### Requirement: Split local dev commands
The project SHALL keep separate frontend-only and backend-only commands for focused debugging.

#### Scenario: Developer starts only the frontend
- **WHEN** a developer runs the frontend-only command
- **THEN** only the Vite frontend starts and proxied API calls still require a separately running backend

#### Scenario: Developer starts only the backend
- **WHEN** a developer runs the backend-only command
- **THEN** only the local backend BFF starts

