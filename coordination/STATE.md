# MaisogLabs Agent Coordination State

CYCLE_ID: MAISOGLABS-WEB-INC-001-AUTH
TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT
AUTHORIZED_SCOPE: WEB_INC_001_AUTH_BOUNDARY_ONLY
ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO
LAST_IMPLEMENTER_HANDOFF_SHA: 0a3d3831e16e520c74e391512253c57e3061916a  # NOTE: this is the base HEAD this implementation cycle started from; this cycle's own resulting commit SHA is not yet known at write time. Architect should replace this with the actual pushed HEAD SHA after inspection.
LAST_ARCHITECT_REVIEWED_SHA: 8dbf5c6350de153caaf5d0016989963e1be321da
CURRENT_REMEDIATION_CYCLE: 0
MAX_REMEDIATION_CYCLES: 3
DEPLOY_AUTHORIZED: NO
MAIN_MERGE_AUTHORIZED: NO

## Current baselines

Frozen Sentinel architecture:
- `ML-DEVOS-ARCH-001 / v1.2.0`

Active Sentinel governance-capability baseline:
- `v1.4.0`

Verified Product Build Pack:
- `ML-DEVOS-AS-010: ARCHITECT_APPROVED — PRODUCT BUILD PACK VERIFIED / REMEDIATION CLOSED`

## Authority chain for this cycle

RFC:
- `ML-DEVOS-RFC-002 — MaisogLabs WEB-INC-001 Authentication Boundary`
- status: `ACCEPTED`
- change class: `ARCHITECTURE`

Architect Sync:
- `ML-DEVOS-AS-011: ARCHITECT_APPROVED — WEB-INC-001 RFC-002 COMPATIBLE FOR BOUNDED IMPLEMENTATION`
- durable archive: `devos/changes/architect-syncs/ML-DEVOS-AS-011.md`

Paulo implementation decision:
- `D-023 — Authorize WEB-INC-001 authentication-boundary implementation`

Paulo's instruction `Proceed with authorizations` has been applied to this next dependency-ordered increment only. It is not blanket authorization for later increments.

## Builder objective — COMPLETE, submitted for Architect verification

Implemented a minimal fail-closed server-side authentication boundary for:

- `/admin`
- `/admin/*`

while preserving the current public website as static/asset-first and introducing no protected editorial reads or mutations. See `coordination/IMPLEMENTER_HANDOFF.md` for the exact diff, per-constraint disposition, and evidence (`ACTOR_REPORTED` until independently reproduced).

## Authorized repository implementation

Claude / Builder may:

- add a bounded Worker entrypoint/auth helper for protected admin paths;
- update `wrangler.jsonc` for a Worker script, Assets binding, and selective Worker-first routing for `/admin` and `/admin/*` only;
- add a minimal static `/admin` placeholder/shell solely to exercise the authentication boundary;
- add only dependency/dependencies actually required for maintained JWT verification and deterministic tests;
- add focused authentication/security tests;
- update `docs/ARCHITECTURE.md` and/or `docs/product/TECHNICAL_DESIGN.md` only to describe what actually became implemented;
- update relevant risk/test/governance traceability records only where required by the implemented increment;
- update `coordination/IMPLEMENTER_HANDOFF.md` and `coordination/STATE.md`.

Exact changed paths must be reported in the Builder handoff.

## Binding implementation constraints

### Protected-path routing

Worker-first routing must be selective:

- `/admin`
- `/admin/*`

Ordinary public routes/assets remain asset-first.

Global `run_worker_first: true` is not authorized.

### Authentication

For protected paths, the Worker must fail closed unless the Cloudflare Access assertion is server-side verified.

Reject at minimum:

- missing assertion;
- malformed assertion;
- expired/not-yet-valid assertion;
- untrusted signature/key;
- wrong issuer/team;
- wrong application audience.

A valid assertion is required before the admin asset is served.

### Secrets / identity

Do not commit:

- production credentials;
- private signing keys;
- real administrator identity data;
- production Access secrets;
- provider secrets.

Local tests must use deterministic test keys/JWKS and test issuer/audience values.

### Admin placeholder boundary

The minimal admin placeholder is only an authentication-boundary test surface.

It must not include:

- D1/private content;
- dashboard data;
- CRUD;
- publish/unpublish;
- media upload;
- theme controls;
- later `WEB-INC-*` functionality.

## Required Builder evidence

Before returning to Architect:

1. exact implementation diff;
2. `npm run build` result;
3. focused auth test result;
4. missing-token rejection;
5. malformed-token rejection;
6. expired-token rejection;
7. wrong-audience rejection;
8. valid signed deterministic test-token acceptance;
9. evidence ordinary public routes remain asset-first/unaffected;
10. secret/identity scan or equivalent evidence that no production secret/private key/admin identity was committed;
11. explicit list of known limitations;
12. explicit confirmation that no external Cloudflare resource was changed.

Builder evidence is `ACTOR_REPORTED` until independently verified. All 12 items above are addressed in `coordination/IMPLEMENTER_HANDOFF.md` § "Required Builder evidence."

## Explicitly prohibited

This cycle does NOT authorize:

- `WEB-INC-005` or any later `WEB-INC-*`;
- D1;
- R2;
- protected editorial reads;
- admin dashboard data;
- project/journal CRUD;
- content mutation;
- audit-log persistence;
- theme/design controls;
- production Cloudflare Access application/policy creation or modification;
- identity-provider configuration;
- real production secret/config provisioning;
- production deployment;
- protected/main merge;
- S3 or later Sentinel phases;
- project onboarding;
- product `.devos/` overlay;
- CI/workflows;
- GitHub rulesets/branch protection.

## External Cloudflare operation gate

Any real Cloudflare Access application/policy change is a separate sensitive operation.

Before that occurs:

1. prepare a concrete Sentinel Decision Packet;
2. bind it to the exact Cloudflare target/path/policy/change/rollback;
3. receive explicit Paulo authorization;
4. use an authorized Cloudflare capability;
5. capture runtime evidence after any separately authorized deployment.

No such external operation is authorized in this cycle.

## Architect review rule

After Builder handoff, Architect must pull the live branch/state and independently compare the exact Builder commit against:

- `ML-DEVOS-RFC-002`;
- `ML-DEVOS-AS-011`;
- `D-023`;
- `docs/product/BUILD_PLAN.md`;
- current website architecture/security constraints.

Architect must independently reproduce deterministic auth tests where practical before issuing PASS / CHANGES_REQUESTED.

## Current gate

`ARCHITECT WEB-INC-001 AUTHENTICATION-BOUNDARY VERIFICATION TURN`
