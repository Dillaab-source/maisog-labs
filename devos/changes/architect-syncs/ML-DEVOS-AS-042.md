# ML-DEVOS-AS-042 — Durable Architect Sync Archive

Status: `CONCLUDED — CHANGES_REQUESTED / SKILLS FOUNDATION DISCOVERY REMEDIATION CYCLE 1`

Canonical rolling source at conclusion:
- `coordination/ARCHITECT_REVIEW.md`

## Concluding snapshot

```markdown
# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 DISCOVERY REMEDIATION CYCLE 1`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-042 — Skills Foundation V0.1 Discovery Review

RFC:
- `ML-DEVOS-RFC-014`

Class:
- `ARCHITECTURE`

Authority:
- `D-038`

## Scope / repository inspection

### AS42-F001 — PASS — discovery stayed within authorized scope

Compared against the Architect handoff base `0c69ba2118b50142a3648bb95cba5fcb359a2b27`.

Exactly one Builder commit is present.

Changed paths:
1. `devos/changes/rfcs/ML-DEVOS-RFC-014.md` — new discovery RFC;
2. `devos/changes/rfcs/README.md` — RFC index;
3. `coordination/IMPLEMENTER_HANDOFF.md` — discovery handoff;
4. `coordination/STATE.md` — return to Architect.

No `devos/skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`, `.gemini/skills/`, or `.github/skills/` directory was created.

No executable skill, S3 implementation, S4+, S5 capability mechanism, runtime/product change, remote resource, credential, deployment, or main merge occurred.

## Architectural findings

### AS42-F002 — PASS — Skill/Governance/State/Architecture/Capability separation is sound

The RFC correctly preserves:
- `GOVERNANCE > SKILLS`;
- `CURRENT AUTHORIZATION > SKILL CAPABILITY`;
- `CAPABILITY != AUTHORITY`.

A Skill is correctly treated as non-authoritative procedural packaging, not as:
- a governance rule;
- a live authorization/state record;
- an ADR;
- a credential/tool permission;
- a risk acceptance;
- merge/deploy authority.

This is compatible with the frozen Sentinel architecture.

### AS42-F003 — BLOCKER — canonical location is being frozen before provider exposure is resolved

The RFC proposes `devos/skills/` as the canonical location while simultaneously leaving provider exposure/adapters as an open question.

Those two decisions are coupled.

Current official provider evidence shows materially different discovery behavior:
- GitHub Copilot accepts project skills from `.github/skills/`, `.claude/skills/`, or `.agents/skills/`;
- Gemini CLI accepts `.gemini/skills/` and the interoperable `.agents/skills/` alias;
- OpenAI describes `SKILL.md` as a portable/open-standard skill playbook;
- ChatGPT's currently installed in-product skills are surfaced through the product/plugin skill system rather than by automatically discovering this repository's arbitrary `devos/skills/` path.

Therefore the RFC must not freeze the canonical repository location independently of the exposure model.

#### Required remediation

Add a compact provider-compatibility matrix for the actual target set:
- Claude / Claude Code;
- OpenAI / Codex;
- ChatGPT product skill exposure where materially relevant;
- Gemini CLI;
- GitHub Copilot;
- any other provider only if current evidence exists.

Compare at minimum:
1. `.agents/skills/` as canonical payload where supported;
2. `devos/skills/` as canonical source + generated/thin provider exposure;
3. `devos/skills/` as governance canonical source + provider-native linking/registration without duplicated content.

For each option, assess:
- native discovery;
- duplication/drift risk;
- symlink/platform risk where relevant;
- governance traceability;
- portability;
- maintenance cost;
- compatibility with current Sentinel topology.

Then either:
- make one architecture recommendation with rationale; or
- leave canonical location explicitly `UNRESOLVED — PAULO DECISION REQUIRED` if evidence does not support a safe choice yet.

Do not create any directory in this remediation.

### AS42-F004 — BLOCKER — Knowledge / Realization Capture violates the RFC's own Skill boundary as currently written

The RFC defines a Skill as a thin wrapper around an already-authoritative repeatable procedure.

It then proposes `Knowledge / Realization Capture` as a V0.1 skill while also stating that the procedure is currently unnamed and has never been formally written down.

Observed recurring behavior is useful evidence for a future procedure, but observation alone does not make that procedure authoritative.

A Skill must not become the place where a new governance/knowledge-record procedure is invented.

#### Required remediation

Choose one:

**Option A — preferred for V0.1 minimalism**
- remove Knowledge / Realization Capture from the initial V0.1 skill set;
- record it as a future candidate requiring its own governed procedure definition first.

**Option B**
- classify and govern the underlying knowledge/debt-capture procedure as its own change before making it a Skill.

Do not implement Option B inside this discovery remediation unless the existing change policy clearly permits doing so without expanding scope. Default to Option A.

This likely reduces the V0.1 initial set from five to four skills:
- Governance / Traceability Audit;
- Architect Review / Sync;
- Implementation Handoff;
- Project Orientation / State Recovery.

### AS42-F005 — BLOCKER — external-skill adoption gate is over-broad

The RFC currently says adopting **any** external skill is capability-adjacent and requires the same gate as a comparable capability/tool grant.

That conflicts with Sentinel's consequence-sensitive governance model and the Product directive's wording `authorization where required`.

An external, reference-only Skill containing only reviewed Markdown instructions is not equivalent in consequence to a Skill containing:
- executable scripts;
- hooks;
- tool allowlists/grants;
- dynamic shell/network operations;
- credential use;
- remote writes;
- destructive or mutating procedures.

#### Required remediation

Define risk tiers or an equivalent consequence-based classification.

Minimum distinction:

**REFERENCE-ONLY / PROCEDURAL**
- no scripts;
- no hooks;
- no tool-permission expansion;
- no remote fetch/write;
- no credentials;
- no mutation authority.
- still untrusted until inspected, pinned/provenanced, overlap-checked, and accepted under the appropriate Skills/governance review.

**CAPABILITY-ADJACENT / EXECUTABLE**
- scripts, hooks, dynamic commands, tool grants, remote access, credentials, mutations, or equivalent.
- route through the relevant CAPABILITY/security/Paulo gate.

`FOUND ONLINE != TRUSTED` remains absolute.
`FOUND ONLINE != AUTOMATIC CAPABILITY CHANGE` should also be true.

### AS42-F006 — BLOCKER — current external ecosystem claims need repository-visible source provenance

The RFC makes time-sensitive claims about current provider support and discovery paths.

Those claims materially affect the architecture, but the RFC does not record the evidence basis in a durable, inspectable form.

#### Required remediation

Add a concise `External evidence basis` section or table to RFC-014 containing:
- provider / standard;
- official source name;
- source URL or durable source reference;
- date checked;
- exact architectural claim supported;
- confidence/status (`OFFICIAL`, `COMMUNITY`, `UNVERIFIED`).

Prefer official documentation for provider-discovery behavior.

Do not state that a provider supports the standard or a path unless the cited evidence supports it.

Community/practitioner evidence may be included for operational pain points, but must be labeled as such.

### AS42-F007 — PASS — rejected candidates are correctly conservative

The decision not to create these V0.1 skills is sound:

- `Project Health`: current repository has reporting artifacts but no sufficiently defined, provider-independent canonical procedure for what the percentage/health model means.
- `Research Before Architectural Decisions`: repeated behavior exists, but no canonical procedure exists yet.
- `Public / Private Information Classification`: the underlying publicness risk remains open; wrapping it as a Skill now could create false confidence.

These remain future candidates, not lost ideas.

### AS42-F008 — PASS — S3 does not currently require an architectural amendment

The Skills discovery has not identified a mandatory S3 schema change.

The existing S3 principle that a Task Contract describes already-authorized scope and grants no capability remains compatible with Skills.

A future S3 example may reference a canonical Skill/procedure once Skills V0.1 exists, but that does not require changing S3's authority model.

S3 remains:
`PAUSED / QUEUED — AUTHORITY PRESERVED`

until this discovery architecture is closed.

### AS42-F009 — PASS — evaluation model is directionally correct

The proposed eval categories cover:
- activation/non-activation;
- overlap;
- governance conflict;
- capability without authority;
- frozen baseline;
- missing Paulo decision;
- unrelated open risk;
- external-skill trust;
- smallest sufficient match.

After the V0.1 skill set is corrected, ensure each remaining skill has both positive and near-miss negative cases.

## Architect conclusion

The discovery is strong and useful. The issues above are architecture-definition issues, not implementation failures.

Required remediation is limited to `ML-DEVOS-RFC-014.md`, the RFC index if its summary changes, and normal coordination handoff/state records.

No implementation is authorized.

## Verdict

`ML-DEVOS-AS-042: CHANGES_REQUESTED — DISCOVERY REMEDIATION CYCLE 1`

Blocking findings:
- `AS42-F003` canonical location/exposure coupling;
- `AS42-F004` Knowledge Capture cannot invent its own procedure through a Skill;
- `AS42-F005` external-skill gate must be consequence-sensitive;
- `AS42-F006` external ecosystem claims require durable source provenance.

All other major discovery boundaries pass.

## Return gate

After remediation:
- `TURN: ARCHITECT`
- `STATUS: READY_FOR_ARCHITECT`
- `ARCHITECT_ACTION_REQUIRED: YES`
- `IMPLEMENTER_ACTION_REQUIRED: NO`

No Skills implementation or S3 resumption may occur before independent closure.

```
