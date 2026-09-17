# Decision Packet: <Title>

See `../governance/specifications/DECISION_PACKET_SPEC.md` and `../governance/specifications/decision-packet.schema.json` for the full specification and machine-readable shape this template implements.

```yaml
decision_id: <stable id>
task_id: <task reference>
project_id: <project this concerns>
requesting_actor: <who/what is asking — never the same as approver>
exact_action: <the precise action, not a summary>
tool: <what would execute it>
target: <exact branch/environment/resource affected>
payload: |
  <exact content of the change, inline if practical>
# payload_hash: <or a hash, if payload is too large to inline>
current_state: <what target's state is now>
expected_state_change: <what it would become if approved>
risk_class: low | medium | high | highest
policy_version: <governance/policy version in effect>
rule_ids: []          # which rule records govern this decision
evidence_refs: []      # citations to supporting evidence
rollback_plan: <how to undo this if approved and it goes wrong>
compensation_plan: <if rollback isn't clean, what compensates>
idempotency_key: <prevents double-execution once automated>
requested_at: <timestamp>
approver: <must be human — Paulo, or an explicitly pre-authorized delegate>
decision: PENDING
decided_at: null
```

## Note

No runtime executes this packet automatically in S1. This is a structured record a human approver reads and decides on manually — the point is that the approver is deciding on this *exact* `payload`/`payload_hash`, `exact_action`, and `target`, not on an AI-written paraphrase of them.
