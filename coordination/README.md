# MaisogLabs Agent Coordination Protocol

This directory is the auditable communication channel between the Builder / Implementer and the Architect / Independent Reviewer. Since the Bootstrap V0 activation (`D-062`, `ML-DEVOS-RFC-018`) it runs the **Context Bootstrap V0 turn protocol**, specified in `brain/protocols/CONTEXT_BOOTSTRAP.md`. Where this summary and that protocol differ, the protocol wins.

## Roles

Roles are governed positions, assigned by the applicable decision chain — not by provider or model name.

- **Paulo** — Product / Risk Owner. Final authority for product decisions, material scope, accepted risk, and stage authorization.
- **Builder / Implementer** — inspects repository reality, implements authorized work, executes tests, writes the current handoff. Currently assigned to Claude by default (a decision may reassign it, as `D-059` once did); `TURN: CLAUDE` in STATE is the Builder-role token.
- **Architect / Independent Reviewer** — independently checks repository state, diffs, tests, evidence, requirements, and risks; writes reviews. Currently assigned to ChatGPT.
- **Repository + tests + runtime/deployment evidence** — the evidence of record. Committed text proves provenance, not authority; authority comes only from the applicable decision/review chain.

## Files

| File | Owner | Role |
|---|---|---|
| `STATE.md` | whoever holds the turn, within their authorized transition | Live machine-readable routing: turn, scope, flags, `PROTOCOL_VERSION`, handoff/review selector fields. Read first, at one exact commit. |
| `ARCHITECT_REVIEW.md` | Architect | The live review. Every published revision carries a new immutable `ML-DEVOS-AS-NNN`, archived byte-for-byte at `devos/changes/architect-syncs/`. |
| `CURRENT_HANDOFF.md` | Builder | The bounded current Builder→Architect evidence report, selected by STATE's identity tuple. Grants no authority. |
| `OPERATIVE_OBLIGATIONS.md` | both, per transition | Carry-forward index of unresolved obligations; rows leave only by cited closure/supersession. |
| `archive/handoffs/` | both, per transition | Immutable byte-exact copies of every outgoing CURRENT_HANDOFF, with provenance. |
| `CURRENT_DIRECTIVE.md` | Owner/Architect (Protocol V2 only) | **Inactive scaffolding** while `PROTOCOL_VERSION: 1`. Under V2 (`ML-DEVOS-RFC-020`, not active): the Owner/Architect → Builder execution packet selected by STATE's directive selector. Transport, never authority. |
| `archive/directives/` | both, per transition (Protocol V2 only) | Immutable byte-exact copies of every outgoing CURRENT_DIRECTIVE, with provenance and an index. Empty until V2 is active. |
| `IMPLEMENTER_HANDOFF.md` | nobody | **Frozen** historical evidence (blob `43eddba31695a567412c431ae3d1e4c9372cabdd`). Not a startup read; never appended. Read only for a concrete historical question. |

## Communication cycle

```text
Paulo / decision chain authorizes scope (recorded in STATE)
        |
        v
Builder: resolve exact tip -> read STATE, review, handoff, obligations at that commit
        |
        v
Builder implements; writes CURRENT_HANDOFF + STATE return gate (+ archives, obligations)
in ONE commit parented on the exact tip; publishes with exact-old-value CAS
        |
        v
Architect: resolve exact tip -> independent review
        |
        v
Architect writes ARCHITECT_REVIEW under a NEW Sync ID + archive + STATE routing
(archiving any handoff it deselects) in ONE commit; publishes with CAS
        |
        v
Next authorized turn
```

## Turn gating

- Governed writes happen only on the actor's own turn (`TURN` plus the matching `*_ACTION_REQUIRED: YES`) and only within `AUTHORIZED_SCOPE`. `TURN` routes work; it does not authorize flagged actions (deploy, main merge, remote D1/R2, mutation).
- Owner-requested **advisory**, read-only analysis is permitted on any turn. It writes nothing governed.
- A resumed, compacted, or reconnected session re-bootstraps from a fresh exact snapshot before any governed write. A `PROTOCOL_VERSION` mismatch stops the session.
- `node scripts/check-context-bootstrap.mjs --commit <sha>` checks a snapshot. `--publish --candidate <sha>` runs every transition check and publishes with the lease.
- Protocol V2 (`ML-DEVOS-RFC-020`) is implemented and tested but **not active**:
  - the checker refuses directive selector fields in a V1 STATE, and any undeclared `PROTOCOL_VERSION` change;
  - once activated by a separate owner Stage B decision, a Builder turn is routed by an `ACTIVE` CURRENT_DIRECTIVE, and the Builder's return commit deselects and archives it (`brain/protocols/CONTEXT_BOOTSTRAP.md` §10).

## Important limitations

This is asynchronous repository-mediated communication. The roles do not share a persistent live channel. Paulo remains the authorization authority between gated phases. A provider that cannot perform exact-old-value compare-and-swap publication is advisory/read-only for governed writes.

## Commit discipline

Communication-only commits should be clearly labeled, for example `docs(sync): ...`. Do not mix application implementation with an Architect review commit. Protocol changes require explicit rationale and an authorizing decision.

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
