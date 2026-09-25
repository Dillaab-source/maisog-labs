# Current Directive — INACTIVE SCAFFOLDING (Protocol V2 template)

Status: `INACTIVE — PROTOCOL V2 NOT ACTIVATED`

This file is **not** an execution packet. The live repository runs `PROTOCOL_VERSION: 1`. Under V1:
- STATE has no directive selector;
- the checker refuses directive selector fields in a V1 STATE (`DIRECTIVE_SELECTOR_UNDER_V1`);
- nothing here is read as an instruction.

Builder turns under V1 are routed by `coordination/STATE.md` and the live review exactly as before.

It was added as `ML-DEVOS-RFC-020` Stage A scaffolding under `D-079`. It becomes the live Owner/Architect → Builder packet only after a separate owner **Stage B** activation decision changes `PROTOCOL_VERSION` to `2`, and a later transition selects a real directive with `CURRENT_DIRECTIVE: ACTIVE`.

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
