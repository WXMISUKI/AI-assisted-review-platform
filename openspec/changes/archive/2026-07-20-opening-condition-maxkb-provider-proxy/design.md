## Context

The external team has exposed an OCR Worker / MaxKB Provider Proxy at a network endpoint reachable by this platform. The proxy provides:

- `GET /api/health`
- `GET /api/knowledge-base/provider/status`
- `POST /api/knowledge/:knowledgeId/search`

The platform must not connect directly to the MaxKB container, and must not store MaxKB administrator username/password. It should hold only a server-side Bearer token configured as `MAXKB_API_KEY`.

## Decisions

### 1. Proxy as MaxKB provider boundary

The platform adapter treats `MAXKB_BASE_URL` as the Worker/Proxy base URL. `MAXKB_RETRIEVAL_PATH` and `MAXKB_STATUS_PATH` are proxy paths, even though the provider type exposed to the rest of the platform remains `maxkb`.

### 2. Readiness normalization

The adapter prefers `MAXKB_STATUS_PATH` for readiness. If status is not configured, it falls back to `MAXKB_HEALTH_PATH`.

The normalizer accepts both payload shapes:

```json
{"provider":"maxkb","ready":true,"status":"ready"}
```

and:

```json
{"providers":{"maxkb":{"provider":"maxkb","ready":true,"status":"ready"}}}
```

Only safe fields such as configured, ready, status, summary, workspaceId, defaultKnowledgeId, and capability booleans are surfaced.

### 3. Credential ownership

`MAXKB_API_KEY` is the platform-to-proxy Bearer key. `MAXKB_USERNAME` and `MAXKB_PASSWORD` are legacy/backward-compatible fields but are no longer recommended for this platform. Direct MaxKB credentials should live only in the Worker/Proxy deployment.

## Risks

- The proxy search response shape may evolve. The platform keeps retrieval hit normalization defensive and safe.
- Live network availability is outside this repository's test boundary. Unit tests cover payload normalization; live verification can be run manually against the provided endpoint.

## Non-Goals

- No direct MaxKB administrator login from this platform.
- No full evidence-to-MaxKB ingestion workflow in this change.
- No new upload channel or multi-tenant permission model.
