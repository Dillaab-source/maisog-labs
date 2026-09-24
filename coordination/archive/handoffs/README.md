# CURRENT_HANDOFF Archive

Status: `ACTIVE` since the `D-062` Stage B activation. No entries yet: the first CURRENT_HANDOFF (`H-CBV0-0001`) is live, and it is archived here when a later transition replaces or deselects it.

Authority: `ML-DEVOS-RFC-018` § Rolling-record preservation (`B018-03`), `D-062`.

This directory holds immutable, byte-exact copies of every outgoing `coordination/CURRENT_HANDOFF.md`, preserved before or atomically with its replacement regardless of outcome. Entries are evidence, never authority.

## Entry layout (deterministic)

For a handoff whose header carries `handoff_id: <ID>` (`^H-[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`):

- `<ID>.md` — the exact outgoing bytes, unmodified.
- `<ID>.provenance.json` — `handoff_id`, `source_path`, `source_commit`, `source_blob` (Git blob ID of the bytes), `sha256`.

Verification: `git hash-object <ID>.md` equals `source_blob`, and `git rev-parse <source_commit>:coordination/CURRENT_HANDOFF.md` equals `source_blob`.

## Rules

- Entries are immutable. An existing `<ID>.md` with identical bytes is a no-op; different bytes fail closed (`ARCHIVE_ID_CONFLICT`).
- The archive write and the replacement are one candidate commit (exact-tip atomic publication); a failed archive write aborts the transition.
- Architect Sync reviews keep their existing archive, `devos/changes/architect-syncs/ML-DEVOS-AS-<NNN>.md`.
- Implemented by `archiveHandoff` / `checkTransitionCompleteness` in `scripts/check-context-bootstrap.mjs`.

## Index

Append one row per entry; never edit or remove rows.

| handoff_id | cycle_id | source_commit | source_blob |
|---|---|---|---|
| H-CBV0-0001 | SENTINEL_CONTEXT_PLANE_BOOTSTRAP_V0_IMPLEMENTATION | 6eb88cf1b9248ce5f01d113e555ec59950f0d622 | df666b9a47155d54c87b4bac9b03a0a75660c31e |
| H-S5-TRIAL1-0001 | SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION | d589a16b8256232edd029593d653335913619125 | bea0547f94419f021d7a95a81b9774f78e642a8a |
| H-S5-REM1-0001 | SENTINEL_S5_CAPABILITY_PERMISSION_GATEWAY_IMPLEMENTATION | 06b5bef3d1e495db95cd52508ea8fc8ed9d7242e | 0810ee8e5ff0b01183b13fb5bd82c180a24670e2 |
| H-S5-CLOSURE-0001 | SENTINEL_S5_CLOSURE | 81504cf3be8fdaf1f7acd43a5873641a98eeef8d | 109a8e3b47ed03a7fef0d285692e8964f2021935 |
| H-S6-RFC019-0001 | SENTINEL_S6_ISOLATED_EXECUTION_DESIGN | e16105a9de6791f3ba3269b689730b6a6e7cc7b1 | 95380f34537af423eaa77ea3bc59ebdaa1eb5bd4 |
| H-S6-RFC019-REM1-0001 | SENTINEL_S6_ISOLATED_EXECUTION_DESIGN | 9295823272574a1c72762ae76cef60d7acddd3e0 | bc403d181eb358b7ab98f143cab33468ef889d18 |
| H-S6-RFC019-REM2-0001 | SENTINEL_S6_ISOLATED_EXECUTION_DESIGN | a56a76e8d28a3960734c93734fd8dbc3e715e554 | 96243dc912cf5baad85e345b0b713e6101ea5575 |
| H-S6-RFC019-REM3-0001 | SENTINEL_S6_ISOLATED_EXECUTION_DESIGN | 7d30f4d2cf3b19ca5cc23113e0c51128ba980ca2 | 89a5b4aef170e8e6e4df2106e34c8261d82cfa01 |
