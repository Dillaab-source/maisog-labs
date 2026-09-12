# Maisog Labs Change Ledger

This ledger records approved website changes, security impact, deployment results, and rollback references.

## v4.0.0-alpha.2 — Public experience rebuild

- Date: 2026-09-12
- Objective: Continue Phase 1 from the clean baseline without introducing future CMS or security conflicts.
- Public experience: Added the clean human–AI cosmic background, blueprint framing, responsive floating navigation, swipeable project cards, process, about, and contact paths.
- Brand: Applied the selected 4B horizontal Signature Fusion header in the Lunar Tech palette (cosmic navy, lunar ivory, and cobalt). The source remains provisional and isolated in `components/Logo.js` so the final production vector can replace it safely.
- Content: Homepage navigation, project information, process copy, site identity, and foundation links remain centralized in `data/site.js`.
- Accessibility: Added a skip link, semantic landmarks, visible focus states, labelled carousel controls, touch scroll snapping, and reduced-motion behavior.
- Performance: Reused the previously optimized 163 KB WebP artwork and system font stacks; no remote font or image dependency was added.
- Security: No authentication, API, database, upload, form-processing, client-side storage, or secret-handling surface was introduced.
- Database impact: None.
- Rollback reference: Git commit `669e71a` restores the deployed clean foundation; `70ea4df` restores Website V3.1.2.
- Deployment result: Static production build passed; publication pending.

## v4.0.0-foundation — Clean design baseline

- Date: 2026-09-12
- Objective: Remove the unapproved visual system and establish a dependable blank canvas for the final brand direction.
- Public experience: Minimal text-only homepage with no logo graphic, background artwork, custom icons, carousel, animation, or decorative interface layers.
- Brand status: `MAISOG LABS` is a temporary text wordmark. No final logo decision is encoded in the interface.
- Preserved foundations: Static Cloudflare export, centralized site content, dependency lockfile, security upgrades, change ledger, and V3 rollback reference.
- Security: No database, authentication, API, upload, or client-side storage was introduced. The dependency audit remains clean.
- Rollback reference: Git commit `70ea4df` restores Website V3.1.2; local commit `dfdbd8e` preserves the discarded V4 visual experiment.
- Deployment result: Static production build passed and the clean foundation was verified live at `https://maisoglabs.com/`.

## v4.0.0-alpha.1 — V4 visual foundation

- Date: 2026-09-12
- Objective: Establish the approved human–AI cosmic visual system and a stable Phase 1 public experience.
- Public experience: Added the clean cinematic Earth/human/robot background, blueprint frame, floating navigation dock, responsive technical SVG icons, swipeable project panels, and V4 typography and color system.
- Content: Kept reusable project and site copy in `data/site.js`; no database or CMS connection was added.
- Security: No authentication, API, database, upload, or secret-handling surface was introduced. Next.js and React were moved to patched 16.3.5 and 19.2.4 releases after checking the current package advisory database.
- Performance: Converted the 2.5 MB source artwork to a 163 KB WebP production asset while preserving its 1983×793 dimensions.
- Database impact: None.
- Deployment impact: Retains the existing static export to `out` and Cloudflare asset-only deployment.
- Known limitations: Project detail links remain presentation-only anchors. The admin/CMS is intentionally excluded from this phase.
- Rollback reference: Git commit `70ea4df` (Website V3.1.2).
- Deployment result: Static production build passed; publication pending.

## v3.1.2 — Preserved baseline

- Date preserved: 2026-09-12
- Git reference: `70ea4df`
- Deployment model: Next.js static export served by Cloudflare.
- Database impact: None.
- Rollback: Restore commit `70ea4df` and redeploy the generated `out` directory.
