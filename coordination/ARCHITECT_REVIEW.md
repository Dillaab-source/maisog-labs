# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 IMPLEMENTATION REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Builder: Claude  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-051 — Skills Foundation V0.1 + Portable Knowledge Treasury Implementation Review

Authority:
- `ML-DEVOS-RFC-014 — ACCEPTED`
- `ML-DEVOS-AS-050 — ARCHITECT_APPROVED`
- `D-042 — Paulo implementation authorization`

Builder implementation commit reviewed:
- `0f86e58c9851acc3ca37ad46b80db11cb772ed21`

Base:
- `32d8754bfd31225d43216f409af0b04ca749f313`

## Scope inspection

### AS51-F001 — PASS — implementation stayed inside the authorized envelope

The implementation added:
- exactly four canonical Skills under `.agents/skills/`;
- exactly four Claude Code bridge Skill files under `.claude/skills/`;
- deterministic bridge generator + validator;
- focused Skill tests;
- manual Portable Knowledge Treasury procedure;
- empty `brain/KNOWLEDGE_PRINCIPLES.md`;
- narrow routing pointers in `AGENTS.md`, `CLAUDE.md`, and `brain/00_HOME.md`;
- normal handoff/state bookkeeping.

No fifth Knowledge Capture Skill exists.

No:
- S3/S4+/S5 implementation;
- product/runtime code;
- D1/R2/remote resource;
- credential/secret;
- deployment;
- main merge;
- provider account/chat scraping;
- S11 memory system

was introduced.

Builder-reported `387/387` test evidence remains `ACTOR_REPORTED` until independently reproduced.

## Accepted implementation findings

### AS51-F002 — PASS — canonical four-Skill set is structurally faithful

The four canonical `.agents/skills/*/SKILL.md` payloads are compact, point to authoritative repository sources, include activation/non-activation, inputs, outputs, stop/escalation behavior, governance dependencies, and explicit non-authority posture.

The canonical payloads themselves begin with valid YAML frontmatter.

### AS51-F003 — PASS — no shadow authority introduced

The Skill content repeatedly preserves:
- `GOVERNANCE > SKILLS`;
- `CURRENT AUTHORIZATION > SKILL CAPABILITY`;
- `CAPABILITY != AUTHORITY`.

No `allowed-tools`, credential grant, secret value, or independent mutation authority is present in canonical Skill frontmatter.

### AS51-F004 — PASS — deterministic generated-copy bridge strategy is architecturally acceptable in principle

Using a deterministic generated copy instead of repository symlinks is acceptable for the stated Windows/Git portability concern, provided the generated bridge is itself valid for Claude Code discovery and drift is fail-closed.

The current implementation has a blocker in that last condition (AS51-F005), but the strategy itself does not need redesign.

### AS51-F005 — BLOCKER — generated Claude Code Skill files place content before required top-of-file YAML frontmatter

Every generated bridge file currently begins with an HTML comment:

`<!-- GENERATED FILE ... -->`

and only then contains the `---` YAML frontmatter copied from the canonical Skill.

Anthropic's current official Claude Code Skills documentation states that Skill behavior is configured using YAML frontmatter **at the top of `SKILL.md`** and its examples begin the file with the opening `---` marker.

Official source checked 2026-09-20:
- `https://code.claude.com/docs/en/skills`
- relevant current documentation: "Skills are configured through YAML frontmatter at the top of SKILL.md"; frontmatter examples start with `---`.

Therefore the bridge can pass its own byte-for-byte drift test while still failing or degrading native Claude Code Skill parsing/discovery.

#### Required remediation

Keep the generated-copy strategy, but ensure every generated Claude bridge file begins at byte 0 with the canonical YAML frontmatter.

Acceptable shapes include:
- canonical frontmatter first, generated notice immediately after the closing `---`; or
- canonical content byte-for-byte with no banner, with generated status documented elsewhere.

Update `tests/skills.test.mjs` so it independently parses **each generated Claude bridge** using a start-of-file frontmatter assertion, not only the canonical `.agents` file.

The test should prove:
- bridge begins with `---`;
- bridge `name` and `description` equal the canonical values;
- bridge still matches deterministic generation;
- drift injection still fails validation.

Regenerate all four `.claude/skills/*/SKILL.md` files after fixing the generator.

Do not switch architectures or introduce hand-maintained provider copies.

### AS51-F006 — BLOCKER — Treasury INTERNAL persistence rule weakens AS-048 / D-042

`brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md` currently says:

- `INTERNAL` may persist when its canonical record type genuinely belongs in the repository.

But `D-042` explicitly preserved the stronger AS-048 condition:

Both `INTERNAL` and `RESTRICTED` repository persistence require:
- accepted current access controls for the material;
- Git suitability;
- an authorized/correct canonical destination.

Private visibility alone is not acceptance.

The current protocol correctly applies accepted-access-control/Git-suitability checks to `RESTRICTED`, but omits them from `INTERNAL`.

#### Required remediation

Change the `INTERNAL` storage rule so it requires all three:
1. current repository access controls are accepted for the material;
2. the material is suitable for Git/version-controlled documentation;
3. its canonical destination genuinely belongs in the repository.

If any is missing or uncertain:
`STOP / DEFER PERSISTENCE`.

Keep `SECRET`/credentials out of Git unconditionally.

Also ensure the protocol's evaluation cases include the INTERNAL unknown/unaccepted-controls near miss explicitly or otherwise unambiguously cover it.

Do not broaden automated disclosure routing; `RISK-WEB-013` remains open.

### AS51-F007 — BLOCKER — Project Orientation depends on stale "current scope" statements

The new `project-orientation-state-recovery` Skill makes:
- `brain/00_HOME.md`;
- `CLAUDE.md`;
- live `coordination/STATE.md`

part of the recovery path.

However:

- `CLAUDE.md` still contains a section titled `Current authorized scope` that declares `PHASE 1 — GOVERNANCE BOOTSTRAP ONLY`;
- `brain/00_HOME.md` still contains a `Current phase` paragraph stating `AUTHORIZED_SCOPE: PHASE_1_GOVERNANCE_BOOTSTRAP_ONLY`.

Those statements are historical bootstrap text, not the current live authorization. The current authoritative scope is in `coordination/STATE.md`.

Before V0.1 Skills, this was stale-documentation debt. After the new Orientation Skill explicitly uses these surfaces to recover live state, the contradiction materially affects the change under review.

#### Required remediation

Make the minimum documentation correction:

**CLAUDE.md**
- replace the stale "Current authorized scope" framing with an explicit statement that live scope/turn/status are always read from `coordination/STATE.md`;
- preserve Phase-1 bootstrap material only as clearly historical/legacy instructions if it must remain for provenance;
- do not present Phase 1 as current.

**brain/00_HOME.md**
- replace the stale `Current phase` claim with a direct pointer to live `coordination/STATE.md`;
- make clear that any phase/scope text elsewhere in this file is historical unless corroborated by live STATE.

The `project-orientation-state-recovery` Skill may remain unchanged if these source surfaces become internally consistent. If its procedure wording needs a small clarification to treat live STATE as authoritative over historical guidance, that is authorized.

No general governance rewrite is requested.

## Non-blocking observations

### AS51-O001 — bridge validator tests the generator's own expected bytes, not provider validity

This is acceptable once AS51-F005 adds an independent provider-format invariant (frontmatter at byte 0). Determinism and semantic validity must both be tested.

### AS51-O002 — manifest gap is correctly disclosed

Leaving `devos/devos-manifest.json` unchanged was consistent with D-042 because no existing field cleanly fits the non-`devos/`, non-phase `.agents/skills/` root without schema invention.

No remediation required in this cycle.

### AS51-O003 — empty Knowledge / Principles ledger is correct

`brain/KNOWLEDGE_PRINCIPLES.md` contains no retroactive chat backfill and invents no new formal ID namespace.

No remediation required.

## Authorized Remediation Cycle 1 files

Claude may modify only what is necessary for AS51-F005/F006/F007:

- `scripts/generate-claude-skills-bridge.mjs`;
- `scripts/validate-claude-skills-bridge.mjs` only if needed;
- `tests/skills.test.mjs`;
- the four generated `.claude/skills/*/SKILL.md` bridge files;
- `brain/protocols/PORTABLE_KNOWLEDGE_TREASURY.md`;
- `CLAUDE.md`;
- `brain/00_HOME.md`;
- `.agents/skills/project-orientation-state-recovery/SKILL.md` only if a narrow source-precedence clarification is needed;
- `coordination/IMPLEMENTER_HANDOFF.md`;
- `coordination/STATE.md`.

Do not modify canonical Skill content unrelated to AS51-F007.

## Preserve accepted implementation

Do not reopen without new evidence:
- exactly four V0.1 Skills;
- `.agents/skills/` canonical source;
- deterministic generated-copy Claude bridge strategy;
- Knowledge Treasury as manual governed procedure;
- empty-at-start Knowledge/Principles ledger;
- no fifth Knowledge Capture Skill;
- no manifest schema invention;
- D-042 sequential S3 rule.

## S3

`S3 — PAUSED DURING REMEDIATION / AUTHORITY PRESERVED`

Do not start S3.

Per D-042, S3 may reopen only after the Skills/Treasury implementation is independently accepted with no blocker.

## Verdict

`ML-DEVOS-AS-051: CHANGES_REQUESTED — IMPLEMENTATION REMEDIATION CYCLE 1`

Active blockers:
- `AS51-F005` Claude bridge frontmatter must be top-of-file;
- `AS51-F006` Treasury INTERNAL rule must restore AS-048/D-042 access-control + Git-suitability conditions;
- `AS51-F007` Orientation sources must stop presenting Phase 1 as current authorization.

## Return gate

After remediation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`
- `CURRENT_REMEDIATION_CYCLE: 1`

Builder must return exact diff/evidence and must not self-accept the implementation or start S3.
