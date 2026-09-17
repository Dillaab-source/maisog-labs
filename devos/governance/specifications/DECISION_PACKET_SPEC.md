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
| `payload` **XOR** `payload_hash` + `payload_hash_algorithm` | **S1-F006 correction: mutually exclusive, never both, never neither.** Either the exact content of the change (`payload`), or a hash of it with a declared algorithm (`payload_hash`/`payload_hash_algorithm`, e.g. `sha256`) when the content is too large to inline — so the approver is approving *this specific content*, not a description of it, and an unverifiable hash with no declared algorithm is never accepted. |
| `current_state` | What the target's state is right now. |
| `expected_state_change` | What the target's state would become if approved. |
| `risk_class` | `low` / `medium` / `high` / `highest`, per the change classification this decision falls under (`../change-policy/CHANGE_GOVERNANCE_POLICY.md`). |
| `policy_version` | Which governance/policy version was in effect when this packet was created. |
| `rule_ids` | Which rule records (`../rules/*.json`) govern this decision. |
| `evidence_refs` | Citations to the evidence (test output, diff, CI run, etc.) supporting the request. **S1-F006 correction: mandatory, with at least one entry, whenever `risk_class` is `high` or `highest`** — evidence binding is part of the adopted Decision Packet requirement (`D-012`), not optional at the top of the risk scale. |
| `rollback_plan` | How to undo the action if it goes wrong. |
| `compensation_plan` | If rollback isn't clean, what compensates for the difference. |
| `idempotency_key` | Optional in S1 — prevents the same approved decision from being executed twice, once execution is automated (not in S1; this field has no effect until that later phase). |
| `requested_at` | Timestamp of the request. |
| `approver` | Who is being asked to decide — always a human (Paulo, or Paulo's explicitly pre-authorized delegate) for anything above `low` risk. |
| `decision` | `APPROVED` / `REJECTED` / `PENDING`. |
| `decided_at` | **S1-F006 correction: conditionally required, never `null`.** Present (as an actual timestamp) only once `decision` is `APPROVED` or `REJECTED`; while `PENDING`, the field is simply absent — omission, not `null`, represents "not yet decided," since JSON's `date-time` format has no meaningful null timestamp. |

## Binding rules

- A Decision Packet is never generated and approved by the same actor. The requesting actor and the approver are always different (`CORE-001`, `CORE-003`).
- `payload` and `payload_hash` are mutually exclusive (S1-F006) — a packet binds to exactly one representation of the proposed content, and a paraphrase of the change is never sufficient for anything above `low` risk.
- `high`/`highest` risk packets must carry at least one `evidence_refs` entry (S1-F006).
- An approved Decision Packet is not itself proof of correct implementation — it authorizes an action; whether the action was executed as approved is a separate, later evidence question (`ML-DEVOS-ARCH-001` §6, evidence classes).
