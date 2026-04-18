# Grader API

Phase 0 stub. See `BLUEPRINT.md` section "Shared interfaces" for the authoritative request and response schemas for:

- `POST /api/v1/grader/generate`
- `POST /api/v1/grader/submit`
- `GET /api/v1/tasks/<hash>`
- `POST /api/v1/deliverables`

Phase 2 backfills this file with concrete examples, error codes, and worked curl commands once the endpoints land.

## Implemented today

- `GET /healthz`: returns `{"ok": true}`. Used by the skill and deploy scripts to detect a running grader.
