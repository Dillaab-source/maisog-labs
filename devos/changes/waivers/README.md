# Waivers

Filed waivers live here as **two sibling files** per waiver (S1-F003 correction — see `../../templates/WAIVER_TEMPLATE.md` for why):

- `ML-DEVOS-WAIVER-<NNN>.md` — narrative, for humans.
- `ML-DEVOS-WAIVER-<NNN>.json` — structured record, conforming to `../../governance/registry/waiver-record.schema.json`, actually validated by `../../governance/registry/validate-waivers.mjs`.

Numbering is sequential starting at `001`, never reused. Every waiver **must** carry a mandatory `expires_at` strictly after `issued_at` — there are no permanent silent exceptions (`../../governance/change-policy/CHANGE_GOVERNANCE_POLICY.md` §1, `WAIVER` row). A waiver may only target a rule whose `waivable` field is `true` in the current rule registry (`../../governance/rules/core-rules.json`) — `validate-waivers.mjs` rejects any waiver naming an unwaivable rule.

## Validation

```
node ../../governance/registry/validate-waivers.mjs
```

Checks JSON validity, required fields, mandatory/valid `expires_at`, that `rule_waived` exists and is `waivable: true`, and enum validity for `risk`/`status`. It does **not** check whether `compensating_controls` are actually adequate, whether `approver` truly holds sufficient authority, or expire a waiver automatically when its date passes — all three remain human/process judgment in S1. See the script's own header comment for the full proves/does-not-prove list.

No waiver has been filed as of this cycle.
