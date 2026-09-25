# Current Directive — NONE SELECTED (Protocol V2 template)

Status: `NONE SELECTED — PROTOCOL V2 ACTIVE (D-080)`

This file is **not** an execution packet. Protocol V2 is active (`PROTOCOL_VERSION: 2`, `D-080`), but live STATE reads `CURRENT_DIRECTIVE: NONE`, so nothing here is read as an instruction.

It was added as `ML-DEVOS-RFC-020` Stage A scaffolding under `D-079`. It becomes the live Owner/Architect → Builder packet only when a later transition, after the activation is verified, replaces it with a real directive and selects it with `CURRENT_DIRECTIVE: ACTIVE`.

A directive is transport and context, never authority. Effective scope is the intersection of:
- live STATE;
- the referenced owner decision;
- the referenced Architect review/specification;
- the directive's instructions.

Anything outside that intersection is a stop condition (`ML-DEVOS-RFC-020` §10).

## Format of a real V2 directive (reference only)

A real directive starts with one fenced `yaml` header, shown here as `text` so this template can never parse as a directive:

```text
schema_version: 1
directive_id: DIR-<bounded-id>            # immutable; never reused with changed bytes
cycle_id: <exact live STATE CYCLE_ID>
issue_parent_commit: <40-hex>             # sole parent of the commit that first publishes these bytes
target_turn: CLAUDE
authority_ref: D-<NNN>                    # must exist in brain/DECISION_LOG.md at the same snapshot
applicable_review_id: ML-DEVOS-AS-<NNN>   # live review or immutable archive
sentinel_disposition: CLEAR               # CLEAR | BLOCKED (BLOCKED never routes to the Builder)
su_mode: BOUNDED_CONTRADICTION            # BOUNDED_CONTRADICTION | ESCALATED_RESEARCH
su_disposition: CLEAR                     # CLEAR | CLEAR_WITH_NOTES | BLOCKED
```

**Header rules:**
- The header is a positive allowlist; unknown keys fail closed.
- The STATE selector must match field-for-field. The selector fields are `CURRENT_DIRECTIVE`, `DIRECTIVE_ID`, `DIRECTIVE_ISSUE_PARENT`, `DIRECTIVE_AUTHORITY_REF` and `DIRECTIVE_APPLICABLE_REVIEW_ID`.

**Body:**
- Required sections, in this order: `Objective`, `Preconditions`, `Governing references`, `Exact execution scope`, `SENTINEL Sync`, `SU Contradiction Check`, `Instructions`, `Validation and evidence`, `Stop conditions`, `Next action`.
- Keep the body delta-based. Reference governing artifacts by path instead of copying them. A typical directive should stay within about 8 KiB (`DIRECTIVE_BYTE_BUDGET`, guidance only).

**Lifecycle:**
- When the directive stops being selected, its exact bytes are archived at `coordination/archive/directives/<directive_id>.md`, with `.provenance.json` and an index row.
- See `brain/protocols/CONTEXT_BOOTSTRAP.md` §10.
