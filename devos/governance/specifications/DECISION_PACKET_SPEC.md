# Sentinel Decision Packet Specification

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Formalizes `ML-DEVOS-AS-003` "Decision Packet" and `brain/DECISION_LOG.md` `D-012`'s Decision Packet requirement. Template: `../../templates/DECISION_PACKET_TEMPLATE.md`. JSON Schema: `./decision-packet.schema.json`.

## Purpose

A sensitive human approval must bind to the **concrete, exact proposed operation** — not merely an AI-written description of what it intends to do. "Claude wants to deploy the site" is not a Decision Packet. "This exact commit SHA, deployed via this exact command, to this exact target, with this rollback plan" is closer to one.

## S1 scope

S1 defines this specification and its template only. **No runtime approval execution exists.** No code reads, validates, or acts on a Decision Packet. A Decision Packet produced today is a structured record a human reads and decides on manually, exactly as every Paulo-gated decision in this repository's history so far has worked — this specification just gives that manual process a consistent shape, and prepares the ground for a later, separately authorized phase (S9 "Independent Review & Evidence Gate" or later) to actually automate parts of it.

## Fields

| Field | Meaning |
|---|---|
| `decision_id` | Stable identifier for this decision request. |
| `task_id` | The task this decision is part of, once a Task Engine (S4+) exists to issue task IDs; may be a free-text reference until then. |
| `project_id` | Which project/repository this decision concerns. |
| `requesting_actor` | Who/what is asking (e.g. `Claude (Builder)`). |
| `exact_action` | The precise action being requested — not a summary. E.g. "merge PR #N into main" or "run `wrangler deploy`". |
| `tool` | The tool/mechanism that would execute the action. |
| `target` | The exact target (branch, environment, resource) the action would affect. |
| `payload` / `payload_hash` | The exact content of the change, or a hash of it when the content is too large to inline — so the approver is approving *this specific content*, not a description of it. |
| `current_state` | What the target's state is right now. |
| `expected_state_change` | What the target's state would become if approved. |
| `risk_class` | `low` / `medium` / `high` / `highest`, per the change classification this decision falls under (`../change-policy/CHANGE_GOVERNANCE_POLICY.md`). |
| `policy_version` | Which governance/policy version was in effect when this packet was created. |
| `rule_ids` | Which rule records (`../rules/*.yaml`) govern this decision. |
| `evidence_refs` | Citations to the evidence (test output, diff, CI run, etc.) supporting the request. |
| `rollback_plan` | How to undo the action if it goes wrong. |
| `compensation_plan` | If rollback isn't clean, what compensates for the difference. |
| `idempotency_key` | Prevents the same approved decision from being executed twice, once execution is automated (not in S1). |
| `requested_at` | Timestamp of the request. |
| `approver` | Who is being asked to decide — always a human (Paulo, or Paulo's explicitly pre-authorized delegate) for anything above `low` risk. |
| `decision` | `APPROVED` / `REJECTED` / `PENDING`. |
| `decided_at` | Timestamp of the decision. |

## Binding rules

- A Decision Packet is never generated and approved by the same actor. The requesting actor and the approver are always different (`CORE-001`, `CORE-003`).
- `payload`/`payload_hash` must be exact — a paraphrase of the change is not sufficient for anything above `low` risk.
- An approved Decision Packet is not itself proof of correct implementation — it authorizes an action; whether the action was executed as approved is a separate, later evidence question (`ML-DEVOS-ARCH-001` §6, evidence classes).
