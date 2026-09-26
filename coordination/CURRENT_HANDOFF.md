# Current Handoff — MaisogLabs V10 Visual Parity + Admin Architecture Planning (D-087)

```yaml
schema_version: 1
handoff_id: H-WEB-V10-PLAN-0001
cycle_id: MAISOGLABS_WEB_V10_PLANNING
input_base_commit: 7ec56d117e215c300cf3f55ce328e7075a23286e
review_target_commit: 7ec56d117e215c300cf3f55ce328e7075a23286e
applicable_review_id: ML-DEVOS-AS-116
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve, and every result here is `ACTOR_REPORTED`.

## Objective

Deliver the D-087 planning artifact under `DIR-WEB-V10-PLAN-0001`: `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`, with all 20 required sections. This is planning and documentation only.

**Input/output SHAs:**
- base `7ec56d117e215c300cf3f55ce328e7075a23286e` (the D-087 directive issue; its parent is owner commit `98a26e2d05f1056806994ea80716ed84960e3e39`);
- result: the commit publishing this handoff;
- main `aebc881e8890c00090d714602591138a045bd3b0` (unchanged).

**V10 identity:**
- HTML `Maisog Labs Home v10.dc.html`: SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`, **verified**.
- ZIP `79f0a455967b808780cde89c2dcde821c7d7d99e7700ee60dc7aba4cb9c61c2a`: **owner-reported**. Only its 202 extracted entries are in the repository, so it cannot be re-hashed.
- The asset hashes are listed in plan §3.1.

## Changed files

- `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md` (new; 429 lines; SHA-256 `3bee86e3f30b100ad87706fffe79d3587f566c55402e5ef85cf888f1f607c1cc`).
- `coordination/CURRENT_HANDOFF.md`, `coordination/STATE.md`.
- `coordination/archive/directives/DIR-WEB-V10-PLAN-0001.{md,provenance.json}` and the index row.

Planning and docs only. Nothing changed in:
- `app/`, `components/`, `lib/`, `data/`, `public/`;
- `worker/`, `migrations/`, `wrangler.jsonc`, `package*.json`.

There was no D1/R2/Access/DNS/Cloudflare action, no media integration, and no merge, deploy, promote or rollback.

## Files inspected

- **V10:** the full `Maisog Labs Home v10.dc.html` (markup and logic), the package `CLAUDE.md`, the Design Panel skill v2 structure and the referenced assets.
- **Current site:** `app/DesignRuntime.js`, `app/admin/DesignControls.js`, `app/globals.css` (tokens/fonts), `components/site/routes.mjs`, `components/site/ResearchSurface.js`, `data/site.js`.
- **Worker:** `worker/public/design.mjs`, `worker/public/journal.mjs` (media projection).
- **Accepted records:** `ML-DEVOS-RFC-010` (fail-safe and composition clauses), the V2A plan (AS-107), and the Gate D handoff (AS-116 inputs).

## Tests and evidence

- **Local read-only renders** (Playwright + Chromium; scratch only, not committed): V10 and current, at desktop 1440×900 and mobile 390×844, covering Entry and every panel. That is 20 screenshots.
- **How V10 was rendered:** its `dc` runtime loads React 18.3.1, ReactDOM 18.3.1 and Babel 7.29.0 from `unpkg.com`, which is blocked here. The exact same versions were fetched from the npm registry and served locally, so that rendering needed no code change to V10.
- **Fonts:** Google Fonts were blocked, so fallback fonts appeared. This is a typography limitation of the render, recorded in plan §13, which requires self-hosted fonts for the acceptance renders.
- **Findings from the renders:**
  - no page-level horizontal overflow on either site;
  - V10 at 390px clips nav items ("RESEARCH"/"CONTACT") and overlaps Systems diagram captions (plan §3.3).
- `git diff --check` clean. A Context Bootstrap check-only run is recorded at publication.

## SU findings (plan §17)

| Class | Findings |
|---|---|
| VERIFIED | the V10 HTML hash; the asset hashes; the RFC-010 conflict; the DesignRuntime failure path keeps the static baseline |
| STRONGLY SUPPORTED | V10-A/B need no D1 migration or API-shape change |
| PLAUSIBLE | the API 500 comes from a bound but unmigrated/empty production D1 |
| Owner-reported | the ZIP hash |
| Contradicted | V10 mobile correctness |

- **Alternatives rejected:** amending RFC-010 in place; versioned D1 settings; embedding the `dc` runtime; V10 under V2A.
- **Minority finding preserved:** strict pixel parity would reproduce the V10 mobile defects.

## SENTINEL boundary findings

- **Commit `98a26e2`:** a direct owner push outside the governed publisher. It is owner-authored, reference-only and runtime-inert, and the Context Bootstrap checks passed on it. The Architect should decide whether future owner reference drops should also go through the publisher.
- **Planning mechanism:** `ML-DEVOS-RFC-021` partially supersedes RFC-010's baseline, composition and parity clauses. RFC-010's security/allowlist/lifecycle rules are kept, and V2A is left intact.
- **API diagnosis:** planned only (plan §9). It requires a separate read-only authorization and a Cloudflare-authenticated session; this environment cannot reach Cloudflare or the live site.

## Design Panel result

`APPROVE PLAN — IMPLEMENTATION NOT AUTHORIZED`.

- **Accessibility** has requirements: D1 mobile nav, D2 caption collision, a contrast measurement and an axe gate.
- **Independent Critic:** reject any increment that does not return the §13 pixel-diff and divergence register.
- **Layperson:** the project facts and taglines must be settled (Q1).

## Unresolved findings and limitations

**Open questions (plan §16):**
- Q1: the project set and copy;
- Q2: the contact email;
- Q3: `#journal` vs `#research`;
- Q4: approve divergences D1/D2;
- Q5: font sourcing and licence;
- Q6: media optimization budget;
- Q7: Journal filter taxonomy.

**Limitations:**
- The renders used fallback fonts.
- Placeholder notes were used for V10 Research.
- Screenshots are scratch-only.
- The production incident remains open (AS-116).
- Every `OPERATIVE_OBLIGATIONS.md` row is carried forward.

## Evidence locations

- `docs/product/MAISOGLABS_V10_VISUAL_PARITY_ADMIN_PLAN.md`.
- `design-references/claude-v10/**` at `98a26e2`.

## Governing references

- **Authority:** D-087.
- **Directive:** DIR-WEB-V10-PLAN-0001 (archived).
- **Review:** ML-DEVOS-AS-116.
- **Related records:** ML-DEVOS-RFC-010, ML-DEVOS-AS-107/AS-112 (V2A), D-076/AS-106 (Website Redesign V1).
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`.

## Next action

The Architect reviews the plan under the next unused immutable Architect Sync ID after ML-DEVOS-AS-116.

The recommended next Paulo decision (plan §20) is to authorize, separately:
1. RFC-021 drafting;
2. read-only API-DIAG from a Cloudflare-authenticated session;
3. answers to Q1–Q3 and the D1/D2 decision.

No implementation begins automatically.
