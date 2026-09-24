# devos/capabilities/ — S5 Capability & Permission Gateway V1

`MANIFEST STATUS: IMPLEMENTED` — `closure_ref: ML-DEVOS-ADR-015`, `executable_runtime_present: false`. Adopted at Sentinel `v1.8.0` by `ML-DEVOS-ADR-015` / `D-065`, following `ML-DEVOS-AS-083`'s independent technical acceptance and `ML-DEVOS-AS-084`'s D.1 closure preflight. The governed closure completes only when the Architect passes D.2 Post-decision Closure Verification (`ML-DEVOS-RFC-015`).

`executable_runtime_present: false` is a behavior-based statement, not a claim that the code is untested. This is an implemented, repository-local decision library, but no active operational Sentinel runtime, orchestrator, CI path, or tool-call wrapper invokes it as an enforcement service. Closure does not wire it into S3, S4, or any tool-execution path.

Canonical owning phase: **S5 — Capability & Permission Gateway**. Known consuming phase(s): none declared.

## Implementation truth

Design `ML-DEVOS-RFC-017`, approved in `ML-DEVOS-AS-077`. Implemented under `D-063` as Context Bootstrap V0 Trial #1 (`d589a16`), remediated per `ML-DEVOS-AS-082` (`06b5bef`), technically accepted by `ML-DEVOS-AS-083`, and closed by `ML-DEVOS-ADR-015` / `D-065`. Evidence classes follow `ML-DEVOS-AS-083`: the Builder's command execution is `ACTOR_REPORTED`, and the Architect's source, diff, security, and boundary review is `INDEPENDENTLY_INSPECTED`. No `RUNTIME_OBSERVED` evidence is claimed.

- `index.mjs` — the public entry. It exports `createGateway` plus the envelope, validator and vocabulary helpers. It does **not** export the raw `evaluate()` core.
- `adapters/` — the five static V1 adapters (`shell`, `github`, `cloudflare`, `mcp`, `browser`). An adapter's `request(requestIntent)` is the only caller-facing decision surface.
  - Each adapter canonicalizes the resource under its own contract.
  - It mints the branded trusted contexts from the host environment bound at gateway construction.
  - It fetches the live revocation list on every call.
  - It fails closed if its clock, identity, or revocation source is unavailable.
- `evaluate.mjs` — the pure five-argument internal core: `evaluate(subjectContext, requestIntent, policy, revocationList, evaluationContext)`.
  - It steps through RFC-017 §3 (a)–(g) and short-circuits on the first failure.
  - It has no clock, randomness, or I/O.
- `trusted-context.mjs` — the module-private brand, and the only place minters exist (`ML-DEVOS-AS-082` `AS82-F001`).
  - Minters are created only inside `createGateway()` and passed only to the five statically imported adapter factories.
  - No module exports, returns, or accepts a callback for a minter, so there is no register/claim surface for an early or foreign caller to acquire and combine with the raw core.
  - Intrinsics used on branded values are captured when the module loads.
  - Hand-built objects are rejected.
  - Trust assumptions and bypass limits are stated in its header.
- `canonical.mjs` — the per-provider canonicalization contracts (RFC-017 §9 table). The `shell` form is platform-aware (`AS82-F002`): POSIX `/…`, Windows drive `C:/…`, and UNC `//server/share/…`, always with `/` separators. `adapters/shell.mjs` resolves traversal and symlinks under the host OS's own path semantics and confines the result to trusted roots.
- `validate-capability-policy.mjs` — the zero-dependency validator.
  - It checks structure, the bounded resource grammar, canonical literals, and class-only credentials.
  - It applies the §8 sensitive-operation tier rule, at load time only.
  - It rejects any secret-shaped value.
  - It rejects the whole document on any error.
  - CLI: `node devos/capabilities/validate-capability-policy.mjs [files…]`.
- `audit.mjs` — the separately constructed `AuditEnvelope`. `event_id`, `timestamp`, and `evidence_provenance` are always caller-supplied, never defaulted.
- `vocabulary.mjs` — the closed V1 vocabularies:
  - the single canonical RFC-017 §4 denial-reason enum;
  - the fixed non-authority disclaimer;
  - the sensitive-action registry.
- `*.schema.json` — draft-07 structural schemas: descriptor, policy, trusted `subjectContext`, trusted `evaluationContext`, untrusted `requestIntent`, decision.
- `examples/valid|invalid/*.policy.json` — bounded fixtures.

Focused tests:
- `tests/capabilities-core.test.mjs` — decision semantics, driven through the real adapter path with a configurable trusted host.
- `tests/capabilities-gateway.test.mjs` — the public adapter surface.
- `tests/capabilities-bypass.test.mjs` — the adversarial minter-acquisition and late-intrinsic-patch probes, each run in a fresh process.
- `tests/capabilities-shell-platform.test.mjs` — Windows and POSIX shell resolution.

## Boundaries

- **Capability != Authority** (`CORE-002`, `CORE-008`).
  - An `ALLOW` answers only whether something can technically happen under the pinned policy.
  - Every decision carries the fixed non-authority disclaimer.
- **Not wired anywhere.**
  - No S3/S4 integration: `contract_ref`/`task_id` are opaque correlation strings only.
  - No runtime service, no network call, no plugin discovery, no live policy service.
  - Nothing invokes this library unless a caller imports it.
- **No secret values.** Credential requirements and attestations are class-level only.
- **Policy immutability.**
  - Policies are immutable per `policy_version`.
  - A descriptor absent from a newer version is not grantable to new attempts after supersession, but an attempt pinned to the older version keeps it until expiry or live revocation.

Redefining this root's ownership requires a separately governed `ARCHITECTURE`-class change.
