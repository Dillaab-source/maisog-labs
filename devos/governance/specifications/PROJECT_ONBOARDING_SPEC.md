# Sentinel Project Onboarding Specification

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Formalizes `ML-DEVOS-AS-003` "Project overlays," `ML-DEVOS-ARCH-001` §2/§9 (repository/overlay topology), and `../../governance/REPOSITORY_OVERLAY_TOPOLOGY.md`. Template: `../../templates/PROJECT_ONBOARDING_TEMPLATE.md`.

## Constitutional anchor

Projects may remain independent repositories (`CORE-015`). Onboarding a project under Sentinel governance never requires moving its application source into the Sentinel core monorepo (`Dillaab-source/maisog-labs`). A project overlay may narrow its own permissions/allowed actions or add stricter local requirements; it may never shrink the applicability of, or otherwise weaken, a Sentinel-wide constitutional/core rule (`CORE-009`). **S1-F005 correction:** "narrowing" means restricting what the project itself may do — it never means reducing where a Sentinel-wide rule reaches. A rule that applies Sentinel-wide continues to apply Sentinel-wide, including to this project, regardless of any overlay.

## The `.devos/` overlay

A project onboarded under Sentinel receives its own `.devos/` directory, in **its own repository** (or, during the current website-pilot transition, inside this monorepo at `maisog-labs`'s own eventual `.devos/`, not created in S1 — see `REPOSITORY_OVERLAY_TOPOLOGY.md`):

```
.devos/
  project.yaml          # identity: project_id, repository, owner, onboarding date, status
  overlay.yaml          # which core rules this project strengthens/narrows, and how
  requirements.yaml     # project-specific requirements, in the same
                         # Requirement -> Design -> Implementation -> Test -> Evidence -> Status
                         # traceability shape as the frozen S0 architecture
  risks.yaml            # project-specific risk register entries
  capabilities.yaml     # which capabilities (CAPABILITY_CHANGE_SPEC.md) this project's
                         # actors are granted, scoped to this project only
```

### `project.yaml` fields

| Field | Meaning |
|---|---|
| `project_id` | Stable identifier. |
| `repository` | Where the project's source actually lives (may be `Dillaab-source/maisog-labs` itself, or an independent repository). |
| `owner` | Human owner of the project. |
| `onboarded_at` | Date onboarding was approved. |
| `onboarding_decision_id` | The `brain/DECISION_LOG.md`-equivalent decision that approved onboarding this project. |
| `status` | `PROPOSED` / `ACTIVE` / `RETIRED`. |

### `overlay.yaml` fields

| Field | Meaning |
|---|---|
| `strengthens` | List of `{ rule_id, addition }` — core rules this project applies more strictly than the Sentinel-wide default. |
| `narrows` | List of `{ rule_id, narrowing }` — **the project's own permitted actions/permissions** under a core rule, made stricter than the Sentinel-wide default. **Never** a reduction in where the core rule itself applies (S1-F005 correction). Example: a project may narrow `CORE-012` by requiring *two* human approvers for its own merges instead of one — that is a stricter local permission rule. It may not narrow `CORE-012` by exempting itself from Paulo-gating — that would shrink the rule's Sentinel-wide applicability, which is forbidden regardless of overlay wording. |
| `local_rules` | List of `rule_id`s defined in this project's own rule file (`../rules/<project>-rules.json`), never overlapping a `CORE-*` ID. |

`overlay.yaml` may never contain a field that redefines, disables, or contradicts a `CONSTITUTIONAL`- or `CORE_POLICY`-class core rule, and `narrows` entries may never reduce a Sentinel-wide rule's reach. A structural validator extension (not built in S1) would eventually check this mechanically; until then, this is checked by Architect review of the overlay proposal itself, per the `PROJECT_ONBOARDING` row in `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1. Any actual change to a core/constitutional rule's applicability or strength must go through that rule's own change class and authority (e.g. a `CONSTITUTIONAL` rule's own RFC + Architect Sync + explicit Paulo approval path) — never through a project overlay at any authority level.

### `requirements.yaml`, `risks.yaml`, `capabilities.yaml`

These mirror, at project scope, the same shapes the website pilot already proved out informally in `brain/GOVERNANCE_MAP.md` and `brain/RISK_REGISTER.md` (requirement/evidence traceability, risk-control-test-evidence-status), and the capability shape in `CAPABILITY_CHANGE_SPEC.md`, respectively — just under a project-scoped, machine-readable file instead of hand-maintained Markdown tables. Exact field-level schemas for these three files are left to a later S1.x or S2 cycle; this specification establishes their existence and purpose, per `D-012`'s S1 scope, which authorizes the onboarding *template* and *specification*, not a full schema for every constituent file.

## Onboarding process (per `../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1, `PROJECT_ONBOARDING` row)

1. Project owner proposes onboarding using `../../templates/PROJECT_ONBOARDING_TEMPLATE.md`.
2. Architect reviews the proposed overlay for compatibility and for any attempted silent weakening of core rules.
3. Paulo approves onboarding.
4. The project's `.devos/` files are created in its own repository (or registered, if co-located).
5. The onboarding decision is recorded (`brain/DECISION_LOG.md`-equivalent).

## S1 scope

This is a specification and template only. **No project is onboarded by this commit.** No `.devos/` directory is created anywhere, including for the website pilot itself — the website continues to use its own proven `brain/`+`coordination/` mechanism, per `D-012`/`AS-003`/`REPOSITORY_OVERLAY_TOPOLOGY.md`, until an explicit, separately authorized migration decision.
