# Current Handoff — S5 Capability & Permission Gateway V1 (Bootstrap Trial #1)

```yaml
schema_version: 1
handoff_id: H-S5-TRIAL1-0001
cycle_id: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION
input_base_commit: ce9c0391260ef0ba4620936b1b448e3de8d135cb
review_target_commit: ce9c0391260ef0ba4620936b1b448e3de8d135cb
applicable_review_id: ML-DEVOS-AS-081
```

This handoff is evidence, not authority. Routing, turn, scope, and flags live only in `coordination/STATE.md`. The Builder does not self-approve this implementation.

## Objective

Implement only the `D-063`-authorized, `ML-DEVOS-AS-077`-approved `ML-DEVOS-RFC-017` S5 Capability & Permission Gateway V1, as Context Bootstrap V0 Trial #1. That covers:
- schemas and a zero-dependency policy validator;
- a pure five-argument internal evaluator;
- five bounded adapters with per-provider canonicalization and branded trusted contexts;
- default deny with the canonical §4 codes;
- policy-version pinning with a live revocation override;
- trusted-time expiry and class-only credentials;
- a pure CapabilityDecision plus a separately constructed AuditEnvelope;
- focused tests and fixtures;
- the AS-077 descriptor-expiry wording reconciliation;
- the observable `OBL-009` measurements.

Nothing is wired into S3/S4 or any runtime.

## Changed files

New, all under `devos/capabilities/`:
- `index.mjs` — the public entry. `createGateway`, envelope, validator, and vocabularies; the raw `evaluate` is not exported.
- `evaluate.mjs` — the pure internal core. Steps §3 (a)–(g) in order, short-circuiting on the first failure. Beyond the RFC's named checks:
  - the request-intent shape check (§4 `MALFORMED_REQUEST`) runs right after step (a);
  - a loaded, validated policy is required at (b);
  - a non-canonical resource is denied (the core never canonicalizes).
- `trusted-context.mjs` — the module-private WeakMap brand.
  - Minters are released once, then the registry seals.
  - A foreign early claim makes the real registry throw on import (fail closed).
  - `evaluationContext` carries exactly `{time}`.
  - Branded values are frozen and never returned to callers.
- `canonical.mjs` — the §9 per-provider contracts. `shell` is syntactic. `github` owner/repo is lowercased and git ref rules are applied. `cloudflare` IDs are opaque and never decoded. `mcp` follows RFC 3986 with no decoding. `browser` follows WHATWG, http(s) only, with no credentials and no fragment.
- `adapters/{common,shell,github,cloudflare,mcp,browser,index}.mjs` — the static registry and wrappers.
  - The trusted host is bound at gateway construction; the per-request caller supplies only `requestIntent`.
  - The request's provider must equal the adapter's own.
  - `shell` resolves symlinks and `..` with OS semantics and confines to host roots.
  - `cloudflare` accepts only host-held genuine references.
  - Live revocations are fetched every call. Clock, identity, or revocation-source failure throws `TrustedSourceUnavailableError`: no placeholder, no empty list.
- `validate-capability-policy.mjs` — structural checks, the bounded grammar with canonical literals and stems, class-only credentials, and the §8 sensitive-tier rule (load time only; `git.push`/`pr.merge` scopes that can reach `main` count as sensitive). It scans for secret shapes, rejects the whole document on any error, and has a CLI.
- `audit.mjs` — `createAuditEnvelope`. `event_id`, `timestamp`, and `evidence_provenance` are required from the caller and never defaulted.
- `vocabulary.mjs` — the §4 denial enum stated once; ARCH-001 roles and evidence classes; providers (`future` reserved); environments; tiers; the fixed disclaimer; the V1 sensitive-action registry.
- `{capability-descriptor,capability-policy,subject-context,evaluation-context,request-intent,decision}.schema.json` — draft-07 schemas.
- `examples/valid/*.policy.json` (3) and `examples/invalid/*.policy.json` (10).

Also new:
- `tests/capabilities-core.test.mjs` — 21 tests of the raw core, run with genuine brands in their own process.
- `tests/capabilities-gateway.test.mjs` — 16 tests of the public surface.

Modified:
- `devos/changes/rfcs/ML-DEVOS-RFC-017.md` — only the §2 `expiry` row: "not grantable to new attempts after supersession" (AS-077 / D-063).
- `devos/capabilities/README.md` — implementation truth. The manifest is still `NOT_IMPLEMENTED`.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` — the return gate and selector tuple.
- `coordination/CURRENT_HANDOFF.md` — this file. The outgoing `H-CBV0-0001` was already archived byte-identical, with provenance, by the Architect in `5224bbe`.

Unchanged (verified with `git diff ce9c039`, which is empty): `devos/contracts/` (S3), `devos/state/` (S4), `devos/devos-manifest.json`, `devos/governance/rules/`, `coordination/IMPLEMENTER_HANDOFF.md`, and all product/runtime files.

## Tests and evidence

All results are ACTOR_REPORTED. Commands were run on the candidate tree at base `ce9c039`, with dependencies installed via `npm ci` from the lockfile.

- `node --test tests/capabilities-core.test.mjs tests/capabilities-gateway.test.mjs` → 37 tests, 37 pass, 0 fail. Exit `0`. Coverage:
  - every one of the 14 §4 codes, plus a guard asserting the produced set equals the enum;
  - hand-built and replayed-snapshot contexts rejected;
  - expiry at −1 ms (allow), at the exact instant (EXPIRED), and +1 ms (EXPIRED);
  - time-bearing or extra request fields rejected;
  - pinned-v1 vs superseded-v2, with revocation overriding the pin;
  - precedence exact > long prefix > short prefix > `*`, and exact project > `*`;
  - ties denied even when tier and credential agree;
  - per-adapter canonicalization: shell traversal, symlink, dangling and escape cases; malformed GitHub IDs; Cloudflare `%2F` not decoded, with no provenance → deny; MCP percent/scheme rules; WHATWG port, fragment and credentials;
  - the tier rule applies only at load, and `evaluate.mjs` never reads `consequence_tier`;
  - purity: `Date.now`/`Math.random` trapped; byte-identical repeat decisions; the source has no clock, random or I/O;
  - two envelopes around one decision differ, and the envelope timestamp is independent of the evaluation time;
  - trusted-source failures throw;
  - provider laundering is rejected;
  - schemas match the code vocabularies;
  - each invalid fixture fails for its intended reason;
  - no S3/S4 import, network, spawn, or dynamic import; no secret literals.
- Mutation check (scratch copies, restored). 12 guards were disabled one at a time: subject brand, evaluation brand, non-canonical core, revocation, ambiguity, expiry off-by-one, unloaded policy, provider laundering, shell confinement, Cloudflare provenance, tier rule, and non-array revocation. Each made ≥1 test fail. Two guards initially survived (provider laundering; revocation-source string coercion, which would fail open), so tests were added for both before handoff.
- `npm test` → 593 tests, 593 pass, 0 fail (556 before + 37 new). Exit `0`.
- `node devos/capabilities/validate-capability-policy.mjs` → 3 valid and 10 invalid fixtures all as expected. Exit `0`.
- `node devos/contracts/validate-task-contract.mjs` → exit `0`. `node devos/governance/registry/validate-rules.mjs` → exit `0`. `node devos/governance/registry/validate-waivers.mjs` → exit `0`. `node scripts/validate-claude-skills-bridge.mjs` → 4/4 OK.
- Traceability:
  - At base, 288 files / 2 errors / 14 warnings / 287 definitions, with pre-existing DRIFT.
  - After `generate-traceability.mjs` (exit `0`), `validate-traceability.mjs` reports 323 files (+35 new) / 2 errors — `CORE-022` and `WEB-REQ-009`, known debt, preserved, no new fingerprint — / 14 warnings / 287 definitions, `No drift`, exit `1` (the established convention while any ERROR exists).

## Unresolved findings and limitations

- **Brand strength (RFC-017 unresolved question 3).** The brand is an in-process WeakMap, not cryptographic. It closes arbitrary-caller forgery, but not same-process monkeypatching or a lying registered adapter (§9 residual risk). The Architect should judge its adequacy.
- **Host trust boundary.** Truthfulness of subject, clock, and revocation data rests on the embedding host bound at `createGateway()`. Per-request callers cannot inject them, but whoever constructs the gateway is trusted.
- **Not enforcement.** Nothing calls the gateway (RFC-017 misuse case 1, and unresolved question 2); integration is a future RFC.
- **Canonicalization is bounded by what can run offline.**
  - `shell` resolves against the local filesystem and host roots.
  - `cloudflare` provenance is a host-supplied reference set, not a live API check (no network by scope).
  - `github` validates syntax only, with no existence check.
  - `mcp` uses RFC 3986 syntax.
  - Resource URIs must fit the V1 grammar (RFC-017 unresolved question 1).
- **Design choices within RFC-017 for review:**
  - A `git.push`/`pr.merge` scope reaching `refs/heads/main` counts as "protected-branch/main merge" (§8).
  - The V1 sensitive-action registry lives in `vocabulary.mjs`.
  - At the expiry instant a descriptor is `EXPIRED`.
  - A `P/*` prefix requires at least one segment beyond `P`.
  - A DENY carries `descriptor_id` only when a descriptor was matched.
- **Revocation freshness** stays the host's responsibility (RFC-017 unresolved question 5). A stale-but-well-formed list cannot be detected.
- **Obligations:**
  - `OBL-002` (wording reconciliation) is implemented here but left `DEFERRED` for Architect disposition, not self-closed.
  - `OBL-009` is partially satisfied (see measurements).
  - `OBL-010`–`OBL-021` are carried forward unchanged.
- **Trial #1 observation.** `CLAUDE.md`'s "Required first read" list (~96 KB, incl. the 21 KB governance plan) conflicts with STATE's "lean/delta-only" instruction. This session followed STATE and did not read the plan, `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `package.json`, or `wrangler.jsonc`. Whether the entrypoint list should defer to STATE is for the Architect.

## Governing references

- Design: `ML-DEVOS-RFC-017`, approved in `ML-DEVOS-AS-077`.
- Authority: `D-063`.
- Protocol: `ML-DEVOS-RFC-018` / `brain/protocols/CONTEXT_BOOTSTRAP.md`, accepted in `ML-DEVOS-AS-081`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md` (rows unchanged by this transition).
- Rules: `CORE-001`, `CORE-002`, `CORE-008`, `CORE-019`, `CORE-020`, `CORE-021`, consumed unchanged.

## Evidence locations

- The commit diff against `ce9c0391260ef0ba4620936b1b448e3de8d135cb`.
- `tests/capabilities-core.test.mjs`, `tests/capabilities-gateway.test.mjs`, and `devos/capabilities/examples/`.
- `node devos/capabilities/validate-capability-policy.mjs` and `devos/governance/traceability/TRACEABILITY_INDEX.md`.

**OBL-009 Bootstrap Trial #1 measurements (this Builder session only; bytes measured at `ce9c039`; tokens are estimates at bytes/4, not provider-reported):**

| Measure | Observed |
|---|---|
| Bootstrap packet read | STATE 3,273 B + live review `ML-DEVOS-AS-081` 6,265 B + `D-063` section 3,993 B + obligations diff only (full file 7,457 B not read) + `CLAUDE.md` 11,081 B (harness-injected) ≈ 24.6 KB (~6.2k est. tokens), versus the 579,438 B pre-cutover `CLAUDE.md` mandatory set (`CBV0-BASELINE-PRE-1`) |
| Task-spec read | `ML-DEVOS-RFC-017` in full: 83,117 B (the governing specification, required) |
| Expansions | ~11 bounded excerpt reads for conventions: ARCH-001 §3/§6, S3 `project` field and validator header, S3 examples listing, S4 `lifecycle.mjs` head and README, manifest entry and test, capabilities README |
| History reads | 0 reads of the frozen legacy handoff (526,469 B); 2 `git show --stat` commit summaries; no broad history retrieval |
| Duplicate reads | 0 intentional (RFC-017 read once, in two pages) |
| Wrong-turn attempts | 0. The prior turn in this session correctly made no writes while `TURN: ARCHITECT` |
| Stale-publication rejections | none before publication; the leased publish outcome is reported outside this file (self-reference) |
| False blocking | 0 |
| Missed obligations | none identified. `OBL-002` implemented. The `CLAUDE.md`-vs-STATE read-list conflict above is recorded as a finding |
| Rework (self-caught before handoff) | 3 test fixtures violated the §8 tier rule; shell adapter rewritten; `evaluationContext` narrowed to `{time}`; `project` pattern corrected to S3's shape; a secret-shaped fixture value replaced; 2 surviving mutants closed with new tests |
| Scope violations | 0. Every changed path is within the `D-063` mapping |

Not observable here: orientation wall-time, provider-reported token usage, and cross-session or multi-participant measures.

## Next action

The Architect performs an independent implementation review of S5 V1 under the next unused immutable Sync ID after `ML-DEVOS-AS-081`. If that routing deselects `H-S5-TRIAL1-0001`, archive it in the same commit. No further Builder action is authorized. Closure (manifest `IMPLEMENTED`, ADR, version) is a separate, later gated act.
