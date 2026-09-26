# WEB-REL-002 — Release Readiness / Release-Scope Review

Status: `BUILDER RECOMMENDATION — PENDING ARCHITECT REVIEW`. The review grants no merge, deploy or remote-mutation authority.

**Governance:**
- **Authority:** `D-083` (planning and inspection only).
- **Directive:** `DIR-WEB-RELEASE-READINESS-0001`.
- **Controlling review:** `ML-DEVOS-AS-112`.
- **Evidence class:** `ACTOR_REPORTED`, except where a finding cites a published Architect review.

## 1. Exact state reviewed

| Ref | SHA |
|---|---|
| `origin/main` | `882ad253b5dbec06b209d1ee1a2a54b21b392e2e` (PR #12 merge commit; parents `887849283…` and `3262dbad4b2e18998586e125b1d34702211862c1`) |
| Accepted governance content (AS-112) | `2cdbf4468d500163f84ab9a06c5232b6614f34b8` |
| Governance tip at review (D-083 directive issue) | `0a35d7731c962a929f89c9d603d573c4f7960079` (adds governance records only) |
| Merge base | `3262dbad4b2e18998586e125b1d34702211862c1` |

**Ancestry facts** (`git diff 3262dba 882ad25` is empty):
- `main`'s tree is identical to governance commit `3262dba`, which is an ancestor of the governance tip.
- `main` contains no content that governance lacks.
- Governance is 127 commits ahead of the WEB-REL-001 release content.
- A governance→main merge is therefore conflict-free by construction.
- The resulting tree equals the governance tip tree.

## 2. Classification of `git diff 882ad25 2cdbf44`

The diff covers 261 files: +39,011 and −939 lines. Command:

```
git diff --name-status 882ad253b5dbec06b209d1ee1a2a54b21b392e2e 2cdbf4468d500163f84ab9a06c5232b6614f34b8
```

| # | Category | Files | Paths |
|---|---|---|---|
| 1 | Public website / admin / product source (build inputs) | 13 (7 A, 6 M) | `app/page.js`, `app/globals.css`, `app/DesignRuntime.js`, `app/admin/DesignControls.js`, `components/site/{SpatialShell,SystemsSurface,ProjectsSurface,ResearchSurface,ContactSurface,useListKeys}.js`, `components/site/routes.mjs`, `data/site.js`, `lib/content/schema.mjs` |
| 1b | Brand direction docs (not build inputs) | 3 M | `brand/V3/{ASSET_MAP.json,DESIGN_MAP.md,guidelines/V3_DIRECTION.md}` |
| 2 | Website supporting tests/docs | 6 | `tests/website-redesign.test.mjs`, `tests/spatial-design-controls-v2.test.mjs`, `docs/product/{WEBSITE_REDESIGN_V1_PLAN,SPATIAL_DESIGN_CONTROLS_V2_PLAN,UI_UX_SPEC,DESIGN_REFERENCE_WORKFLOW}.md` |
| 3 | Governance / Context Bootstrap / Protocol V2 | 24 | `coordination/{STATE,README,OPERATIVE_OBLIGATIONS,CURRENT_HANDOFF,CURRENT_DIRECTIVE,ARCHITECT_REVIEW,IMPLEMENTER_HANDOFF}.md`, `brain/**` (6, incl. `brain/protocols/**`), `CLAUDE.md`, `AGENTS.md`, `.agents/skills/**` (3), `.claude/skills/**` (3), `scripts/check-context-bootstrap.mjs`, `tests/context-bootstrap{,-v2}.test.mjs` |
| 4 | SENTINEL / S5 capabilities / S6 execution / DevOS | 91 | `devos/execution/**` (24, S6 core, AS-103), `devos/capabilities/**` (33, S5), `tests/execution-*.test.mjs` (13), `tests/capabilities-*.test.mjs` (4), `tests/fixtures/execution/**` (5), `devos/changes/{rfcs,adrs}/**` (7), `devos/governance/**` (3), `devos/devos-manifest.json`, `tests/devos-manifest.test.mjs`, `docs/SENTINEL_CONTEXT_PLANE_V1_PLAN.md` |
| 5a | Website evidence | 21 A | `docs/product/evidence/{website-redesign-v1,spatial-design-controls-v2a}/**` |
| 5b | Governance evidence / archives | 103 | `coordination/archive/**`, `devos/changes/architect-syncs/**` |

**Absent from the diff (unchanged since WEB-REL-001):**
- `worker/**`, `migrations/**`, `wrangler.jsonc`;
- `package.json` and `package-lock.json`;
- `.github/workflows/**`;
- `next.config.mjs` and `public/**`.

**Not in either branch:** the suspended D-068 local draft is untracked and exists only in a local checkout.

## 3. What can reach production

- **Static assets.** `next.config.mjs` uses `output: "export"`, so the assets are the `out/` tree built from `app/`, `components/`, `lib/`, `data/` and `public/`.
  - The website source closure imports only `app/`, `components/`, `lib/`, `data/` and React/Next.
  - A fresh build of `0a35d77` produced 40 files under `out/`. None has a path matching `devos`, `execution`, `sentinel`, `coordination` or `brain`.
- **Worker bundle.**
  - A static walk of the import graph from `wrangler.jsonc` `main` (`worker/index.mjs`) reaches 18 modules under `worker/`, plus the external `jose`.
  - It reaches zero `devos/**` modules.
  - `worker/**` is unchanged by this diff, so the Worker code is byte-identical to WEB-REL-001.
- **Conclusion.** Categories 1b and 2–5 cannot change the production runtime; they are repository-only. The production effect of either release shape is limited to category 1: the Website Redesign V1 static site and the V2A admin UI client code.

**Production effect of the V2A admin (runtime note, `ACTOR_REPORTED` from source):**
- `wrangler.jsonc` still carries placeholder `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD`, and a D1 binding that is `remote: false` with no `database_id`.
- `/admin` therefore stays fail-closed behind the unchanged Worker Access check.
- `/api/design` has no production D1, so `DesignRuntime` keeps the WEB-INC-007 fail-safe baseline presentation.
- Releasing V2A ships admin client code that is inert in production until a separately governed Access/D1 activation. It does not make design controls live.

## 4. SU contradiction check (`ESCALATED_RESEARCH`, repository evidence)

1. **Accidental S6/experimental inclusion.**
   - A direct merge puts `devos/execution/**` (S6 core, accepted as an implementation in AS-103 but parked) and `devos/capabilities/**` (S5) on `main` as repository content.
   - §3 shows neither reaches the static assets or the Worker bundle.
   - `main` already carries governance/DevOS content (177 `devos/` files), per the PR #12 precedent.
   - **Risk:** repository-level, not runtime. It needs an explicit owner acknowledgement that "on `main`" ≠ "authorized or active". It is not a blocker.
2. **Missing accepted website changes.**
   - A direct merge cannot omit any accepted file.
   - A selective branch must hand-assemble the 13 source files, 2 tests and docs. The `data/site.js` / `lib/content/schema.mjs` coupling (`spatialContent`, `validateSpatialContent`) makes a partial pick fail build or tests rather than degrade silently, so that risk is detectable but real.
3. **Governance/history dependencies.**
   - The website source has no code dependency on governance files.
   - Its acceptance evidence (AS-106, AS-112, D-076, D-082) lives in governance files, and the governance traceability validator scans them.
   - A selective `main` would carry accepted code while its governing records sit only on the governance branch. The PR #12 precedent ("preserve governed history") chose the opposite.
4. **Release-branch divergence.**
   - A selective branch produces a `main` tree that equals no reviewed or tested governance commit. CI evidence (`test-and-build` green on `2cdbf44` and `0a35d77`) and the Architect acceptances would not apply to it directly.
   - The next full governance→main merge then has to reconcile the same bytes introduced twice.
   - Governance would stop being a superset of `main`, which is the property that currently makes the merge trivially safe.
5. **Unintended Cloudflare/build effects.**
   - Opening a PR triggers Cloudflare non-production preview builds, which D-055 permits.
   - A merge to `main` triggers a Workers Builds production build. Per `ML-DEVOS-AS-074` (the D-057 remediation), that build runs `npx wrangler versions upload`, which uploads a version without promoting it.
   - This is external dashboard state last verified in `ML-DEVOS-AS-074`. The repository cannot prove it has not drifted.
   - **Consequence:** the merge gate must re-verify it before merging; see §7.
6. **Merge = deploy assumption.** This is rejected by `D-057`. Merge and production promotion are separate gates. Promotion activates a specific uploaded version ID and needs its own owner decision.

## 5. Options

**A — Direct `governance/maisoglabs-v0.1 → main` release PR.** This is the same shape as PR #12.
- **Pros:**
  - conflict-free, since `main` ⊂ governance;
  - the resulting tree equals the reviewed, CI-green governance tip;
  - no omission risk and governed history preserved;
  - no divergence, and matches the precedent.
- **Cons:**
  - 261 files are reviewed at once, including repository-only S5/S6 content;
  - the PR head moves with every governance bookkeeping commit (the D-056 final-head rule handles this).

**B — Bounded website-release branch** (from `main`, carrying only categories 1, 1b, 2 and 5a).
- **Pros:** a small, production-focused diff.
- **Cons:**
  - a new, untested tree and new CI evidence required;
  - hand-assembly risk;
  - governed records are absent from `main`;
  - permanent divergence and double-application on the next full merge;
  - no runtime benefit, because §3 shows categories 3–5 do not reach production anyway.

## 6. Recommendation

**Option A.** Open a fresh governance→main release PR, reviewed as WEB-REL-002, pinned to an exact head SHA.

- **Release candidate scope:**
  - **Production-affecting:** the full governance tip tree, whose effective production surface is category 1 only (§3).
  - **Repository-only:** categories 1b and 2–5, included deliberately for history and traceability.
- **Excluded:**
  - nothing inside the branch;
  - the untracked D-068 draft, which is not in any branch;
  - legacy PRs #1, #2, #6 and #7, and PR #10, all untouched.
- **Owner acknowledgement:** the owner acknowledges that S5/S6 repository content on `main` grants no authority and is not executed by the production runtime. If Paulo rejects S5/S6 on `main` as a policy matter, Option B becomes the fallback, and its costs in §5 need a separate decision and new CI evidence.

## 7. Required gates (each needs a separate Paulo decision)

1. **Scope acceptance.** The Architect reviews this artifact.
2. **Gate B — open the release PR.**
   - One PR from `governance/maisoglabs-v0.1` to `main`.
   - Cloudflare preview builds are allowed (D-055).
   - Required: `test-and-build` green on the exact PR head (`npm ci`, `npm test`, `npm run build`), `main-protection` still active, and the full diff inventory checked against §2.
   - The PR head may move only by governance bookkeeping, with CI re-verified on the final head (D-056 rule).
3. **Gate C — merge.**
   - Preconditions:
     - a fresh re-verification that Cloudflare production Git builds still run `npx wrangler versions upload` (no promotion);
     - the currently active production Version ID recorded (last recorded: `a28ee2e9-a9a0-4528-b89f-07e0c827be2b`, `ML-DEVOS-AS-074`).
   - Merge only the exact pinned head, as a normal merge commit.
   - Post-merge, confirm that the Workers build uploaded a version and that the active production version is unchanged.
4. **Gate D — production promotion.**
   - A separate owner decision naming the exact uploaded Version ID built from the merge commit.
   - The MEDIA_GAP (AS-106: `plate-hero-v4.png`, `logo-mark.mp4`, poster) must be explicitly accepted, or resolved, for the public release.
5. **Runtime verification (after promotion).** Record:
   - Entry, `#systems`, `#projects`, `#research`, `#contact` and `/journal` render on desktop and mobile;
   - `/admin` remains fail-closed;
   - `/api/design` returns the fail-safe baseline;
   - `/api/journal` behaves as before;
   - 404 handling is unchanged;
   - the active Version ID;
   - that no D1, R2, Access or DNS change occurred.
6. **Rollback.**
   - Runtime: roll back to the prior active Version ID through the Cloudflare versions/deployments surface, as its own authorized action.
   - Source: a revert PR against `main`. Never force-push; `main-protection` blocks non-fast-forward updates.
   - Rollback needs no D1/R2 action, since no remote data changes.

## 8. Blockers and open items

**Blockers:** none that prevent Gate B.

**Open items before the named gates:**
- **Gate C:** Cloudflare build-configuration re-verification (external state; see §4 item 5).
- **Gate D:** owner disposition of the MEDIA_GAP.
- **Gate B/C:** owner acknowledgement of the S5/S6 repository content (§6).

**Non-blocking hazards and debt:**
- Legacy PR #7 is open, non-draft, and targets `main`. It must not be merged.
- Pre-existing traceability debt remains (`CORE-022`, `WEB-REQ-009`).
- No automated accessibility or visual-regression suite exists (`TEST-WEB-003`).
- O1/O2 (S6) are unaffected.
