## Context

Research captured in `docs/opening-condition-platform-benchmark-2026-07-22.md` shows that mature platforms emphasize versioned review context, clear public statuses, next-action ownership, and historical traceability. The project `DESIGN.md` also positions the product as an enterprise review workbench rather than a marketing or chat-first interface.

The current overview already has enough data to serve this purpose, including workspace metadata, project/review-object catalog, readiness, run state, and responsibility ownership. The issue is presentation: several labels are unreadable, and the page does not yet organize the information like a production handoff surface.

## Goals / Non-Goals

**Goals:**

- Make the overview answer: Which project? Which review object? Which participating entity? Which run? What is the next action?
- Keep the page high-density and utilitarian, similar to mature engineering review platforms.
- Route the user to the correct workflow page instead of exposing repeated controls on the overview.
- Use existing semantic tokens and local CSS classes; avoid a global visual rewrite.

**Non-Goals:**

- Do not add multi-tenant permissions.
- Do not add new backend endpoints or database tables.
- Do not redesign every opening-condition page.
- Do not copy any third-party brand, logo, or exact visual asset.

## Decisions

### 1. Overview as command context, not operation console

The overview should orient the operator and route to the next step. Upload, matching, human review, and report mutation actions stay in their dedicated workflow pages.

### 2. Object hierarchy as first-class UI

The three domain layers `project -> review object -> participating entity` should be visible as separate context blocks. This aligns with the previously defined object model and prepares the platform for later multi-project management without implementing full permissions now.

### 3. Mature-platform style means workflow clarity

Hallmark and the benchmark notes point to a restrained, dense, auditable UI. This change uses structured panels, compact record rows, and explicit state chips rather than decorative visuals.

## Risks / Trade-offs

- [Only overview is improved] -> This is intentional; it removes the most visible entry-page friction without expanding scope.
- [Some older labels may remain elsewhere] -> Future changes can continue page-by-page cleanup.
- [No full project management yet] -> The UI prepares the hierarchy but still uses existing workspace data.
