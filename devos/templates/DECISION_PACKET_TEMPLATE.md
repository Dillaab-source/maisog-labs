# Decision Packet: <Title>

See `../governance/specifications/DECISION_PACKET_SPEC.md` and `../governance/specifications/decision-packet.schema.json` for the full specification and machine-readable shape this template implements.

**S1-F006 correction:** `payload` and `payload_hash` are mutually exclusive — choose exactly one, never both, never neither. `decided_at` is present only once a decision is actually made (never `null` — while `PENDING`, omit the field entirely). `evidence_refs` is required, with at least one entry, whenever `risk_class` is `high` or `highest`.

## Example A — exact payload, still pending

```json
{
  "decision_id": "<stable id>",
  "task_id": "<task reference>",
  "project_id": "<project this concerns>",
  "requesting_actor": "<who/what is asking — never the same as approver>",
  "exact_action": "<the precise action, not a summary>",
  "tool": "<what would execute it>",
  "target": "<exact branch/environment/resource affected>",
  "payload": "<exact content of the change, inline>",
  "current_state": "<what target's state is now>",
  "expected_state_change": "<what it would become if approved>",
  "risk_class": "medium",
  "policy_version": "<governance/policy version in effect>",
  "rule_ids": [],
  "evidence_refs": [],
  "rollback_plan": "<how to undo this if approved and it goes wrong>",
  "compensation_plan": "<if rollback isn't clean, what compensates>",
  "requested_at": "<ISO 8601 timestamp>",
  "approver": "<must be human — Paulo, or an explicitly pre-authorized delegate>",
  "decision": "PENDING"
}
```

Note: no `decided_at` field at all while `PENDING` — its *absence* is the honest representation of "not yet decided," not a `null` value.

## Example B — hashed payload (too large to inline), high risk, approved

```json
{
  "decision_id": "<stable id>",
  "task_id": "<task reference>",
  "project_id": "<project this concerns>",
  "requesting_actor": "<who/what is asking>",
  "exact_action": "<the precise action>",
  "tool": "<what would execute it>",
  "target": "<exact branch/environment/resource affected>",
  "payload_hash": "<hex digest>",
  "payload_hash_algorithm": "sha256",
  "current_state": "<...>",
  "expected_state_change": "<...>",
  "risk_class": "high",
  "policy_version": "<...>",
  "rule_ids": ["CORE-012"],
  "evidence_refs": ["<at least one citation — required at high/highest risk>"],
  "rollback_plan": "<...>",
  "requested_at": "<ISO 8601 timestamp>",
  "approver": "Paulo",
  "decision": "APPROVED",
  "decided_at": "<ISO 8601 timestamp — required once decision is not PENDING>"
}
```

## Note

No runtime executes this packet automatically in S1. This is a structured record a human approver reads and decides on manually — the point is that the approver is deciding on this *exact* `payload` (or a specific, algorithm-declared `payload_hash`), `exact_action`, and `target`, not on an AI-written paraphrase of them. `idempotency_key` remains optional in S1 — it becomes meaningful once execution is automated in a later, separately authorized phase.
