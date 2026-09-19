# ADR-008: Adopt the WEB-INC-006 local Journal subsystem

Status: `ACCEPTED`

Related:
- `WEB-REQ-009`
- `ML-DEVOS-RFC-009`
- `ML-DEVOS-AS-028`
- `ML-DEVOS-AS-029`
- `D-031`

Implementation:
- `cdc8f84cbdb2c5a76336512b6c0e5111030d3e4e`

Decision:
MaisogLabs adopts the local/repository Journal subsystem with:
- `journal_entries`, `journal_entry_revisions`, `journal_media`;
- authenticated create/edit/preview/publish/unpublish lifecycle;
- revision-scoped immutable Journal media snapshots;
- published-only public GET APIs;
- static `/journal` shell;
- plain-text body rendering;
- Journal lifecycle dashboard projection;
- bounded Journal audit integration.

Public Journal reads follow only `published_revision_id` and never draft/historical fallback.

Accepted limitations:
- `AS29-L001`: base-row immutable metadata is application-enforced rather than independently frozen by a dedicated DB trigger.
- `AS29-L002`: audit authority is bounded at fixed Journal call sites rather than a global literal action enum.
- `AS29-L003`: direct SQL could supply an arbitrary first non-null `published_at`; authorized application code generates it server-side.

Resource boundary:
- D1/R2 remain local-only and `remote: false`.
- No production resource provisioning, public R2 object serving, deployment, public homepage/projects D1 cutover, or protected/main merge.

Sentinel impact:
- frozen architecture remains `v1.2.0`;
- active governance-capability baseline remains `v1.5.0`;
- no S3+ implementation.
