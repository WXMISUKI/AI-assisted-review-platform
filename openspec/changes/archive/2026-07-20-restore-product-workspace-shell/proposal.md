## Why

The current opening-condition pilot controls have drifted into a demo-like single page, which weakens the enterprise product boundary between construction-plan review and opening-condition review. We need to restore the platform information architecture before continuing deeper MaxKB/OCR integration.

## What Changes

- Rename the shared login entry to "AI资料审查平台".
- Preserve the authenticated business selection portal as the only place where users choose between product workspaces.
- Restore opening-condition review as its own workspace shell with a left navigation and one focused business page at a time.
- Move trial bootstrap, ZIP/material intake, readiness, and matching controls under the opening-condition "资料接入" workflow page instead of showing them on the product overview.
- Keep construction-plan review as an independent product workspace and do not embed opening-condition pages into it.
- Add a MaxKB cooperation requirements document that clarifies ZIP/material packet responsibility boundaries between the front platform, OCR Worker / MaxKB Provider Proxy, and MaxKB.

## Capabilities

### New Capabilities
- `maxkb-material-packet-coordination`: Defines how the platform and MaxKB-side provider proxy cooperate for ZIP/material packets, file classification, OCR ingestion, retrieval checks, and safe provider references.

### Modified Capabilities
- `platform-shell`: The shared login and shell flow must use the AI资料审查平台 entry, product launcher, and product-specific workspaces rather than direct mixed demo screens.
- `product-portal-boundary`: Product portals must remain independently navigated and visually separated while reusing shared OCR, object storage, LLM, and knowledge provider services.
- `opening-condition-single-project-trial-intake`: Trial intake UI must appear as a focused opening-condition "资料接入" workflow page and remain operator-triggered.

## Impact

- Affected frontend: `src/App.tsx`, `src/appShellPages.tsx`, `src/appShellTypes.ts`, `src/domain/productPortal.ts`, `src/styles.css`.
- Affected docs: MaxKB/material packet coordination documentation under `docs/`.
- No backend API shape changes are required in this slice unless implementation reveals a missing frontend contract.
- No new provider secrets are required.
