# ML-DEVOS-AS-031 — Durable Architect Sync Archive

Status: `CONCLUDED — ARCHITECT_APPROVED / SCREENSHOT-REFERENCE WORKFLOW ADDENDUM`

Canonical rolling source:
- `coordination/ARCHITECT_REVIEW.md`

Concluding source snapshot:
- commit: `c6a53593caae0b32a9dd542d6adeea1aced0198f`
- file blob: `6205aa65d54bb9766b4037a037cb11044b5e73b7`

## Concluding snapshot

```markdown
# Architect Review

Status: `ARCHITECT_APPROVED — WEB-INC-007 SCREENSHOT REFERENCE WORKFLOW ADDENDUM`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-031 — Screenshot Reference → Admin Design Workflow Addendum

Parent architecture:
- `ML-DEVOS-RFC-010`
- `ML-DEVOS-AS-030`
- `D-032`

Workflow document:
- `docs/product/DESIGN_REFERENCE_WORKFLOW.md`

## User requirement

Paulo requires WEB-INC-007 to support this practical workflow:

`upload UI screenshot to ChatGPT → Architect analyzes → structured plan → Claude applies through admin design controls → preview → Paulo review → publish`

## Compatibility finding

This requirement is compatible with the already-approved WEB-INC-007 architecture **without adding a new runtime AI subsystem, table, or public API**.

The screenshot is an Architect-side reference input.

MaisogLabs stores only validated WEB-INC-007 design settings.

## Required behavior

The implemented design-control surface must be deterministic enough that an Architect-generated plan can be applied repeatably through:

- fixed control names;
- visible allowed values;
- stable numeric ranges;
- explicit section controls;
- Save Draft;
- Preview;
- Publish;
- clear validation/conflict feedback.

Claude may apply an approved plan through the authenticated UI or the exact same bounded admin APIs.

## Scope boundary

The workflow does not authorize:

- arbitrary CSS/JS/HTML;
- screenshot-to-code generation inside the website;
- raw D1 updates;
- direct source edits to mimic a reference;
- arbitrary new presets;
- new tables/routes;
- a website-resident LLM/image model;
- deployment or main merge.

If a reference cannot be expressed by existing WEB-INC-007 controls, the Architect must mark the difference as a GAP and route it through a later bounded design change rather than bypassing the control layer.

## Third-party reference rule

Reference screenshots may inform composition, hierarchy, spacing, geometry, density, color relationships, and interaction patterns.

They must not be used to intentionally copy third-party logos, proprietary copy, unique illustrations, photography, or trademarked identity elements unless Paulo has rights to use them.

## Verdict

`ML-DEVOS-AS-031: ARCHITECT_APPROVED — SCREENSHOT-TO-ADMIN WORKFLOW IS A REQUIRED OPERATING USE CASE OF WEB-INC-007`

This addendum does not change the approved table count, route count, resource boundary, or release authority.
```
