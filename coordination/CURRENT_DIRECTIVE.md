# Current Directive — V10 Admin Content Bridge Architecture Planning

```yaml
schema_version: 1
directive_id: DIR-WEB-V10-CONTENT-BRIDGE-PLAN-0001
cycle_id: MAISOGLABS_WEB_V10_CONTENT_BRIDGE_PLAN
issue_parent_commit: 65288c7c9c412506826ca72912a8f32d816c95a1
target_turn: CLAUDE
authority_ref: D-104
applicable_review_id: ML-DEVOS-AS-130
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-104 and `ML-DEVOS-AS-130`.

## Objective

Produce a repository-grounded architecture for a V10 Admin Content Editor plus a Public Content Bridge that lets Paulo eventually edit recruiter-facing copy from `/admin` while preserving the D-093 V10 homepage. The rule is: code owns the V10 design; admin owns approved content fields.

Deliver:
- `docs/product/V10_ADMIN_CONTENT_BRIDGE_PLAN.md`;
- a draft of `devos/changes/rfcs/ML-DEVOS-RFC-022.md` (status `DRAFT`).

## Preconditions

- The Protocol V2 bootstrap passes, and STATE selects this directive with every action flag `NO`.
- `main` is still `6e14077a0f48ba7712d772b3f8e1d0b9b62e0ab4`.
- `public/index.html` SHA-256 is still `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9`.

## Governing references

- **T0:** Protocol V2; D-104; live STATE; `ML-DEVOS-AS-130`.
- **T1:** D-093 and the homepage artifact records; `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`; `ML-DEVOS-RFC-021`; `docs/ARCHITECTURE.md`; `coordination/OPERATIVE_OBLIGATIONS.md`.

## Exact execution scope

Allowed:
- repository reads;
- local read-only analysis, including running existing tests;
- writing the plan document and the RFC-022 draft;
- one Protocol V2 Builder return.

Not allowed:
- changes to `public/index.html`, `app/**`, `worker/**`, `migrations/**`, `lib/**`, `data/**`, `scripts/**`, tests or configuration;
- Cloudflare calls; remote D1/R2;
- deployment; `main`;
- A-2, A-3, A-5, A-6, A-7, A-8, A-9;
- S6/S7, PR #7, PR #10, D-068, `devos/execution/`, `tests/fixtures/execution/`.

## SENTINEL Sync

- **Authority:** D-104 (Paulo), planning only.
- **Context:** D-093 made the homepage a static artifact; the prior V10 plan predates it.
- **Capability:** repository and documentation writes only.
- **Execution:** single pass.
- **Evidence:** repository citations and local read-only test output.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`. The architecture choice is itself under contradiction review inside the plan. The directive only fixes that the plan must not assume its preferred candidate.

## Instructions

1. Inspect the D-093 artifact, the admin/worker/D1 code, the migrations and the prior V10 plan.
2. Compare the alternatives.
3. Select and specify the architecture.
4. Write the plan and the RFC-022 draft.
5. Publish the return.

## Validation and evidence

- every claim about current code cites a repository path;
- the existing test suite still passes unchanged;
- `public/index.html` is byte-unchanged.

## Stop conditions

Stop if any step would need a runtime, product or Cloudflare change, or if the repository contradicts D-093 in a way that invalidates planning.

## Next action

Publish `H-WEB-V10-CONTENT-BRIDGE-PLAN-0001`. Archive and deselect this directive, keep every flag `NO`, and route `TURN: ARCHITECT`.
