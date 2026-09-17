# Sentinel Repository / Overlay Topology Specification

Companion to `../architecture/ML-DEVOS-ARCH-001.md` §2, §9. Normative statement. **This document supersedes the prior cycle's version**, which specified a separate `maisoglabs-devos` repository — corrected below per `D-011`/`AS0-001A`.

## Current topology (as of this commit)

```
Dillaab-source/maisog-labs                 (Sentinel monorepo — CANONICAL, per D-011/AS0-001A)
  devos/                                    (Sentinel core — THIS commit)
    architecture/ML-DEVOS-ARCH-001.md
    plans/ML-DEVOS-SIP-001.md
    governance/
      ROLE_RESPONSIBILITY_MATRIX.md
      TRUST_BOUNDARIES.md
      BOOTSTRAP_SOURCE_OF_TRUTH.md
      EVIDENCE_PROVENANCE_MODEL.md
      REPOSITORY_OVERLAY_TOPOLOGY.md        (this file)
    handoffs/ML-DEVOS-S0-HANDOFF.md

  app/, components/, data/, lib/, public/, tests/,
  package.json, next.config.mjs, wrangler.jsonc    (existing website — UNTOUCHED this cycle,
                                                      preserved per D-011 repurpose invariants)

  brain/, coordination/, CLAUDE.md, AGENTS.md,
  README.md, docs/                                  (existing website-pilot governance — UNCHANGED
                                                      this cycle except coordination/IMPLEMENTER_HANDOFF.md
                                                      and coordination/STATE.md themselves; remain
                                                      bootstrap/legacy governance surfaces per D-011)
```

## Future topology (NOT created in S0 — named for the record only)

```
Dillaab-source/maisog-labs
  devos/                                    (unchanged from above, grows in later phases)

  projects/
    maisoglabs-website/
      .devos/                               (future website project overlay — NOT CREATED.
                                              Website migration into this structure is explicitly
                                              NOT part of S0, per D-011 and coordination/STATE.md.)

  <future project>/
    .devos/                                 (same pattern, if/when other projects come under Sentinel —
                                              e.g. "PUSAKAL", "ClinicFlow", named in D-010 K-2, otherwise
                                              unknown to this session)
```

**Do not create this future structure to "match the target diagram."** No `projects/` directory, no `.devos/` overlay, and no application-code move was created or authorized this cycle. This section exists so the eventual overlay shape is recorded, not to be pre-built speculatively.

## Design rules

1. **`devos/` is the only new directory this cycle adds.** It contains documentation only — no runtime/control-plane code.
2. **The existing website is not "migrated" by this commit.** `app/`, `components/`, `data/`, `lib/`, `public/`, `tests/`, and the build/deploy configuration files are byte-for-byte unchanged (verified via `git diff --stat`, recorded in `../handoffs/ML-DEVOS-S0-HANDOFF.md`).
3. **`brain/` and `coordination/` are not retired by this commit.** They remain the live governance mechanism for the website pilot and the live bootstrap turn-lock for this Sentinel cycle, per `D-011`.
4. **The future `.devos/` overlay is the only sanctioned coupling point** between Sentinel core (`devos/`) and a product's own code/governance, once it exists (`ML-DEVOS-SIP-001` S12). It must not duplicate a product's own requirement/evidence records wholesale, nor compete with that product's own governance mechanism as a second source of truth.

## SENTINEL-MIGRATION-DEBT-001 (recorded, not fixed in S0)

The website's actual content-flow path, as implemented, is:

```
data/site.js
  ↓
lib/content/local.mjs
  ↓
lib/content/public.mjs   (validates through lib/content/schema.mjs)
  ↓
app/page.js
```

This session's own earlier governance documentation (`brain/PROJECT_GOVERNANCE.md`, `brain/ARCHITECT_HANDOFF.md`-adjacent references from the website pilot) has at times described this ordering inconsistently — in particular, earlier text describes validation as happening "through" `local.mjs` in a way that can read as `local.mjs` sitting between `public.mjs` and `schema.mjs`, when the actual call chain (confirmed by direct source inspection: `lib/content/local.mjs` imports `projectPublishedContent` from `public.mjs`, and `public.mjs` itself imports and calls `validateContent` from `schema.mjs` before filtering) is `local.mjs → public.mjs → schema.mjs (validation) → back into public.mjs's projection → local.mjs's return value`. **[REPO-VERIFIED: AS0-010 flags this as a known inconsistency; the exact ordering correction above is CYCLE-SUPPLIED, from direct inspection of `lib/content/local.mjs` and `lib/content/public.mjs` in this repository]**

This is recorded as **migration debt only** — `SENTINEL-MIGRATION-DEBT-001` — to be resolved when the website's governance documentation is next touched (or when it migrates under a `.devos/` overlay, whichever comes first). **No website runtime file was read for correctness beyond confirming this import chain, and none was edited, in this cycle.**
