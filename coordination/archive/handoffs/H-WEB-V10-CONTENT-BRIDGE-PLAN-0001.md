# Current Handoff — V10 Admin Content Bridge Architecture Planning (D-104)

```yaml
schema_version: 1
handoff_id: H-WEB-V10-CONTENT-BRIDGE-PLAN-0001
cycle_id: MAISOGLABS_WEB_V10_CONTENT_BRIDGE_PLAN
input_base_commit: b7d0284c1853eae5887a6fdc6148987c68895345
review_target_commit: b7d0284c1853eae5887a6fdc6148987c68895345
applicable_review_id: ML-DEVOS-AS-130
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. All evidence is `ACTOR_REPORTED`: repository reading, local read-only decoding of the artifact, and local test runs.

## Objective

Execute `DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001` (D-104): a repository-grounded architecture for a V10 Admin Content Editor plus a Public Content Bridge onto the D-093 homepage, planning only. Deliverables:
- `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`;
- a draft of `ML-DEVOS-RFC-022` (`DRAFT`).

## Result

**D-104 publication:** `b7d0284c1853eae5887a6fdc6148987c68895345` (parent `65288c7…`; check-only exit 0, compare-and-swap publish attempt 1).

**Selected architecture: an MLData-seam published-content bridge (plan §4; RFC-022 §2).**
- The D-093 artifact keeps all project, flow, note and email data in one embedded `window.MLData` assignment, which runs before its components render. Its loader replaces the DOM but keeps `window`.
- On `GET /` (becoming exact-path Worker-first), the Worker inserts, at a fixed and verified offset, a JSON island plus a fixed code-owned hook, and only when a valid published snapshot exists. The hook merges allowlisted values into `MLData` at assignment.
- The artifact file is never edited. With nothing published, or on any failure (D1 error or timeout, validation, precondition, exception), the response is **byte-identical** to the artifact.
- There is no deploy per copy edit, no extra request and no content flash.

**Alternatives rejected (plan §3):**

| Alternative | Why rejected |
|---|---|
| (A) Paulo's candidate: static artifact + client `fetch('/api/site-content')` | The unmodified artifact cannot call it, and a fetch races the first render, so content flashes |
| (B) Rewriting the rendered HTML | Impossible: the copy lives in gzipped bundle resources rendered client-side |
| (C) Return to React | Prohibited by the D-093 owner instruction |
| (D) Build/deploy on publish | Edits the served artifact, and each copy edit would need Gate C and Gate D |
| (F) Post-render DOM replacement | Fragile |

(G), a new artifact from Paulo with an adapter, is **complementary**: it is required for Tier 2 copy.

**Scope tiers:**
- **Tier 1** works with the current artifact: projects (1..5 on the homepage, because `SystemsPanel` destructures 5 orbit slots, and a sixth project would throw and blank the page; exactly 4 flow stages each) and the contact email.
- **Tier 2** needs artifact v2: entry intro, nav labels, contact heading, description and CTA, and captions. These are JSX literals today.
- About and CTA buttons do not exist in V10. Adding them is a design change.

**Migration determination (plan §16):**
- Email: none (`site_settings_revisions.contact_email` exists).
- Projects: **one** migration, `0006`, adding four nullable `project_revisions` columns: `tagline`, `status`, `disciplines_json`, `flow_json`. Each is justified.
- No snapshot table and no second CMS.

**Existing capabilities reused:**
- project lifecycle routes (draft / preview / publish / unpublish) with expected-pointer stale-write guards and commit-time guards (`worker/admin/projects.mjs`, `worker/d1/projects.mjs`);
- `validate.mjs` `text(max)`, email and `assertNoUnknownFields`;
- append-only audit (`worker/d1/audit.mjs`);
- `featured` (homepage inclusion) and `sort_order` (order);
- `site_settings_revisions` fields for email and future copy;
- the `/admin/*` Access boundary for the draft homepage preview;
- the public-module isolation pattern of `worker/public/*`.

**Proposed increments (plan §20):**

| Increment | Scope |
|---|---|
| CB-0 | owner decisions Q1–Q5 and RFC review |
| CB-1 | pure bridge library |
| CB-2 | migration `0006` and V10 project fields |
| CB-3 | site-settings lifecycle |
| CB-4 | admin preview and Content UI |
| CB-5 | public `/` wiring |
| CB-R | release (separate Gate C, remote D1 and Gate D decisions) |
| CB-6 | optional Journal → Research notes bridge |
| CB-7 | Tier 2 after artifact v2 |

CB-1 to CB-5 are repository-only.

## Changed files

**D-104 publication commit (`b7d0284`):** `brain/DECISION_LOG.md` (D-104), `coordination/CURRENT_DIRECTIVE.md`, `coordination/STATE.md`.

**This return commit:**
- `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md` (new): the 20 required sections, plus evidence and SENTINEL/SU/open questions (§21–22).
- `devos/changes/rfcs/ML-DEVOS-RFC-022.md` (new): `DRAFT`, not accepted.
- `devos/changes/rfcs/README.md`: an index row for RFC-022 (DRAFT).
- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to the Architect, directive deselected.
- `coordination/archive/directives/DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001.{md,provenance.json}`: byte-identical directive archive, plus its index row.

## Tests and evidence

- **Bootstrap:** before D-104, tip `65288c7`, `TURN: PAULO`, all flags `NO`, D-104 absent, exit 0. After publication, exit 0 on `b7d0284`.
- **Artifact:** `public/index.html` SHA-256 is `2417f7e5…9f9` before and after (unchanged). Decoded locally with the same method as `tests/homepage-artifact.test.mjs` into:
  - 34 resources;
  - the template;
  - the outer loader (DOMParser plus `documentElement.replaceWith`, ordered script re-creation).

  The `MLData` keys and the component consumption and invariants (`PS[j]`, `FLOW[shown][3]`, `D[k]`) are cited in plan §1.
- **`npm test`:** 613 tests; 602 pass, 11 fail.
  - All 11 failures are `Cannot find package 'wrangler'` (10 suites) or `'jose'` (`worker-auth`).
  - `npm ci` received `403 Forbidden` from the environment's registry proxy, so dependencies could not be installed. This is an environment limit, not a code regression.
  - `tests/homepage-artifact.test.mjs` passes 5/5.
- **Traceability validator:**
  - At the D-104 tip: 4 errors, including `ML-DEVOS-RFC-022 referenced but missing`, which D-104 introduced.
  - With this return: 3 errors, all pre-existing: `CORE-022` and `WEB-REQ-009` (OBL-015 traceability debt) and `D-000`. The RFC-022 error is resolved.
  - The "generated index DRIFT" warning is pre-existing (the index was last regenerated at `ea6401d`) and was not regenerated here (out of scope).

## Unresolved findings and limitations

1. **Q1 (D-093 semantics) blocks the selected design.** Does "byte-for-byte" bind the served response, or only the file? The bridge changes served bytes only when content is published. If served bytes must always equal the artifact, only a new artifact with its own adapter remains (flash risk).
2. **Q2:** `/` would become Worker-first, a new runtime dependency on the Worker (not on D1). This is mitigated by the byte-identical fallback and an outer catch (AS-116 lesson), but it needs owner acceptance.
3. **Q3 (facts):** RFC-021 C1 (8 projects) and C3 (`paulo.maisog@maisoglabs.com`) conflict with the artifact's 5-slot geometry and `maisog36@gmail.com`.
4. **Q4:** Tier 2, About and CTAs need artifact v2 and design decisions.
5. **Q5:** whether `/api/site-content` and CB-6 are wanted at all.
6. Production D1 content state is unknown (no data reads allowed). The production admin is non-functional while the Access vars are placeholders (AS-129 F-6). Previews are disabled, so pre-promotion verification must be redesigned (AS-130).
7. Browser and runtime evidence is planned (CB-5, Playwright with the preinstalled Chromium) but was not produced in this planning cycle. The CPU cost of the `/` path is unmeasured.
8. **Carried forward:**
   - AS-129/130 open items (A-2, A-3, A-5–A-9);
   - S6 parked at ML-DEVOS-AS-103;
   - O1 and O2 open;
   - D-068 held;
   - OBL-015 (traceability debt) and OBL-017 unchanged.

## Confirmations

- Nothing changed in `public/index.html`, `app/**`, `worker/**`, `migrations/**`, `lib/**`, `data/**`, `scripts/**`, tests or config.
- No Cloudflare call, remote D1/R2, deployment, `main` change or production change.
- No PR #7, PR #10, S6/S7 or D-068 action. `devos/execution/`, `tests/fixtures/execution/` and `stash@{0}` were not touched.
- Local-only actions:
  - the artifact was decoded into the session scratchpad;
  - a temporary git worktree was created and removed to compare validator baselines;
  - `npm ci` was attempted and failed; nothing was installed.
- RFC-022 remains `DRAFT`. Its implementation has not started.

## Evidence locations

- `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md` (§1 current state with file citations; §21 evidence).
- `devos/changes/rfcs/ML-DEVOS-RFC-022.md`.
- `public/index.html` (SHA `2417f7e5…`); `tests/homepage-artifact.test.mjs` (decoding method).
- `migrations/0001_web_inc_005_init.sql` (`site_settings_revisions`, `project_revisions`); `worker/admin/projects.mjs`; `worker/d1/validate.mjs`; `worker/public/design.mjs`; `worker/auth.mjs`; `wrangler.jsonc`.
- `coordination/archive/directives/DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001.md`.

## Governing references

- **Authority:** D-104 (planning only).
- **Directive:** DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001 (archived).
- **Reviews:** ML-DEVOS-AS-130; ML-DEVOS-AS-129 (F-6, the preview tradeoff).
- **Decisions:** D-093 (homepage artifact), D-088/D-089 (RFC-021 content decisions), D-097 (remote D1 precedent).
- **RFCs:** ML-DEVOS-RFC-021 (accepted), ML-DEVOS-RFC-022 (draft).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews the plan and RFC-022 under the next unused immutable Architect Sync ID after ML-DEVOS-AS-130, and routes Q1–Q5 to Paulo. RFC-022 implementation does not begin without a separate decision.
