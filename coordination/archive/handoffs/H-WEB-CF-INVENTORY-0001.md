# Current Handoff — Cloudflare Inventory & Exposure Review (D-102, read-only)

```yaml
schema_version: 1
handoff_id: H-WEB-CF-INVENTORY-0001
cycle_id: MAISOGLABS_CF_INVENTORY_REVIEW
input_base_commit: 9e8c9f5006f0654eac7c139a41ef4d21b71a5f34
review_target_commit: 9e8c9f5006f0654eac7c139a41ef4d21b71a5f34
applicable_review_id: ML-DEVOS-AS-128
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. All Cloudflare evidence is `ACTOR_REPORTED`: connector `GET` reads made from this authenticated cloud session.

## Objective

Execute `DIR-WEB-CF-INVENTORY-0001` (D-102): a read-only inventory and classification of the Cloudflare resources found during D-101, mapped against repository intent. The deliverables are findings and a remediation proposal. Nothing is executed.

## Result

**Assessment complete. No mutation was made.** The full report is `docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md`. In brief:

1. **Inventory:**
   - 5 Workers, 1 Pages project, 3 D1 databases, 2 R2 buckets, 3 Access apps, 3 Worker custom domains;
   - one extra resource outside the D-101 list: the `n8n.maisoglabs.com` Cloudflare Tunnel, currently down, with no Access app.
2. **Repo ↔ Cloudflare:** only `maisog-labs`, with its D1 `…-005-local` and R2 `…-004-local`, is sourced from and documented in this repository. **The deployed code of `maisog-admin`, `maisog-admin-staging`, `maisog-labs-staging` and Pages `maisog-jobs` exists on no branch** (all remote branches were searched). `maisog-cms` / `maisog-media` appear only in the uninspected `master-plan-v1` plan.
3. **Exposure findings:**
   - **F-1 (HIGH):** `maisog-labs` previews and `workers.dev` are on. Every non-`main` branch push publishes a public preview URL running unreviewed code bound to the production D1/R2 (783 versions so far), which bypasses the Gate C/D path.
   - **F-2 (HIGH):** staging admin shares production `maisog-cms` / `maisog-media`, so it is not isolated.
   - **F-3 (MEDIUM):** `maisog-labs-staging` serves an unauthenticated public read of the admin CMS publication and media on `workers.dev`.
   - **F-4 (LOW):** `ACCESS_DIAGNOSTIC=1` is set on staging admin.
   - **F-5 (MEDIUM, latent):** n8n tunnel with no Access app.
   - **F-6 (INFO):** the governed apex `/admin` is safe but non-functional (placeholders), while the ungoverned `admin.maisoglabs.com` is the working admin.
   - **F-7 (UNVERIFIED):** `maisog-jobs` and `eternal-eggs-dashboard` are public with no Access app.
   - **F-8 (INFO):** confirm the single allow-listed admin email.
   - R2 is not public. The admin bundles verify the Access JWT correctly behind an origin check.
4. **Suspected legacy:**
   - `maisog-labs-staging`;
   - the pre-governance Admin V1 stack (`maisog-admin*`, `maisog-cms`, `maisog-media`), which is nonetheless the only working admin;
   - old `maisog-labs` preview versions;
   - `eternal-eggs-dashboard` (legacy for this repo; possibly live for Eternal Eggs).
5. **Dependency uncertainties:**
   - `maisog-cms` / `maisog-media` have three dependants and unknown content;
   - Worker source may exist only in Cloudflare;
   - usage is unknown (analytics not read);
   - the origin of `maisog-jobs` is unproven;
   - n8n usage is unknown.
6. **Cleanup candidates (not executed):**
   - `maisog-labs-staging` exposure, then retirement;
   - staging admin hardening or retirement;
   - n8n DNS/tunnel or an Access app for it.

   No deletion is recommended for any Class-4 resource before owner decisions.
7. **Remediation plan:** A-0 (owner decisions only) and A-1…A-9, each one bounded setting or record change with its own rollback (report §8).
8. **Before returning to product development:**
   - **Recommended first:** A-0 (owner decisions), then A-1 (disable `maisog-labs` preview URLs) and A-4 (disable `maisog-labs-staging` `workers.dev` and previews). These are small, reversible setting toggles that close the two paths reaching real data without authentication or review.
   - **Also before n8n is next started:** A-6.
   - **Can run alongside product work:** A-2, A-3, A-5, A-7; A-8 and A-9 are larger follow-ups.

   This is a Builder recommendation; the owner decides.

## Changed files

This return commit changes only:

- `docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md` (new): the assessment report.
- `coordination/CURRENT_HANDOFF.md`: this handoff.
- `coordination/STATE.md`: routed to `TURN: ARCHITECT`, directive deselected, all flags `NO`.
- `coordination/archive/directives/DIR-WEB-CF-INVENTORY-0001.{md,provenance.json}`: byte-identical directive archive, plus its index row.

The cycle-opening commit `9e8c9f5` (D-102 and the directive) is the other commit in this cycle.

## Tests and evidence

**Bootstrap:**
- `check-context-bootstrap.mjs --commit 9e8c9f5… --session-protocol 2`: exit 0.
- `main` is `6e14077…`.

**Cloudflare `GET` reads:**
- Workers: scripts, settings/bindings, subdomain toggles, deployments, versions, custom domains, and Builds triggers (by script tag);
- Pages projects;
- D1 list and metadata;
- R2 buckets, managed-domain, custom-domain and CORS configuration;
- Access organization, IdPs, apps and policies;
- zones, DNS records and zone Worker routes;
- Cloudflare Tunnels and their configuration;
- the deployed bundles of `maisog-admin`, `maisog-admin-staging`, `maisog-labs-staging` and `eternal-eggs-dashboard` (2 bytes; assets only), inspected only for authentication and route logic.

**HTTP (unauthenticated `GET`):**
- `https://53137101-maisog-labs.paulomaisog284.workers.dev/admin` returned `401`, so the Worker fails closed.
- Every other host returned a session-proxy `CONNECT 403` (network allowlist). This is recorded as an evidence limit, not as a Cloudflare response.

**Repository:** references were searched across all remote branches (a local fetch only; nothing on GitHub changed).

## Unresolved findings and limitations

1. **Live exposure probes were not possible** except on the two allowlisted hosts. F-3, F-4 and F-7 rest on configuration and bundle code, not on observed responses.
2. **No data reads:** it is unknown whether `maisog-cms` has a current publication (F-3 severity) or what `maisog-cms`, `maisog-media` or `maisog-jobs` contain.
3. **Side effect of publishing, disclosed:** under F-1, this session's own branch pushes, and every governance-branch push, cause Workers Builds to upload non-production preview versions of `maisog-labs` (for example v781 and v783 from `claude/maisoglabs-protocol-v2-resume-7o14cx`). Publishing this return will add another. None was deployed; production remains `53137101…` @ 100%.
4. **Redaction:** the Access allow-list email is not written in this public repository.
5. **Carried forward:**
   - S6 parked at ML-DEVOS-AS-103;
   - O1 and O2 open;
   - D-068 held;
   - OBL-017 (production gate sequence) is directly affected by F-1;
   - OBL-019/OBL-020 risks (RISK-WEB-002, -013) are touched by F-1 and F-3. The risk register was not edited (assessment only; A-7).

## Confirmations

- Only `GET` Cloudflare calls. No deploy, deletion, rename, or traffic, DNS, Access, Worker-setting, preview-setting, binding, secret or environment change.
- No D1 SQL, no R2 object listing or read, no secret values read, no authenticated application requests.
- No `main`, PR #7, PR #10, S6/S7 or D-068 action. Remote branches were fetched locally only, never modified.

## Evidence locations

- `docs/security/CF_INVENTORY_EXPOSURE_REVIEW.md` (inventory tables with IDs, mapping, classification, findings, plan).
- Cloudflare account `fb7234ae…`, zone `22a56d25…`; the resource IDs are listed in the report.
- `coordination/archive/directives/DIR-WEB-CF-INVENTORY-0001.md`.

## Governing references

- **Authority:** D-102 (assessment only).
- **Directive:** DIR-WEB-CF-INVENTORY-0001 (archived).
- **Reviews:** ML-DEVOS-AS-128.
- **Decisions:** D-101 (inventory findings), D-098 (`-local` naming), D-057/OBL-017 (production gate sequence).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews this assessment under the next unused immutable Architect Sync ID after ML-DEVOS-AS-128, and routes the owner decisions (A-0) and any remediation authorizations to Paulo. Nothing in this return authorizes a change.
