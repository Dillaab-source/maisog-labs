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
  "status": "ACTIVE",
  "paulo_decision_ref": "<REQUIRED if the waived rule's authority.paulo_approval_required is true — a brain/DECISION_LOG.md entry ID or equivalent explicit Paulo record evidencing approval of THIS waiver>",
  "architect_sync_ref": "<REQUIRED if the waived rule's authority.architect_sync_required is true — an Architect Sync ID (e.g. ML-DEVOS-AS-NNN) evidencing Architect review of THIS waiver>"
}
```

`node ../governance/registry/validate-waivers.mjs` will reject this record if: `expires_at` is missing or not after `issued_at`; `expires_at` has already passed while `status` still says `ACTIVE` (expiry is authoritative over status text — S1-F003 cycle 2); `rule_waived` does not exist in the current rule registry; the referenced rule's `waivable` field is `false`; or the referenced rule's `authority.paulo_approval_required`/`authority.architect_sync_required` is `true` while the corresponding `paulo_decision_ref`/`architect_sync_ref` field above is absent or empty (S1-F003 cycle 2 — a bare `approver` string is not itself sufficient authority evidence for a rule whose own authority fields demand a Paulo decision or Architect Sync). A waiver against an unwaivable (`waivable: false`) constitutional rule is not a shortcut — it is rejected outright. The only path to changing such a rule is that rule's own full change class (typically `CONSTITUTIONAL`: RFC + Architect Sync + explicit Paulo approval). The validator is also fail-closed against its own dependency: if the rule registry itself cannot be parsed, waiver validation aborts entirely rather than silently treating every reference as unresolvable.

**S1-F004 (remediation cycle 3, FINAL):** the validator now also rejects this record for any violation of the declared JSON Schema shape, not only the semantic checks above — an unrecognized field (`additionalProperties: false`); a `waiver_id` not matching `^ML-DEVOS-WAIVER-[0-9]{3}$`; a `rule_waived` not matching `^[A-Z][A-Z0-9]*-[0-9]{3}$`; an empty `scope`/`reason`/`approver`/`compensating_controls`; an `issued_at`/`expires_at` not in exact `YYYY-MM-DD` form; an `evidence` that is not an array, or that contains anything other than `ACTOR_REPORTED`/`INDEPENDENTLY_INSPECTED`/`INDEPENDENTLY_REPRODUCED`/`CI_ATTESTED`/`RUNTIME_OBSERVED`; an invalid `risk`/`status` value; or a `paulo_decision_ref`/`architect_sync_ref` that is present but not a non-empty string, even on a waiver whose target rule doesn't itself require that field.

## Narrative (`ML-DEVOS-WAIVER-<NNN>.md`, this file)

Explain the situation in prose: what rule is being waived, for what concrete reason, for how long, and what compensates for the gap.

## Why this isn't just weakening the rule

Per `CORE-009`, a waiver is not a backdoor for silently weakening a constitutional/core rule — it is a time-boxed, explicitly approved, narrowly scoped, evidenced exception, and only ever against a rule its own author marked `waivable: true`. If what's actually needed is a permanent change to the rule, that is an RFC against the rule itself (using that rule's own change class and authority — never a lower-authority path), not a waiver that never expires or gets silently renewed forever.

## Waiver authority rule (S1-F003)

A waiver's `approver` must hold authority at least equal to the waived rule's own `authority` fields (`../governance/registry/RULE_RECORD_SCHEMA.md`). A `CORE_POLICY`-class rule's waiver needs at least `CORE_POLICY`-level sign-off; nothing waivable at `CONSTITUTIONAL` level can be approved by anything less than the full Paulo + Architect Sync authority that rule itself requires. A waiver can never grant itself more authority than establishing the rule required in the first place.

**Structural binding (S1-F003, remediation cycle 2):** the free-text `approver` field alone is not mechanically checked against the target rule's authority — `validate-waivers.mjs` cannot verify that a name is "actually Paulo." What it does mechanically enforce is that the required *reference* fields are present: `paulo_decision_ref` whenever the waived rule's `authority.paulo_approval_required` is `true`, and `architect_sync_ref` whenever the waived rule's `authority.architect_sync_required` is `true`. A waiver missing the reference its own target rule's authority demands is rejected outright, closing the gap where a plausible-looking `approver` string alone could pass.

## Expiry handling

When `expires_at` passes, this waiver's `status` must be updated to `EXPIRED` and the waived rule reverts to full effect automatically — not by anyone's discretion. Renewing a waiver requires a new waiver record referencing this one, with its own fresh justification; it is not a mechanical rollover. **Note (S1 scope):** flipping `status` to `EXPIRED` in the stored file after the date passes is still a manual act — no scheduled job or runtime check performs this automatically, since no such automation is authorized in S1. **However (S1-F003, remediation cycle 2):** `validate-waivers.mjs` now makes expiry authoritative at validation time — a waiver record whose `expires_at` has already passed while `status` still says `ACTIVE` is rejected as an error on every run, so a stale `ACTIVE` waiver cannot silently pass this lint check even before its `status` field is manually corrected.
