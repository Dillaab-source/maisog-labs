# Sentinel Review Notes

Status: `CANONICAL ROLLING NOTE — NON-BINDING / CROSS-BUILD`

Last reviewed: `2026-09-19`

Owner: Paulo  
Purpose: Keep the most useful Sentinel architecture observations easy to retrieve across MaisogLabs builds without turning every observation into a new governance layer.

## Pull phrase

Future sessions/builds may use:

`PULL SENTINEL REVIEW NOTES`

Canonical file:

`docs/SENTINEL_REVIEW_NOTES.md`

This note is intentionally short enough to review quickly. The longer historical assessment remains at:

`docs/SENTINEL_ARCHITECTURE_ASSESSMENT_2026-09-19.md`

## Important rule

This file is **advisory only**.

It does not:
- change Sentinel architecture;
- change authority;
- authorize a build;
- authorize a Sentinel phase;
- authorize deployment, remote resources, merge, mutation, or cutover;
- override live `coordination/STATE.md`, Decisions, ADRs, Architect Syncs, or the frozen architecture.

If a future build wants to implement one of these observations, normal Sentinel governance still applies.

---

## Current overall view

Sentinel already has a strong conceptual architecture.

Approximate review snapshot:

- Conceptual architecture: `~9.0/10`
- Governance model: `~9.2/10`
- Traceability / evidence model: `~9.2/10`
- Current technical enforcement: `~6.5–7.0/10`
- Production / autonomous-agent readiness: `~6.0/10`

The lower enforcement/readiness scores do **not** mean the architecture is weak.

They mostly reflect that later Sentinel enforcement phases have not been implemented yet.

## Core conclusion

**Do not overcomplicate Sentinel now.**

The current architecture is already strong enough to keep building safely with Paulo + Architect + Builder.

Prefer:

`simple + explicit + reviewed`

over:

`more governance documents + more ceremony`

The next major improvements should come only when real build pressure justifies them.

---

## What is already strong and should be preserved

1. `CAPABILITY != AUTHORITY`
2. Paulo remains final Product / Risk authority.
3. Architect and Builder remain separate roles.
4. Builder never self-approves.
5. Exact implementation SHA / provenance is recorded.
6. Actor-reported evidence is not silently treated as independently verified evidence.
7. Higher-risk changes require stronger governance.
8. Deployment, remote resources, merge, mutation, and cutover remain separately gated.
9. Historical decisions/reviews remain durable.
10. New increments do not automatically inherit old authority.

Future automation should enforce these principles, not replace them.

---

## Main limitations to remember

### 1. Governance is still mostly procedural

Files such as `coordination/STATE.md` are authoritative, but many restrictions still depend on actors following them.

Future direction:

`GOVERNANCE DOCUMENTED → GOVERNANCE ENFORCED`

Only implement this when Sentinel begins handling materially more autonomy, agents, or remote resources.

### 2. Approval fatigue

Do not force Paulo through full heavy governance for harmless low-risk changes.

Keep using change classification.

Small change:
- lightweight path.

Architecture / security / remote / production change:
- strong path.

Never let automation invent its own delegation.

### 3. Documentation duplication

RFCs, STATE, Architect reviews, handoffs, risk/test ledgers, ADRs and build plans can repeat facts.

Future improvement:
- fewer canonical facts;
- more generated views;
- machine-readable state where useful.

Do not add more documents just because Sentinel can.

### 4. Independent execution is incomplete

Architect can inspect code/diffs, but Builder runtime evidence may still remain `ACTOR_REPORTED`.

Future Evidence / QA work should run exact committed SHAs in clean environments.

### 5. Full five-actor model is not operational yet

Current practical workflow is mostly:
- Paulo
- ChatGPT Architect
- Claude Builder

QA and fresh-context Independent Reviewer remain future operational stages.

Do not simulate extra actors merely for ceremony.

### 6. Isolation is not yet a security boundary

Future Builder isolation should distinguish:

`worktree/branch isolation`

from:

`execution/security sandbox isolation`

Worktrees protect source coordination. Sandboxes protect filesystem/network/secrets boundaries.

### 7. Runtime governance comes later

Sentinel is currently stronger before merge/deployment than after production activation.

When production becomes routine, revisit:
- runtime health evidence;
- deployment verification;
- rollback;
- monitoring;
- incident evidence;
- capability revocation.

### 8. Token/context efficiency

Large governance files are useful but can become expensive.

Future direction:
- scoped retrieval;
- compact machine-readable state;
- references instead of repeated prose;
- generated summaries.

---

## Broad external-review takeaway

A broad 2025–2026 review across official standards, vendors, open-source systems, research, and practitioner discussions generally supports Sentinel's direction.

Recurring themes across the wider ecosystem:

- human judgment gates remain important;
- software agents need explicit identities and bounded authority;
- coding agents should not approve their own work;
- sandboxing / isolation matters;
- evidence and provenance matter;
- agent orchestration should come after permissions, isolation and verification;
- runtime observability matters;
- branch/ruleset/CI enforcement is stronger than prompt-only policy;
- specification helps complex work but becomes wasteful when overused.

The key takeaway is not to copy every external framework.

Use external findings only when they solve a real Sentinel problem.

---

## Roadmap observations to revisit later

The frozen roadmap remains authoritative.

### S3 — Typed Task Contracts

Good next Sentinel foundation when we decide to advance Sentinel itself.

### S4 — State Machine Kernel

Important once unattended or parallel work increases.

### S5 — Capability & Permission Gateway

Very important before meaningful remote/cloud autonomy.

### S6 — Isolated Execution

Important before autonomous Builders receive broader access.

### S7 — Evidence & QA Plane

High-value once independent verification needs to become repeatable.

### S8 — Orchestrator

Do not rush.

Orchestration without permissions/isolation/evidence mainly multiplies mistakes faster.

### S10 — GitHub Enforcement

Potential roadmap review item:

Minimum branch/ruleset enforcement may be worth introducing **before** significant autonomous orchestration, even if the S10 phase number remains unchanged.

Do not silently reorder the frozen roadmap. Revisit through a future architecture review only if needed.

### S11 — Memory & Observability

Full S11 can remain later, but minimal security/run telemetry may deserve earlier introduction when autonomous execution becomes real.

Potential early telemetry:
- task ID;
- agent ID;
- base/result SHA;
- tool calls;
- denied operations;
- network attempts;
- evidence IDs;
- duration;
- token/cost information.

---

## Remote-resource threshold

Use this as a practical review trigger.

Before giving an agent materially broader remote capability such as:
- Cloudflare R2;
- remote D1;
- production deployment;
- infrastructure mutation;
- broad GitHub write/merge authority;
- reusable cloud credentials;

review whether Sentinel needs more of S3–S7 first.

This is a **review trigger**, not a blanket prohibition.

Sometimes a narrowly scoped, explicitly human-approved remote action can still be appropriate under the current bootstrap model.

---

## Avoid premature complexity

Do **not** automatically add:

- a new governance subsystem;
- more roles;
- more approval layers;
- more documents;
- CI;
- a capability gateway;
- an orchestrator;
- a task engine;
- a policy engine;

just because they are in the future architecture.

Introduce them when one or more real problems appears:

- multiple Builders operate concurrently;
- projects/repositories multiply;
- unattended/overnight execution becomes common;
- remote infrastructure access becomes routine;
- manual governance materially slows delivery;
- stale/duplicated state becomes frequent;
- evidence must be independently reproducible;
- production operation becomes routine;
- capability restrictions need mechanical enforcement.

Until then, keep the workflow simple.

---

## Review method for future builds

When a new build or increment begins, ask only:

1. Does this introduce materially more authority?
2. Does it touch remote or production resources?
3. Does it increase agent autonomy?
4. Does it introduce concurrency or multiple agents?
5. Does it make actor-reported evidence insufficient?
6. Is the existing manual governance becoming a bottleneck?
7. Is a current known limitation directly relevant?

If the answer is mostly `NO`:

**Keep building under the current Sentinel workflow.**

If several answers become `YES`:

**Pull this note and review whether the next Sentinel enforcement phase should be advanced.**

---

## Current priority philosophy

`BUILD VALUE FIRST — ADD CONTROL WHEN RISK JUSTIFIES IT`

while preserving:

`CAPABILITY != AUTHORITY`

and:

`EVIDENCE, NOT AGENT ASSERTION, MOVES STATE FORWARD`

The objective is not maximum governance.

The objective is **enough governance to safely support the level of autonomy we are actually using**.

---

## Related records

Detailed historical assessment:

`docs/SENTINEL_ARCHITECTURE_ASSESSMENT_2026-09-19.md`

Frozen architecture:

`devos/architecture/ML-DEVOS-ARCH-001.md`

Frozen roadmap:

`devos/plans/ML-DEVOS-SIP-001.md`

Live authority/state:

`coordination/STATE.md`

Active change policy:

`devos/governance/change-policy/CHANGE_GOVERNANCE_POLICY.md`

This rolling note may be updated in future reviews, but updates remain non-binding unless a separate governed decision promotes an item into policy or architecture.
