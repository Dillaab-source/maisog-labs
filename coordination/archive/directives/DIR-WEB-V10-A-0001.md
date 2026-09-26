# Current Directive — V10-A Public Visual Baseline Implementation

```yaml
schema_version: 1
directive_id: DIR-WEB-V10-A-0001
cycle_id: MAISOGLABS_WEB_V10_A
issue_parent_commit: 6dd90bd6d27c62a798a0a27ceb0074a147cb38f2
target_turn: CLAUDE
authority_ref: D-090
applicable_review_id: ML-DEVOS-AS-118
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-090, accepted RFC-021, ML-DEVOS-AS-118, and this directive.

## Objective

Implement V10-A: the public MaisogLabs V10 static, code-owned fail-safe baseline, with approved content and routing, fixed local assets, self-hosted fonts, bounded design-runtime mappings, responsive accessibility corrections, tests, and local visual-parity evidence.

## Preconditions

- Bootstrap Protocol V2 from the exact tip that publishes this directive.
- Confirm D-090, RFC-021, ML-DEVOS-AS-118, this directive ID, and scope `D090_V10_A_PUBLIC_BASELINE_IMPLEMENTATION_ONLY` are selected together.
- Confirm `main` remains `aebc881e8890c00090d714602591138a045bd3b0`.
- Confirm only `MEDIA_MUTATION_AUTHORIZED` and bounded repository `MUTATION_AUTHORIZED` are YES; every remote, deploy, audit, and main-merge flag remains NO.
- Stop on any stale tip, protocol mismatch, scope ambiguity, or missing governing record.

## Governing references

- **T0:** Protocol V2, D-090, accepted ML-DEVOS-RFC-021, and the hard boundaries in live STATE.
- **T1:** ML-DEVOS-AS-118; D-088 and D-089; `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`; V10 HTML identity `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`; main `aebc881e8890c00090d714602591138a045bd3b0`.
- **T2:** `design-references/claude-v10/**`; preserved RFC-010 security/lifecycle invariants; current public content boundary; `coordination/OPERATIVE_OBLIGATIONS.md`.
- **T3:** only for a named unresolved implementation question, with the reason and evidence classification recorded.

## Exact execution scope

**Allowed Builder surfaces:**

- `app/layout.js`, `app/page.js`, `app/globals.css`, `app/DesignRuntime.js`;
- `components/site/**`;
- `data/site.js`;
- `lib/content/schema.mjs`, `lib/design/**`;
- `public/v10/**`;
- V10-focused `tests/**` files;
- V10 contract, divergence, asset-manifest, and local evidence files under `docs/product/**`;
- normal Protocol V2 coordination, directive archive/provenance/index, and handoff evidence for the return.

**Required implementation:**

- faithfully reproduce the approved V10 composition as the static fallback without `dc`, `support.js`, Babel, remote fonts, remote assets, or D1/API dependency;
- use exactly the eight approved projects, ClinicFlow once, factual plain-language copy, and `paulo.maisog@maisoglabs.com`;
- use canonical `#systems`, `#projects`, `#journal`, `#contact`; resolve `#research` to the same Journal surface; retain governed compatibility aliases;
- record and implement D1 accessible compact/mobile navigation and D2 narrow Systems-label correction;
- integrate only fixed allowlisted local media and self-hosted fonts with source/license/hash records, preserving reference bytes;
- ignore removed presentation fields, apply only fixed mappings, clamp panel opacity to `80..90`, border intensity to `10..25`, radius scale to `80..120`, and map animation `calm -> Full`, `minimal -> Calm`, `off -> Still`, with reduced motion forcing Still;
- lock AS118-F001's exact overlay mapping in the implementation contract and deterministic tests: range boundaries, monotonicity, invalid fallback, and exact V10 point.

**Not allowed:** admin V10-B; API-DIAG/API-FIX; Worker, migration, package or lockfile changes; remote resources; theme publication; main merge; deployment; production mutation; or any held item named in STATE.

## SENTINEL Sync

Fresh snapshot: `6dd90bd6d27c62a798a0a27ceb0074a147cb38f2`, confirmed as the authoritative remote tip before this directive transition. The mandatory `--session-protocol 2` bootstrap passed.

**Authority:** Paulo's D-090 authorizes only the bounded V10-A implementation. RFC-021 is accepted architecture; AS-118 is the controlling independent review and AS118-F001 is mandatory acceptance work.

**Context:** The V10 artifact and repository references are source-controlled. The known production API incident remains separate and is neither a prerequisite nor part of this implementation.

**Capability:** local repository application/media/test/documentation writes on the allowlisted surfaces are available. Cloudflare, D1, R2, Access, DNS, domain, secret, environment, production, merge, deploy, promotion, rollback, and API-diagnosis capabilities are neither required nor authorized.

**Execution:** one V10-A implementation and one Protocol V2 return. No admin or backend repair may be mixed into this cycle.

**Evidence:** return exact base/result commits, changed files, hashes and licenses, test/build results, visual evidence at desktop and narrow widths, and an explicit local-only evidence classification.

Disposition: `CLEAR`.

## SU Contradiction Check

Mode: `BOUNDED_CONTRADICTION`. Disposition: `CLEAR_WITH_NOTES`.

1. V10 must be the code-owned fallback even when `/api/design` fails; runtime settings may only adjust approved dimensions through fixed mappings.
2. Prototype mechanics, placeholder copy, remote font declarations, and free-form paths are reference evidence, not runtime authority.
3. The accepted eight-project list and owner email replace conflicting prototype content.
4. RFC-010's security, positive-allowlist, revision, lifecycle, and published-only guarantees remain intact despite its visual-baseline supersession.
5. D1/D2 are approved accessible corrections and must be disclosed rather than hidden as parity failures.
6. V10-B and the API incident are separable work and remain unauthorized.

## Instructions

1. Re-bootstrap and read D-090, RFC-021, AS-118, the V10 plan, obligations, current public implementation, and exact V10 source from one snapshot.
2. Write the implementation contract first, including AS118-F001's exact overlay point and mapping.
3. Integrate fixed local assets and fonts with a deterministic source/hash/license manifest.
4. Implement the public composition, content, routing, responsive D1/D2 corrections, and bounded design-runtime mapping only on allowlisted surfaces.
5. Add focused deterministic tests and run the full suite/build.
6. Render and compare desktop and narrow/mobile views; record evidence and remaining deliberate divergences.
7. Publish one Protocol V2 Builder return, archive/deselect this directive byte-for-byte with provenance, clear the live selectors and flags, and route to the Architect.

## Validation and evidence

- `git diff --check` passes.
- Focused V10 tests and full `npm test` pass.
- `npm run build` passes without remote runtime dependencies.
- The V10 HTML hash, copied-source hashes, derivative lineage, and font licenses/sources are recorded and reproducible.
- Tests prove eight unique projects, ClinicFlow once, exact email, canonical/alias routing, V10 fail-safe behavior, ignored fields, every clamp boundary/fallback, animation mappings, and AS118-F001.
- Desktop and narrow/mobile screenshots are recorded as local `ACTOR_REPORTED` evidence with D1/D2 in the divergence register.
- No unlisted surface or prohibited remote/production capability is touched.
- The Protocol V2 publish checker passes in check-only mode before compare-and-swap publication.

## Stop conditions

Stop if admin, Worker, migration, package, API diagnosis/fix, remote resource, production, merge, or deploy work would be required; if an asset lacks a traceable source/license where required; if V10 cannot remain the static failure baseline; if a required decision is ambiguous; or if freshness/protocol/publication checks fail.

Do not broaden scope to resolve an unrelated issue.

## Next action

The Builder implements V10-A and returns through a newly minted handoff (expected `H-WEB-V10-A-0001`) with exact implementation and evidence. The return must set `CURRENT_DIRECTIVE: NONE`, clear directive selectors and all action flags, and route to `TURN: ARCHITECT`, `STATUS: READY_FOR_ARCHITECT`.

Then stop. Architect acceptance, V10-B, API work, main merge, and deployment remain separate decisions.
