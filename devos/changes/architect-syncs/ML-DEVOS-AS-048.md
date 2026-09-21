# ML-DEVOS-AS-048 — Access-Control Clarification Canonicalization

Status: `DISCOVERY REMEDIATION AMENDMENT — CANONICALIZED`

Relationship:
- supplements `ML-DEVOS-AS-047`;
- preserves the access-control clarification introduced by commit `71bbef09035b8e1517b95142a03cd1282c654e20`;
- replaces the accidental noncanonical filename `ML-DEVOS-AS-047-access-control-amendment.md` with the next valid Architect Sync ID.

## Reason for canonicalization

Sentinel Traceability V1 defines Architect Sync IDs as one canonical file per ID under:

`devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md`

The temporary amendment filename reused `AS-047` in the Architect Sync canonical directory and therefore risked a duplicate canonical-definition finding.

This correction does not alter the substance of the amendment. It only gives the amendment its own canonical ID and removes the accidental duplicate artifact from the active tree. Git history preserves the original commit.

## Preserved amendment content

```markdown
# AS-047 — Explicit Access-Control Amendment

Base: `310d1ddd9b57218349e1ea02e568ac175cca76ec`
Reviewer: Codex
Status: `CHANGES_REQUESTED — SAME REMEDIATION CYCLE 2`

## Explicit access-control condition — AS-047 amendment (2026-09-20)

Paulo's current request makes repository suitability conditional: **both INTERNAL and RESTRICTED documentation may use this private repository only if current access controls are accepted for the material, the material is suitable for Git, and its canonical destination is authorized under existing governance.** Private visibility alone is not acceptance. This review verified GitHub metadata (`visibility: private`, repository ID `1364674338`, 2026-09-20 approximately 04:36 UTC); it did not audit or accept the full access-control configuration.

If accepted access controls, classification, Git suitability, or destination authorization is missing or uncertain, `STOP / DEFER PERSISTENCE`. This condition also applies to the INTERNAL and RESTRICTED positive eval cases: add a near-miss with unaccepted/unknown controls that stops before persistence. Credentials/secrets and all other Git-unsuitable material remain excluded even if controls are accepted. Non-rendered paths are not themselves privacy boundaries; public outputs and exports retain disclosure gates.

This is a narrow clarification of AS47-F001 / the superseded premise of AS46-F001, authorized by Paulo's request to update this discovery review. It grants no sensitive-data persistence, policy waiver, access-control change, private-repository/secret-store creation, or implementation authority. Existing AGENTS.md restrictions and stronger governance remain in force; any later persistence must reconcile applicable rules through existing governance. AS45-F007, AS46-F002/F003, Cycle 2, Claude's turn, all authorization flags, and S3's paused/preserved authority remain unchanged. The immutable AS-047 archive and D-041 are preserved.

```

## Effective clarification

Both INTERNAL and RESTRICTED documentation may use the private MaisogLabs repository only when:
- current access controls are accepted for the material;
- the material is suitable for Git;
- the canonical destination is authorized under existing governance.

Private visibility alone is not acceptance.

If accepted access controls, classification, Git suitability, or destination authorization is missing or uncertain:

`STOP / DEFER PERSISTENCE`

Credentials, secret values, private keys, recovery codes, and other Git-unsuitable material remain excluded regardless of repository visibility.

## Governance impact

None beyond canonical bookkeeping.

Unchanged:
- `AS45-F007` remains active;
- `AS46-F002` remains active;
- `AS46-F003` remains active;
- Cycle 2 remains active;
- `TURN: CLAUDE`;
- S3 remains `PAUSED / QUEUED — AUTHORITY PRESERVED`;
- no Skills/Treasury implementation, provider adapters, deployment, remote resource, or main merge is authorized.
