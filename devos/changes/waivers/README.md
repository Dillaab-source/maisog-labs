# Waivers

Filed waivers live here as **two sibling files** per waiver (S1-F003 correction — see `../../templates/WAIVER_TEMPLATE.md` for why):

- `ML-DEVOS-WAIVER-<NNN>.md` — narrative, for humans.
- `ML-DEVOS-WAIVER-<NNN>.json` — structured record, conforming to `../../governance/registry/waiver-record.schema.json`, actually validated by `../../governance/registry/validate-waivers.mjs`.

Numbering is sequential starting at `001`, never reused. Every waiver **must** carry a mandatory `expires_at` strictly after `issued_at` — there are no permanent silent exceptions (`../../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1, `WAIVER` row). A waiver may only target a rule whose `waivable` field is `true` in the current rule registry (`../../governance/rules/core-rules.json`) — `validate-waivers.mjs` rejects any waiver naming an unwaivable rule.

**S1-F003 (remediation cycle 2):** a waiver against a rule whose own `authority.paulo_approval_required`/`authority.architect_sync_required` is `true` must also carry a non-empty `paulo_decision_ref`/`architect_sync_ref` respectively — see `../../templates/WAIVER_TEMPLATE.md`. `expires_at` is also now authoritative over `status` at validation time: an `ACTIVE` waiver whose expiry has passed is rejected regardless of what `status` still says.

## Validation

```
node ../../governance/registry/validate-waivers.mjs
```

Checks JSON validity, required fields, mandatory/valid `expires_at` (and that expiry is authoritative over stale `ACTIVE` status text), that `rule_waived` exists and is `waivable: true`, that the waiver carries the authority-reference fields its target rule's own authority demands, and enum validity for `risk`/`status`. It does **not** check whether `compensating_controls` are actually adequate, or whether `approver`/`paulo_decision_ref`/`architect_sync_ref` cite a genuine record — those remain human/process judgment in S1. This validator is fail-closed with respect to its own dependency: if the rule registry it cross-checks against cannot be parsed, waiver validation aborts entirely rather than silently proceeding with a partial index (S1-F004). See the script's own header comment for the full proves/does-not-prove list.

No waiver has been filed as of this cycle.
