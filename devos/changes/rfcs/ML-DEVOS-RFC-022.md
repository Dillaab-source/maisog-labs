# ML-DEVOS-RFC-022: V10 Published Content Bridge

Status: See `devos/changes/rfcs/README.md` for the current lifecycle projection; Decisions and ADRs remain authoritative.

Proposed change class: `ARCHITECTURE`

**Authority:**
- `D-104`: planning and this draft.
- `ML-DEVOS-AS-131`: plan acceptance; the D-093 served-byte finding; Tier 1 scope; the twelve acceptance tests.
- `D-105`: Paulo's decisions Q1–Q5, including the bounded D-093 amendment, and authority for this amendment only.

**Repository-grounded base:**
- governance `678f038181665159781cf308664c8f48c16f16b1` (D-105);
- `main` `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`;
- homepage artifact SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

**Planning record:** `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`, accepted as the planning basis by AS-131. Where this RFC and the plan differ, this RFC governs, because it incorporates D-105 and AS-131.

## 1. Problem

D-093 made the homepage `/` the byte-identical, self-unpacking Design System artifact (`public/index.html`), served asset-first, and removed the React homepage. The admin project, journal and design lifecycles therefore reach nothing public on `/`. Paulo wants to edit recruiter-facing content from `/admin` without redesigning V10, rebuilding the homepage, or deploying for each copy change.

## 2. Decision summary

1. **Rule:** code owns the V10 design; admin owns approved content fields. The admin never gains HTML, CSS, JS, selector, asset-path, script, URL (other than a validated email), layout, or structural-count capability.
2. **Mechanism:** an **MLData-seam published-content bridge**.
   - The artifact defines its project, flow, research-note and email data in one embedded `window.MLData` assignment, which runs before its components render.
   - On exact `GET /` only, the Worker inserts, at a fixed and verified offset in the served response, a JSON data island and a fixed, code-owned hook script. It does so only when valid published content exists.
   - The hook merges allowlisted published values into `MLData` at assignment time, before the first render.
3. **The artifact file is never edited** (§3, D-105 Q1). When nothing is published, or on any application-level failure, the response is byte-identical to the artifact.
4. **Storage reuses the existing D1 revision model:**
   - `project_revisions`, extended by one migration of four nullable V10 columns, with `featured` meaning "on the homepage";
   - `site_settings_revisions`, reused unchanged for the email.

   No second CMS and no homepage snapshot table (AS-131).
5. **Lifecycle:**
   - Draft, preview and publish reuse the expected-pointer stale-write guards and the atomic, append-only audit.
   - A homepage preview (`/admin/preview/home`, under the existing `/admin/*` protection) injects draft content.
   - Public `/` reads published pointers only.

## 3. D-093 amendment (D-105 Q1)

This RFC relies on, and does not itself grant, the owner amendment recorded in D-105:

- **Preserved:** `public/index.html` is immutable, and byte-identical to the approved artifact (SHA-256 `2417f7e5…9f9`). The artifact-hash tests in `tests/homepage-artifact.test.mjs` remain in force.
- **Superseded, narrowly:** the requirement that every successful public `/` response always equal the artifact byte-for-byte (`DIR-WEB-HOMEPAGE-ARTIFACT-0001`; the D-093 local-runtime evidence).
- **Replacement rule:** the served `/` response may differ from the artifact **only** by the RFC-022 bridge span (§5.2), and **only** when validated published content exists. Otherwise it is byte-identical.
- `docs/product/HOMEPAGE_ARTIFACT_CONTRACT.md` is updated to state this rule in the implementation increment that wires `/` (CB-5), not before.

## 4. Scope

**Tier 1 (this RFC):**
- homepage projects: 1..5 featured projects, each with exactly 4 flow stages (`PROJ` and `FLOW` together);
- the contact email (`EMAIL`).

**Initial homepage content (D-105 Q3).**
- Projects, in order:
  1. ClinicFlow
  2. Eternal Eggs
  3. Sentinel / DevOS
  4. SU
  5. Maisog Kilat

  Maisog Guild is not in the initial homepage set.
- **Email:** `paulo.maisog@maisoglabs.com` is preferred, once its deliverability is confirmed. Until then the currently verified working address is retained.
- These are owner facts entered through the admin lifecycle after implementation. This RFC does not author project copy.
- Eternal Eggs is not in the artifact's `MLData`. No approved Eternal Eggs copy (kind, tagline, description, disciplines, flow) exists in the repository yet. It must be supplied, as for every project, before the projects group can publish.
- The projects group publishes only as a whole (§5.1). Until all five carry complete, valid V10 fields, the homepage keeps the artifact's own project data.
- Email deliverability is an owner-attested release precondition; the system cannot verify it. The email group must not be published with the preferred address before that attestation is recorded.

**Deferred (D-105 Q4/Q5; AS-131):**
- Tier 2 / artifact v2: entry intro, navigation labels, section captions and headings, contact heading/body/button wording. These need a revised owner-approved artifact that exposes them through the content seam.
- Design additions: an About section, new CTA buttons, new homepage structural panels.
- A public `/api/site-content`: not added. The bridge reads the published revision substrate internally. A public API may be proposed only for a concrete second consumer.
- The Journal → Research `NOTES` bridge (CB-6).

**Out of scope:** disciplines (`DISC`), orbit geometry (`SLOTS`/`PSLOTS`), motion, assets, brand components, `/api/design` wiring.

## 5. Normative contracts

### 5.1 Bridge payload (`schemaVersion: 1`)

The payload's keys are:
- `projects[]`, with 1..5 entries, in homepage order:
  - `name` (1..40)
  - `kind` (1..40)
  - `status` (`""` or `"Active"`)
  - `tagline` (1..160)
  - `description` (1..400)
  - `disciplines` (1..6 unique integers, each 0..5)
  - `flow` (exactly 4 strings, each 1..60)
- `contact.email` (the existing `validate.mjs` email rule, ≤ 254).

Rules:
- All text uses the existing `text(max)` rule: trimmed, with no control characters, `<` or `>`.
- Unknown fields are rejected.
- Project names are unique, case-insensitively.
- Each group is all-or-nothing, and groups are independent.
- The payload never contains ids, slugs, revisions, timestamps, actors, audit data, drafts, storage keys, media, URLs, HTML or style values.

### 5.2 Injection (the bridge span)

- The span is exactly `<script type="application/json" id="ml-published">JSON</script><script>HOOK</script>`, inserted immediately before the first `<script>` of the outer document's `<head>`.
- The offset and the artifact length and SHA-256 are build-time constants. On any precondition mismatch, nothing is inserted.
- The JSON escapes `<`, `>`, `&`, U+2028 and U+2029 as `\uXXXX`.
- `HOOK` is a code constant, never data-derived.
- Removing the span from an injected response must yield the artifact bytes exactly.

### 5.3 Hook

- At parse time, the hook reads and parses the island inside `try/catch`.
- It defines a `window.MLData` accessor. On the artifact's assignment, it produces a shallow copy where:
  - `PROJ` and `FLOW` are replaced only if the `projects` group re-validates;
  - `EMAIL` is replaced only if the `contact` group re-validates;
  - every other key is left identity-equal.
- It never throws, never adds keys, and never evaluates data.

### 5.4 Fail-safe and runtime dependency (AS-131 precision)

`GET /` returns `env.ASSETS.fetch(request)` untouched on any of the following:
- no published content;
- a D1 error, or a timeout over 250 ms;
- a validation failure;
- a splice precondition failure;
- any exception caught by the application.

The `/` dispatch is wrapped in the strongest practical outer fail-safe, and is placed before any other Worker logic that could throw.

**Precise claims:**
- **May be claimed:** D1 failure does not make homepage content availability depend on D1.
- **Must not be claimed:** that the homepage has no new runtime dependency. Once exact `/` is Worker-first, the homepage depends on successful Worker execution.
- **Residual risk, explicit and accepted by D-105 Q2:** a Worker or platform failure that occurs before the application fallback executes is not equivalent to asset-first service. This risk is not represented as mitigated.

### 5.5 Routing (D-105 Q2)

- `run_worker_first` gains the exact path `"/"` only. No other ordinary asset route becomes Worker-first because of this RFC.
- `/` is classified as a public route before the admin authentication check.
- `/admin/preview/home` uses the existing `/admin/*` protection.

### 5.6 Lifecycle and integrity

- Every mutation carries `expectedPublishedRevisionId` and `expectedDraftRevisionId`. A stale expectation returns 409 with no change and no partial publication.
- A publish that would leave more than 5 featured published projects returns 409, before publication.
- A featured project without a complete, valid set of V10 fields cannot be published as featured.
- Every success writes an audit row atomically in the business batch. Failure audits are best-effort.
- The actor is `cf-access:<sub>`.
- Public `/` never reads draft pointers.
- **Initial activation (D-111, AS137-F001).** Until the D-105 initial five are activated, no single homepage-eligible publish is accepted. `POST /admin/api/projects/initial-activation` publishes exactly ClinicFlow, Eternal Eggs, Sentinel / DevOS, SU and Maisog Kilat, complete, valid and in that order, in one atomic batch. The batch keeps each project's expected-pointer guard and writes one `project_publish` audit row per project plus one `homepage_initial_activation` success row. That row is the durable activation marker: `audit_log` is append-only, so the pre-activation restriction switches off exactly once. The marker gates only admin publishes. Public `/` never reads it and keeps rendering any valid published group of 1..5 (AS133-F001).
- **`site_settings` bootstrap (D-111).** On a database with no `site_settings` row, the first contact draft (sent with both expected pointers `null`) creates the row and revision 1 in one batch. The revision takes the canonical `data/site.js` content with only the email replaced, and only the draft pointer is set. Nothing is published; the attested contact publish is still required. A competing bootstrap fails on the primary key and rolls back.

## 6. Migration (proposed; not authorized until this RFC is accepted)

`0006` adds nullable `project_revisions` columns:
- `tagline`;
- `status` (CHECK `NULL`, `''` or `'Active'`);
- `disciplines_json`;
- `flow_json`.

The field-by-field justification is in plan §16. Existing columns are reused: `title` → name, `category` → kind, `summary` → description, `featured` → homepage inclusion, `sort_order` → order.

No other schema change is proposed. The email uses the existing `site_settings_revisions.contact_email`.

## 7. Acceptance tests required for any implementation (AS-131)

Implementation acceptance must prove:

1. the canonical `public/index.html` SHA-256 remains `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`;
2. the no-published-content response to `/` is byte-identical to the artifact;
3. the D1 error and timeout responses are byte-identical to the artifact;
4. an injected response differs only by the §5.2 bridge span;
5. malformed or hostile data cannot become HTML, JS, CSS or URL execution;
6. drafts never reach public `/`;
7. stale mutations fail without partial publication;
8. more than five homepage projects is rejected before publication;
9. each project has exactly four flow stages;
10. the browser render has no console error and no blank-page failure;
11. `/` Worker CPU and latency are measured before release;
12. the existing D-093 artifact hash tests continue to pass.

## 8. Alternatives rejected

- Client fetch of `/api/site-content`: needs an artifact change or injection, races the first render (content flash), and adds public surface without a second consumer.
- Rendered-HTML rewriting: there is no rendered copy in the HTML.
- A return to React: prohibited by D-093.
- Build/deploy on publish: edits the served artifact and needs Gate C and Gate D per copy edit.
- Post-render DOM replacement: fragile.

A new artifact with a built-in adapter is complementary, and deferred with Tier 2.

## 9. Risks

- The homepage depends on Worker execution for `/` (§5.4 residual risk; accepted by D-105 Q2).
- Production D1 content state is unknown. A read-only check is required before release.
- The production admin was non-functional while `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN` were placeholders (AS-129 F-6, AS137-F002). D-111 sets them to the existing `maisoglabs.com/admin` Access application's values; the deployed Worker picks them up only at Gate D.
- Version previews are disabled (AS-130), so pre-promotion verification must use local Miniflare/Playwright evidence plus a post-promotion read-only check.
- Eternal Eggs copy does not yet exist, and email deliverability is unconfirmed. Until both are supplied, the homepage keeps the artifact's own data (safe, but no visible change).
- RFC-021 C1 (eight projects) and C3 remain partly unmet on the homepage by design (five slots). D-105 Q3 sets the homepage set.

## 10. Implementation increments (each needs its own authority)

| Inc | Scope |
|---|---|
| CB-1 | pure bridge library (payload, hook, splice) |
| CB-2 | migration `0006` and V10 project fields, local D1 only |
| CB-3 | site-settings lifecycle (email) |
| CB-4 | admin preview and Content UI (Tier 1; Tier 2 tabs read-only) |
| CB-5 | public exact-`/` wiring, the `HOMEPAGE_ARTIFACT_CONTRACT.md` update, Playwright evidence |
| CB-R | release: Gate C, read-only production D1 check, remote `0006`, Gate D, production smoke; then owner content and initial activation (§10.1) |

CB-6 (Journal bridge) and CB-7 (Tier 2) are deferred.

### 10.1 Release sequencing (D-111)

- **Gate D activates the code, not the bridge.** Gate D may promote the RFC-022 Worker while there is still no valid published bridge payload. With no published homepage projects and no admin-published email, public `/` serves the approved artifact unchanged (§5.4), so promotion alone changes nothing visible.
- **AS132-F002 applies to the first project bridge activation.** It is not a precondition for making the admin and bootstrap code reachable. The first project activation is the §5.6 initial activation of exactly the D-105 five, in order; no path creates a partial first group. This requirement is not weakened.
- **After Gate D, in production, each with its own owner authority:** save the five project drafts (with approved copy, including Eternal Eggs), preview them, run initial activation, then draft and publish the contact email once its deliverability is confirmed.

## 11. Amendment log

**D-105 amendment:**
- incorporated Q1 (§3 D-093 amendment), Q2 (§5.5 exact `/` only), Q3 (§4 initial content and the email precondition), Q4 (§4 deferrals), Q5 (§4 no public API, CB-6 deferred);
- incorporated AS-131: the Worker-dependency precision (§5.4), storage and no-snapshot reuse (§2, §6), the twelve acceptance tests (§7);
- removed the optional `/api/site-content` mirror from the contract;
- stated that the migration is not authorized before acceptance.

**D-111 amendment (`ML-DEVOS-AS-137`):**
- §5.6: initial-only atomic activation of the D-105 five (AS137-F001), and the `site_settings` first-draft bootstrap;
- §9: Access values wired (AS137-F002);
- §10 / §10.1: Gate D may activate the code before any bridge payload exists. AS132-F002 governs the first project bridge activation, unchanged in substance.

## 12. Acceptance

Accepted by `ML-DEVOS-AS-132`, subject to AS132-F001 (dynamic response identity and caching; mandatory implementation condition) and AS132-F002 (initial five-project activation; mandatory release condition). Acceptance grants no implementation authority: CB-1..CB-5 and CB-R each need their own owner decision.
