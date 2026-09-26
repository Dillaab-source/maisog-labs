# Current Directive — MaisogLabs V10 Visual Parity + Admin Architecture Planning

```yaml
schema_version: 1
directive_id: DIR-WEB-V10-PLAN-0001
cycle_id: MAISOGLABS_WEB_V10_PLANNING
issue_parent_commit: 98a26e2d05f1056806994ea80716ed84960e3e39
target_turn: CLAUDE
authority_ref: D-087
applicable_review_id: ML-DEVOS-AS-116
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of:
- live STATE;
- D-087;
- ML-DEVOS-AS-116;
- this directive.

The Builder published it as mechanical publisher of Paulo's D-087.

## Objective

Produce `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`, a repository-grounded V10 visual-parity and admin-architecture plan with the 20 sections D-087 requires.

This is planning only.

## Preconditions

- A fresh Protocol V2 bootstrap of the tip that publishes this directive.
- The V10 HTML hash equals `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`.
- `main` = `aebc881e8890c00090d714602591138a045bd3b0`.
- D-068 stays untouched.

## Governing references

- **T0:** Protocol V2, D-087, and the hard boundaries.
- **T1:** STATE, ML-DEVOS-AS-116, D-087, V10 artifact identity, and current main.
- **T2 (only as needed):**
  - ML-DEVOS-RFC-010;
  - `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md`;
  - `app/DesignRuntime.js`, `app/admin/DesignControls.js`, `components/site/**`, `app/globals.css`;
  - the content boundary (`data/site.js` → `lib/content/**`);
  - the V10 package Design Panel skill;
  - the V10 artifact.
- **T3 history:** only for a named unresolved question, with the reason recorded.

## Exact execution scope

**Allowed:**
- read-only inspection of the repository and `design-references/claude-v10/**`;
- local read-only rendering and screenshots (scratch only, not committed unless needed as plan evidence);
- writing the single plan artifact;
- the Protocol V2 return records.

**Not allowed:** anything D-087 lists as NOT authorized, which includes:
- no changes to `app/`, `components/`, `lib/`, `data/`, `worker/`, `migrations/` or `public/`;
- no media copied into runtime paths;
- no Cloudflare, D1 or R2 access for mutation.

## SENTINEL Sync

Snapshot `98a26e2d05f1056806994ea80716ed84960e3e39`, from a fresh `--session-protocol 2` bootstrap (exit 0).

**Live state:**
- `TURN: PAULO`, `STATUS: INCIDENT_ACCEPTED_WITH_KNOWN_DEGRADATION`;
- scope `AS116_…_PAULO_NEXT_DECISION_ONLY`;
- no directive or handoff, and all flags NO.

**Repository checks:**
- Commit `98a26e2` is an owner-authored direct push adding only `design-references/claude-v10/**` (204 files). It is outside the governed publisher, but it is owner-authored, reference-only, and runtime-inert.
- `main` = `aebc881…`.
- The production API incident (AS-116) is open and is kept separate.

Disposition `CLEAR`.

## SU Contradiction Check

Mode `BOUNDED_CONTRADICTION`. The plan is documentation only, and primary evidence (the artifact, the repository and the accepted records) is expected to suffice. Disposition `CLEAR_WITH_NOTES`.

**Notes:**
1. RFC-010's V3 fail-safe baseline conflicts with V10. The plan must name the governed mechanism and must not reinterpret RFC-010 silently.
2. V2A's prohibition on public structural redesign means V10 is a new increment, not V2A.
3. The ZIP hash is owner-reported, because only the extracted entries are in the repository. The HTML hash is verified.
4. The Builder cannot reach production from this environment, so API diagnosis is planned only, never executed.

## Instructions

1. Inspect V10: the HTML, its dependencies and asset hashes. Render it locally at desktop and mobile widths.
2. Inspect the current site, and build the parity matrix and the admin-control matrix.
3. Resolve the RFC-010 / V2A conflicts and recommend the smallest mechanism.
4. Write the plan (20 sections). Run the SU ledger and the Design Panel passes.
5. Return through `H-WEB-V10-PLAN-0001`.

## Validation and evidence

- Hashes recorded.
- `git diff` limited to the plan plus Protocol V2 records.
- `git diff --check` clean.
- A Context Bootstrap check-only run before publishing.
- Screenshots classed as `ACTOR_REPORTED`.

## Stop conditions

Stop if any of these occurs:
- the V10 hash mismatches;
- implementation or production access would be needed;
- the directive scope conflicts with D-087;
- a stale tip or protocol mismatch.

## Next action

The Builder plans, then publishes one Protocol V2 return commit containing:
- the plan;
- `H-WEB-V10-PLAN-0001`;
- the directive archived;
- `CURRENT_DIRECTIVE: NONE`;
- `TURN: ARCHITECT`.

Then it stops.
