# Current Handoff — S6 Integrity Hardening RFC-019 Amendment Draft

```yaml
schema_version: 1
handoff_id: H-S6-INTEGRITY-RFC-0001
cycle_id: SENTINEL_S6_INTEGRITY_HARDENING_RFC
input_base_commit: 68968789bfa36f47a53179e3ed51d5d16e758203
review_target_commit: 68968789bfa36f47a53179e3ed51d5d16e758203
applicable_review_id: ML-DEVOS-AS-098
```

This handoff is evidence/navigation, not authority. STATE owns turn and scope.

## Objective

Amend `ML-DEVOS-RFC-019` only, following `D-073` and
`ML-DEVOS-AS-098`, so S6 has one coherent durable transaction/crash model before any
further implementation.

Use the Architect review as the compact normative planning input. Do not re-open product
work or implement S6 code.

## Changed files

Expected Builder write set is limited to:

- `devos/changes/rfcs/ML-DEVOS-RFC-019.md`;
- `devos/changes/rfcs/README.md` only if factual status/index wording requires it;
- deterministic traceability outputs if the RFC edit changes them;
- `coordination/STATE.md` and `coordination/CURRENT_HANDOFF.md` for the return gate.

No `devos/execution/**`, S3/S4/S5, manifest, ADR, version, S7, product/runtime,
deployment or remote-resource mutation.

## Tests and evidence

This is design work.

Required evidence on return:

- exact changed-file list;
- traceability generator/validator results if regenerated;
- `npm test` and standard validators if the repository's design workflow requires them;
- `git diff --check`;
- explicit statement that no executable S6 or S7 file changed;
- explicit mapping from every AS-098 architecture requirement A-J to the amended RFC
  section(s).

Builder evidence is `ACTOR_REPORTED`.

## Unresolved findings and limitations

Carry forward:

- AS97-F001 and the post-AS097 implementation findings as design inputs only;
- no implementation is authorized;
- no real execution driver is authorized;
- S6 stays NOT_IMPLEMENTED / v1.8.0;
- `node:sqlite` / SQLite is an alternative, not a mandatory design choice;
- no S4 signed receipt/history interface is authorized;
- S7 Input Integrity remains a later phase input.

All OPEN/DEFERRED rows in `coordination/OPERATIVE_OBLIGATIONS.md` remain unresolved
unless separately closed by cited authority.

## Governing references

- `D-073` — S6 integrity-hardening planning authority;
- `ML-DEVOS-AS-098` — SU-grounded Architect planning requirements;
- `ML-DEVOS-AS-097` — last implementation review;
- `D-071`, `D-072` — existing S6 implementation boundaries/history;
- `D-069` — execution-driver separation;
- `ML-DEVOS-RFC-019` — design to amend;
- `ML-DEVOS-ARCH-001` / `ML-DEVOS-SIP-001` — frozen S6/S7 roadmap;
- `coordination/OPERATIVE_OBLIGATIONS.md` — carry-forward inventory.

## Evidence locations

- `coordination/ARCHITECT_REVIEW.md` / durable `ML-DEVOS-AS-098`;
- current `ML-DEVOS-RFC-019`;
- authoritative branch snapshot named in the YAML header.

## Next action

Claude drafts the RFC-019 integrity-hardening amendment only and returns:

- TURN: ARCHITECT
- STATUS: READY_FOR_ARCHITECT
- ARCHITECT_ACTION_REQUIRED: YES
- IMPLEMENTER_ACTION_REQUIRED: NO
- PAULO_DECISION_REQUIRED: NO

Use the next exact commit as `review_target_commit` in the returned handoff.

Recommended manual Claude setting: **High / Extended Thinking**.
Reasoning mode: **transaction/crash-consistency architecture + adversarial invariant
design**.

Do not implement the amended design. Any implementation requires a fresh Paulo decision
after Architect review.
