# ML-DEVOS-AS-028 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED / WEB-INC-006 LOCAL JOURNAL ARCHITECTURE`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `ec893a99af5564b4510a442f88d6ded6a03d532e`
- file blob: `8d5312dc2e90925cf270985393ef8110a39290a1`

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — PAULO IMPLEMENTATION AUTHORIZATION RECORDED / BUILDER TURN MAY OPEN`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-028 — WEB-INC-006 Local Journal Architecture Sync

RFC:
- `ML-DEVOS-RFC-009`

Product increment:
- `WEB-INC-006 — Journal`

Change class:
- `ARCHITECTURE`

Reviewed proposal base:
- `ec51e08f7ec69b313e661036b6197a0d759dfd9c`

RFC commit:
- `a1a927401d270bb53a8b0a93c121c72ca7208bcc`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

## Repository-grounded context

The Architect independently confirmed:

- WEB-INC-004 is closed by `ML-DEVOS-AS-027` / `ML-DEVOS-ADR-007`;
- current schema has 17 product tables;
- current Worker-first routing is limited to `/admin` and `/admin/*`;
- the accepted project mutation lifecycle already supplies the revision/pointer/stale-write/audit pattern Journal should reuse;
- the accepted media subsystem already supplies immutable revision-scoped media snapshot semantics;
- `WEB-REQ-009` is now defined in `docs/product/PRD.md`;
- no Journal implementation exists yet.

## Findings

### AS28-F001 — PASS — ARCHITECTURE classification is correct

Although journal mutations reuse an existing capability pattern, WEB-INC-006 changes the system architecture by:

- adding three persistent tables;
- adding a new public content type;
- widening Worker-first routing beyond the admin boundary;
- creating the first unauthenticated public Worker → D1 read path.

The stronger architecture route is required.

### AS28-F002 — PASS — table ownership is bounded

RFC-009 permits exactly:

- `journal_entries`;
- `journal_entry_revisions`;
- `journal_media`.

Target product-table count is exactly:

`17 → 20`

No theme table, media table replacement, or unrelated schema is authorized.

### AS28-F003 — PASS — public Worker boundary is explicit and narrow

The current `wrangler.jsonc` Worker-first list is admin-only.

RFC-009 may widen it only for:

- `/api/journal`;
- `/api/journal/*`.

Those routes are public, unauthenticated, read-only, GET-only paths.

No other public request path becomes Worker-first.

This is a deliberate architecture decision rather than an accidental side effect.

### AS28-F004 — PASS — public-read isolation is strong

The public index/detail contract follows only:

`journal_entries.published_revision_id`

and must never:

- fall back to `draft_revision_id`;
- expose draft-only entries;
- expose unpublished entries;
- expose an arbitrary historical revision.

This preserves the core revision/publication invariant.

### AS28-F005 — PASS — WEB-REQ-009 closes the missing public requirement gap

The build plan explicitly required a new stable public requirement before Journal implementation.

`WEB-REQ-009` now owns:

- published-only public reads;
- newest-published-first index ordering;
- immutable-slug detail lookup;
- draft/unpublished non-disclosure.

No implementation may claim Journal public acceptance without proving it.

### AS28-F006 — PASS — body format is deliberately simple and safe

RFC-009 resolves the previously-undecided body format to:

`plain text only`

for this increment.

No Markdown execution, rich text engine, HTML interpolation, or `dangerouslySetInnerHTML` is authorized.

This keeps WEB-INC-006 focused on publication architecture rather than content-renderer security.

### AS28-F007 — PASS — publication timestamp semantics are explicit

`published_at` belongs to the revision and is server-controlled.

The only permitted post-insert revision mutation is:

`published_at: NULL → generated timestamp`

at first publication.

The database must reject all other revision mutation and any second timestamp rewrite.

This creates the chronological ordering signal without making ordinary revision content mutable.

### AS28-F008 — PASS — journal media follows accepted immutable snapshot semantics

`journal_media` is revision-scoped and must mirror the already-accepted `project_media` guarantees:

- active existing media only;
- immutable rows;
- duplicate association prevention;
- duplicate role/order slot prevention;
- omitted edit media inherits source snapshot;
- supplied media fully defines the new revision snapshot.

No public R2 object-serving path is created.

### AS28-F009 — PASS — protected mutation lifecycle reuses accepted controls

Admin Journal routes are bounded to:

- create draft;
- edit draft;
- preview;
- publish;
- unpublish.

No delete, generic write, slug rename, or arbitrary mutation endpoint is authorized.

Mutations remain subject to:

- verified Access identity;
- bounded subject;
- same-origin;
- bounded JSON body;
- server-side validation;
- expected pointer inputs;
- commit-time stale-write protection;
- audit success/failure semantics.

### AS28-F010 — PASS — public and admin routing are separated

The Builder must classify exact public Journal GET routes before the Access-auth admin dispatch.

Public routes must never inherit admin authentication requirements.

Admin routes must never bypass Access because public Journal routing exists.

Tests must cover both directions.

### AS28-F011 — PASS — static Next.js contract is preserved

The public `/journal` route remains a static shell.

It may fetch the public Journal API client-side.

RFC-009 does not authorize:

- SSR conversion;
- server components reading D1 at runtime;
- build-time D1 access;
- replacing the static export deployment model.

### AS28-F012 — PASS — dashboard scope is bounded

The authenticated dashboard may gain Journal lifecycle metadata only.

It must not expose journal body text by default.

This is consistent with the dashboard's status/projection role.

### AS28-F013 — PASS — audit extension is bounded

Only these new audit actions are authorized:

- `journal_create_draft`;
- `journal_edit_draft`;
- `journal_publish`;
- `journal_unpublish`.

No generic Journal audit action family is introduced.

### AS28-F014 — PASS — local resource boundary remains intact

D1 and R2 remain:

`remote: false`

No remote resource, production identifier, credential, public R2 domain, deployment, or cutover is authorized.

CORE-019 real-remote-resource authority is therefore not activated by this local-only build.

### AS28-F015 — PASS — no premature WEB-INC-007 or Sentinel expansion

WEB-INC-006 does not authorize:

- theme/design controls;
- Sentinel S3+;
- CI/rulesets;
- Capability Gateway;
- Task Engine;
- Orchestrator.

### AS28-F016 — PASS — evidence requirements are sufficient

RFC-009 requires direct evidence for:

- migration/table inventory;
- pointer ownership;
- revision immutability;
- one-time publish timestamp;
- media snapshots;
- stale-write protection;
- publish revalidation;
- public non-disclosure;
- routing separation;
- audit behavior;
- dashboard status;
- full tests/build;
- local Wrangler smoke;
- no-remote confirmation.

Builder runtime evidence remains `ACTOR_REPORTED` until Architect review.

## Paulo gate

Paulo explicitly authorized proceeding with the next increment twice after UI-PATCH-001 closure, including the instruction:

`Authorized`

The second authorization was given while WEB-INC-006 was explicitly identified as the active next Journal cycle.

That satisfies the Paulo product/risk gate for the exact bounded RFC-009 implementation scope.

It does not authorize deployment, remote resources, main merge, WEB-INC-007, or Sentinel expansion.

## Verdict

`ML-DEVOS-AS-028: ARCHITECT_APPROVED — WEB-INC-006 LOCAL JOURNAL ARCHITECTURE COMPATIBLE FOR BOUNDED LOCAL/REPOSITORY IMPLEMENTATION`

Claude may be given a Builder turn only after:

- RFC-009 status is updated to `ACCEPTED`;
- D-031 records Paulo's bounded authorization;
- `coordination/STATE.md` explicitly names WEB-INC-006 and keeps all remote/release gates closed.

Because WEB-INC-006 is `ARCHITECTURE`, final accepted implementation requires:

- independent Architect implementation review;
- durable Architect Sync archive;
- post-acceptance ADR.
```
