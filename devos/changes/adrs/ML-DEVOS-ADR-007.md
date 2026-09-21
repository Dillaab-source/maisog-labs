# ADR-007: Adopt the WEB-INC-004 local media subsystem

Status: `ACCEPTED`

Product increment:
- `WEB-INC-004 — Media subsystem`

Related RFC:
- `ML-DEVOS-RFC-007`

Architect Syncs:
- `ML-DEVOS-AS-023` — architecture compatibility / bounded local-only implementation
- `ML-DEVOS-AS-026` — implementation review / remediation requested
- `ML-DEVOS-AS-027` — final remediation acceptance

Paulo decision:
- `D-029`

Implementation:
- initial implementation: `ca6a93b65353968353b9ba3670e162468abdb33a`
- remediation: `681fc90dc42239c2bd5866af1c6a0d430212416a`

Final accepted local/repository state:
- handoff/state commit: `3edfa51b25b8f87757eaac7096e7b2829c81e009`

## Decision

MaisogLabs adopts WEB-INC-004 as the local/repository media architecture.

The accepted subsystem includes:

- `media`
- `project_media`
- local simulated R2 binding `MEDIA`
- authenticated `POST /admin/api/media`
- authenticated `GET /admin/api/media`
- revision-scoped project media snapshots
- inheritance on text-only draft edits
- exact-draft preview media metadata
- append-only media upload audit integration
- compensating R2 delete when the D1 success batch fails

## Media contract

Accepted media uploads are limited to:

- JPEG
- PNG
- WebP

with:

- 5 MiB actual-byte maximum;
- MIME/signature agreement;
- server-generated media ID;
- server-generated storage key;
- bounded normalized alt text;
- immutable public-affecting metadata;
- structural state domain `active|archived`.

No archive API is adopted by this ADR.

## Revision-scoped association contract

`project_media` belongs to `project_revisions.id`.

Historical association rows are immutable.

The database enforces both:

- duplicate-association prevention via `UNIQUE(project_revision_id, media_id, role)`;
- duplicate-slot prevention via `UNIQUE(project_revision_id, role, sort_order)`.

Changing attachments/reordering creates a new revision snapshot rather than editing historical rows.

## Cross-store consistency

R2 and D1 are not treated as a distributed transaction.

Accepted upload sequence:

1. validate;
2. write object to local R2;
3. D1 batch inserts media metadata and success audit;
4. return success only after both succeed.

If D1 fails after the object write, the implementation attempts compensating R2 deletion and returns failure.

A compensating-delete failure may leave an unreferenced object. That object is not represented as successful D1 media state.

## Accepted limitation

`AS27-L001`:

SQLite's built-in default `trim()` is narrower than JavaScript `.trim()` for some non-ASCII/non-space whitespace edge cases.

This is accepted because:
- every authorized media HTTP write is normalized and validated in JS before D1;
- the DB independently rejects empty, ASCII-space-only, untrimmed-ASCII-space, and over-limit values;
- no direct-SQL media mutation capability exists;
- future direct-DB writers must revisit this limitation.

## Public boundary

The public website continues to use the existing static content source.

This ADR does not create:
- public R2 serving;
- public D1 reads;
- public media route;
- public bucket/custom domain;
- public cutover.

## Resource boundary

Accepted resource use is local only.

Not authorized/adopted by this ADR:

- real/remote R2;
- remote D1;
- `remote: true`;
- production resource provisioning;
- deployment;
- protected/main merge.

## Sentinel impact

No Sentinel architecture or governance version change.

Frozen Sentinel architecture remains:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline remains:
- `v1.5.0`

No S3+ runtime/enforcement subsystem is implemented.

## Supersession

Supersedes: none.

Superseded by: none as of acceptance.
