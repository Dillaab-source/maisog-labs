# Current Directive — D-133 ClinicFlow source-of-truth recovery (read-only)

```yaml
schema_version: 1
directive_id: DIR-CLINICFLOW-V1-RECOVERY-0001
cycle_id: CLINICFLOW_V1_RECOVERY
issue_parent_commit: 2939cbe8a9c52465e6467f9cf2671cd28c7bab81
target_turn: CLAUDE
authority_ref: D-133
applicable_review_id: ML-DEVOS-AS-160
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE and D-133. Claude/Builder prepared it as mechanical publisher of D-133.

## Objective

Recover the real current state of ClinicFlow from the material reachable from the Builder session. Return one recovery handoff with the sections D-133 lists. Implement nothing.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; every action flag is `NO`.
- `ML-DEVOS-AS-160` closed the D-129/D-132 website release.

## Governing references

- **T0:** D-133; live STATE.
- **T1:** MaisogLabs records that mention ClinicFlow (RFC-022 homepage copy, D-088, D-105); `OBL-017` (production gating).

## Exact execution scope

Allowed (read-only):
- this repository and its history;
- listing and reading repositories reachable from the session;
- reading n8n workflows and executions through the n8n connector, if it is reachable;
- read-only listing of Cloudflare resources;
- reading workflow JSON, prompts, schemas and documentation.

Credentials and secrets are recorded **by name, type and reference only, never by value**.

Not allowed:
- creating, activating, deactivating, executing, testing or editing workflows;
- sending messages; Messenger/Facebook, OAuth, Google Sheets or Calendar writes;
- using production credentials to act; creating repositories; deleting material;
- deploying; website changes; S6/S7; V2.1 Revision 2.

## SENTINEL Sync

- **Authority:** D-133 (Paulo).
- **Context:** the website release is closed; ClinicFlow is the next priority.
- **Capability:** read-only inspection through the connected integrations.
- **Execution:** inventory → classify → recover the architecture → V1 contract and test plan → return.
- **Evidence:** what each located artifact is, and where.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- Some sources D-133 names ("local ClinicFlow files", screenshots, notes on Paulo's machine) may be unreachable from a cloud session. They are reported as unreachable, never inferred.
- Running a workflow to "demonstrate" that it works would be execution, and is not allowed. "Working" is established only from existing evidence (for example past execution records), classed accordingly.

## Instructions

1. Bootstrap.
2. Inventory every reachable source.
3. Classify each component.
4. Recover the architecture; build the preserve/repair/rebuild/remove matrix, the V1 contract, the test plan, the risks and the next gate.
5. Publish the return: archive and deselect this directive; route `TURN: ARCHITECT`; all flags `NO`.

## Validation and evidence

The D-133 return sections, each tied to a located artifact or marked not located or unreachable.

## Stop conditions

- Any step would need a write, an execution or the use of a credential to act.
- A located artifact exposes a secret value: record the location only, and never copy the value.

## Next action

Publish `H-CLINICFLOW-V1-RECOVERY-0001` and route to the Architect.
