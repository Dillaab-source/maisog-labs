# WAIVER-<NNN>: <Title>

<!--
Numbering convention: ML-DEVOS-WAIVER-001, ... — sequential, never reused.
No waiver has been filed as of this cycle. See
../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md §1, WAIVER row.

S1-F003 correction: a waiver is filed as TWO artifacts, not one:
  1. This narrative file (prose, for humans): devos/changes/waivers/ML-DEVOS-WAIVER-<NNN>.md
  2. A structured record (machine-readable, actually validated):
     devos/changes/waivers/ML-DEVOS-WAIVER-<NNN>.json
     conforming to ../governance/registry/waiver-record.schema.json.

Only the .json file is checked by ../governance/registry/validate-waivers.mjs.
A prior version of this template embedded YAML inside this Markdown file and
claimed it was validated -- it was not; nothing scanned devos/changes/waivers/
at all. This is now fixed: the .json sibling file is real and is validated.
-->

## Structured record (`ML-DEVOS-WAIVER-<NNN>.json`)

```json
{
  "waiver_id": "ML-DEVOS-WAIVER-<NNN>",
  "rule_waived": "<rule_id from ../governance/rules/*.json — MUST have waivable: true>",
  "scope": "<exactly what this waiver covers — as narrow as possible>",
  "reason": "<why this exception is needed>",
  "risk": "low | medium | high | highest",
  "approver": "<must be Paulo, or a role Paulo has explicitly pre-authorized to approve waivers of this rule's class — never the requesting actor>",
  "issued_at": "<YYYY-MM-DD>",
  "expires_at": "<YYYY-MM-DD — REQUIRED, must be strictly after issued_at, no exceptions>",
  "compensating_controls": "<what mitigates the risk of the waived rule not applying during this window>",
  "evidence": ["<evidence class(es) supporting that the compensating controls actually work>"],
  "status": "ACTIVE"
}
```

`node ../governance/registry/validate-waivers.mjs` will reject this record if: `expires_at` is missing or not after `issued_at`; `rule_waived` does not exist in the current rule registry; or the referenced rule's `waivable` field is `false`. A waiver against an unwaivable (`waivable: false`) constitutional rule is not a shortcut — it is rejected outright. The only path to changing such a rule is that rule's own full change class (typically `CONSTITUTIONAL`: RFC + Architect Sync + explicit Paulo approval).

## Narrative (`ML-DEVOS-WAIVER-<NNN>.md`, this file)

Explain the situation in prose: what rule is being waived, for what concrete reason, for how long, and what compensates for the gap.

## Why this isn't just weakening the rule

Per `CORE-009`, a waiver is not a backdoor for silently weakening a constitutional/core rule — it is a time-boxed, explicitly approved, narrowly scoped, evidenced exception, and only ever against a rule its own author marked `waivable: true`. If what's actually needed is a permanent change to the rule, that is an RFC against the rule itself (using that rule's own change class and authority — never a lower-authority path), not a waiver that never expires or gets silently renewed forever.

## Waiver authority rule (S1-F003)

A waiver's `approver` must hold authority at least equal to the waived rule's own `authority` fields (`../governance/registry/RULE_RECORD_SCHEMA.md`). A `CORE_POLICY`-class rule's waiver needs at least `CORE_POLICY`-level sign-off; nothing waivable at `CONSTITUTIONAL` level can be approved by anything less than the full Paulo + Architect Sync authority that rule itself requires. A waiver can never grant itself more authority than establishing the rule required in the first place.

## Expiry handling

When `expires_at` passes, this waiver's `status` must be updated to `EXPIRED` and the waived rule reverts to full effect automatically — not by anyone's discretion. Renewing a waiver requires a new waiver record referencing this one, with its own fresh justification; it is not a mechanical rollover. **Note (S1 scope):** flipping `status` to `EXPIRED` after the date passes is currently a manual act — no scheduled job or runtime check performs this automatically, since no such automation is authorized in S1.
