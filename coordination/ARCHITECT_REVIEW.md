# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 IMPLEMENTATION REMEDIATION CYCLE 2 (SCOPE CLEANUP ONLY)`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Builder: Claude  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-052 — Skills Foundation V0.1 Implementation Remediation Review 1

Authority:
- `ML-DEVOS-RFC-014 — ACCEPTED`
- `ML-DEVOS-AS-050 — ARCHITECT_APPROVED`
- `D-042 — Paulo implementation authorization`
- `ML-DEVOS-AS-051 — implementation remediation cycle 1`

Builder remediation commit reviewed:
- `69133f0cc7a3bcab7931376dda5b65eb4b4b78f6`

## Scope / evidence

### AS52-F001 — PASS — all three AS-051 substantive blockers are closed

#### AS51-F005 — CLOSED

Independent repository inspection confirms all four generated Claude bridge files:
- begin at byte 0 with `---`;
- have the same Git blob SHA as their matching canonical `.agents/skills/<name>/SKILL.md`;
- are therefore byte-for-byte identical to the canonical payload.

The generator now emits canonical bytes exactly, with no prefixed banner.

The focused tests also add provider-format assertions for each bridge plus drift-injection coverage.

#### AS51-F006 — CLOSED

The Portable Knowledge Treasury now applies the full AS-048/D-042 bar to `INTERNAL` persistence:
- accepted current access controls;
- Git/version-control suitability;
- correct canonical destination.

If any condition is missing or uncertain:
`STOP / DEFER PERSISTENCE`.

The INTERNAL near-miss eval is now explicit.

#### AS51-F007 — CLOSED

`CLAUDE.md` now labels Phase-1 bootstrap instructions as historical and states live `coordination/STATE.md` controls current scope/turn/status.

`brain/00_HOME.md` likewise points current-state recovery to live `coordination/STATE.md` and no longer presents `PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY` as the current phase.

The Project Orientation Skill can therefore rely on those surfaces without inheriting stale authorization.

### AS52-F002 — PASS — hard boundaries remain intact

No S3 implementation, S4+/S5, product/runtime mutation, remote resource, credential, deployment, main merge, external Skill installation, or chat/provider import was introduced.

S3 remains paused.

## Single remaining blocker

### AS52-F003 — BLOCKER — one remediation artifact was created outside the AS-051 file whitelist

The remediation added:

`.claude/skills/README.md`

AS-051 authorized Claude to modify only:
- the four generated `.claude/skills/*/SKILL.md` files;
- the named generator/validator/test/Treasury/orientation documents;
- normal handoff/state bookkeeping.

It did **not** authorize creating a new `.claude/skills/README.md`.

The README is low-risk and its content is directionally correct, but the governance question is not whether the file is useful. The issue is whether a Builder may add an unlisted artifact during an explicitly bounded remediation cycle.

Under:
- `CORE-001 — Human authority cannot be invented by an agent or mechanism`;
- `CORE-002 — Capability != Authority`;
- the explicit AS-051 `Claude may modify only...` boundary,

the answer is no.

Accepting this artifact silently would weaken the exact authority discipline the Skills system is intended to preserve.

## Required Cycle 2 remediation

Perform only this normalization:

1. delete `.claude/skills/README.md`;
2. update comments in `scripts/generate-claude-skills-bridge.mjs` only as needed so they no longer cite that README;
3. keep generated-status documentation in already-authorized/canonical surfaces such as:
   - `.agents/skills/README.md`;
   - the generator/validator source comments;
4. do not change any canonical Skill content, Treasury rule, routing behavior, bridge bytes, or architecture;
5. rerun the focused bridge/Skill validation and report the result;
6. return to Architect.

No new artifact is required to replace the removed README.

## Authorized Remediation Cycle 2 files

Claude may modify only:
- `.claude/skills/README.md` — delete only;
- `scripts/generate-claude-skills-bridge.mjs` — comment/reference cleanup only;
- `tests/skills.test.mjs` only if a stale README assertion/reference exists;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

Do not modify the four canonical Skill payloads or generated bridge Skill bytes unless removal of a stale README reference somehow requires it; none is currently expected.

## Preserve accepted implementation

Do not reopen:
- the four Skills;
- `.agents/skills/` canonical architecture;
- generated-copy bridge strategy;
- frontmatter-at-byte-0 fix;
- Treasury access-control fix;
- stale-scope fix;
- Knowledge/Principles ledger;
- D-042 sequential S3 rule.

## S3

`S3 — PAUSED DURING REMEDIATION / AUTHORITY PRESERVED`

Do not start S3.

If AS52-F003 closes cleanly, the next review is expected to be the V0.1 acceptance review and, under D-042, may reopen S3.

## Verdict

`ML-DEVOS-AS-052: CHANGES_REQUESTED — IMPLEMENTATION REMEDIATION CYCLE 2 / SCOPE CLEANUP ONLY`

## Return gate

After cleanup:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`
- `CURRENT_REMEDIATION_CYCLE: 2`

Builder must not self-accept or start S3.
