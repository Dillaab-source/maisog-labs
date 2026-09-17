# Project Onboarding: <Project Name>

See `../governance/specifications/PROJECT_ONBOARDING_SPEC.md` for the full specification this template implements.

```yaml
# project.yaml
project_id: <stable id>
repository: <owner/repo — may be Dillaab-source/maisog-labs itself, or independent>
owner: <human owner>
onboarded_at: <date — filled when actually approved, not when drafted>
onboarding_decision_id: <decision record ID — filled when actually approved>
status: PROPOSED
```

## Why onboard this project

What this project is, and why it should come under Sentinel governance.

## Proposed overlay

```yaml
# overlay.yaml (draft)
strengthens: []   # [{ rule_id, addition }]
narrows: []       # [{ rule_id, narrowing }]
local_rules: []   # rule_ids to be defined in ../governance/rules/<project>-rules.json
```

State explicitly: does this overlay touch any `CONSTITUTIONAL` or `CORE_POLICY` rule? If so, explain how it strengthens/narrows rather than weakens (`CORE-009`) — the Architect will check this specifically.

## Proposed requirements/risks/capabilities

Sketch what `requirements.yaml`, `risks.yaml`, and `capabilities.yaml` (`PROJECT_ONBOARDING_SPEC.md`) would contain for this project, at whatever level of detail is available at proposal time. Full detail is not required before Architect review — enough to assess compatibility is.

## Non-migration confirmation

Confirm explicitly: does onboarding this project require moving its application source into `Dillaab-source/maisog-labs`? (Default answer: **no** — per `CORE-015`, co-location is never required.) If migration is somehow proposed anyway, that is a separate, additional authorization beyond onboarding itself.
