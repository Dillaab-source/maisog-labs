# ML-DEVOS-RFC-022: V10 Published Content Bridge

Status: `DRAFT` — drafted under `D-104` (planning only). Not reviewed, not accepted, and it grants no implementation authority.

Proposed change class: `ARCHITECTURE`

**Authority:**
- `D-104`: Paulo's authorization of V10 Admin Content Bridge architecture planning and of this draft.
- `ML-DEVOS-AS-130`: the controlling review at drafting time.

**Repository-grounded drafting base:**
- governance `b7d0284c1853eae5887a6fdc6148987c68895345`;
- `main` `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
- homepage artifact SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

**Planning record:** `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`. It holds the full analysis, the evidence and the alternatives. This RFC states the proposed normative contract only.

## 1. Problem

D-093 made the homepage `/` the byte-identical, self-unpacking Design System artifact (`public/index.html`), served asset-first, and removed the React homepage. The admin project, journal and design lifecycles therefore reach nothing public on `/`. Paulo wants to edit recruiter-facing content from `/admin` without redesigning V10, rebuilding the homepage, or deploying for each copy change.

## 2. Decision summary (proposed)

1. **Rule:** code owns the V10 design; admin owns approved content fields. The admin never gains HTML, CSS, JS, selector, asset-path, script, URL (other than a validated email), layout, or structural-count capability.
2. **Mechanism:** an **MLData-seam published-content bridge**.
   - The artifact defines all project, flow, research-note and email data in one embedded `window.MLData` assignment, which runs before its components render.
   - On `GET /` only, the Worker inserts, at a fixed and verified offset in the served response, a JSON data island and a fixed, code-owned hook script. It does so only when a valid published snapshot exists.
   - The hook merges allowlisted published values into `MLData` at assignment time.
3. **The artifact file is never edited.** When nothing is published, or on any failure, the response is byte-identical to the artifact.
4. **Storage reuses the existing D1 revision model:**
   - `project_revisions`, extended by one migration of four nullable V10 columns, with `featured` meaning "on the homepage";
   - `site_settings_revisions`, reused unchanged for the email and future copy.

   No snapshot table and no second CMS.
5. **Lifecycle:**
   - Draft, preview and publish reuse the expected-pointer stale-write guards and the atomic audit.
   - A homepage preview (`/admin/preview/home`, Access-protected) injects draft content.
   - Public reads follow published pointers only.

## 3. Scope tiers

- **Tier 1 (current artifact):** projects, as `PROJ` and `FLOW` together, with 1..5 projects (the orbit has 5 slots) and exactly 4 flow stages each; and the contact email (`EMAIL`).
- **Tier 2 (requires a new Design System artifact from Paulo that reads copy from `MLData`):** the entry intro, navigation labels (fixed destinations), contact heading, description and CTA text, and section captions.
- **Out of scope:**
  - About and CTA buttons (absent from V10; a design change);
  - disciplines (`DISC`), orbit geometry, motion, assets, brand components;
  - `/api/design` wiring;
  - research notes. A Journal → `NOTES` bridge is an optional later increment.

## 4. Normative contracts

### 4.1 Bridge payload (`schemaVersion: 1`)

The payload's keys are:
- `projects[]`: `name` (1..40), `kind` (1..40), `status` (`""` or `"Active"`), `tagline` (1..160), `description` (1..400), `disciplines` (1..6 unique integers, 0..5), `flow` (exactly 4 strings, each 1..60);
- `contact.email` (the existing email rule, ≤ 254).

Rules:
- All text uses the existing `text(max)` rule: trimmed, with no control characters, `<` or `>`.
- Unknown fields are rejected.
- Project names are unique.
- Each group is all-or-nothing, and groups are independent.
- The payload never contains ids, slugs, revisions, timestamps, actors, audit data, drafts, storage keys, media, URLs, HTML or style values.

### 4.2 Injection

- The injected span is exactly `<script type="application/json" id="ml-published">JSON</script><script>HOOK</script>`, inserted immediately before the first `<script>` of the outer document's `<head>`.
- The offset and the artifact length and SHA are build-time constants. On any precondition mismatch, nothing is inserted.
- The JSON escapes `<`, `>`, `&`, U+2028 and U+2029.
- `HOOK` is a code constant, never data-derived.

### 4.3 Hook

- At parse time, the hook reads and parses the island inside `try/catch`.
- It defines a `window.MLData` accessor. On the artifact's assignment, it produces a shallow copy where:
  - `PROJ` and `FLOW` are replaced only if the `projects` group re-validates;
  - `EMAIL` is replaced only if the `contact` group re-validates;
  - every other key is left identity-equal.
- It never throws, never adds keys, and never evaluates data.

### 4.4 Fail-safe

`GET /` returns `env.ASSETS.fetch(request)` untouched on any of the following:
- no published content;
- a D1 error, or a timeout over 250 ms;
- a validation failure;
- a precondition failure;
- any exception.

The outermost handler cannot emit 1101 for `/`.

### 4.5 Routing

- `run_worker_first` gains the exact path `"/"` only. `/` is classified as a public route before the admin authentication check.
- `/admin/preview/home` sits under the existing `/admin/*` protection.
- `/api/site-content` is **not** proposed. It may be added later as a GET-only mirror, if a second consumer appears.

### 4.6 Lifecycle and integrity

- Every mutation carries `expectedPublishedRevisionId` and `expectedDraftRevisionId`. A stale expectation returns 409 with no change.
- A publish that would leave more than 5 featured published projects returns 409.
- Every success writes an audit row atomically. Failure audits are best-effort.
- The actor is `cf-access:<sub>`.

## 5. Migration

`0006` adds nullable `project_revisions` columns:
- `tagline`;
- `status` (CHECK `NULL`, `''` or `'Active'`);
- `disciplines_json`;
- `flow_json`.

The field-by-field justification is in plan §16. No other schema change is proposed for Tier 1.

## 6. Alternatives rejected

- Client fetch of `/api/site-content`: needs an artifact change or injection, and races the first render, so content flashes.
- Rendered-HTML rewriting: there is no rendered copy in the HTML.
- A return to React: prohibited by D-093.
- Build/deploy on publish: edits the served artifact and needs Gate C and Gate D per copy edit.
- Post-render DOM replacement: fragile.

A new artifact with a built-in adapter is complementary, and required for Tier 2.

## 7. Risks

- `/` becomes a Worker-first route, so it now depends on the Worker (mitigated by §4.4).
- The meaning of D-093 "byte-for-byte" for served responses needs an owner decision.
- Production D1 content state is unknown.
- The production admin is non-functional while the Access vars are placeholders.
- Pre-promotion verification must replace version previews (AS-130).
- Content facts conflict: RFC-021 C1 lists 8 projects, but the homepage has at most 5 slots.

## 8. Open owner decisions

Q1–Q5 in plan §22. The key ones:
- Q1: may the served response differ by the bridge span only when content is published?
- Q2: accept `/` as Worker-first?
- Q3: which five projects, and which email?

## 9. Evidence required for future acceptance of an implementation

- Unit and `vm` hook tests for every bound.
- A Worker test proving the byte-identical fallback (SHA) and span-only insertion.
- Playwright render evidence (content shown, no errors, fallback DOM equal to the original, 1440 and 390 px).
- The full existing suite passing.
- CPU measurement of the `/` path.

## 10. Acceptance

Not accepted. This requires independent Architect review and a Paulo decision. Implementation increments CB-1..CB-5 (plan §20) need their own authority.
