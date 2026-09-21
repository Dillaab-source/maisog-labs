# ML-DEVOS-RFC-017: S5 Capability & Permission Gateway

Status: `DRAFT`

Proposed change class: `ARCHITECTURE`

Sentinel phase:
- `S5 — Capability & Permission Gateway`

Authority chain: `D-058` (Paulo) authorizes this proposal/audit step only, following S4's closure at Sentinel `v1.7.0` (`ML-DEVOS-ADR-014`, `D-051`, `ML-DEVOS-AS-068`) and the completion of the WEB-REL-001 release-baseline gates. This RFC is itself the Architect Sync input for S5; it grants no authority and authorizes no implementation. Per `D-058` and `coordination/ARCHITECT_REVIEW.md`'s Builder Brief for this cycle, no executable S5 gateway or permission-enforcement code is created by this RFC — every artifact named below is a planned deliverable of a future, separately authorized S5 implementation cycle.

## Problem

`ML-DEVOS-ARCH-001` §4–§5 names a **Capability Registry / Gateway** as a frozen system mechanism — "determines what CAN technically be done, as distinct from Governance, which determines what MAY be done" — and `devos/capabilities/` has stood reserved for it since S2 (`ML-DEVOS-RFC-001`, `ML-DEVOS-AS-006`, `D-016`), currently `NOT_IMPLEMENTED`. `CORE-002` ("Capability != Authority") and `CORE-008` ("installed capability does not grant authority") are both already active, constitutional-and-capability-class rules — but nothing in this repository today technically enforces either. Whether a given actor's request to invoke a given tool against a given resource is even *technically permitted* is decided by nothing more than informal prose review at authorization time; there is no deterministic, fail-closed decision function anyone or anything actually calls.

S3 Typed Task Contracts (`ML-DEVOS-RFC-013`) built the typed *description* of what a task is authorized to do, explicitly excluding permission enforcement ("no capability/tool/credential enforcement... that is S5"). S4's State Machine Kernel (`ML-DEVOS-RFC-016`) built the authoritative *lifecycle* record, explicitly stating the same boundary ("the kernel accepts a bare `actor_id` string... and performs no general actor permission check... until S5 exists"). Both phases deliberately deferred the same open question: given an actor, a project, a tool/provider, an action, a resource scope, and an environment, is this specific invocation *technically* permitted right now — and if not, exactly why not?

Left unaddressed, Sentinel can describe what a task is authorized to do (S3) and track what stage it is in (S4), but has no deterministic mechanism that actually stands between an actor and a tool invocation to answer "can this technically happen" independently of whether it *should* happen.

## Motivation

As Sentinel's actor surface grows (Builder, QA, Architect, and a future Orchestrator dispatching work across providers — shell, GitHub, Cloudflare, MCP tools, browser/UI automation), informal review of "is this technically permitted" does not scale and does not fail closed: a misconfigured tool binding, a stale credential, an actor operating outside its intended project, or a request against an unrecognized resource scope can silently proceed with no structural backstop. `ML-DEVOS-ARCH-001` §4–§5 already names this as a frozen target mechanism; S5 is what turns that accepted intent into an actual, reviewable design, following the exact discovery → design → Architect Sync → Paulo-gated implementation sequence S3 and S4 already used.

If this RFC is not accepted, S5 remains unauthorized and every future capability decision continues to rely entirely on prose authorization and ordinary code review, with `CORE-002`/`CORE-008` remaining true in principle but technically unenforced.

## Proposed change

This RFC proposes the design only. Per `D-058`'s explicit authorization, **no executable implementation, schema file, or live policy/decision mechanism is created by this RFC** — every artifact named below is a planned deliverable of a future, separately authorized S5 implementation cycle, not a file this cycle writes.

### 1. Scope of the gateway — what S5 is and is not

The S5 Capability & Permission Gateway is proposed as **a pure, deterministic decision function over a request and a versioned policy document** — not a credential store, not a secrets manager, not a governance-authority decider, not an active enforcement daemon that intercepts traffic. Concretely, the gateway:

- **is**: a library exposing one primary operation, `evaluate(request, policy) -> decision`, plus policy-loading/versioning helpers, that answers exactly one question — *is this specific (actor, project, tool, action, resource scope, environment) combination technically permitted under the currently-bound policy version* — and nothing else.
- **is not**: a governance-authority decider. It never determines whether an action *should* happen, whether a human has approved it, or whether a task is in-scope per its Task Contract (S3) or in the right lifecycle state to attempt it (S4) — those remain entirely the callers' and Architect/Paulo's responsibility. An `ALLOW` decision from S5 answers only the CAN question; it never answers the MAY question (`ML-DEVOS-ARCH-001` §5).
- **is not** a credential broker or secrets manager. It evaluates *credential requirement descriptors* (does this action require a credential of a named class, and is one declared to exist for this actor/environment) — it never stores, issues, rotates, or exposes an actual secret value (§6 below).
- **is not** an active enforcement daemon. It does not intercept, wrap, or proxy real tool calls; a future integration point (a provider adapter, an Orchestrator, or a tool-invocation wrapper) would call `evaluate()` before acting and respect its decision — S5 itself never runs as a service sitting in the traffic path.

This distinction bounds S5 sharply against S6 (isolated execution), S7 (evidence storage/QA), S8 (orchestration/dispatch), and S9 (Evidence Gate sufficiency judgment), mirroring exactly the boundary discipline `ML-DEVOS-RFC-016` §A and §H already established for S4.

### 2. Capability descriptors (provider-neutral)

A **capability descriptor** is the static, policy-authored unit the gateway evaluates a request against. Each descriptor is provider-neutral — it never embeds a provider-specific authority concept (e.g. a GitHub permission string or a Cloudflare API scope) directly; a provider adapter (§8) translates between a provider's native vocabulary and this shape. A descriptor's required fields:

| Field | Shape | Meaning |
|---|---|---|
| `descriptor_id` | `^[A-Z][A-Z0-9_-]*$`, ≥3 chars | Stable identifier, reusing S4's exact task-id shape convention (`isValidTaskId()`) rather than inventing a second identifier grammar. |
| `actor_role` | one of the frozen `ML-DEVOS-ARCH-001` §3 actors (`Paulo`, `Architect`, `Builder`, `QA`, `Independent Reviewer`) or a named future role | Which actor role this descriptor applies to. Never a bare unauthenticated identity string — descriptors are role-scoped, not person-scoped, consistent with `CORE-008`'s "roles/projects/scopes" framing. |
| `project` | repository/project scope string (e.g. `Dillaab-source/maisog-labs`), or the literal `*` for a Sentinel-wide descriptor | Reuses S3's `project` field shape rather than inventing a second project-scope grammar. |
| `provider` | one of the bounded V1 adapter names (§8) — `shell`, `github`, `cloudflare`, `mcp`, `browser`, or a future registered value | Which capability subsystem (`ML-DEVOS-ARCH-001` §4's "Skills, MCP tools, GitHub, Cloudflare, n8n, shell, browser, and future APIs") this descriptor governs. |
| `action` | provider-scoped action name (e.g. `git.push`, `pr.merge`, `d1.migrate`, `shell.exec`) | The specific technical operation, named in the provider's own vocabulary via the adapter boundary — never a Sentinel-invented universal verb set that would have to keep pace with every provider's API surface. |
| `resource_scope` | non-empty array of bounded resource patterns (e.g. branch name, path glob, bucket/database identifier) | The exact resource(s) this descriptor covers. An empty array is a schema violation, not "everything" — unbounded scope must be spelled out explicitly (`resource_scope: ["*"]`), never implied by omission. |
| `environment` | one of `local`, `ci`, `staging`, `production`, or a future registered value | Mirrors the environment axis `CORE-019` already requires for remote-resource authorization records. |
| `expiry` | ISO-8601 timestamp, or `null` for a descriptor with no fixed expiry (still subject to `policy_version` staleness, §11) | When this descriptor stops being valid. A `null` expiry is not "forever, unconditionally" — it still expires functionally the moment its containing policy version is superseded and no successor descriptor exists for the same key. |
| `credential_requirement` | `{ required: boolean, credential_class: string \| null }` | Whether this action requires a credential, and if so, a named *class* (e.g. `github_pat_scoped`, `cloudflare_api_token`) — never a value, reference path, or hint at where a secret lives (§6). |
| `consequence_tier` | reuses the existing `core-rules.json` risk vocabulary exactly: `low` \| `medium` \| `high` \| `highest` | Deliberately the same four-value vocabulary already canonical for `CORE-*` rules, rather than inventing a second risk taxonomy S5 would have to keep synchronized with the first. |

A descriptor is a **policy artifact**, not a grant instance — per-request evaluation (§3) is what actually produces a decision for a specific attempt; the descriptor only says what a currently-active policy version considers technically expressible for a role/project/provider/action/resource/environment combination.

### 3. Decision contracts

**Request.** A `CapabilityRequest` presents: `actor_role`, `actor_id` (an opaque identity string, exactly as S4's `claim()`/`transition()` already accept a bare `actor_id` with no permission judgment attached to it), `project`, `provider`, `action`, `resource` (the specific resource instance being acted on, checked against a matching descriptor's `resource_scope` patterns), `environment`, `policy_version` (the version the caller believes is current — §11), and an optional `contract_ref`/`task_id` (opaque references to an S3 Task Contract / S4 task record, for audit correlation only — never re-validated or re-interpreted by S5, per §10).

**Evaluation.** `evaluate(request, policy)` is a pure function: same request against the same policy document always yields the same decision, with no hidden state, no network call, and no wall-clock read except through an injectable `now()` (mirroring S4's deterministic-clock discipline, §11). Evaluation proceeds, in order: (a) policy-version binding check (§11); (b) descriptor lookup by `(actor_role, project, provider, action, environment)`; (c) resource-scope match against the candidate descriptor(s); (d) expiry/revocation check (§5); (e) credential-requirement check (§6); (f) consequence-tier gate check (§7). The first failing step produces the decision; later steps are not evaluated once one has failed (short-circuit, not an aggregate score).

**Decision.** A `CapabilityDecision` is exactly one of `ALLOW` or `DENY`. There is no third "warn but proceed" outcome — a request either has a technically matching, unexpired, unrevoked, credential-satisfied, consequence-tier-cleared descriptor, or it does not. Every `DENY` carries a **stable denial-reason code** from a bounded V1 vocabulary (§4's default-deny table plus): `EXPIRED`, `REVOKED`, `RESOURCE_SCOPE_MISMATCH`, `CREDENTIAL_REQUIREMENT_UNSATISFIED`, `CONSEQUENCE_TIER_GATE_UNSATISFIED`, `POLICY_VERSION_STALE`, `MALFORMED_REQUEST`. Every `ALLOW` carries the exact `descriptor_id` and `policy_version` it was granted under, so a later audit can trace precisely which policy artifact authorized the decision. Both outcomes carry the fixed, non-reword-able **non-authority disclaimer** (§5's text below) — mirroring S3's `authority_disclaimer` `const` field and S4's fixed non-authority statement — so an `ALLOW` can never be read, quoted, or logged without the caveat attached.

### 4. Default-deny handling

Every axis fails closed on the unknown, not merely on the explicitly forbidden:

| Condition | Decision | Denial reason |
|---|---|---|
| `actor_role` not a recognized role | `DENY` | `UNKNOWN_ACTOR_ROLE` |
| `provider` not a registered adapter | `DENY` | `UNKNOWN_PROVIDER` |
| `action` not declared by any descriptor for the resolved `(actor_role, project, provider, environment)` | `DENY` | `UNKNOWN_ACTION` |
| `project` not `*` and not matching any descriptor's `project` | `DENY` | `UNKNOWN_PROJECT` |
| `resource` matches no descriptor's `resource_scope` pattern | `DENY` | `UNKNOWN_RESOURCE_SCOPE` |
| `environment` not a registered value | `DENY` | `UNKNOWN_ENVIRONMENT` |
| `policy_version` not resolvable to a loaded policy document | `DENY` | `UNKNOWN_POLICY_VERSION` |
| more than one descriptor matches with materially different `consequence_tier`/`credential_requirement` (an ambiguous policy authoring defect) | `DENY` | `AMBIGUOUS_POLICY_MATCH` |
| request is structurally malformed (missing required field, wrong type) | `DENY` | `MALFORMED_REQUEST` |

There is no generic catch-all `ALLOW` path and no "permissive by default, deny-listed exceptions" mode. A capability exists only where a currently-valid, unexpired, matching descriptor explicitly says so. This is the same fail-closed posture S4 already applies to orphaned locks and structurally invalid records ("never a silent default to some assumed state") and S3 applies to malformed evidence declarations — S5 inherits, not reinvents, that discipline.

### 5. Separation of technical capability, governance authority, and human risk acceptance

Three independent questions, never conflated:

1. **May this happen?** — Governance authority. Decided by Paulo/Architect/RFC-Decision-ADR chain, described (not granted) by an S3 Task Contract's `authorization_references`. S5 never evaluates this question and never consumes a Task Contract's authorization fields to make its own decision.
2. **Can this happen?** — Technical capability. Decided exclusively by S5's `evaluate()` against the current policy. This is the only question S5 answers.
3. **Is this acceptable given the consequence?** — Human risk acceptance. Decided by Paulo (or Paulo-delegated policy) at the consequence tiers `§7` names, informed by, but never satisfied by, an `ALLOW` decision.

Every `CapabilityDecision`, `ALLOW` or `DENY`, carries the following fixed, schema-`const` **non-authority disclaimer**, worded to parallel S3's `authority_disclaimer` and S4's non-authority field exactly:

> This capability decision describes only what is technically permitted under the current policy. It does not itself grant governance authority, certify that an action should happen, accept risk, or satisfy any merge, deployment, or production-write approval requirement (`CORE-001`, `CORE-002`, `CORE-008`). An `ALLOW` decision from a Governance-authorized actor is necessary but never sufficient for a sensitive operation (§7); a `DENY` decision blocks the action regardless of any governance authorization that may otherwise exist.

No instance may soften, omit, or reword this field, mirroring `ML-DEVOS-AS-038`'s `AS38-F002` finding on the S3 equivalent.

### 6. Least-privilege scoping, revocation, expiry, and stale-policy behavior

- **Least privilege by construction.** A descriptor's `resource_scope` must be a bounded pattern set, never `["*"]` by default — an unbounded scope is a deliberate, explicit authoring choice, not the schema's default shape (the schema's structural validator rejects a missing/empty `resource_scope`, exactly as S3's `allowed_paths` must be non-empty).
- **Revocation.** A descriptor carries no separate "revoked" boolean; revocation is modeled as *removal from the current policy version* (§11) — a superseded policy version simply no longer contains the descriptor. This avoids a second parallel "is it revoked" flag that could drift out of sync with the policy document itself, at the cost of requiring every revocation to be an explicit new policy version (never a silent in-place mutation of a live version — mirroring `ML-DEVOS-ARCH-001` §8's traceability model, which never mutates closed records in place).
- **Expiry.** Evaluated at decision time against the injectable clock (§11), never cached. An expired descriptor decides exactly as an absent one would (`DENY` / `EXPIRED`), never silently treated as "still valid until someone notices."
- **Stale policy.** A request presenting a `policy_version` older than the current one is not silently upgraded to evaluate against the newer version (that would let a caller's stale understanding of policy accidentally receive a decision based on rules it never actually saw) and is not blindly evaluated against its own stale version either (that would let an already-revoked descriptor still return `ALLOW`). V1's resolution: **`POLICY_VERSION_STALE` is itself a `DENY`** whenever the presented version does not exactly equal the currently-loaded active version. A caller must re-fetch current policy and retry with the current `policy_version` — exactly the same "no silent revision reconciliation" discipline S4's fencing token already enforces for task mutations.

### 7. Credential and secret-reference requirements

S5 policy documents and decision records **never contain a secret value**. A descriptor's `credential_requirement.credential_class` names only a *class* of credential (e.g. `github_pat_scoped`, `cloudflare_api_token`, `none`) that a caller must independently prove is available through a mechanism entirely outside this RFC's scope (an environment variable's presence, a secrets-manager binding, a CI secret context) — S5 evaluates only whether the *declared* requirement is satisfied by a caller-supplied boolean/opaque attestation (`credential_available: true/false` plus the class it claims to satisfy), never the credential's actual value, validity, or expiry. Validating that an attested credential is genuinely live, unexpired, and scoped correctly is explicitly **out of scope** for S5 V1 and named as a disclosed limitation (§"Non-goals"), analogous to how S3's evidence-presence gate checks *presence and class label*, never sufficiency or content.

### 8. Sensitive-operation gates

Building on `consequence_tier` (§2) and `CORE-019`/`CORE-020`/`CORE-021`'s already-active consequence-escalation policy, the following action classes are **named sensitive-operation categories** that a descriptor authoring a matching action must declare at `consequence_tier: "high"` or `"highest"`, never lower, as a structural validation rule (not merely a convention):

- protected-branch/`main` merge;
- deployment/production-write actions;
- remote-resource mutation (D1/R2/Access/DNS-class actions, per `CORE-019`'s already-required scoping fields);
- credential/secret management actions (rotation, issuance, revocation);
- any explicitly-flagged destructive action (deletion, force-push, irreversible data mutation).

A descriptor for one of these categories declared at `consequence_tier: "low"`/`"medium"` is a structural policy-authoring defect the validator rejects outright — this prevents a policy author from silently under-classifying a high-consequence action to make it easier to grant, mirroring `CORE-020`'s binding rule that consequence-sensitive claims "must not close solely on Builder `ACTOR_REPORTED` evidence." An `ALLOW` decision at `high`/`highest` tier still carries the §5 non-authority disclaimer unweakened — the tier affects evidence/audit expectations (§9), never whether the disclaimer applies.

### 9. Provider adapter boundaries

An **adapter** is a bounded, explicitly registered translation layer between one provider's native vocabulary and this RFC's provider-neutral request/descriptor shape (§2–§3). V1 names exactly five adapter slots, matching `ML-DEVOS-ARCH-001` §4's own enumeration: `shell`, `github`, `cloudflare`, `mcp`, `browser`. A sixth, `future`, is reserved for a provider not yet named, added only by a future governed extension to the bounded provider-name vocabulary (never an ad hoc string).

An adapter's responsibility is strictly translation and **never** decision-making:
- it maps a provider-native action identifier (a GitHub REST endpoint, a shell command class, a Cloudflare API operation, an MCP tool name, a browser automation action) to this RFC's `(provider, action)` pair;
- it maps a provider-native resource identifier (a repo/branch, a file path, a bucket/database/zone name, an MCP resource URI, a target URL/DOM scope) to a `resource` value checkable against a descriptor's `resource_scope` patterns;
- it never itself decides `ALLOW`/`DENY` — every adapter-translated request still flows through the one `evaluate()` function (§3);
- it never embeds provider-specific authority semantics (e.g. "this GitHub token has admin scope, so allow everything") into the core model — a provider's own permission concepts are a capability-existence fact the adapter surfaces as an attested `credential_class`/`credential_available` pair (§6), never a decision shortcut.

Adapter registration is a static, versioned list (mirroring the bounded `provider` enum in §2), not a runtime plugin-discovery mechanism — V1 explicitly excludes dynamic adapter loading as a future-phase concern, consistent with "smallest gateway that answers the CAN question."

### 10. Composition with S3 Typed Task Contracts and S4 Task State

S5 references, but never duplicates or re-validates, S3/S4 artifacts:

- A `CapabilityRequest` may carry an opaque `contract_ref`/`task_id` purely for audit correlation (§12) — S5 never re-opens, re-validates, or re-interprets the referenced Task Contract's `scope`/`claims`/`evidence` fields, nor the referenced task record's `state`/`owner`/`revision`. Those remain entirely S3's and S4's own concerns.
- S5 does not gate S4's `transition()` calls, `claim()` calls, or any other kernel operation directly — S4 remains, exactly as `ML-DEVOS-RFC-016` states, a library that "performs no general actor permission check... until S5 exists." A future, separately authorized integration RFC would decide whether/how a caller invokes `evaluate()` before calling into S4's kernel; this RFC does not itself wire that integration, since doing so would silently expand S4's already-accepted, closed interface.
- S3's `scope.remote_resources_involved`/`protected_main_or_deploy_in_scope`/`production_write_in_scope`/`credential_or_security_in_scope`/`destructive_actions_in_scope` boolean flags and S5's `consequence_tier`/sensitive-operation categories (§8) describe overlapping real-world concerns from two different documents' perspectives (a task's declared scope vs. a capability descriptor's technical classification) — this RFC does not merge them into one shared field, avoiding exactly the memory-boundary conflation `ML-DEVOS-ARCH-001` §11 warns against for Task Engine State vs. every other store. A future implementation may recommend keeping them consistent by convention, but S5 does not read or write S3's schema fields, and S3's schema is not modified by this RFC.

### 11. Idempotency, retry, concurrency, and policy-version implications

- **Read-only, side-effect-free evaluation.** `evaluate()` is a pure read over an immutable, versioned policy document — it has no persisted state of its own to corrupt, no lock to acquire, and no idempotency-key ledger to maintain, unlike S4's mutating operations. A retried identical request against an unchanged `policy_version` always returns the identical decision — idempotency is a structural property of the function's purity, not a separately implemented mechanism.
- **Policy versioning.** Policy documents are immutable once published; a change to any descriptor produces a new `policy_version` rather than mutating an existing one in place (§6's revocation model depends on this). This mirrors S4's `revision` fencing philosophy (never mutate a committed record; the next state is a new version) applied to a configuration artifact instead of a task record.
- **Concurrency.** Because evaluation has no shared mutable state, concurrent `evaluate()` calls require no lock, mutex, or serialization primitive of any kind — unlike S4's genuine need for a `wx`-exclusive lock file around its read-validate-mutate-persist cycle. This is a direct consequence of S5 V1 being a pure decision function rather than a stateful store.
- **Policy-version implications for a task/attempt.** A future integration should bind one resolved `policy_version` to a task/attempt at the point capability is first evaluated for it, and require the same version on every subsequent capability check for that same attempt, so a mid-attempt policy change cannot silently upgrade or downgrade an in-flight attempt's permitted actions. This RFC names the requirement; it does not implement the binding mechanism, which belongs to the future integration RFC named in §10.

### 12. Audit and evidence events

Every `evaluate()` call — `ALLOW` or `DENY` — produces one **audit event** record with, at minimum: `event_id`, `timestamp` (from the injectable clock), the full request (`actor_role`, `actor_id`, `project`, `provider`, `action`, `resource`, `environment`, `policy_version`, optional `contract_ref`/`task_id`), the resulting `decision`, the `descriptor_id` (if matched) or `denial_reason` (if not), and an `evidence_provenance` field naming which of the five `ML-DEVOS-ARCH-001` §6 classes the audit event itself is (ordinarily `ACTOR_REPORTED` — the caller/adapter reports that it called `evaluate()` and got this result — since S5 V1 has no independent, out-of-band observer of every call). **This RFC does not claim that S7 Evidence Store or S9 Evidence Gate already exist** — an audit event is, in V1, an in-process return value plus whatever the caller chooses to log; S5 does not itself provide durable, tamper-evident audit storage (that capability, if needed, is S7's and S11's concern). This bounded honesty mirrors S4's own disclosed limitation that its bounded transition history is not Run History and is not a substitute for a future dedicated store.

## Required design decisions

| Decision | V1 selection | Rejected alternative(s) |
|---|---|---|
| Capability policy representation and schema ownership | JSON Schema (draft-07) + a zero-third-party-dependency Node validator under `devos/capabilities/`, mirroring S3/S4's exact precedent | A DSL/rules-engine format (e.g. Rego/OPA) — rejected for V1 as a new external dependency and runtime this bounded gateway does not need; revisit only if policy complexity later outgrows a static descriptor list |
| Repository-local vs. externally supplied configuration | Repository-local, versioned JSON policy documents committed under `devos/capabilities/`, exactly like `core-rules.json` | An externally hosted/live policy service — rejected for V1; would introduce a remote dependency and a new trust boundary this bootstrap-phase repository has not yet authorized (`CORE-019`) |
| Decision API shape and stable denial codes | One pure function, `evaluate(request, policy) -> decision`, `ALLOW`/`DENY` plus a bounded, versioned denial-reason-code vocabulary (§3–§4) | A numeric/HTTP-status-style code space — rejected as needlessly overloading an unrelated existing convention; a free-text reason string alone — rejected as not machine-checkable for tests/audits |
| Policy-version binding to a task/attempt | Caller presents `policy_version` explicitly; any mismatch with the current version is `DENY`/`POLICY_VERSION_STALE` (§6, §11) | Silently evaluating against whichever policy version is current regardless of what the caller believed — rejected as hiding a policy change from an in-flight attempt |
| Adapter registration and discovery | Static, versioned enum of exactly five V1 provider names plus a reserved `future` slot (§9) | Dynamic runtime plugin discovery — rejected for V1 as unnecessary surface for a bounded provider set, and as a potential capability-injection vector without its own separately governed review |
| Revocation/expiry evaluation time | Evaluated at decision time only, against an injectable clock, never cached or evaluated at policy-load time (§6, §11) | Pre-computing a resolved/materialized permission set at policy-load time — rejected because it would let a load-time snapshot silently outlive the descriptor's real expiry |
| Audit event minimum fields | The §12 field set, evidence class `ACTOR_REPORTED` by default, no S7/S9 existence claimed | Requiring `CI_ATTESTED` or stronger evidence for every evaluation call — rejected as disproportionate for V1's low-consequence-tier evaluations; §8's sensitive-operation categories may warrant stronger evidence at the *action* layer, decided by the caller/Architect, not invented by S5 itself |
| Governance permits, capability absent | `DENY` — capability absence is dispositive regardless of governance authorization; the caller must resolve the missing descriptor/credential/adapter gap, never proceed on governance authority alone (§5) | Allowing a governance-authorized actor to bypass a missing capability "just this once" — rejected outright; this is exactly the authority-substituting-for-capability failure `ML-DEVOS-ARCH-001` §5 forbids |
| Capability exists, governance authority absent | Out of S5's decision scope entirely — S5 never checks governance authority and an `ALLOW` decision is never itself sufficient justification to act; the caller/Architect/Paulo chain remains solely responsible for confirming authorization exists before ever calling `evaluate()` (§5) | Having S5 also check `authorization_references`/similar governance fields — rejected as duplicating S3's and the RFC/Decision chain's job and blurring the Governance/Capability axis separation this whole RFC exists to keep clean |

## Scope

This RFC proposes the S5 design only: capability-descriptor schema, decision/request/denial-reason contracts, default-deny rules, the technical-capability/governance-authority/risk-acceptance separation, least-privilege/revocation/expiry/stale-policy behavior, credential-requirement (not credential-value) handling, sensitive-operation gate classification, provider adapter boundaries, audit-event shape, composition with S3/S4, and idempotency/concurrency/policy-versioning implications, with an explicit comparison and V1 selection for each required design decision. It affects `Dillaab-source/maisog-labs` only (no other project is registered under Sentinel — `projects/registry.json` remains `EMPTY`).

## Non-goals

This RFC does **not**:

- write any executable implementation, schema file, or test file (`D-058`'s explicit authorization boundary — this cycle is proposal/audit only);
- create or mutate any live capability policy, credential, or secret;
- validate that an attested credential is genuinely live, unexpired, or correctly scoped (§7's disclosed V1 limitation — credential *value* validation is out of scope);
- implement S6 isolated execution, S7 evidence storage/QA execution, S8 orchestration/dispatch, S9 Evidence Gate acceptance logic, S10 CI/rulesets, S11 memory/observability, S12 project overlays, S13 release/runtime verification, or S14 the production pilot;
- change any `CORE-*` rule's meaning, any actor's authority, `manifest_version`, the Sentinel capability baseline version, or any ADR;
- wire S5 into S4's kernel operations or S3's contract validator — that integration, if pursued, is a future, separately authorized RFC (§10);
- implement dynamic adapter/plugin discovery, an externally hosted policy service, or any remote/cloud resource;
- authorize any later phase or itself constitute S5 implementation authorization.

## Affected components

Primary (future implementation only, not created by this RFC): `devos/capabilities/`.

Referenced, unmodified: `devos/contracts/` (S3 schema/validator, read-only reference for `contract_ref` correlation only), `devos/state/` (S4 kernel, read-only reference for `task_id` correlation only), `devos/governance/rules/core-rules.json` (`CORE-001/002/008/019/020/021`, read-only reference).

Supporting governance records only: this RFC; its Architect Sync; a future Decision; a future implementation cycle; a future closure ADR.

## Affected rules

**No `CORE-*` rule is added, modified, or superseded by this RFC.** S5's design consumes `CORE-001`, `CORE-002`, `CORE-008`, `CORE-019`, `CORE-020`, and `CORE-021` exactly as currently written, and must validate any future implementation against them unchanged. No amendment to `ML-DEVOS-ARCH-001` is proposed by this RFC — the frozen §4/§5 Capability Registry/Gateway description already anticipates exactly this mechanism; S5 fulfills that reservation rather than amending it.

## Alternatives considered

### 1. Fold S5 into S4's kernel as an additional guard clause

Rejected. This would collapse two phases `ML-DEVOS-SIP-001`'s roadmap deliberately separates, and would force every future capability-policy change through S4's already-closed, Architect-accepted implementation surface, re-opening a phase that should remain stable.

### 2. Adopt an existing open-source policy-as-code engine (e.g. OPA/Rego, Casbin)

Rejected for V1, for the same reason `ML-DEVOS-RFC-016` rejected an external state-machine library: a general-purpose policy engine assumes a much larger surface (its own DSL, runtime, and often a live service) than a bounded provider-neutral descriptor/decision model needs. Revisiting this remains open if policy complexity later outgrows a static descriptor list — not rejected forever, rejected for this proposal's bounded scope.

### 3. Let each provider adapter make its own allow/deny decision locally

Rejected. This would scatter the CAN-decision logic across five-plus adapters with no single deterministic function to test, audit, or reason about, and would risk each adapter quietly inventing its own denial-reason vocabulary and default-deny discipline — exactly the inconsistency a single `evaluate()` function exists to prevent.

### 4. Pre-materialize a resolved permission matrix at policy-publish time instead of evaluating per request

Considered and rejected as the *primary* mechanism (§"Required design decisions" — revocation/expiry evaluation time) for the same reason S4 rejected age-based automatic lock recovery: a materialized snapshot can silently outlive the real descriptor's expiry/revocation, reintroducing exactly the kind of stale-authority gap `CORE-002` exists to prevent.

### 5. Allow a governance-authorized actor to bypass a missing capability descriptor as an emergency escape hatch

Rejected outright, not merely for V1. This is precisely the Capability≠Authority substitution `ML-DEVOS-ARCH-001` §5 forbids; an emergency path, if ever needed, belongs to a separately governed `WAIVER`-class change with its own explicit, time-boxed, Paulo-approved terms (`CHANGE_GOVERNANCE_POLICY.md` §1's `WAIVER` row) — never a silent S5 bypass mode.

## Risks

### Over-scoping into later phases
Mitigation: the explicit non-goals list and §10's composition boundary name exactly what S6/S7/S8/S9 remain solely responsible for; any future implementation review should re-check the diff against this list.

### S5 becomes a de facto governance-authority decider
Mitigation: §5's fixed non-authority disclaimer and the explicit "capability exists, governance authority absent" design decision keep S5 answering only the CAN question; any future caller conflating an `ALLOW` decision with authorization is a caller-side defect this RFC's disclaimer is designed to make visible, not an S5 design gap.

### Credential-requirement checking creates a false sense of security
Mitigation: §7 explicitly discloses that credential *value*/liveness validation is out of scope for V1; a future phase must not cite S5's `credential_available` attestation as proof a credential is actually valid.

### Stale-policy handling blocks legitimate work during a policy rollout
Mitigation: this is a deliberate, disclosed availability trade-off, exactly like S4's orphaned-lock fail-closed choice — a caller presenting a stale `policy_version` must re-fetch and retry rather than being silently upgraded, trading a small operational friction for the guarantee that no attempt evaluates against policy it never actually observed.

### Ambiguous policy authoring produces contradictory descriptors
Mitigation: `AMBIGUOUS_POLICY_MATCH` (§4) fails closed rather than picking one match arbitrarily or merging conflicting `consequence_tier`/`credential_requirement` values; this pushes the defect back to policy authoring/review rather than silently resolving it inside the evaluator.

### Provider adapter boundary proves too rigid for a future provider's native model
Mitigation: §9's bounded provider enum is explicitly extensible only through a future governed change, not a runtime mechanism — disclosed as a deliberate V1 scope bound rather than a discovered gap later.

## Migration impact

None. No live capability policy, credential requirement, or decision record exists to migrate (nothing has ever technically enforced a capability decision in this repository). No existing file, schema, or record is modified by this RFC.

## Security / trust impact

This RFC proposes the mechanism that would, once implemented, technically enforce `CORE-002`/`CORE-008` for the first time — a genuine trust-boundary-relevant change, though this RFC itself creates no new trust boundary and grants no new capability. `TRUST_BOUNDARIES.md` TB-7 ("a tool, credential, or API access granted to any actor or mechanism is a capability fact, not an authorization fact") is the exact invariant S5 is designed to make technically checkable rather than merely stated. The gateway introduces no new credential, secret, or remote-resource access of its own (`CORE-008`, `CORE-019` both inapplicable to this proposal — no remote/cloud action is proposed); a future implementation's own security review must independently confirm the evaluator never logs, stores, or exposes an actual secret value, only the class-level attestations §7 describes.

## Evidence requirements

A future S5 implementation's acceptance should require, at minimum:

- `INDEPENDENTLY_INSPECTED` review of the descriptor schema/decision-function/adapter-boundary source against this RFC's design;
- Builder-reported (`ACTOR_REPORTED`) focused test execution covering, at minimum, every default-deny condition (§4), every denial-reason code (§3), expiry/revocation/stale-policy behavior (§6), the ambiguous-policy-match case (§4), and non-authority-disclaimer presence on every decision;
- independent inspection that no descriptor or decision record ever contains a literal secret value, only class-level credential attestations (§7);
- independent inspection that the sensitive-operation consequence-tier structural rule (§8) is actually enforced by the validator, not merely documented;
- explicit confirmation that S4's kernel interface and S3's contract schema remain byte-identical (no accidental widening of an already-closed phase's surface).

## Rollout

Not proposed by this RFC. A future implementation cycle would, at minimum, follow the same sequence S3/S4 used: bounded implementation authorization (Paulo decision) → focused tests → Architect Stage Gate Review → closure package (ADR, manifest `IMPLEMENTED` status for `devos/capabilities/`, version disposition) → D.1/D.2 closure preflight/verification, exactly per `ML-DEVOS-RFC-015`'s established reserved-root lifecycle.

## Rollback

Not applicable at this proposal stage — no artifact this RFC could roll back exists yet. A future implementation's rollback plan (removing/reverting `devos/capabilities/` content) is that implementation cycle's own concern.

## Compatibility

Compatible with the frozen `ML-DEVOS-ARCH-001 / v1.2.0` baseline without amendment: the Capability Registry/Gateway mechanism this RFC designs is exactly the mechanism §4–§5 already name and reserve, not a new concept requiring a frozen-content amendment (contrast with S4's narrow, explicitly governed §10 terminal-state addition). Compatible with S3 (`ML-DEVOS-ADR-013`) and S4 (`ML-DEVOS-ADR-014`) by reference-only composition (§10) — neither schema is read, modified, or duplicated.

## Version impact

Per `VERSIONING_POLICY.md`'s scheme, a future successful S5 implementation would very plausibly be assessed `MINOR` (a new, backwards-compatible subsystem; no existing rule's meaning changes; no actor's authority changes) — the same reasoning already applied to S3 and S4. **This RFC does not itself claim or apply any version bump**; it is a discovery/design proposal only, exactly as `ML-DEVOS-RFC-016`'s equivalent section stated for S4.

## Architect Sync requirement

Yes. `ARCHITECTURE`-class changes always require one (`CHANGE_GOVERNANCE_POLICY.md` §1). This RFC is itself the input to that Architect Sync, per `D-058`'s framing.

## Paulo decision requirement

Yes. `ARCHITECTURE`-class changes always require an explicit Paulo gate for implementation authorization, entirely separate from any design-acceptance verdict the Architect Sync reaches on this RFC — mirroring the `D-048`/`D-049` (design) → `D-050` (implementation) → `D-051` (closure) sequence S4 followed.

## Threat model and trust boundaries

- **Threat: a request forges/omits `policy_version` to evade a revocation.** Mitigated by §6/§11's strict equality check — any non-matching or absent `policy_version` is `DENY`/`POLICY_VERSION_STALE`/`MALFORMED_REQUEST`, never silently resolved to "whatever is current" or "whatever the descriptor's own version says."
- **Threat: a compromised or misconfigured adapter reports a false `credential_available: true`.** Named as a disclosed V1 limitation (§7, §"Risks") — S5 cannot itself detect a lying adapter; a future phase (S7/S9, or the adapter's own separately governed capability-onboarding review, `CORE-008`) must address adapter trustworthiness. S5's contribution is making the requirement explicit and checkable, not eliminating the adapter as a trust boundary.
- **Threat: an actor role is spoofed (a Builder-scoped credential presents `actor_role: "Paulo"`).** Out of scope for S5 V1 — `evaluate()` trusts its `actor_role` input exactly as S4's `claim()`/`transition()` trust a bare `actor_id`; genuine identity/authentication enforcement is a boundary this RFC explicitly does not claim to close, consistent with `ML-DEVOS-RFC-016`'s identical disclosed limitation for S4.
- **Threat: a policy-authoring mistake grants an overly broad `resource_scope`.** Mitigated structurally (§6 — non-empty, explicit scope required) but not eliminated; a future implementation's test plan must include negative fixtures proving an overly broad pattern is still bounded to what it literally matches, not silently widened.
- **Trust boundary carried forward from `TRUST_BOUNDARIES.md` TB-7:** this RFC's entire purpose is to make TB-7's already-stated principle technically checkable; it does not itself resolve TB-7, since TB-7 is a statement about the *current, actual* state of the repository that remains true (capability without authority) until a real implementation exists and is wired into an actual enforcement point.

## Misuse cases

- A caller invokes `evaluate()`, receives `DENY`, and proceeds anyway because S5 is advisory-only in the absence of a real enforcement wrapper. Mitigated by disclosure only at this design stage — the "is not an active enforcement daemon" boundary (§1) means a future implementation/integration RFC must explicitly wire `evaluate()`'s result to actually block the call site, or S5 remains theater. This RFC names that dependency rather than hiding it.
- A caller quotes an `ALLOW` decision, minus its non-authority disclaimer, as proof that an action was authorized. Mitigated by the disclaimer being schema-`const`/non-removable (§5), exactly as S3's `authority_disclaimer` already is.
- A policy author sets `consequence_tier: "low"` on a sensitive-operation-category action to make it easier to grant. Mitigated structurally by §8's validation rule rejecting under-classified sensitive actions.

## Failure modes

- **Policy document fails to load/parse.** Fails closed: no descriptor is available, so every request against that policy version is effectively `UNKNOWN_POLICY_VERSION`/`DENY`. No fallback to a cached or default-permissive policy.
- **Clock/`now()` misbehaves (test or integration bug).** Because the clock is injected exactly as S4's is, a misbehaving clock is a caller-side integration defect, not a hidden internal dependency S5 could silently get wrong via `Date.now()`.
- **Structurally malformed descriptor in an otherwise loadable policy document.** The policy loader/validator must reject the entire policy version as invalid at load time (fail closed on the whole document), never silently skip one bad descriptor and proceed with a partially-valid policy — mirroring S4's structural validation running at both load and pre-persistence boundaries.

## Test plan

A future implementation's focused test suite must cover, at minimum: every default-deny condition (§4) with a distinct fixture per denial-reason code; expiry evaluated at exactly the boundary instant (equal-to and one-tick-past); a stale `policy_version` on an otherwise-valid request; the ambiguous-policy-match case with two descriptors differing only in `consequence_tier`; a sensitive-operation-category descriptor declared at a too-low `consequence_tier` (must fail policy validation, not evaluation); credential-requirement satisfied vs. unsatisfied vs. wrong-class; every adapter's action/resource translation round-tripping to a correct `(provider, action, resource)` tuple; and a positive-path `ALLOW` carrying the exact `descriptor_id`, `policy_version`, and unweakened non-authority disclaimer. Concurrency tests are not required for V1's pure-function evaluator (§11), unlike S4's genuine need for real-process lock tests.

## Implementation mapping

Not authorized by this RFC. A future implementation cycle would, at minimum, produce: `devos/capabilities/capability-descriptor.schema.json` and `devos/capabilities/decision.schema.json` (structural schemas); `devos/capabilities/validate-capability-policy.mjs` (structural + the §8 sensitive-operation-tier semantic rule, zero third-party dependencies, following S3/S4's precedent); `devos/capabilities/evaluate.mjs` (the pure decision function); `devos/capabilities/adapters/` (the five V1 adapter translation modules, translation-only per §9); bounded valid/invalid example policy fixtures; and focused tests per the plan above. None of these files are created by this RFC.

## Unresolved questions

1. **Should `resource` matching support more than literal glob-style patterns (e.g. a structured path-segment scope) for providers whose resources are not naturally path-shaped (e.g. a Cloudflare zone/record, an MCP tool's own parameter space)?** This RFC leaves `resource_scope` pattern-matching semantics as "bounded resource patterns" without fully specifying a pattern grammar, deferring the exact syntax to implementation, subject to Architect review of whatever grammar is proposed then.
2. **Where should the future integration point that actually calls `evaluate()` before a real tool invocation live** — a wrapper around each provider adapter, a future S8 Orchestrator responsibility, or a caller-side convention every actor is expected to follow? This RFC deliberately does not decide this (§10), naming it as a future, separately authorized integration RFC's job.
3. **Should a `DENY` decision itself be evidence-worthy** (i.e., should a denied attempt automatically produce a durable audit record even before S7 exists), or is an in-process return value sufficient until S7/S11 exist? This RFC's §12 takes the minimal position (in-process, `ACTOR_REPORTED`-class only) but flags this as an open question the Architect may want to revisit given `CORE-020`'s consequence-escalation direction.
4. **Does a future multi-project Sentinel deployment (`projects/registry.json` no longer `EMPTY`) require `project`-scoped policy isolation stronger than a single shared descriptor list filtered by the `project` field**, or does the single-list-with-a-project-field model (mirroring S3's `project` field) remain sufficient? Left open since no second project exists yet to motivate a concrete answer.
