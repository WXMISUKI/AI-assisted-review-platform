## Context

Mature construction platforms typically make project context, document/submittal registers, package contents, review workflow, status, revision, and audit trail first-class platform facts. Uploaded files are attached to a project or package and then routed for review. AI/OCR/RAG can assist, but they do not own the formal review decision.

This project should follow the same shape:

```text
Project / workspace context
  -> basis attachment published
  -> project master data initialized
  -> subcontract knowledge base bound
  -> checklist and ZIP material packet accepted
  -> ZIP inventory extracted
  -> deterministic matching
  -> human review for uncertainty
  -> auxiliary report archived
```

## Decisions

### 1. Reuse MinIO upload

The portal uploads files through `/api/minio/upload`. The new trial bootstrap API receives only safe object references, not multipart file bytes.

### 2. Bootstrap creates pilot facts, not production tenancy

The first trial uses a single workspace context and creates:

- one published basis version from the uploaded contract/basis object
- small human-approved trial master data records for personnel and equipment authorization gates
- one ready subcontract-team knowledge-base record
- one pilot task initialized through the existing `intake/init` orchestration

This is explicitly a pilot bootstrap, not final multi-tenant organization/RBAC.

### 3. MaxKB proxy binding is safe metadata

When MaxKB provider status is ready and has a default knowledge id, the bootstrap binds a safe provider ref:

```json
{
  "provider": "maxkb",
  "knowledgeId": "...",
  "syncStatus": "ready"
}
```

The provider ref supports recall and readiness only. It does not prove that evidence is correct.

### 4. OCR Worker remains the next handoff

This change prepares the platform task and object refs required for OCR Worker ingestion and retrieval-check, but does not batch-submit every ZIP member to OCR. That should be the next slice once the operator can bootstrap and inspect a real material packet.

## Risks

- The uploaded contract PDF may be large. The existing upload limit is 100MB, which covers the current sample but should be revisited before production.
- Trial master data is an operator-confirmed placeholder. Production should replace it with OCR-assisted extraction and explicit human confirmation.
- ZIP entries are manifest-only in this slice; file-level extraction/OCR remains a later worker concern.

## Non-Goals

- No direct MaxKB administrator login.
- No arbitrary server-local file path ingestion.
- No new database schema or RBAC model.
- No full report DOCX/PDF generation.
