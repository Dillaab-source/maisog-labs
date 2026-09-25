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
| H-S6-EXECBOUNDARY-0001 | SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT | ac701465dd4ff055d4a36b449e4b8568a81b3deb | d9c722eec9105ae046231d060e2ba0ec6c56198b |
| H-S6-EXECBOUNDARY-REM1-0001 | SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT | ccdbbc754ee45769f3da16c7bbdba27641b67084 | 870c6a3295bd63ec73df37371deb68adf6156f88 |
| H-S6-EXECBOUNDARY-REM2-0001 | SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT | 5d3f0777ca82f2cf5f6890dd3319f6999255b541 | 5d12972e1ac14278a2e98c007ebd0a5cad8e41a9 |
| H-S6-EXECBOUNDARY-REM3-0001 | SENTINEL_S6_EXECUTION_BOUNDARY_DESIGN_AMENDMENT | a5b0c3dd75d9c5eb5dc491a636b438874462f4bb | 70dd9b5828e3f6671d477cfe85efd49b3e4ed1bd |
| H-S6-CORE-IMPL-0001 | SENTINEL_S6_CORE_IMPLEMENTATION | f6c631f4a1671d2d04879ce1c18800881e7be5c4 | e4ab1b08f9589f5c7c4a4b03616bf9d91d1f8f31 |
| H-S6-CORE-IMPL-REM1-0001 | SENTINEL_S6_CORE_IMPLEMENTATION | f92fabe3b4b91f856a853c22cc9825e7e8b48cd1 | 60748dce77d7e65a6634f83baae71a679d71f5c1 |
| H-S6-CORE-IMPL-REM2-0001 | SENTINEL_S6_CORE_IMPLEMENTATION | 3b64aa68b431602fa7f78ac270260f308e896033 | 395a6cb7b7765a0f586dcfbbb01cd8e6de34f5fe |
| H-S6-CORE-IMPL-REM3-0001 | SENTINEL_S6_CORE_IMPLEMENTATION | 1bf18efba855ffadf5c6b6f7b6183d594d2b1d32 | c5320b12c129ba6fa86419000735d45f55718711 |
| H-S6-INTEGRITY-RFC-0001 | SENTINEL_S6_INTEGRITY_HARDENING_RFC | 82c8d59523094facbc5eb5230ef2e3911a1a5619 | 6a1b90315b94b2b25d0507265ddab05f9236eedf |
| H-S6-INTEGRITY-RFC-DRAFT-0001 | SENTINEL_S6_INTEGRITY_HARDENING_RFC | 1231634df7fdefe198ac86b956643c242a61f56f | 71212eff3b998f6fb7939c622ddc2fda6fc41f25 |
| H-S6-INTEGRITY-RFC-REM1-0001 | SENTINEL_S6_INTEGRITY_HARDENING_RFC | fe73dab3a584c3e17e6d18ab583e37deabd050f9 | 1618dcc602c10200d2f54d7f4e8afb684e761bc9 |
| H-S6-INTEGRITY-RFC-REM2-0001 | SENTINEL_S6_INTEGRITY_HARDENING_RFC | 7f6099b60735473ac4cc7219081a3011a318fc1b | 91042e2b6899355ca6807777ad7dc3796ce1f519 |
| H-S6-CORE-HARDEN-0001 | SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION | f725207bc1308b5d13d3810c22361271bcbf7d33 | d1e8d15d0a6cd5355c75b203e10cd29a95116aa5 |
| H-S6-CORE-HARDEN-REM1-0001 | SENTINEL_S6_CORE_HARDENING_IMPLEMENTATION | ea6401d8358dc8386cf7e246b7e1dd1aefb46d87 | 50e31b48b7b2cca3dc2a978e9ce9d7d6782a0281 |
