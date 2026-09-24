# Current Handoff — S5 Remediation Cycle 1 (AS82-F001, AS82-F002)

```yaml
schema_version: 1
handoff_id: H-S5-REM1-0001
cycle_id: SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION
input_base_commit: f6fd5179d8a0d21e7ce0d2121dfc87f783735de3
review_target_commit: f6fd5179d8a0d21e7ce0d2121dfc87f783735de3
applicable_review_id: ML-DEVOS-AS-082
```

This handoff is evidence, not authority. Routing, turn, scope, and flags live only in `coordination/STATE.md`. The Builder does not self-approve this remediation.

## Objective

Remediation cycle 1 of 2, scope `SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_REMEDIATION_CYCLE_1_ONLY`. It corrects exactly the two `ML-DEVOS-AS-082` blockers and nothing else:

- `AS82-F001` — close the trusted-context minter-acquisition bypass.
- `AS82-F002` — make shell resolution platform-aware.

The non-cryptographic, in-process V1 trust model is preserved. There is no redesign, no new provider, and no S3/S4 wiring.

## Changed files

**AS82-F001**

- `devos/capabilities/trusted-context.mjs` — rewritten.
  - The WeakMap brand, the (now unexported) `makeMinter`, and the only code that uses minters (`createGateway` plus the five statically imported adapter factories) live in this one module.
  - `registerAdapters`, `isRegistrySealed`, and `RegistrySealedError` are removed.
  - No module exports, returns, or accepts a callback for a minter. Each adapter gets a fresh minter for its own provider only, kept inside a closure that exposes only `request()`.
  - `Reflect.apply`, `Object.freeze`, `Object.keys`, and `WeakMap.prototype.get`/`set` are captured at load, so late monkeypatching cannot intercept a genuine context.
  - The header states the unchanged residual limits: pre-load intrinsic patching, loader hooks, source edits, and a lying host or adapter.
- `devos/capabilities/adapters/index.mjs` — deleted. The registry moved into `trusted-context.mjs`.
- `devos/capabilities/index.mjs` — `createGateway` and `GatewayConfigurationError` are now re-exported from `trusted-context.mjs`. The public surface is otherwise unchanged, and the raw `evaluate` is still not exported.

**AS82-F002**

- `devos/capabilities/canonical.mjs` — the `shell` contract is now platform-aware.
  - POSIX `/…` is unchanged.
  - Windows drive paths become `C:/…`, with the drive letter uppercased.
  - UNC paths become `//server/share/…`.
  - Output always uses `/`, with no `.`/`..` or empty segments.
  - Drive-relative (`C:x`), rooted-without-drive (`\x`), relative, and share-less UNC paths are rejected.
  - A backslash in a POSIX path is rejected (fail closed; it is not a separator there).
- `devos/capabilities/adapters/shell.mjs` — resolution uses the host's native `path` and real `fs`.
  - It walks segments from the realpath of the native root, applying `realpath` per existing component (OS symlink semantics).
  - A dangling component → `null`. A not-yet-existing tail is appended literally.
  - Windows roots must be `X:\` or `\\server\share\`.
  - Roots and results are canonicalized to `/` form, and confinement is segment-aware (`isWithinRoot`, which also handles drive roots like `C:/`).
  - The algorithm is exported as pure functions over injectable `pathImpl`/`fsImpl` (`resolveShellPath`, `toCanonicalShellPath`, `canonicalizeShellResource`, `canonicalRoots`). The adapter always uses native `path`/`fs`. These are path helpers, not a trust hook: nothing in them touches minters or brands.

**Tests and docs**

- `tests/capabilities-bypass.test.mjs` (new, 2 tests) — each scenario runs in a fresh child process with no production hook.
  - Early-harvest: the hostile code imports the brand module first and exercises every export of every production module (call-with-capture) before any other code loads.
  - Late-intrinsic-patch: it patches `WeakMap`/`Object.freeze`/`Object.keys`/`Reflect.apply` after load and uses a hostile host whose callbacks capture `this`/`arguments`.
  - Both collect anything minter- or context-shaped, attempt a raw-core ALLOW under a maximally permissive loaded policy, and fail on any usable minter, any forged ALLOW, or any single leaked genuine context (checked with the exported verifiers).
  - Both also assert that the legitimate gateway still produces ALLOW.
- `tests/capabilities-shell-platform.test.mjs` (new, 11 tests) — pure Windows/UNC/POSIX canonical forms, plus the production resolver under `path.win32` over an in-memory Windows-semantics fs (case-insensitive, true-case realpath, symlinks, dangling links, and `\` resolving against the current drive). It covers:
  - drive and UNC resolution, and forward-slash input;
  - symlink and `link\..` OS semantics;
  - escape, traversal, dangling, missing-drive, and non-absolute rejection;
  - not-yet-existing tails;
  - segment-aware confinement (`C:/repo` ⊄ `C:/repository`);
  - that policies accept only canonical `/`-form Windows literals.
- `tests/capabilities-core.test.mjs` — rewritten to drive decision semantics through the real adapter path with a configurable trusted host (the legitimate `createGateway` embedder API) instead of the removed minter release. It adds an assertion that the brand module exports no minting or registration surface. Still 21 tests.
- `tests/capabilities-gateway.test.mjs` — the sealed-registry assertion is replaced with "no public minting/registration surface". Still 16 tests.
- `devos/capabilities/README.md` — the brand, registry, and shell-platform descriptions are updated.
- `devos/governance/traceability/{TRACEABILITY_INDEX.md,traceability-index.json}` — regenerated.
- `coordination/STATE.md` (return gate) and `coordination/CURRENT_HANDOFF.md` (this file). The outgoing `H-S5-TRIAL1-0001` was already archived byte-identical by the AS-082 transition.

Unchanged (`git diff f6fd517` is empty): `devos/contracts/`, `devos/state/`, `devos/devos-manifest.json` (the `devos/capabilities/` root is still `NOT_IMPLEMENTED`), `devos/governance/rules/`, and the frozen legacy handoff.

## Tests and evidence

All results are ACTOR_REPORTED. Commands were run on the candidate tree at base `f6fd517`.

- **Bypass reproduced before the fix.** Against the unremediated code, the early-harvest probe reported `{"minters":5,"bypass":5}` (5 genuine minters and 5 forged trusted direct-core ALLOWs), and the late-patch probe `{"bypass":1}`. After the fix both report `"minters":0,"bypass":0,"leaked":0`.
  - Correction disclosed: the first draft of the early-harvest probe imported every module before exercising exports, so the real registry had already sealed and the probe falsely passed on vulnerable code. It was fixed to exercise each module immediately after importing it.
- `node --test tests/capabilities-*.test.mjs` → 50 tests, 50 pass, 0 fail (21 core + 16 gateway + 2 bypass + 11 shell-platform). Exit `0`.
- **Mutation check** (scratch copies, restored byte-identical). 15 regressions were reintroduced one at a time, and each made ≥1 test fail:
  - F001: minter factory exported; registration surface reintroduced; uncaptured `WeakMap.set`; uncaptured `Object.freeze`; uncaptured `Object.keys`.
  - F002: rooted-without-drive accepted; non-segment-aware confinement; lexical (no-symlink) resolution; dangling tolerated; forward slashes not handled on Windows; drive-letter case not canonical; POSIX backslash accepted.
  - The first run left 3 survivors: two F001 intrinsic mutants, because the probe counted only full ALLOWs, and rooted-without-drive, because the fake fs didn't model the current drive. Both probes were strengthened, and all three are now killed.
- `npm test` → 606 tests, 606 pass, 0 fail (593 before + 13 new). Exit `0`.
- Validators, all exit `0`: `node devos/capabilities/validate-capability-policy.mjs`, `node devos/contracts/validate-task-contract.mjs`, `node devos/governance/registry/validate-rules.mjs`, `node devos/governance/registry/validate-waivers.mjs`. `node scripts/validate-claude-skills-bridge.mjs` → 4/4 OK.
- Traceability:
  - At base: 326 files / 2 errors / 14 warnings / 288 definitions, with pre-existing DRIFT (from the AS-082 publication).
  - After `generate-traceability.mjs` (exit `0`), `validate-traceability.mjs` reports 327 files (+2 tests, −1 deleted module) / 2 errors — `CORE-022`, `WEB-REQ-009`, known debt, preserved, no new fingerprint — / 14 warnings / 288 definitions, `No drift`, exit `1` (the established convention).

## Unresolved findings and limitations

- **Residual in-process limits (unchanged V1 model, disclosed in the `trusted-context.mjs` header).**
  - Code that patches intrinsics or installs Node loader hooks *before* the brand module loads, or edits source, is not stopped.
  - A lying host or registered adapter is not stopped.
  - The late-patch probe covers only patching after load.
- **Coverage consequence of closing the bypass.** Three `evaluate()` branches are now reachable only by a holder of genuine brands, and no caller can be one:
  - `UNKNOWN_PROVIDER`;
  - the unloaded-policy guard at step (b);
  - the non-canonical-resource guard.

  They remain as defense in depth and are asserted by source inspection in `tests/capabilities-core.test.mjs`, not by execution. Consequently two earlier mutants ("accept unloaded policy", "core accepts non-canonical") can no longer be killed by execution. The core coverage guard now asserts 13 of 14 codes through the public path. The adapter still answers a foreign provider name with `MALFORMED_REQUEST` rather than `UNKNOWN_PROVIDER`: that is pre-existing behavior not in AS-082's scope, flagged for Architect disposition.
- **Windows coverage is by construction, not by execution.** It comes from the production resolver under `path.win32` with a modeled filesystem. It was not executed on a real Windows host, so real NTFS junctions, 8.3 short names, and `\\?\` long-path prefixes are not exercised; `\\?\` and device paths are rejected by the canonical grammar, fail closed.
- **POSIX filenames containing `\`** are now rejected as a deliberate fail-closed consequence.
- **Obligations.** `OBL-002` was closed by AS-082. `OBL-009`–`OBL-021` are carried forward unchanged; this transition changes no inventory row.

## Governing references

- Findings: `ML-DEVOS-AS-082` (`AS82-F001`, `AS82-F002`).
- Design: `ML-DEVOS-RFC-017` §3, §9, approved in `ML-DEVOS-AS-077`.
- Authority: `D-063`.
- Protocol: `brain/protocols/CONTEXT_BOOTSTRAP.md`.
- Obligations: `coordination/OPERATIVE_OBLIGATIONS.md`.

## Evidence locations

- The commit diff against `f6fd5179d8a0d21e7ce0d2121dfc87f783735de3`.
- `tests/capabilities-bypass.test.mjs` and `tests/capabilities-shell-platform.test.mjs`.
- `devos/capabilities/trusted-context.mjs` (header), `devos/capabilities/adapters/shell.mjs`, and `devos/capabilities/canonical.mjs`.

**OBL-009 Bootstrap trial measurements (this Builder session; bytes measured at `f6fd517`):**

- **Bootstrap packet:** STATE 3,411 B plus the AS-082 findings section (full review 9,638 B), with no other governance reads.
- **Code context:** carried from this session's prior turn. Before relying on it, I verified by `git diff d589a16 f6fd517 -- devos tests` (no code drift) instead of re-reading the files.
- **Legacy/history reads:** 0 of the frozen handoff; 1 `git show --stat` of the routing commit.
- **Wrong-turn attempts, false blocking, scope violations:** 0.
- **Rework:** one false-passing probe corrected; three mutation survivors closed by strengthening tests.

## Next action

The Architect reviews Remediation Cycle 1 independently under the next unused immutable Sync ID after `ML-DEVOS-AS-082`. If that routing deselects `H-S5-REM1-0001`, archive it in the same commit. One autonomous remediation cycle remains within `MAX_REMEDIATION_CYCLES: 2`. No further Builder action is authorized.
