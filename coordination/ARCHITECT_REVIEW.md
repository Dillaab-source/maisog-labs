# Architect Review

Status: `CHANGES_REQUESTED`

Architect: ChatGPT
Product / Risk Owner: Paulo
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-012 — WEB-INC-001 Remediation Cycle 1 Verification

Cycle: `MAISOGLABS-WEB-INC-001-AUTH`
Review mode: `POST-REMEDIATION ARCHITECTURE / SECURITY / SOURCE-OF-TRUTH REVIEW`
Authority chain: `ML-DEVOS-RFC-002 → ML-DEVOS-AS-011 → D-023 → ML-DEVOS-AS-012`
Reviewed Builder remediation commit: `4a8cc86bf3caabecccb1b6ec24ad1f19269966e6`
Builder remediation base: `b0aa71a4ac0f4b0c9636ad4114b021a236eeafc5`

## Required review discipline performed

Before issuing this verdict, the Architect:

1. pulled the live governance branch and current `coordination/STATE.md`;
2. confirmed live HEAD is exactly Builder remediation commit `4a8cc86...`;
3. read the current Builder handoff and the previous `ML-DEVOS-AS-012` findings;
4. independently compared exact Builder range `b0aa71a... → 4a8cc86...`;
5. inspected `worker/auth.mjs`, `worker/index.mjs`, `wrangler.jsonc`, the updated auth tests, Product Technical Design, Project Governance, Governance Map, Risk Register, Test Ledger, handoff, and state;
6. compared the remediation against `ML-DEVOS-RFC-002`, `ML-DEVOS-AS-011`, `D-023`, and the active Product Build Pack;
7. checked for regression of the previously passing JWT-verification and selective Worker-first invariants;
8. checked traceability/provenance claims against the exact Git diff.

## Exact remediation diff

GitHub compare `b0aa71a4ac0f4b0c9636ad4114b021a236eeafc5 → 4a8cc86bf3caabecccb1b6ec24ad1f19269966e6` reports:

- exactly **1 Builder commit**;
- exactly **11 changed files**:
  - `brain/GOVERNANCE_MAP.md`
  - `brain/PROJECT_GOVERNANCE.md`
  - `brain/RISK_REGISTER.md`
  - `brain/TEST_LEDGER.md`
  - `coordination/IMPLEMENTER_HANDOFF.md`
  - `coordination/STATE.md`
  - `docs/product/TECHNICAL_DESIGN.md`
  - `tests/worker-auth.test.mjs`
  - `worker/auth.mjs`
  - `worker/index.mjs`
  - `wrangler.jsonc`

No D1/R2, later `WEB-INC-*`, S3, CI/ruleset, production deployment, or main-merge change appears in the Builder remediation diff.

## Finding dispositions

### AS12-F001 — RESOLVED

The remediation now validates authentication configuration before protected-path token verification.

Independent code inspection confirms:

- `isValidTeamDomain`, `isValidAudience`, and `isValidAuthConfig` exist;
- missing, blank, placeholder, scheme-bearing/path-bearing/malformed team-domain values are rejected;
- missing, blank, or placeholder audience values are rejected;
- protected-path handling checks config before invoking `getJWKS`;
- invalid config returns `401` without `assets.fetch`;
- the tests include a spy asserting no `getJWKS` call for invalid configuration;
- a validly signed test token is explicitly unable to compensate for invalid config.

The critical fail-closed configuration invariant is now represented in code:

`INVALID REQUIRED AUTH CONFIG → NO JWKS RESOLUTION → NO ADMIN ASSET`

The previous token-level issuer/audience/signature/expiry tests remain present.

### AS12-F002 — PARTIALLY RESOLVED — residual current-state contradictions remain

The main stale statements identified in Cycle 1 were corrected:

- `jose` is now recorded as the implemented JWT dependency;
- the Worker + Assets deployment shape is recorded;
- the Product Technical Design no longer globally says there is no server-executed path;
- the proposed-target introduction no longer says the already-implemented authentication boundary does not exist;
- Project Governance no longer points to the closed Phase-1 bootstrap authorization as the current gate.

However, independent source-of-truth inspection found several remaining stale current-state statements:

1. `docs/product/TECHNICAL_DESIGN.md` still says under **System boundaries**:
   - `app/` currently has only route `/` plus generated `/_not-found`.
   
   That is now false because `app/admin/page.js` exists and the build produces `/admin`.

2. The same System-boundaries list omits the now-real `worker/` runtime boundary even though `docs/ARCHITECTURE.md` correctly records it.

3. `brain/GOVERNANCE_MAP.md` still records `WEB-REQ-004` evidence as:
   - `ADMIN STATUS: NOT IMPLEMENTED (no /admin route in app/)`.
   
   That is now factually false. The requirement itself is still correctly `NOT STARTED` because admin-managed content editing does not exist; the evidence/rationale must instead say that an **auth-only /admin placeholder exists, but no content-editing/persistence capability exists and edits still require source changes**.

4. `brain/RISK_REGISTER.md` still contains stale wording such as:
   - `RISK-WEB-007`: “no admin exists”;
   - `RISK-WEB-011`: “no admin exists yet to introduce a new injection surface”.
   
   The correct distinction is that an admin authentication placeholder now exists, while no admin **write/edit/mutation** surface exists.

Required remediation:

- correct the route inventory in `TECHNICAL_DESIGN.md`;
- add `worker/` to its current system-boundary list;
- correct `WEB-REQ-004` evidence without changing its still-correct `NOT STARTED` status;
- replace stale “no admin exists” risk wording with precise “no admin write/edit/mutation surface exists” wording;
- do not broaden implementation scope while correcting the records.

### AS12-F003 — RESOLVED AT REPOSITORY / LOCAL-EVIDENCE LEVEL

`wrangler.jsonc` now explicitly pins:

`assets.html_handling: "auto-trailing-slash"`

and preserves selective Worker-first routing:

`["/admin", "/admin/*"]`.

The Builder reports local Wrangler evidence for:

- `/admin` → 401 unauthenticated;
- `/admin/` → 401 unauthenticated;
- `/admin.html` → 307 to `/admin`, empty body, followed by 401;
- `/admin/index.html` → 401.

The pinned configuration and routing shape are independently inspected and consistent with the remediation request.

The exact local Wrangler smoke-test outputs remain `ACTOR_REPORTED` in this Architect review; production behavior remains unclaimed and still requires later `RUNTIME_OBSERVED` evidence after a separately authorized deployment.

### AS12-F004 — PASS / PRESERVED

Core JWT verification remains fail closed for the required token-failure classes.

### AS12-F005 — PASS / PRESERVED

Worker-first routing remains selective and was not widened globally.

### AS12-F006 — PASS / PRESERVED

The Builder stayed within the authorized WEB-INC-001 remediation boundary.

### AS12-F007 — REQUIRED — durable Builder handoff has an exact-diff provenance defect

`coordination/IMPLEMENTER_HANDOFF.md` says:

> “Exactly 9 files”

for this remediation cycle.

The exact Git compare reports **11 changed files**.

The handoff's list covers the nine substantive remediation artifacts but omits the two normal coordination files that are nevertheless part of the commit:

- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

Because the heading says **Exact changed-file list**, these files must be counted.

Required remediation:

- correct the Cycle 1 remediation handoff from 9 to 11 changed files;
- include both coordination files in the exact list;
- preserve the distinction between substantive remediation files and normal handoff/state files if useful, but do not call a partial list exact;
- record that the Architect independently detected the count mismatch from Git compare.

This is a provenance/bookkeeping defect, not a runtime/security failure.

## Security verdict

The runtime/security remediation itself is materially improved and the three original security/config findings are resolved at the repository-design/code-inspection level.

No new security blocker was found in the auth logic during this pass.

The remaining blockers are source-of-truth convergence and exact-diff provenance.

## Evidence disposition

- exact Git diff and repository/code/config inspection: `INDEPENDENTLY_INSPECTED`;
- Builder `npm test`, build, dry-run, and local Wrangler smoke results: `ACTOR_REPORTED`;
- no production authentication/deployment evidence exists or is claimed.

No independent execution result is claimed in this pass.

## Verdict

`ML-DEVOS-AS-012: CHANGES_REQUESTED — WEB-INC-001 REMEDIATION CYCLE 2`

The auth implementation itself is now close to closure. Remediation Cycle 2 is deliberately narrow and documentation/provenance-focused.

WEB-INC-001 should not close until:

1. all current-state records agree that the auth-only `/admin` and `worker/` boundary now exist while write/edit/storage features do not; and
2. the Builder handoff truthfully records the exact 11-file remediation diff.

## Authorized Remediation Cycle 2 scope

Claude may modify only:

- `docs/product/TECHNICAL_DESIGN.md`;
- `brain/GOVERNANCE_MAP.md`;
- `brain/RISK_REGISTER.md`;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

`brain/PROJECT_GOVERNANCE.md` should remain unchanged unless a direct contradiction with the above corrections is discovered.

No runtime/auth code, tests, Wrangler config, package files, application route, D1/R2, later `WEB-INC-*`, S3, CI/ruleset, production Cloudflare configuration, deployment, or main-merge change is authorized in this remediation cycle.

## Deployment authority

`DEPLOY_AUTHORIZED: NO`

`MAIN_MERGE_AUTHORIZED: NO`

## Current gate

`CLAUDE WEB-INC-001 REMEDIATION CYCLE 2 — SUBJECT TO ML-DEVOS-AS-012`
