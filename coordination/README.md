# MaisogLabs Agent Coordination Protocol

This directory is the auditable communication channel between the Implementer (Claude) and the Architect / Independent Reviewer (ChatGPT).

## Roles

- **Paulo** — Product / Risk Owner. Final authority for product decisions, material scope, accepted risk, and stage authorization.
- **Claude** — Implementer. Inspects repository reality, implements authorized work, executes tests, and writes implementation evidence.
- **ChatGPT** — Architect / Independent Reviewer. Independently checks repository state, diffs, tests, evidence, requirements, and risks.
- **Repository + tests + runtime/deployment evidence** — source of truth.

## Files

### `IMPLEMENTER_HANDOFF.md`
Owned for writing by Claude during an authorized implementation/reconnaissance cycle.

Claude records:
- cycle/change ID
- commit / branch state
- objective and review scope
- files inspected or changed
- requirements / risks affected
- commands and tests executed
- results and evidence
- known limitations
- unresolved questions
- Paulo-level decisions required
- requested Architect review mode

### `ARCHITECT_REVIEW.md`
Owned for writing by ChatGPT during Architect Sync.

The Architect records:
- exact reviewed commit / branch
- review mode and scope
- evidence inspected
- findings
- blockers
- required remediation
- Paulo decisions required
- verdict

Claude must read the latest Architect Review before starting remediation or the next authorized phase.

## Communication cycle

```text
Paulo authorizes scope
        |
        v
Claude inspects / implements
        |
        v
coordination/IMPLEMENTER_HANDOFF.md
        |
        v
Claude commits + pushes the handoff to the working branch
        |
        v
Paulo invokes "MAISOGLABS ARCHITECT SYNC" in ChatGPT
        |
        v
ChatGPT independently reads GitHub state + evidence
        |
        v
coordination/ARCHITECT_REVIEW.md
        |
        v
ChatGPT commits review to the same working branch
        |
        v
Claude pulls branch and reads review
        |
        v
Remediation / next authorized cycle
```

## Important limitations

This is asynchronous repository-mediated communication. Claude and ChatGPT do not have a persistent direct live channel to each other. Paulo remains the authorization authority between gated phases.

## Write ownership

To avoid agents overwriting one another:

- Claude writes `coordination/IMPLEMENTER_HANDOFF.md`.
- ChatGPT writes `coordination/ARCHITECT_REVIEW.md`.
- Either agent may read both.
- Protocol changes require explicit rationale and should not be made during an unrelated feature change.

## Commit discipline

Communication-only commits should be clearly labeled, for example:

- `docs(sync): publish phase 0 implementer handoff`
- `docs(sync): record architect review for phase 0`

Do not mix application implementation with an Architect review commit.

## Review modes

Use one of:

- `CHANGE REVIEW` — scoped to the current change.
- `STAGE GATE REVIEW` — broader review of a development stage.
- `RELEASE REVIEW` — evidence for production release readiness.
- `SECURITY REVIEW` — focused security boundary review.

## Verdict rules

A normal change review may return:

- `READY TO COMMIT: YES`
- `READY TO COMMIT: NO`
- `READY TO COMMIT: YES WITH FOLLOW-UP`

`READY TO COMMIT: YES` means no unresolved blocker introduced by, materially affecting, or required for the change under review remains unresolved. It does not mean the entire project has zero unresolved risks.

A Stage Gate, Release Review, or Security Review must use a verdict appropriate to its explicitly declared broader scope.

## Evidence rule

Statements such as `implemented`, `fixed`, `tested`, `secure`, `working`, `deployed`, and `complete` are claims until supported by verifiable repository, test, runtime, or deployment evidence.
