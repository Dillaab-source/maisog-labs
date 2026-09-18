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

| Role | Holder | Authority |
|---|---|---|
| Product / Risk Owner | Paulo | Final product authority. Approves material scope, architecture decisions, accepted risk, and every gated phase transition. Only Paulo can authorize the next phase, deployment, or a `main` merge. |
| Architect / Independent Reviewer | ChatGPT | Independently reviews architecture, implementation claims, tests, risks, and security against repository evidence. Writes `coordination/ARCHITECT_REVIEW.md`. Cannot authorize a new phase — only assess against the currently authorized one and recommend to Paulo. |
| Implementer | Claude | Inspects repository reality before acting, implements only the currently authorized scope, writes/updates tests, maintains governance documents, writes `coordination/IMPLEMENTER_HANDOFF.md`. May report `IMPLEMENTATION COMPLETE`. **May not self-certify `ARCHITECT VERIFIED`.** |

**Source of truth:** the repository, its committed tests, and runtime/deployment evidence. Agent statements alone — from any of the three roles — are not proof.

**No implementer self-certification:** a claim of `implemented`, `fixed`, `tested`, `secure`, `deployed`, or `complete` requires evidence (code, diff, test output, build output, runtime output, deployment logs, etc.), and Claude's own evidence is recorded as *implementer-reported* until the Architect independently reproduces or inspects it — see `TEST_LEDGER.md` and the evidence-class rule below.

## Current deployment model

Static Next.js export (`next.config.mjs`: `output: "export"`) served by Wrangler — **not** Cloudflare Pages. As of `WEB-INC-001`, this is a Worker script (`worker/index.mjs`, `wrangler.jsonc`'s `main`) plus a static Assets binding, with Worker-first routing selectively enabled for `/admin`/`/admin/*` only (`assets.run_worker_first`); every other route remains asset-first, exactly as the prior asset-only contract was. Evidence: `wrangler.jsonc` (`assets.directory: "./out"`, `main`, `run_worker_first`), `package.json` (`"deploy": "wrangler deploy"`), `docs/ARCHITECTURE.md`. This Phase 1 cycle corrected a prior documentation contradiction where `AGENTS.md` and `README.md` described the target as "Cloudflare Pages" (Architect finding F-003); both now describe the Worker/Wrangler asset deployment and point to `docs/ARCHITECTURE.md` as canonical — that correction remains true; only the underlying deployment shape itself has since evolved, via a separately authorized and reviewed increment (`ML-DEVOS-RFC-002`/`ML-DEVOS-AS-011`/`D-023`), not silently.

## Current storage model

Local, Git-backed content only. There is no database, no D1, no R2, and no external persistence layer. The governed content boundary, preserved as-is by this bootstrap (per Architect finding F-002 and the required Phase 1 item "Preserve current content architecture"):

```
data/site.js  →  lib/content/local.mjs  →  lib/content/schema.mjs  →  lib/content/public.mjs  →  app/page.js
   (source)      (build/server-only          (validation,             (published-only            (consumer;
                  async reader — a             unknown-field            projection, drops           renders only
                  seam for a future            rejection, link/         internal `state`            the projection)
                  D1 implementation,           HTML-injection           field)
                  not a live connection)       guards)
```

Any future Admin/CMS work must either preserve this boundary or deliberately replace it through an approved architecture decision recorded in `DECISION_LOG.md` — it must not be bypassed silently.

Draft/archived content in `data/site.js` is filtered out of the public projection at build time, but this is **not** confidentiality: the Git source remains public. This is documented in `docs/CONTENT.md` and repeated here because it is a governance-relevant security boundary, not just an engineering note.

## Current admin/auth status

`ADMIN STATUS: AUTHENTICATION BOUNDARY ONLY IMPLEMENTED (WEB-INC-001)`
`AUTHENTICATION STATUS: SERVER-SIDE FAIL-CLOSED VERIFICATION IMPLEMENTED FOR /admin, /admin/* ONLY — NO SESSION/EDITORIAL/MUTATION CAPABILITY`

As of `WEB-INC-001` (`ML-DEVOS-RFC-002` → `ML-DEVOS-AS-011` → `D-023`), a Worker entrypoint (`worker/index.mjs`, `worker/auth.mjs`) fail-closed-verifies a Cloudflare Access JWT assertion for `/admin` and `/admin/*` only, gating a minimal static placeholder (`app/admin/page.js`) — see `docs/ARCHITECTURE.md` § "Runtime flow" and `docs/product/TECHNICAL_DESIGN.md` § "Public/admin boundary — current" for the exact mechanism. This is repository-implemented and locally/deterministically tested (`tests/worker-auth.test.mjs`); no production Cloudflare Access application exists yet, so this is not production-verified (`coordination/IMPLEMENTER_HANDOFF.md` evidence classes apply). No session/cookie mechanism, no editorial/private data read, no content mutation, and no database access exist anywhere in `app/`, `components/`, `data/`, `lib/`, or `worker/` — every capability beyond this authentication check remains `NOT IMPLEMENTED`.

## Current restrictions

- **No deployment** is authorized except by explicit, separate Paulo authorization. Current value: `DEPLOY_AUTHORIZED: NO` (`coordination/STATE.md`).
- **No merge to `main`** is authorized except by explicit, separate Paulo authorization. Current value: `MAIN_MERGE_AUTHORIZED: NO` (`coordination/STATE.md`).
- No further website implementation is authorized beyond what a specific, currently active governance record permits. As of this cycle that is `WEB-INC-001`'s authentication boundary only (`ML-DEVOS-RFC-002`/`ML-DEVOS-AS-011`/`D-023`) — see `coordination/STATE.md` for the live gate. D1/R2 integration, any later `WEB-INC-*`, and further public-website redesign remain unauthorized until their own separate RFC/Architect-Sync/Paulo-decision chain is completed; this line is updated at each such authorization rather than left pointing at the closed `PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY` gate.
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
