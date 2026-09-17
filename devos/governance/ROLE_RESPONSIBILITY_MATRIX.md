# Sentinel Role / Responsibility Matrix

Companion to `../architecture/ML-DEVOS-ARCH-001.md` §3–§4. Five actors; system mechanisms are listed separately and explicitly marked as non-authorities. **[REPO-VERIFIED: D-010 K-4, AS0-002, AS0-007]** except where noted.

## Actors

| Role | Primary responsibility | Writes code/content | Approves own work | Authorizes deploy/protected-branch merge | Authorizes next phase/scope | Evidence it can produce |
|---|---|---|---|---|---|---|
| **Paulo** | Owner / final Product-Risk authority | No | N/A | **Yes — only role** | **Yes — only role** | Consumes evidence; issues risk-acceptance and authorization decisions, recorded in a decision log |
| **Architect** | Requirements → design → architecture → risk → constraints | No | No | No (recommends only) | No (recommends only) | `INDEPENDENTLY_INSPECTED` primarily; `INDEPENDENTLY_REPRODUCED` when it actually re-executes something |
| **Builder** | Implementation within explicitly authorized scope | Yes | **No — never** | No | No | `ACTOR_REPORTED` |
| **QA** | Independent/deterministic validation | Test/validation code only, in-scope | No | No | No | `INDEPENDENTLY_REPRODUCED` when it re-executes; `ACTOR_REPORTED` otherwise — must not claim reproduction it didn't do |
| **Independent Reviewer** | Fresh-context **post-implementation integration review** — must not simply inherit the Builder's reasoning | No | No | No (recommends only) | No | `INDEPENDENTLY_INSPECTED`/`REPRODUCED`, structurally required to come from a clean context |

**Architect vs. Independent Reviewer — the distinction is timing and contamination, not seniority:** the Architect works requirements → design → architecture → risk → constraints, i.e. before and during implementation; the Independent Reviewer works fresh-context, after implementation, specifically checking the integration result rather than re-litigating the design. **[REPO-VERIFIED: AS0-007; "must not inherit Builder reasoning" phrasing is CYCLE-SUPPLIED elaboration of the same underlying rule]**

## System mechanisms (non-authorities — cannot appear in the "authorizes" columns above under any circumstance)

| Mechanism | Function | Can block? | Can authorize/waive? |
|---|---|---|---|
| Evidence Gate | Deterministic checkpoint on requirement/test/security/policy evidence | Yes — fail-closed | **No** |
| Policy Engine | Encodes the rules the Evidence Gate enforces | Indirectly, via the rules it encodes | **No** |
| Task Engine | Tracks requirement → design → implementation → test → evidence → status | No | **No** |
| Orchestrator | Dispatches work to actors | No | **No** |
| Capability Registry / Gateway | Determines what CAN technically be done, independent of what Governance says MAY be done | Yes, by construction (denies invocation) | **No** |
| CI | Executes QA's deterministic checks | Indirectly (feeds Evidence Gate) | **No** |
| GitHub Rules | Branch protection / required checks | Yes, technically | **No** |

## Cross-cutting rules (apply to every row above)

1. **No self-certification.** A Builder marking its own work approved, or any actor certifying its own output at a status stronger than the evidence class it itself produced, is a violation, not a shortcut.
2. **Capability ≠ authority.** A role or mechanism having the technical ability to perform an action never by itself grants authorization to take a governance-significant action (deploy, merge to a protected branch, accept risk, change scope). See `TRUST_BOUNDARIES.md` TB-7.
3. **Governance determines what MAY be done; the Capability Registry/Gateway determines what CAN technically be done.** These are independent axes — see `../architecture/ML-DEVOS-ARCH-001.md` §5. **[CYCLE-SUPPLIED framing]**
4. Only Paulo's entries in "Authorizes deploy/protected-branch merge" and "Authorizes next phase/scope" are ever `Yes`. Any future revision adding a second `Yes` in either column is itself an architecture change requiring the freeze/Architect-Sync/Paulo-authorization pattern this document itself went through.
