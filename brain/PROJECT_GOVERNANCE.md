# Project Governance

## Repository

`Dillaab-source/maisog-labs`

## Authoritative governance branch

`governance/maisoglabs-v0.1`

Claude's temporary per-session push branches (for example `claude/phase-0-governance-scope-w8o3jp`) are implementation transport only, never a second source of truth. When a session branch and the governance branch diverge, the governance branch is authoritative (Architect finding F-005, `coordination/ARCHITECT_REVIEW.md`).

## Legacy baseline SHA

`887849283ee9cd16e8d60b937bac95b1c85bf3d9` (`main` HEAD at governance start; verified independently via `git merge-base HEAD origin/governance/maisoglabs-v0.1` in the Phase 0 handoff, and re-confirmed as `main`'s current HEAD as of this Phase 1 commit).

## Governance start boundary

Governance applies prospectively from the legacy baseline SHA above. Commits on `main` before this SHA are **not** retroactively governed, reviewed, or certified. Legacy areas of the codebase are documented and brought under governance only when a future authorized phase actually touches them (governance plan §7, "Governance Boundary").

## Roles and authority

| Role | Assigned holder | Authority |
|---|---|---|
| Product / Risk Owner | Paulo | Final product authority. Approves material scope, architecture decisions, accepted risk, and every gated phase transition. Only Paulo can authorize the next phase, deployment, or a `main` merge. |
| Architect / Independent Reviewer | ChatGPT (current assignment) | Independently reviews architecture, implementation claims, tests, risks, and security against repository evidence. Writes `coordination/ARCHITECT_REVIEW.md`, minting a new immutable `ML-DEVOS-AS-NNN` per published revision. Cannot authorize a new phase — only assess against the currently authorized one and recommend to Paulo. |
| Builder / Implementer | Claude (current default assignment; a decision may reassign it, as `D-059` did) | Inspects repository reality before acting, implements only the currently authorized scope, writes/updates tests, maintains governance documents, writes `coordination/CURRENT_HANDOFF.md` (`coordination/IMPLEMENTER_HANDOFF.md` is frozen pre-V0 history). May report `IMPLEMENTATION COMPLETE`. **May not self-certify `ARCHITECT VERIFIED`.** |

Roles are governed positions: authority attaches to the role as assigned by the applicable decision, never to a provider or model name. `TURN: CLAUDE` in `coordination/STATE.md` denotes the Builder role.

**Source of truth:** the repository, its committed tests, and runtime/deployment evidence. Agent statements alone — from any of the three roles — are not proof.

**No implementer self-certification:** a claim of `implemented`, `fixed`, `tested`, `secure`, `deployed`, or `complete` requires evidence (code, diff, test output, build output, runtime output, deployment logs, etc.), and Claude's own evidence is recorded as *implementer-reported* until the Architect independently reproduces or inspects it — see `TEST_LEDGER.md` and the evidence-class rule below.

## Current deployment model

Static Next.js export (`next.config.mjs`: `output: "export"`) served by Wrangler — **not** Cloudflare Pages. As of `WEB-INC-001`, this is a Worker script (`worker/index.mjs`, `wrangler.jsonc`'s `main`) plus a static Assets binding, with Worker-first routing selectively enabled for `/admin`/`/admin/*` only (`assets.run_worker_first`); every other route remains asset-first, exactly as the prior asset-only contract was. Evidence: `wrangler.jsonc` (`assets.directory: "./out"`, `main`, `run_worker_first`), `package.json` (`"deploy": "wrangler deploy"`), `docs/ARCHITECTURE.md`. This Phase 1 cycle corrected a prior documentation contradiction where `AGENTS.md` and `README.md` described the target as "Cloudflare Pages" (Architect finding F-003); both now describe the Worker/Wrangler asset deployment and point to `docs/ARCHITECTURE.md` as canonical — that correction remains true; only the underlying deployment shape itself has since evolved, via a separately authorized and reviewed increment (`ML-DEVOS-RFC-002`/`ML-DEVOS-AS-011`/`D-023`), not silently.

## Current storage model

MaisogLabs now has a **hybrid public content model**.

### Homepage / existing portfolio content

The homepage and existing public project presentation still use the Git-backed path:

```
data/site.js → lib/content/local.mjs → schema.mjs → public.mjs → app/page.js
```

That path remains authoritative for the existing homepage/project presentation.

### Local D1/R2 capabilities

Separately accepted local architecture now includes:

- a 20-product-table D1 schema through migration 0004;
- append-only audit;
- project mutation lifecycle;
- local R2 media storage plus project media associations;
- Journal lifecycle and Journal media;
- published-only public Journal D1 reads.

D1/R2 remain explicitly local-only (`remote: false`).

The public Journal API is the first accepted public D1 read path, but this does **not** cut the homepage/projects over to D1.

`D1 PUBLISHED ≠ PRODUCTION WEBSITE LIVE` remains the governing distinction for non-Journal content.

No production/remote D1 or R2 verification is claimed.

## Current admin/auth status

`ADMIN STATUS: AUTHENTICATED READ-ONLY UI + BOUNDED DOMAIN APIs IMPLEMENTED LOCALLY`

Cloudflare Access verification is implemented at repository level for `/admin` and `/admin/*`.

After successful authentication, the Worker supports:

- bounded dashboard status reads;
- project lifecycle mutation API;
- media upload/list API;
- Journal lifecycle mutation API.

The admin UI itself is not yet a complete editing interface for those APIs.

There is no application session store beyond per-request Access assertion verification.

No production Cloudflare Access configuration is verified.

The public Journal API is intentionally outside the admin auth boundary and is read-only/published-only.

## Current restrictions

- **No deployment** is authorized except by explicit, separate Paulo authorization. Current value: `DEPLOY_AUTHORIZED: NO` (`coordination/STATE.md`).
- **No merge to `main`** is authorized except by explicit, separate Paulo authorization. Current value: `MAIN_MERGE_AUTHORIZED: NO` (`coordination/STATE.md`).
- No further website implementation is authorized unless the live `coordination/STATE.md` opens a specific bounded turn. WEB-INC-001/005/002/008/003/004/006 and UI-PATCH-001 are closed; WEB-INC-007 Theme/Design Controls remains unstarted and unauthorized. Remote/production D1/R2, deployment, public media serving, broader D1 cutover, and main merge remain separately gated.
- No experimental/legacy branch (see inventory below) may be merged into the governance branch without a separate, explicit authorization and review.

## Legacy / non-governance branch inventory

These remote branches exist but are **not** part of the governed baseline. Per Architect finding F-004 and the Phase 1 mandate, they are recorded here for awareness only and are conservatively classified `UNINSPECTED LEGACY/EXPERIMENTAL` — no branch content, code, or design was reviewed, reused, or merged to produce this classification; it is a Git-metadata inventory only.

| Branch | HEAD SHA (short) | Last commit date | Last commit subject | Classification |
|---|---|---|---|---|
| `admin-v1` | `1ed03a1` | 2026-09-13 | "Wire Cloudflare agent guidance into AGENTS.md" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `codex/link-eternal-eggs-dashboard` | `1433137` | 2026-09-13 | "Test secure project URLs" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `design-v2` | `a6cff52` | 2026-09-11 | "Refine V2 visual system, mobile layout, and remove dominant hero photography" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `master-plan-v1` | `6847026` | 2026-09-12 | "Log safe Master Plan V1 preparation changes" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `redesign/immersive-bridge-v2` | `8763312` | 2026-09-11 | "Mark admin route private for search indexing" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `website-v3.1` | `0f311b8` | 2026-09-11 | "Style immersive V3.1 glass-system interface" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `website-v3.1.1` | `5789594` | 2026-09-11 | "Bump website to V3.1.1 and add admin email" | `UNINSPECTED LEGACY/EXPERIMENTAL` |
| `website-v3.1.2` | `6204519` | 2026-09-11 | "Add canonical reversed icon for dark website backgrounds" | `UNINSPECTED LEGACY/EXPERIMENTAL` |

Evidence: `git log -1 --format="%H %ci %s" origin/<branch>` run against each branch during this Phase 1 cycle.

Note for Paulo/Architect awareness: two of the subject lines above (`redesign/immersive-bridge-v2`: "Mark admin route private for search indexing"; `website-v3.1.1`: "Bump website to V3.1.1 and add admin email") mention admin-related content by commit-message title alone. This is recorded as a subject-line observation only — no branch content was opened or inspected — and should inform, not preempt, the "deliberately reviewed" step required before any future reuse.

Do not merge, cherry-pick, or import content from any of these branches into `governance/maisoglabs-v0.1` or `main` without a separate, explicit Paulo authorization and Architect review of that specific branch's content.
