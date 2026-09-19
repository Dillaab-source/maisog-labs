# ML-DEVOS-AS-029 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED / WEB-INC-006 JOURNAL ACCEPTED`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `943b7d0714bdcb7ea718cb3ad6ef3d05e4e78285`
- file blob: `dd6ed1436c1d1b46b34e6c9f2541306d6a05a4f9`

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — WEB-INC-006 JOURNAL ACCEPTED`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-029 — WEB-INC-006 Final Implementation Review

Cycle:
- `MAISOGLABS-WEB-INC-006-JOURNAL`

Authority chain:
- `WEB-REQ-009 → ML-DEVOS-RFC-009 → ML-DEVOS-AS-028 → D-031`

Implementation base:
- `28039221fc2b6fede35cee7ce02ff76be3dbcea0`

Builder implementation:
- `cdc8f84cbdb2c5a76336512b6c0e5111030d3e4e`

Builder handoff/state:
- `5f4d07efdd5714de8c44225998a4d9c052888069`

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.5.0`

## Independent review

The Architect independently:

1. live-checked branch HEAD, STATE, and IMPLEMENTER_HANDOFF;
2. separated the single implementation commit from the bookkeeping commit;
3. inspected migration 0004;
4. inspected Journal D1 mutation helpers;
5. inspected protected admin Journal dispatch;
6. inspected public Journal SQL and route dispatch;
7. inspected Worker auth/public-routing separation;
8. inspected Wrangler Worker-first route expansion;
9. inspected the static `/journal` shell/client;
10. inspected validation/media/dashboard/schema integration;
11. inspected focused test source for pointer ownership, immutable revision/media behavior, stale writes, public draft non-disclosure, and publish-time media revalidation.

Builder runtime/test/visual/CLI results remain `ACTOR_REPORTED`.

## Findings

### AS29-F001 — PASS — implementation commit is bounded

Implementation commit `cdc8f84...` contains the Journal subsystem and its tests/presentation only.

Bookkeeping commit `5f4d07e...` contains coordination handoff/state only.

No deployment or main merge is present.

### AS29-F002 — PASS — schema target is exactly the authorized three-table addition

Migration 0004 adds exactly:

- `journal_entries`;
- `journal_entry_revisions`;
- `journal_media`.

The schema helper preserves prior frozen exports and adds a separate full-schema path targeting 20 product tables.

No prior migration was modified by the implementation compare.

### AS29-F003 — PASS — pointer ownership is database-enforced

`journal_entries` uses composite foreign keys so:

- `published_revision_id`;
- `draft_revision_id`

can reference only revisions belonging to the same journal entry.

This prevents cross-entry pointer corruption.

### AS29-F004 — PASS — journal revision content is immutable with a narrow publish transition

The database rejects ordinary UPDATE and DELETE of `journal_entry_revisions`.

The only accepted post-insert transition is:

`published_at: NULL → non-null`

while all other revision fields remain unchanged.

Application publish generates the timestamp server-side.

A second timestamp rewrite is rejected.

### AS29-F005 — PASS — journal media is a revision-scoped immutable snapshot

`journal_media`:

- belongs to `journal_entry_revisions.id`;
- references existing `media.id`;
- enforces role `cover|gallery`;
- rejects duplicate association;
- rejects duplicate role/order slot;
- rejects UPDATE;
- rejects DELETE.

Admin create/edit validates referenced media as active before constructing the snapshot.

### AS29-F006 — PASS — create/edit lifecycle preserves immutable history

Create inserts:

- base entity;
- revision 1;
- optional media snapshot;
- draft pointer;
- success audit

in one batch.

Edit creates a new revision.

When media is omitted, the source revision snapshot is inherited.

When supplied, the supplied media list becomes the complete new snapshot.

Prior revisions and prior journal_media rows are not rewritten.

### AS29-F007 — PASS — stale-write protection is retained

Journal mutation reuses the accepted commit-time stale-pointer guard technique.

Focused interleaving test source reproduces the same class of race already addressed for projects.

No last-write-wins behavior is intentionally introduced.

### AS29-F008 — PASS — publish revalidates persisted content and media

Before pointer promotion the handler:

- re-reads the exact draft revision;
- re-runs full Journal content validation;
- reads the exact draft media snapshot;
- verifies all referenced media still exist and remain active.

Only after those checks does it execute the atomic publish batch.

### AS29-F009 — PASS — public reads follow the published pointer only

Public index SQL joins:

`journal_entries.published_revision_id → journal_entry_revisions.id`

with ownership correlation to the same entry.

Public detail first resolves the entry's current published pointer and then reads exactly that owned revision.

Neither query reads or falls back to `draft_revision_id`.

Draft-only, unpublished, and superseding-draft content therefore have no authorized public read path.

### AS29-F010 — PASS — public index ordering is deterministic

Index ordering is:

`published_at DESC, revision_id DESC`

which provides newest-published-first behavior plus a deterministic tie-break.

### AS29-F011 — PASS — public response projection is bounded

Public index/detail select and return positive allowlists.

Journal media projection contains only:

- id;
- content type;
- alt text;
- role;
- order.

No storage key, uploaded-by identity, draft pointer, audit data, or binding/resource information is selected for the public projection.

### AS29-F012 — PASS — public/admin routing separation is structural

`worker/auth.mjs` classifies only:

- `/api/journal`;
- `/api/journal/*`

into the public dispatch before Access verification.

All `/admin/*` paths continue through the existing Access verification flow.

Public Journal dispatch itself recognizes only the root and one-slug detail shape and rejects unsupported methods before D1 access.

### AS29-F013 — PASS — Worker-first expansion is exact

`wrangler.jsonc` expands Worker-first paths only to:

- `/api/journal`;
- `/api/journal/*`.

No other public path was added.

D1/R2 bindings remain explicitly `remote: false`.

### AS29-F014 — PASS — static export contract is preserved

`app/journal/page.js` remains a static shell.

It reads only existing static site content for branding.

The client component fetches Journal API data at runtime.

No D1 module is imported by the Next.js page.

No SSR conversion or build-time D1 access was introduced.

### AS29-F015 — PASS — body rendering is plain text

Journal body validation normalizes line endings, rejects control/angle-bracket input outside allowed plain-text characters, and bounds length.

The client renders the body as normal React text content.

No `dangerouslySetInnerHTML`, Markdown interpreter, or rich-text executor is introduced.

### AS29-F016 — PASS — dashboard Journal projection is bounded

The dashboard reads Journal lifecycle metadata and labels only.

Summary/body are not selected by the Journal dashboard query and therefore cannot leak through that projection.

### AS29-F017 — PASS — audit integration stays fixed at Journal call sites

The Journal implementation uses exactly these new action literals:

- `journal_create_draft`;
- `journal_edit_draft`;
- `journal_publish`;
- `journal_unpublish`.

Success audits are included in mutation batches; bounded failure paths use the existing append-only failure audit mechanism.

No caller-controlled audit action is exposed.

### AS29-L001 — ACCEPTED LIMITATION — base-row immutable metadata is application-enforced, not independently frozen by a new DB trigger

RFC-009 describes Journal `id`, `slug`, and `created_at` as identity/immutable metadata.

The authorized HTTP surface contains no rename/update path for those fields, and all normal Journal mutations preserve them.

The D1 table does not add a separate trigger preventing a hypothetical direct SQL UPDATE of those base metadata columns.

This is accepted because:

- no direct-SQL Journal mutation capability exists;
- remote D1 remains unauthorized;
- the accepted commit-time stale guard deliberately uses a self-assignment of `slug`, so naively adding an `UPDATE OF slug` rejection trigger would break the existing race-protection technique;
- the same stale-guard coupling is already an accepted limitation pattern from WEB-INC-003.

A future schema/CAS redesign or direct-DB writer must revisit this.

### AS29-L002 — ACCEPTED CLARIFICATION — audit substrate has bounded-name validation, not a global literal action enum

RFC-009 used “audit action allowlist” language.

The previously accepted audit substrate validates action names structurally rather than maintaining a central literal enum.

WEB-INC-006 still satisfies the authority intent because Journal call sites hardcode exactly the four authorized Journal action names and accept no action string from the HTTP request.

No generic Journal audit capability was introduced.

### AS29-L003 — ACCEPTED LIMITATION — direct SQL could supply an arbitrary non-null first published_at value

The application generates `published_at` server-side and the admin request cannot supply it.

The DB trigger enforces the one-time NULL→non-null transition and prevents later rewrites, but it does not independently validate ISO timestamp syntax for a hypothetical direct SQL writer.

This is accepted for the current local-only architecture because no direct DB writer is authorized.

If direct DB mutation or remote operational tooling is later introduced, timestamp-shape enforcement must be revisited.

### AS29-F018 — ACCEPTED ACTOR_REPORTED evidence

Claude reports:

- admin Journal suite: `44/44`;
- public Journal suite: `16/16`;
- full suite: `269/269`;
- `npm run build`: success;
- static routes include `/journal`;
- fresh local migrations produce exactly 20 product tables;
- local Wrangler smoke verifies public/admin route separation;
- screenshot verification of Journal index/detail;
- dry-run binding set unchanged;
- no remote D1/R2;
- no deployment;
- no main merge.

These claims remain `ACTOR_REPORTED`.

For this local/repository architecture increment, independent source/diff inspection plus the reported deterministic/local evidence is sufficient under CORE-020.

## Final verdict

`ML-DEVOS-AS-029: ARCHITECT_APPROVED — WEB-INC-006 LOCAL JOURNAL SUBSYSTEM ACCEPTED`

`WEB-REQ-009` is implemented at repository/local level.

No production/remote verification is claimed.

## Post-acceptance requirement

Because WEB-INC-006 is `ARCHITECTURE`, record a durable ADR before final cycle closure.

No authority is created for:

- remote D1/R2;
- deployment;
- protected/main merge;
- WEB-INC-007;
- Sentinel S3+.
```
