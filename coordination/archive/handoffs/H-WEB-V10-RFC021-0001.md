# Current Handoff — MaisogLabs V10 Canonical Visual Baseline RFC Draft (D-088)

```yaml
schema_version: 1
handoff_id: H-WEB-V10-RFC021-0001
cycle_id: MAISOGLABS_WEB_V10_RFC021_DRAFT
input_base_commit: 4c436a8a1f8768ea2fdbf377ef22f9717ccfb810
review_target_commit: 4c436a8a1f8768ea2fdbf377ef22f9717ccfb810
applicable_review_id: ML-DEVOS-AS-117
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve, and every result here is `ACTOR_REPORTED`.

## Objective

Deliver the D-088 RFC draft under `DIR-WEB-V10-RFC021-0001`: `devos/changes/rfcs/ML-DEVOS-RFC-021.md` ("V10 Canonical Visual Baseline", status `DRAFT`, class `ARCHITECTURE`) and its index row. Documentation and architecture only.

**Input/output SHAs:**
- base `4c436a8a1f8768ea2fdbf377ef22f9717ccfb810` (the D-088 directive issue; its parent is `fb4f2121cff9eaee3c9fd27ef2a2ab50cd76e6a7`);
- result: the commit publishing this handoff;
- main `aebc881e8890c00090d714602591138a045bd3b0` (unchanged).

## Changed files

- `devos/changes/rfcs/ML-DEVOS-RFC-021.md` (new; 254 lines; SHA-256 `9e3fb60d7e652ade4573616b05e7329de1cdebc1e37b9d5d66b4ad7c7a5b16e7`).
- `devos/changes/rfcs/README.md` (one RFC-021 row added at the top of "Current contents").
- `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`.
- `coordination/archive/directives/DIR-WEB-V10-RFC021-0001.{md,provenance.json}` and the index row (blob `f7ae75b9d21049668271f9e9128836d6dd51c6d3`; archived bytes compared identical to `4c436a8:coordination/CURRENT_DIRECTIVE.md`).

Nothing changed in `app/`, `components/`, `lib/`, `data/`, `public/`, `worker/`, `migrations/`, `wrangler.jsonc` or `package*.json`. No D1/R2/Access/DNS/secret/environment action, no API diagnosis, and no merge, deploy, promotion or rollback.

## D-088 / AS-117 requirement mapping

| Requirement | RFC-021 location |
|---|---|
| Supersede RFC-010 only for the V3/soft-geometry baseline, composition and default parity | §4, S1–S7, each with a verbatim RFC-010 anchor |
| Preserve RFC-010 authentication, allowlists, stale-write, immutable revisions, draft/preview/publish, published-only projection, arbitrary-input prohibition | §3, P1–P12, each with its RFC-010 source clause |
| V2A historical; Website Redesign V1 composition superseded | §4 (closing paragraphs) |
| V10 is the static fail-safe baseline | §2, §5 (R1–R4), §8 F1 |
| Eight unique projects, ClinicFlow once, factual copy | §6 C1–C2 |
| Contact `paulo.maisog@maisoglabs.com` | §6 C3 |
| `#journal` canonical, `#research` alias, one surface, new links use `#journal` | §8 F3 |
| D1 accessible compact/mobile nav; D2 narrow Systems-label fix | §9 Divergence Register |
| Runtime clamps: opacity 80..90, border 10..25, stale/direct values covered | §7.2 |
| Removed fields ignored | §7.1 |
| AS-117 runtime-enforced range tests | §13 items 4–5 (value tables 55/79/80/90/91/"x"/missing and 9/10/25/26/45/"x"/missing) |
| API-DIAG separate and unauthorized | §10 |
| No implementation authority | status banner, §14 |

## Findings

- **Seeded revision (VERIFIED by inspection):** `migrations/0005_web_inc_007_theme.sql` seeds `panel_opacity_pct 74`, `border_intensity_pct 25` (line 108), with column CHECKs 55..90 and 10..45 (lines 62–63). Under the §7.2 clamp this presents as 80/25, not V10-exact 90/16. RFC-021 §7.4 discloses this; the remedy is a separate owner-authorized 90/16 theme publish through the existing lifecycle, with no migration.
- **Pre-existing index gap (observation, not fixed):** `devos/changes/rfcs/README.md` has no row for `ML-DEVOS-RFC-020`. Out of this directive's scope.
- **Drafting correction:** the §7.2 normalization wording was tightened so that "invalid" means missing, non-numeric or non-finite; non-integer finite values are rounded then clamped.

## SU findings

| Class | Findings |
|---|---|
| VERIFIED | the RFC-010 anchor quotes; the migration-seeded 74/25 values and CHECK ranges; the directive archive is byte-identical |
| STRONGLY SUPPORTED | V10-A/V10-B need no D1 migration or API-shape change (clamping is runtime-side) |
| PLAUSIBLE | the open production API 500 is an unmigrated/empty production D1 (AS-116; unchanged, not investigated) |
| UNRESOLVED | font sourcing/licence (plan Q5), media budget (Q6), Journal taxonomy (Q7) |

## Tests and evidence

- `git diff --check`: clean (recorded at publication).
- Diff scope: only the files listed above.
- Context Bootstrap `--publish --check-only` then `--publish`, with `--session-protocol 2`, recorded at publication.
- No application tests were run: no application file changed.

## Unresolved findings and limitations

- The RFC is a draft; nothing in it is accepted until Architect review and a separate Paulo decision (§14).
- The production incident remains open and temporarily accepted (AS-116).
- Every `OPERATIVE_OBLIGATIONS.md` row is carried forward. S6 stays parked at ML-DEVOS-AS-103; O1 and O2 stay open.

## Evidence locations

- `devos/changes/rfcs/ML-DEVOS-RFC-021.md` and `devos/changes/rfcs/README.md` at the commit publishing this handoff.
- `coordination/archive/directives/DIR-WEB-V10-RFC021-0001.md` (byte-identical to `4c436a8:coordination/CURRENT_DIRECTIVE.md`).
- `migrations/0005_web_inc_007_theme.sql` lines 62–63 and 108 (seeded values and CHECK ranges).

## Governing references

- **Authority:** D-088.
- **Directive:** DIR-WEB-V10-RFC021-0001 (archived).
- **Review:** ML-DEVOS-AS-117.
- **Related:** ML-DEVOS-RFC-010, D-087 plan, ML-DEVOS-AS-107/AS-112 (V2A), D-076/AS-106 (Website Redesign V1).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews RFC-021 under the next unused immutable Architect Sync ID after ML-DEVOS-AS-117. Acceptance requires that review plus a separate Paulo decision. No V10-A or V10-B implementation begins automatically.
