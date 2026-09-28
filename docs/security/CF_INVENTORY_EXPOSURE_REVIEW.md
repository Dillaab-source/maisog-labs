# Cloudflare Inventory & Exposure Review (D-102, assessment only)

- **Cycle:** `MAISOGLABS_CF_INVENTORY_REVIEW`
- **Directive:** `DIR-WEB-CF-INVENTORY-0001`
- **Return:** `H-WEB-CF-INVENTORY-0001`
- **Reading time:** 2026-09-28, about 07:45–08:05 UTC
- **Account:** `fb7234ae…`
- **Zone:** `maisoglabs.com` (`22a56d25…`, Free plan)

This is evidence, not authority. Nothing in it authorizes a change.

Every Cloudflare reading below was a connector `GET` (`ACTOR_REPORTED`). There was no D1 SQL, no R2 object listing or read, and no secret value was read. Worker bundle source was read, and only its authentication and route logic was inspected. HTTP probing was limited by the cloud session's network allowlist; see §9.

The repository is public, so the Access allow-list identity is redacted here. It can be read in the dashboard.

## 1. Resource inventory

### Workers (`*.paulomaisog284.workers.dev`)

| Worker | Created / last deploy | Deploy source | Active version | Custom domain | workers.dev / previews | Bindings |
|---|---|---|---|---|---|---|
| `maisog-labs` | 2026-09-10 / 2026-09-28 (`3bf053d6…`) | Workers Builds, repo-connected (`Dillaab-source/maisog-labs`) | `53137101…` @ 100%, 783 versions | `maisoglabs.com` | **on / on** | D1 `DB` → `maisog-labs-web-inc-005-local`; R2 `MEDIA` → `maisog-labs-web-inc-004-local`; vars `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` = **placeholders**; `ASSETS` |
| `maisog-admin` | 2026-09-12 / 2026-09-13 | wrangler (manual), 3 versions | `53a5abd5…` @ 100% | `admin.maisoglabs.com` | off / off | D1 `DB` → **`maisog-cms`**; R2 `MEDIA` → **`maisog-media`**; `ACCESS_AUD` (the admin Access app), `ACCESS_ISSUER`, `ADMIN_ORIGIN=https://admin.maisoglabs.com`; `ASSETS` |
| `maisog-admin-staging` | 2026-09-13 / 2026-09-13 | wrangler (manual), 5 versions | `b7dae41f…` @ 100% | `staging-admin.maisoglabs.com` | **on** / off | D1 `DB` → **`maisog-cms` (same as production admin)**; R2 → **`maisog-media` (same)**; `ACCESS_AUD` (the staging Access app), `ACCESS_ISSUER`, `ADMIN_ORIGIN=https://staging-admin…`, **`ACCESS_DIAGNOSTIC=1`**; `ASSETS` |
| `maisog-labs-staging` | 2026-09-13 / 2026-09-13 | wrangler (manual), 1 version | `5a178e36…` @ 100% | none | **on / on** | D1 `DB` → **`maisog-cms`**; R2 `MEDIA` → **`maisog-media`**; `ASSETS` |
| `eternal-eggs-dashboard` | 2026-09-12 / 2026-09-12 | dashboard, 2 versions | `ab18002d…` @ 100% | none | **on** / off | none (assets only) |

There are no zone Worker routes; every hostname is bound through a Custom Domain. The only Workers Builds triggers are on `maisog-labs`:

- `main` → `npx wrangler versions upload`;
- **every non-`main` branch** → `npx wrangler versions upload`, which creates a preview version.

### Pages

| Project | Created / last deploy | Source | Domains | Bindings |
|---|---|---|---|---|
| `maisog-jobs` | 2026-09-20 / 2026-09-20 (`8ad27547…`, production) | **Direct upload**, no Git connection | `maisog-jobs.pages.dev` only | D1 `DB` → `maisog-jobs` |

### D1 (metadata only)

| Database | UUID | Created | Region | Size / tables | Bound by |
|---|---|---|---|---|---|
| `maisog-labs-web-inc-005-local` | `45b87574…` | 2026-09-18 | WNAM | 278 kB / 23 | `maisog-labs` (production website) |
| `maisog-cms` | `72dfb480…` | 2026-09-11 | APAC | 139 kB / 9 | `maisog-admin`, `maisog-admin-staging`, `maisog-labs-staging` |
| `maisog-jobs` | `1f1923ec…` | 2026-09-20 | APAC | 53 kB / 3 | Pages `maisog-jobs` |

### R2 (configuration only)

| Bucket | Created | r2.dev public URL | Custom domains | CORS | Bound by |
|---|---|---|---|---|---|
| `maisog-labs-web-inc-004-local` | 2026-09-19 | disabled | none | none | `maisog-labs` |
| `maisog-media` | 2026-09-12 | disabled | none | none | `maisog-admin`, `maisog-admin-staging`, `maisog-labs-staging` |

Neither bucket is directly public.

### Access (Zero Trust organization "Maisog Labs", team domain `jolly-disk-0469.cloudflareaccess.com`)

| Application | Covers | Session | IdP | Policy |
|---|---|---|---|---|
| `maisoglabs.com` (AUD `ef44d36e…`) | `maisoglabs.com/admin`, `/admin/*` | 24h | One-Time PIN only | allow one email (redacted) |
| Maisog Labs Admin Portal V1 (AUD `1bfe97a9…`) | `admin.maisoglabs.com`, `/*` | 30m | One-Time PIN only | same reusable policy |
| Maisog Labs Admin V1 — Staging (AUD `2adfce39…`) | `staging-admin.maisoglabs.com`, `/*` | 30m | One-Time PIN only | same reusable policy |

- No Access application covers any `*.workers.dev` or `*.pages.dev` host, or `n8n.maisoglabs.com`.
- The allowed email is **not** the Cloudflare account email. The owner should confirm it is intended.
- It equals the `ADMIN_EMAIL` constant hard-coded in both admin Worker bundles.

### DNS / other (discovered; not in the D-101 list)

- `maisoglabs.com`, `admin.` and `staging-admin.`: Worker Custom Domain records (`AAAA 100::`, proxied).
- MX/SPF/DKIM for Cloudflare Email Routing.
- **`n8n.maisoglabs.com`:** CNAME to Cloudflare Tunnel `maisoglabs-n8n` (`71250c4d…`), proxied, ingress `http://localhost:5678`. The tunnel is currently **down** (0 connectors). It is not referenced anywhere in the repository.

## 2. Repository ↔ Cloudflare mapping

| Cloudflare resource | Repository source of deployed code | Repository documentation of intent |
|---|---|---|
| `maisog-labs` + `maisoglabs.com` | `main` / governance branch (`wrangler.jsonc`, `worker/`) | Yes: `wrangler.jsonc`, `docs/ARCHITECTURE.md`, D-098..D-101 |
| D1 `maisog-labs-web-inc-005-local`, R2 `maisog-labs-web-inc-004-local` | `wrangler.jsonc` bindings, `migrations/` | Yes; the `-local` suffix is historical (D-098) |
| Placeholder `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN` | `wrangler.jsonc` vars; `worker/auth.mjs` fails closed on them | Yes: intentionally inert (RFC-002 §4, AS12-F001) |
| Access app `maisoglabs.com` (`/admin`) | none (dashboard-configured) | Implied by WEB-INC-001, but its AUD is not wired into the Worker (placeholders) |
| `maisog-admin`, `maisog-admin-staging` | **No branch of this repository contains their code** (`ADMIN_ORIGIN`, `ACCESS_ISSUER`, `ACCESS_DIAGNOSTIC`); all remote branches were searched | Names `maisog-cms` / `maisog-media` come only from the `master-plan-v1` planning doc; D-101 inventory note only |
| `maisog-labs-staging` | **No branch contains its code** (`/api/public/v1/content`, `/api/public/v1/media/:id`) | D-101 inventory note only |
| D1 `maisog-cms`, R2 `maisog-media` | none | `master-plan-v1` plan (uninspected legacy branch); D-101 note |
| Pages `maisog-jobs` + D1 `maisog-jobs` | none. `feature/jobs-dashboard-v1` (2026-09-21, "Add interactive job tracker dashboard") is the probable origin, but its `wrangler.jsonc` names `maisog-labs`, so the link is **unproven** | D-101 note; AS116 Stage B "not touched" |
| `eternal-eggs-dashboard` | none (dashboard upload) | Linked only by the legacy branch `codex/link-eternal-eggs-dashboard` (`data/site.js` `projectUrl`); **not** linked from `main` |
| Tunnel `maisoglabs-n8n` / `n8n.maisoglabs.com` | none | none |

## 3. Classification

| Resource | Class | Basis |
|---|---|---|
| `maisog-labs` (production), `maisoglabs.com`, its D1/R2 | **1 DOCUMENTED + INTENTIONAL** | Governed through D-098..D-101 |
| `maisog-labs` `workers.dev` + preview URLs (783 versions, per-branch uploads) | **5 SECURITY / EXPOSURE CONCERN** | See F-1 |
| Placeholder `ACCESS_AUD` / `ACCESS_TEAM_DOMAIN` | **1 DOCUMENTED + INTENTIONAL**, with an owner note | A fail-closed design. `/admin` on the apex is therefore non-functional behind Access. That is by design until wiring is authorized (F-6) |
| Access app `maisoglabs.com` (`/admin`) | **2 INTENTIONAL BUT UNDER-GOVERNED** | Exists and works at the edge; not recorded in the repo; 24h session vs 30m elsewhere |
| `maisog-admin` + `admin.maisoglabs.com` + its Access app | **2 INTENTIONAL BUT UNDER-GOVERNED** | Well-defended runtime; source not in the repo; no governance record |
| `maisog-admin-staging` + `staging-admin.maisoglabs.com` | **5 SECURITY / EXPOSURE CONCERN** | Not isolated from production CMS data; diagnostic mode on; workers.dev on (F-2, F-4) |
| `maisog-labs-staging` | **5 SECURITY / EXPOSURE CONCERN**, and probably 3 | Unauthenticated public read of `maisog-cms` / `maisog-media` via workers.dev and previews (F-3); single 2026-09-13 upload; looks like a stalled experiment |
| D1 `maisog-cms`, R2 `maisog-media` | **4 UNKNOWN — NEEDS OWNER DECISION** | May hold real admin/CMS data; three Workers depend on them |
| Pages `maisog-jobs` + D1 `maisog-jobs` | **4 UNKNOWN — NEEDS OWNER DECISION** | Separate product; direct upload; public `pages.dev`; auth posture unverified (F-7) |
| `eternal-eggs-dashboard` | **4 UNKNOWN — NEEDS OWNER DECISION** | Separate project, publicly reachable, not linked from `main`; its content was not inspected |
| Tunnel `maisoglabs-n8n` / `n8n.maisoglabs.com` | **5 SECURITY / EXPOSURE CONCERN** (latent) and **4** | No Access app. If the tunnel comes back up, n8n is internet-facing, protected only by n8n's own login (F-5) |
| Email Routing MX/SPF/DKIM | **4 UNKNOWN** (probably intentional) | Not documented in the repo |

## 4. Exposure and security findings

**F-1 — the production-bound `maisog-labs` has public `workers.dev` and per-version preview URLs, and every branch push publishes one (HIGH, governance and exposure).**

Every non-`main` push creates a public preview URL. That URL runs the pushed, unreviewed code with the **production D1 and R2 bindings**, because each branch version is uploaded with `wrangler.jsonc`'s bindings, which pin the production D1 `45b87574…` and R2 bucket. So far this has produced 783 versions. This session's own branch pushes created v781 and v783; neither was deployed.

Access covers only `maisoglabs.com/admin`, so on these hosts the Worker's own fail-closed guard is the only `/admin` protection. It was observed working: an unauthenticated `GET https://53137101-maisog-labs…workers.dev/admin` returned `401`.

Anyone with push access can therefore run arbitrary code against production data at a public URL, bypassing the PR/Gate C/Gate D sequence (OBL-017). Older preview versions stay reachable with older code.

**F-2 — "staging" admin is not isolated (HIGH, integrity).**

`maisog-admin-staging` binds the **same** D1 (`maisog-cms`) and R2 (`maisog-media`) as `maisog-admin`. Any write through `staging-admin.maisoglabs.com` changes production admin data. `maisog-labs-staging` shares them too.

**F-3 — unauthenticated public read path onto the admin CMS (MEDIUM, draft/private exposure; RISK-WEB-013 class).**

`maisog-labs-staging` serves `GET /api/public/v1/content` and `/api/public/v1/media/:id` on its public `workers.dev` and preview URLs. These return the current `maisog-cms` publication and its "ready" media from `maisog-media`. The admin bundle marks publications `publicDeliveryConnected: false`, which suggests this content was **not intended to be public**. Whether any publication currently exists could not be checked, because no SQL is allowed.

**F-4 — diagnostic mode enabled on staging admin (LOW).**

`ACCESS_DIAGNOSTIC=1` makes `maisog-admin-staging` return detailed Access-failure categories (for example missing assertion, audience, signature). This is a minor information leak. Its `workers.dev` host is on, but the Worker's `Origin === ADMIN_ORIGIN` check rejects that host with `403` before authentication, so it is not an Access bypass.

**F-5 — `n8n.maisoglabs.com` tunnel with no Access (MEDIUM, latent).**

The DNS record and tunnel config remain, with ingress to `localhost:5678`. The tunnel is currently down, so there is no exposure right now. Whenever the connector runs, n8n (automation, credentials store) is public, guarded only by its own login.

**F-6 — the apex `/admin` Access application and the Worker are not wired (INFO).**

The Access app `maisoglabs.com` exists (AUD `ef44d36e…`), but `maisog-labs` still carries placeholders, so the Worker rejects every request. This is safe. However, the governed admin path is non-functional, and a separate, ungoverned admin (`admin.maisoglabs.com`) is the one that actually works.

**F-7 — `maisog-jobs` and `eternal-eggs-dashboard` are public without Access (UNVERIFIED).**

Both are reachable on public `*.pages.dev` / `*.workers.dev` hosts with no Access app. Whether they expose anything sensitive is unknown, because their content was not probed (§9).

**F-8 — admin identity and IdP (INFO / owner confirmation).** All three Access apps allow a single email via One-Time PIN only. It is not the account email, and it is hard-coded as `ADMIN_EMAIL` in the admin bundles. Session length differs: 24h on the apex app vs 30m on the others.

**Not a finding:**

- R2 buckets are not public (r2.dev disabled, no custom domains, no CORS).
- `maisog-admin` has `workers.dev` off.
- Both admin bundles verify the Access JWT with issuer, AUD, `RS256` and email pinned, after an origin check.

## 5. Suspected legacy resources (not safe to delete on this evidence)

- **`maisog-labs-staging`:** one upload on 2026-09-13, never updated, no custom domain, code not in the repo. Probably an abandoned public-delivery experiment for the `master-plan-v1` CMS. However, it is live and reads `maisog-cms`.
- **The `maisog-admin` / `maisog-admin-staging` stack, `maisog-cms`, `maisog-media`:** the pre-governance "Admin V1" line (2026-09-12/13, before the governance baseline). It has been superseded in the repository by the governed WEB-INC admin inside `maisog-labs` (D1 `…-005-local`, R2 `…-004-local`). But it is the only **working** admin, and it may hold real content.
- **Old `maisog-labs` preview versions (#1–#780):** historical.
- **`eternal-eggs-dashboard`:** a 2026-09-12 dashboard upload for a separate project. It is legacy for this repository, but may be live for Eternal Eggs.

## 6. Dependency uncertainties

- `maisog-cms` / `maisog-media` are bound by three Workers. Removing either breaks `admin.maisoglabs.com`. Whether they contain the only copy of any content is **unknown**.
- Whether anyone uses `staging-admin` or `maisog-labs-staging` (analytics not read), and whether any external site or app calls `/api/public/v1/*`, is unknown.
- The source code of `maisog-admin*`, `maisog-labs-staging` and `maisog-jobs` exists only in Cloudflare (and perhaps on a local machine). Deleting a Worker may lose the only copy of its source; Cloudflare-side bundles are compiled output.
- It is unknown whether `maisog-jobs` Pages is the output of `feature/jobs-dashboard-v1`, and whether `n8n` is still used.
- `eternal-eggs-dashboard` belongs to another project, and its owner and dependants are unknown.
- The `maisog-labs` preview toggle affects the Workers Builds PR preview flow, including the check-run preview links used in Gate C evidence.

## 7. Cleanup candidates (NOT executed; each needs its own authorization)

1. `maisog-labs-staging`: disable `workers.dev` and previews, then delete once confirmed unused.
2. `maisog-admin-staging`: disable `workers.dev`, set `ACCESS_DIAGNOSTIC` off, and either re-bind it to separate staging D1/R2 or retire it.
3. `n8n.maisoglabs.com`: add an Access app, or remove the DNS record and tunnel if n8n is no longer self-hosted.
4. Old `maisog-labs` versions: no per-version cleanup is proposed. Disabling previews (A-1) removes their public URLs.
5. `maisog-admin` stack, `maisog-cms`, `maisog-media`, `maisog-jobs`, `eternal-eggs-dashboard`: **no cleanup recommendation** until the owner decides their status (§8, A-0).

## 8. Smallest remediation plan (independently authorizable actions)

Ordered by risk reduction per unit of change. Each is one bounded Cloudflare setting or record change, with its own rollback, and none depends on another unless stated.

| ID | Action | Effect / risk | Rollback |
|---|---|---|---|
| **A-0** | **Owner decisions only (no Cloudflare change):** for each Class-4 resource, say intended / retire / other project; confirm the Access allow-list email; say whether `maisog-cms` holds content that must be kept; say whether n8n is still used. | Unblocks everything else | n/a |
| **A-1** | `maisog-labs`: disable **preview URLs** (`previews_enabled: false`). | Closes F-1's arbitrary-code-against-production-data path. Branch uploads still create versions but no public URL. Loses PR preview links; the Gate C/D smoke-test method would change (smoke-test via the `main`-alias preview or another route). | Re-enable the toggle |
| **A-2** | `maisog-labs`: disable **`workers.dev`**. | Removes the non-Access production host. Production is served only via `maisoglabs.com`. | Re-enable |
| **A-3** | `maisog-labs` Workers Builds: restrict the non-production trigger (for example to `governance/*`), or remove it. | Stops every branch creating production-bound versions | Restore the trigger |
| **A-4** | `maisog-labs-staging`: disable `workers.dev` and previews. | Closes F-3's public CMS read path without deleting anything | Re-enable |
| **A-5** | `maisog-admin-staging`: disable `workers.dev`; set `ACCESS_DIAGNOSTIC` to `0` or remove it. | Closes F-4 | Revert the var and toggle |
| **A-6** | `n8n.maisoglabs.com`: create an Access app with the existing reusable policy, **or** delete the CNAME and tunnel (per A-0). | Closes F-5 before the tunnel next comes up | Remove the app / recreate the record |
| **A-7** | Governance record (repo-only): register every non-`maisog-labs` resource and its owner and status in `brain/PROJECT_GOVERNANCE.md` and the risk register (new risks for F-1, F-2, F-3, F-5). Recover the admin/staging source into version control if it is to be kept. | Makes the inventory durable | Git revert |
| **A-8** | Staging isolation: either retire `maisog-admin-staging` or re-bind it to new, separate staging D1/R2. | Closes F-2. Creating resources is a larger change, so do it after A-0 | Re-bind |
| **A-9** | Later, as a product cycle and not cleanup: decide the one canonical admin. Either wire the apex `/admin` (set `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` to the `maisoglabs.com` app) or formally adopt or retire the Admin V1 stack. Any retirement of `maisog-cms` / `maisog-media` would need a prior export decision. | Resolves F-6 and the dual-admin state | Per its own plan |

## 9. Evidence limits

- **HTTP probing was blocked by this environment's network allowlist.** Only `maisoglabs.com` and `53137101-maisog-labs…workers.dev` are reachable. Every other host returned a proxy `CONNECT 403` from the session egress, not from Cloudflare. Exposure conclusions for those hosts rest on configuration and the deployed bundle code, not on live responses.
- Deployed Worker code was read from Cloudflare (compiled bundles). `eternal-eggs-dashboard` and `maisog-jobs` content was not read.
- No D1 or R2 data was read, so data sensitivity and emptiness are unknown.
- Traffic and analytics were not read, so "unused" is never asserted.
