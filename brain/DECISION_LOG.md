# Decision Log

Chronological record of governance-relevant decisions. Newest entries at the bottom. Each entry cites the deciding role and the evidence/commit it rests on.

---

### D-001 — Adopt MaisogLabs Governance v0.1 for the website pilot

- **Decided by:** Paulo (Product / Risk Owner)
- **Date/context:** Governance plan authored and merged to `governance/maisoglabs-v0.1` (`f7bb45b`, `docs(governance): add MaisogLabs governance and admin-first plan`).
- **Decision:** Adopt `docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt` as the governing plan for this repository's website/admin work, with Paulo as Product/Risk Owner, ChatGPT as Architect, and Claude as Implementer.

### D-002 — Record legacy baseline SHA

- **Decided by:** Governance plan (Paulo-approved) / confirmed by Claude in Phase 0
- **Decision:** `887849283ee9cd16e8d60b937bac95b1c85bf3d9` (`main` HEAD, "Add validated Phase 2 content layer") is the legacy baseline. Governance is prospective from this SHA; earlier history is not retroactively governed.
- **Evidence:** `git merge-base HEAD origin/governance/maisoglabs-v0.1` = this SHA; `git rev-parse main` = this SHA (verified in Phase 0 handoff and unchanged as of Phase 1).

### D-003 — Approve Phase 0 (Repository Reconnaissance Only)

- **Decided by:** Paulo
- **Decision:** Authorize Claude to perform repository reconnaissance only; no functional, deployment, or `main`-merge changes.
- **Evidence:** `CLAUDE.md` "Current authorized scope" section at the time; `coordination/STATE.md` `CYCLE_ID: PHASE-0-RECON`.

### D-004 — Close Phase 0 stage gate

- **Decided by:** ChatGPT (Architect), Stage Gate Review
- **Decision:** `PHASE 0 STAGE GATE: APPROVED`. Reconnaissance was complete and accurate; no application code changed; handoff and turn-state mechanics functioned correctly. Verdict explicitly did not approve any functional implementation and required Paulo authorization before Phase 1.
- **Evidence:** `coordination/ARCHITECT_REVIEW.md` (reviewed handoff SHA `2e97bf65423daad59348b98860f6bf7ebaec4215`).

### D-005 — Approve Phase 1 (Governance Bootstrap Only)

- **Decided by:** Paulo
- **Decision:** Authorize Claude to perform governance bootstrap only (create `brain/*`, extend `AGENTS.md`, reconcile the deployment-wording contradiction, inventory legacy branches, preserve the existing content boundary). No admin implementation, authentication, D1/R2, public redesign, deployment, or `main` merge is authorized.
- **Evidence:** `CLAUDE.md` "Current authorized scope: PHASE 1 — GOVERNANCE BOOTSTRAP ONLY. Paulo has explicitly approved this phase."; `coordination/STATE.md` `CYCLE_ID: PHASE-1-GOVERNANCE-BOOTSTRAP`, `AUTHORIZED_SCOPE: PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY`.

### D-006 — Reconcile deployment-wording contradiction (documentation only)

- **Decided by:** Claude (Implementer), acting on Architect finding F-003 and Paulo-approved Phase 1 scope item A
- **Decision:** `AGENTS.md` and `README.md` are updated to describe the stack as a static export served via a Cloudflare Worker asset-only deployment through Wrangler, matching `docs/ARCHITECTURE.md` and `wrangler.jsonc`, rather than "Cloudflare Pages." No infrastructure, build command, or deployment target was changed — this is a documentation correction only.
- **Evidence:** This commit's diff to `AGENTS.md` and `README.md`; no diff to `wrangler.jsonc`, `next.config.mjs`, or `package.json` scripts.

### D-007 — Preserve the existing content boundary as the governed baseline

- **Decided by:** Claude (Implementer), acting on Architect finding F-002 and Paulo-approved Phase 1 scope item C
- **Decision:** The existing `data/site.js → lib/content/local.mjs → lib/content/schema.mjs → lib/content/public.mjs → app/page.js` boundary is recorded as the governed content architecture in `PROJECT_GOVERNANCE.md`. Future Admin/CMS work must preserve it or replace it only through a new, explicitly recorded decision in this log — not silently.
- **Evidence:** `brain/PROJECT_GOVERNANCE.md` § "Current storage model"; no changes made to `lib/content/*` or `data/site.js` in this cycle.

### D-008 — Classify non-governance branches without inspection or merge

- **Decided by:** Claude (Implementer), acting on Architect finding F-004 and Paulo-approved Phase 1 scope item B
- **Decision:** The eight known non-governance remote branches (`admin-v1`, `codex/link-eternal-eggs-dashboard`, `design-v2`, `master-plan-v1`, `redesign/immersive-bridge-v2`, `website-v3.1`, `website-v3.1.1`, `website-v3.1.2`) are recorded in `PROJECT_GOVERNANCE.md` as `UNINSPECTED LEGACY/EXPERIMENTAL`, from Git metadata only. None were opened, reviewed, or merged. `admin-v1` specifically is not reused merely because it exists.
- **Evidence:** `brain/PROJECT_GOVERNANCE.md` § "Legacy / non-governance branch inventory"; `git log -1` output per branch recorded in the same section.
