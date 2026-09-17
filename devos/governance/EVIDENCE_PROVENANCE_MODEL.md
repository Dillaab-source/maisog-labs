# Sentinel Evidence Provenance Model

Companion to `../architecture/ML-DEVOS-ARCH-001.md` §6–§7. Normative statement.

## Classes

**[REPO-VERIFIED: D-010 "additional freeze corrections", AS0-003]** Provider-independent — the class describes the *method* by which evidence was produced, not the *identity* of who/what produced it.

| Class | Definition |
|---|---|
| `ACTOR_REPORTED` | An actor ran or observed something and reports the result. No independent check has occurred. |
| `INDEPENDENTLY_INSPECTED` | A different actor examined the artifact (diff, log, output, file) itself, without re-executing the underlying process. |
| `INDEPENDENTLY_REPRODUCED` | A different actor or process re-ran the same check independently and obtained a result. |
| `CI_ATTESTED` | A deterministic, non-human CI system executed the check and recorded the result. |
| `RUNTIME_OBSERVED` | Observed directly from an actual running/deployed system, not a build or test environment. |

**These describe provenance, not an absolute universal quality ranking.** `RUNTIME_OBSERVED` and `CI_ATTESTED` in particular answer different questions (does it work in production vs. did the deterministic pipeline pass) and are not strictly ordered against each other — a `VERIFIED` status claim should cite whichever is actually relevant to what's being verified. **[CYCLE-SUPPLIED clarification, consistent with the REPO-VERIFIED class definitions]**

## Worked examples

**[CYCLE-SUPPLIED, illustrative — not independently found in `AS0-001`…`AS0-012` at this granularity, but directly consistent with them]**

| Action | Evidence class produced |
|---|---|
| Claude runs `npm test` | `ACTOR_REPORTED` |
| QA independently reruns it | `INDEPENDENTLY_REPRODUCED` |
| GitHub Actions runs it on a specific commit SHA | `CI_ATTESTED` |
| A production health check succeeds | `RUNTIME_OBSERVED` |

## The Task Contract

**[CYCLE-SUPPLIED — no Task Contract mechanism exists yet anywhere in this repository or any code]** The intent, recorded here for later phases (`ML-DEVOS-SIP-001` S3 "Typed Task Contracts") to actually design: **the Task Contract decides which evidence class is required for a given claim.** Not every claim needs `CI_ATTESTED` or `RUNTIME_OBSERVED` — a low-risk documentation claim may reasonably require only `INDEPENDENTLY_INSPECTED`, while a claim about production behavior requires `RUNTIME_OBSERVED` specifically. This is stated as intent, not as a describable current mechanism; no schema or enforcement exists.

## Binding rules

**[REPO-VERIFIED — carried from the website pilot's proven `brain/TEST_LEDGER.md` discipline and D-010]**

1. Never silently upgrade a class. An Architect reading a diff and concluding "this probably passes" is `INDEPENDENTLY_INSPECTED`, not `INDEPENDENTLY_REPRODUCED`.
2. Code existence is never evidence of `VERIFIED` status.
3. Claims requiring a cited evidence class: `implemented`, `fixed`, `tested`, `secure`, `deployed`, `working`, `complete`.
4. Evidence artifacts belong in the Evidence Store, referenced by ID from Task State/Run History rather than duplicated (`ML-DEVOS-ARCH-001` §11), once those mechanisms exist.

## Integration / Evidence-Gate order

See `../architecture/ML-DEVOS-ARCH-001.md` §7 for the full diagram and provenance disclosure (base ordering `[REPO-VERIFIED: AS0-004]`; full diagram detail `[CYCLE-SUPPLIED]`). Restated here because it is the evidence model's primary consumer: **PR/CI/reviewer evidence is what feeds the Evidence Gate** (`D-010`) — the Evidence Gate never occurs before that evidence exists, and it consumes `CI_ATTESTED`/`INDEPENDENTLY_REPRODUCED`/`INDEPENDENTLY_INSPECTED` results, never a Builder's bare `ACTOR_REPORTED` claim alone.

## Current state of this model in practice

**[REPO-VERIFIED — confirmed by direct repository inspection this cycle and the prior cycle]** No mechanism in this repository produces `CI_ATTESTED` evidence — no `.github/workflows` directory exists. All evidence produced in the website pilot to date has been `ACTOR_REPORTED` (Claude's command output) or `INDEPENDENTLY_INSPECTED` (the Architect reading diffs and files); `INDEPENDENTLY_REPRODUCED` evidence has not yet occurred even once in that pilot's history — a fact worth carrying into Sentinel's own early evidence trail rather than assuming resolved.
