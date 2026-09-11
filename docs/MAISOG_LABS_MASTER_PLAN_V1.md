# Maisog Labs Master Plan V1

Status: APPROVED ARCHITECTURAL BASELINE — IMPLEMENTATION NOT YET PRODUCTION-APPROVED
Owner identity: `paulo@maisoglabs.com`
Branch: `master-plan-v1`

## 1. Purpose

This document is the architectural and security contract for the next evolution of Maisog Labs. It governs the public site, admin portal, API, D1 data, R2 media, and future MCP access.

The priority order is:

1. Security and recoverability.
2. Correct authorization boundaries.
3. Simple architecture with minimal moving parts.
4. Human-controlled publishing.
5. Agent/MCP access only after the underlying application is secure without AI.

## 2. Core architecture

```text
Public visitor
    |
    v
maisoglabs.com
    |
    +--> public site / public read API --> published content only

Paulo
    |
    v
Cloudflare Access
    |
    v
/admin + /api/admin/*
    |
    v
Worker authorization/service layer
    |                |
    v                v
D1: maisog-cms      R2: maisog-media

ChatGPT / Claude / Codex
    |
    v
OAuth-authenticated remote MCP
    |
    v
MCP gateway
    |
    v
same authorization/service layer
    |
    +--> D1 / R2
```

The website, admin UI, REST API, and MCP are interfaces. Business rules and authorization belong in deterministic server-side code.

## 3. Canonical names

- Domain: `maisoglabs.com`
- Canonical administrator identity: `paulo@maisoglabs.com`
- D1 database: `maisog-cms`
- D1 binding: `DB`
- R2 bucket: `maisog-media`
- R2 binding: `MEDIA`
- Worker/project: `maisog-labs`
- Planned MCP endpoint: `mcp.maisoglabs.com/mcp`

## 4. Security invariants

These rules are non-negotiable unless superseded by a later approved Master Plan version.

1. Cloudflare Access is the first admin access boundary, but the Worker must independently validate the authenticated identity.
2. The server must derive identity from validated authentication. Client-provided email fields, headers not cryptographically trusted, prompt content, and tool arguments never establish identity.
3. The canonical admin authorization check is against `paulo@maisoglabs.com`.
4. Production mutations require MFA before being enabled.
5. All state-changing operations use POST/PATCH/DELETE; never GET.
6. Browser mutation endpoints require same-origin/CSRF defenses in addition to authentication.
7. D1 queries containing variable data use prepared statements and bound values.
8. R2 remains private by default. Browser or AI clients do not receive storage administrator credentials.
9. Uploaded media is validated server-side for size, allowed format, file signature/decodability where feasible, and safe generated object keys. SVG is rejected in V1 unless a dedicated sanitizer is introduced.
10. Draft content is separate from published content. Editing never makes content public automatically.
11. Publishing is an explicit server-side action. Published D1 changes must be transactional where applicable.
12. D1 and R2 are separate systems; no design may assume a single atomic transaction across both. Failed multi-system operations require compensating cleanup or reconciliation.
13. Secrets never live in browser code, Git-tracked environment files, D1 content, audit logs, prompts, or MCP tool arguments.
14. Public APIs expose published public fields only; they never expose drafts, admin fields, tokens, or secrets.
15. AI/MCP permissions are narrower than human admin permissions. V1 agents may read and create/edit drafts but may not autonomously publish, alter auth policy, execute raw SQL, run arbitrary code, or administer infrastructure.
16. Authorization is deterministic code. Prompts and model reasoning never decide whether an operation is permitted.
17. Sensitive mutations generate audit events without logging tokens, secrets, or full authorization headers.
18. Production writes remain disabled until the security gates in this document pass.

## 5. Data ownership

### D1 — `maisog-cms`

D1 stores structured application state:

- `site_content`
- `projects`
- `media` metadata
- `admin_events`

The initial content model keeps draft and published values separate.

### R2 — `maisog-media`

R2 stores binary media such as project images and portfolio assets. D1 stores the metadata/reference, not the image bytes.

## 6. Draft and publish flow

```text
EDIT
  |
  v
DRAFT
  |
  v
PREVIEW
  |
  v
HUMAN REVIEW
  |
  v
PUBLISH
  |
  v
PUBLIC
```

For media, the object must exist successfully before published content may reference it. If R2 succeeds and D1 metadata fails, the implementation must clean up or reconcile the orphan object.

## 7. Shared service layer

Admin API, public API, and MCP must reuse the same domain/service logic rather than implement parallel business rules.

Planned internal responsibilities:

- AuthorizationService
- ContentService
- ProjectService
- MediaService
- PublishingService
- AuditService

## 8. Admin API target

Initial route contract:

- `GET /api/admin/me`
- `GET /api/admin/site`
- `PATCH /api/admin/site`
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `GET /api/admin/projects/:id`
- `PATCH /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `POST /api/admin/media`
- `DELETE /api/admin/media/:id`
- `POST /api/admin/publish`
- `GET /api/admin/events`

No write route may be enabled until authentication, authorization, validation, CSRF/origin controls, request limits, and audit behavior are tested.

## 9. Public API target

Public routes are read-only and return published data only, for example:

- `GET /api/public/site`
- `GET /api/public/projects`
- `GET /api/public/projects/:slug`

## 10. MCP V1 target

Use remote MCP over current supported Streamable HTTP with OAuth-based authentication. Prefer stateless request handling unless a demonstrated requirement needs durable session state.

Initial tool class:

- read site/project data
- create project draft
- update project draft
- list media
- upload approved media
- read activity relevant to the caller

Explicitly prohibited in MCP V1:

- raw SQL execution
- arbitrary R2 operations
- arbitrary code/shell execution
- authentication/Access policy administration
- database destruction
- autonomous production publishing

Human review remains the publication gate.

## 11. Deployment direction

The current repository remains a static Next.js export. The planned evolution is to use Cloudflare Workers Static Assets plus Worker API functionality, while retaining static rendering where possible.

Do not convert the whole application to server-side rendering merely to add the API. Document and approve any future hosting-model change first.

## 12. Dependency and secret hygiene gates

Before backend implementation is production-eligible:

- update framework/runtime dependencies to reviewed patched releases
- commit a package lockfile
- use reproducible installs (`npm ci`) in controlled builds
- ignore `.dev.vars` and `.dev.vars.*`
- scan the repository for accidentally committed secrets before adding real credentials
- use Cloudflare Secrets for sensitive runtime values

## 13. Environments

Target separation:

- Local development
- Preview/Staging
- Production

Production D1/R2 must not be used as routine development storage.

## 14. Recovery

Recovery layers:

- Code rollback: Git commits / branch / previous production deployment
- D1 emergency recovery: D1 recovery capabilities such as point-in-time recovery when available/configured by the platform
- Content recovery: revision/restore functionality can be added later, but current publishing must preserve drafts and audit events
- Media recovery: private R2 plus a documented deletion/retention policy before destructive media cleanup is enabled

## 15. Implementation sequence and stop gates

### Phase 0 — Governance and documentation
Safe to do without live Cloudflare access.

- Create this Master Plan.
- Create a versioned change log.
- Add secret-file ignore patterns.
- Keep production and `main` untouched.
- Record known architecture drift instead of changing runtime behavior prematurely.

### Phase 1 — Identity boundary
Requires Cloudflare access and a controlled test environment.

- Verify Access application routes.
- Verify allow rule for exactly `paulo@maisoglabs.com`.
- Require MFA before production mutations.
- Obtain/verify Access application audience and issuer/team-domain configuration.
- Implement `GET /api/admin/me` only.
- Validate token signature, issuer, audience, expiry, and exact authorized email.
- Test unauthorized, expired, wrong-audience, and forged identity attempts.

STOP GATE: no D1 writes until Phase 1 passes.

### Phase 2 — Data foundation

- Create/bind staging D1 `maisog-cms` equivalent.
- Add migrations for `site_content`, `projects`, `media`, and `admin_events`.
- Use prepared statements exclusively for variable SQL.
- Test migration and rollback/recovery procedure.

STOP GATE: no production migration until staging schema tests pass.

### Phase 3 — Protected service/API layer

- Implement authorization middleware/service.
- Implement validation and request-size limits.
- Implement same-origin/CSRF protections and strict CORS policy.
- Implement audit-event helper.
- Add site/project draft endpoints.

STOP GATE: no production writes until adversarial API tests pass.

### Phase 4 — Media foundation

- Create/bind staging R2 `maisog-media` equivalent.
- Keep bucket private.
- Implement validated image upload.
- Add safe generated object keys.
- Handle R2/D1 partial-failure cleanup.

STOP GATE: no public media publishing until upload abuse tests pass.

### Phase 5 — Admin CMS integration

- Connect current Admin V1 UI to protected APIs.
- Preserve draft/preview behavior.
- Verify mobile/desktop UI.
- Keep publish disabled until Phase 6.

### Phase 6 — Human-controlled publishing

- Implement explicit publish operation.
- Use transactional D1 operations for D1 state changes.
- Ensure published content only references existing approved media.
- Record publish audit events.
- Test failure and rollback paths.

### Phase 7 — Hardening and production approval

Adversarial test set includes at minimum:

- no authentication token
- forged identity header
- forged/invalid JWT
- wrong audience
- expired JWT
- cross-site mutation attempt
- disallowed CORS origin
- SQL injection payloads
- stored-XSS payloads
- unsupported file type
- MIME/file-signature mismatch
- oversized upload
- draft data requested through public routes
- authorization bypass attempts
- request flooding/rate-limit behavior
- R2/D1 partial failure

STOP GATE: production CMS writes only after this phase passes.

### Phase 8 — MCP read-only

- Add OAuth-authenticated remote MCP endpoint.
- Reuse the same authorization/service layer.
- Start with read-only tools/resources.

### Phase 9 — MCP draft-write

- Add narrowly scoped draft creation/editing and approved-media upload.
- Preserve human publication gate.
- Test prompt injection and tool-abuse scenarios.

### Phase 10 — Future capabilities

Anything broader — autonomous publishing, team roles, scheduled publishing, broader agent permissions, multi-user tenancy, raw infrastructure control — requires a new architecture/security review and a logged Master Plan version change.

## 16. Change-control rule

Every approved architectural/security change must be logged in `docs/MASTER_PLAN_CHANGELOG.md` before or with implementation.

Each entry records:

- version
- date
- change ID
- proposal/change
- reason
- security impact
- compatibility impact
- implementation status
- rollback/reversal note
- approval state

Version convention:

- `V1.x` — compatible refinement or implementation decision within the V1 architecture
- `V2.0` — breaking trust-boundary, deployment-model, identity-model, or major data-architecture change

No silent architectural changes.

## 17. Current implementation status

Verified from repository state at creation of this plan:

- Public site exists as static Next.js export.
- `main` does not contain the Admin V1 route.
- `admin-v1` contains a preview-only admin UI and documentation; persistence/security backend is not yet implemented.
- Current Wrangler configuration serves static `./out` assets and has no D1 or R2 bindings yet.
- Real Cloudflare Access configuration, MFA state, D1/R2 resources, and live Worker bindings must be verified from the Cloudflare account before being treated as facts.

## 18. Approval rule

AI may propose and implement changes on non-production branches, but AI-generated code is not self-approving.

Production promotion requires:

1. documented change
2. technical validation
3. security validation for security-relevant changes
4. explicit owner approval where required
5. rollback path

Security outranks convenience.