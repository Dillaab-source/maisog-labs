# Architect Review / Implementation Handoff

Status: `AUTHORIZED_IMPLEMENTATION — RFC-015 RESERVED SUBSYSTEM LIFECYCLE + CLOSURE RECONCILIATION`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Builder: Claude  
Working branch: `governance/maisoglabs-v0.1`

---

# RFC-015 bounded implementation handoff

Authority:
- `ML-DEVOS-RFC-015 — DESIGN_ACCEPTED / IMPLEMENTATION AUTHORIZED`
- `ML-DEVOS-AS-059 — ARCHITECT_APPROVED`
- `D-044 — design acceptance`
- `D-045 — bounded implementation authorization + return-to-roadmap direction`

## Objective

Implement RFC-015 faithfully and minimally so Sentinel can represent and verify post-bootstrap reserved-root closure without adding a new phase, Skill, agent, database, runtime subsystem, or unrelated governance layer.

## Authorized files / surfaces

Builder may modify only:

- `devos/schemas/devos-manifest.schema.json`
- `devos/schemas/validate-devos-manifest.mjs`
- focused tests under `tests/*.test.mjs` specifically for RFC-015 manifest lifecycle behavior
- `brain/protocols/ARCHITECT_SYNC.md`
- narrowly necessary documentation comments/readmes that become materially false due to these exact changes
- `coordination/IMPLEMENTER_HANDOFF.md`
- `coordination/STATE.md`

Do not mutate `devos/devos-manifest.json` in this implementation cycle except if a purely schema-compatibility fixture copy is required inside tests. The live manifest instance remains unchanged until a later closure decision.

## Required schema behavior

### Reserved-root status

Extend reserved-root status to include:
- `NOT_IMPLEMENTED`
- S2-only `FOUNDATION_ACTIVE`
- `IMPLEMENTED`

`IMPLEMENTED` is descriptive only and grants no authority.

### closure_ref

Add optional:
`closure_ref: string | null`

For `IMPLEMENTED`:
- non-null;
- must resolve by ADR to exactly one `closure_history` entry;
- matched entry phase must equal root `owning_phase`;
- matched decision / architect_sync / version must be non-empty;
- resolved ADR / Decision / Architect Sync identifiers must satisfy existing repository ID conventions.

For `NOT_IMPLEMENTED` and `FOUNDATION_ACTIVE`:
- absent or null only;
- never a live closure reference.

Backwards compatibility:
- no existing root should become invalid solely because it lacks `closure_ref`;
- no existing live manifest migration is performed this cycle.

### FOUNDATION_ACTIVE

Preserve the existing invariant:
- only `devos/schemas/` may be `FOUNDATION_ACTIVE`.

Do not reinterpret other roots as foundation-active.

### executable_runtime_present

Clarify schema/procedure semantics by responsibility, not invocation method.

`false` means no active Sentinel operational subsystem that:
- owns/persists operational state;
- executes lifecycle/state transitions;
- dispatches/orchestrates actors;
- brokers/enforces capabilities;
- performs autonomous/consequence-bearing operational actions.

Repository-local schemas/validators/generators/tests can be executable and even CI-invoked without thereby becoming Sentinel runtime.

Do not rename the field.
Do not change the current live values.

## Validator requirements

Extend, do not replace, the existing zero-dependency validator.

Required focused cases include at minimum:
- current live manifest remains valid before any instance migration;
- `IMPLEMENTED` without `closure_ref` fails;
- dangling ADR closure_ref fails;
- duplicate matching ADR closure history fails;
- closure_ref to wrong owning phase fails;
- malformed ADR/Decision/Architect-Sync IDs fail;
- missing matched decision / architect_sync / version fails;
- non-implemented/foundation root with non-null closure_ref fails;
- only devos/schemas may be FOUNDATION_ACTIVE;
- valid synthetic implemented-root + matching closure-history fixture passes;
- implementation status cannot be inferred as authority;
- executable local validator/tooling does not by itself force runtime-present semantics.

Builder may refactor validator helpers only as necessary to implement/test these invariants.

## Architect Sync procedure

Add RFC-015's two closure moments under existing STAGE GATE REVIEW:

### D.1 Pre-decision Closure Preflight
Checks only proposed-package facts before Paulo closure authorization.

### D.2 Post-decision Closure Verification
Checks only final repository facts after an authorized closure mutation lands.

Preserve:
- exact base SHA;
- bounded diff;
- explicit version disposition;
- traceability baseline fingerprint;
- generated-output currency;
- baseline-error visibility;
- no new unexpected closure-induced ERROR;
- no silent next-phase authority.

Do not create a new record type, phase, Skill, scoring framework, CI gate, or runtime subsystem.

## Focused test integration

The repository test command already runs:
`node --test tests/*.test.mjs`

Builder may add one focused test file under `tests/` without modifying `package.json` unless a concrete test-discovery problem is proven. Do not add a new dependency.

## Strategic sequencing recorded by D-045

This implementation is intended to finish the last planned pre-S4 governance-hardening detour.

Do not implement the later closure package now.

After independent acceptance, the future preferred closure proposal is:
- Skills/Treasury explicit no-bump disposition + separate ADR;
- RFC-015 separate ADR;
- S3 separate ADR;
- RFC-015 + S3 adoption proposed under one explicit `v1.6.0` release boundary;
- then return to the Sentinel roadmap, with S4 as the default next candidate.

That later closure/version package still requires a separate Paulo decision.

## Explicitly prohibited

No:
- live `devos/devos-manifest.json` S3 closure mutation;
- `devos/contracts/` → IMPLEMENTED yet;
- closure_history append;
- RFC-013 closure status update;
- closure ADR creation;
- Sentinel version bump;
- Traceability closure regeneration as final closure evidence;
- Skills/Treasury closure bookkeeping;
- S4 proposal/implementation;
- S5+;
- core-rule mutation;
- product/runtime mutation;
- remote resources;
- credentials;
- deployment;
- production writes;
- protected/main merge;
- unrelated governance expansion.

## Required Builder evidence

Return:
- exact base/result SHA;
- exact changed files;
- schema diff summary;
- validator semantic diff summary;
- focused test inventory/results;
- full repository suite result if practical;
- current live manifest validation result;
- proof no live manifest closure mutation occurred;
- proof no S3 closure/version/ADR/S4 work occurred;
- any compatibility limitation or unexpected interaction.

## Return gate

After implementation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

Builder must not self-accept RFC-015 implementation or start closure/S4 work.
