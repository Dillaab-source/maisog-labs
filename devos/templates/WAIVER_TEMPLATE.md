# WAIVER-<NNN>: <Title>

<!--
Numbering convention: ML-DEVOS-WAIVER-001, ... — sequential, never reused.
No waiver has been filed as of S1. See
../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md §1, WAIVER row.
A waiver is a temporary, explicit, expiring exception — never a permanent
silent one. expires_at is MANDATORY; the static validator
(../governance/registry/validate-rules.mjs) rejects a WAIVER-class rule
record with no expiry.
-->

```yaml
waiver_id: ML-DEVOS-WAIVER-<NNN>
rule_waived: <rule_id from ../governance/rules/*.yaml>
scope: <exactly what this waiver covers — as narrow as possible>
reason: <why this exception is needed>
risk: low | medium | high | highest
approver: <must be Paulo, or a role Paulo has explicitly pre-authorized to approve waivers of this rule's class>
issued_at: <date>
expires_at: <date — REQUIRED, no exceptions>
compensating_controls: <what mitigates the risk of the waived rule not applying during this window>
evidence: <evidence class(es) supporting that the compensating controls actually work>
status: ACTIVE | EXPIRED | REVOKED
```

## Full description

Explain the situation in prose: what rule is being waived, for what concrete reason, for how long, and what compensates for the gap.

## Why this isn't just weakening the rule

Per `CORE-009`, a waiver is not a backdoor for silently weakening a constitutional/core rule — it is a time-boxed, explicitly approved, narrowly scoped, evidenced exception. If what's actually needed is a permanent change to the rule, that is an RFC against the rule itself (`CORE_POLICY`/`CONSTITUTIONAL` class, as appropriate), not a waiver that never expires or gets silently renewed forever.

## Expiry handling

When `expires_at` passes, this waiver's `status` must be updated to `EXPIRED` and the waived rule reverts to full effect automatically — not by anyone's discretion. Renewing a waiver requires a new waiver record referencing this one, with its own fresh justification; it is not a mechanical rollover.
