# Architect Handoff Format

This is the reusable report format for a completed implementation/reconnaissance cycle (governance plan §17). The *live* handoff for the current cycle is written into `coordination/IMPLEMENTER_HANDOFF.md`; this document defines the required shape and field meanings so every cycle is comparable.

After each meaningful implementation cycle, `coordination/IMPLEMENTER_HANDOFF.md` must record:

```
CHANGE ID:
OBJECTIVE:
FILES CHANGED:
REQUIREMENTS AFFECTED:
RISKS AFFECTED:
IMPLEMENTATION SUMMARY:
TESTS EXECUTED:
RESULTS:
EVIDENCE:
KNOWN LIMITATIONS:
UNRESOLVED QUESTIONS:
REQUESTED REVIEW SCOPE:
```

## Field meanings

- **CHANGE ID** — a stable cycle identifier (e.g. `PHASE-0-RECON`, `PHASE-1-GOVERNANCE-BOOTSTRAP`). Matches `coordination/STATE.md`'s `CYCLE_ID`.
- **OBJECTIVE** — one or two sentences: what this cycle was authorized to do, per the currently authorized scope.
- **FILES CHANGED** — an exact list. A handoff that claims "documentation only" must be checked against `git status`/`git diff` before it is written, not asserted from memory.
- **REQUIREMENTS AFFECTED** — cite requirement IDs from the governance plan or `GOVERNANCE_MAP.md` where applicable; write "none" explicitly if a cycle is infrastructure/documentation-only.
- **RISKS AFFECTED** — cite `RISK_REGISTER.md` IDs whose status changed or whose evidence changed.
- **IMPLEMENTATION SUMMARY** — what was actually done, in repository terms (files, sections, boundaries touched), not aspirational language.
- **TESTS EXECUTED** — the literal commands run.
- **RESULTS** — the literal output/outcome of each command (pass/fail counts, build success/failure, etc.). Never paraphrase a failure as a pass.
- **EVIDENCE** — file paths, commit SHAs, or command output that a reader could independently re-check.
- **KNOWN LIMITATIONS** — what was not verified, not tested, or deliberately out of scope this cycle. Do not omit inconvenient gaps.
- **UNRESOLVED QUESTIONS** — anything requiring Architect or Paulo judgment.
- **REQUESTED REVIEW SCOPE** — one of the review modes in `protocols/ARCHITECT_SYNC.md` (`CHANGE REVIEW`, `STAGE GATE REVIEW`, `RELEASE REVIEW`, `SECURITY REVIEW`).

## Non-negotiable rule

Do not hide failures or known gaps. A handoff that omits a known limitation to look more complete is a governance violation, not a shortcut — the whole point of this format is that Paulo and the Architect can trust it without re-deriving it from scratch.
