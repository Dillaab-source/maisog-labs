# V10-A local visual evidence

Evidence class: `ACTOR_REPORTED`. Captured locally on 2026-09-26 from the static `out/` export served at `http://localhost:3000`. This is repository-local implementation evidence, not production verification.

## Captures

| File | View | SHA-256 |
|---|---|---|
| `entry-desktop-1440x900.png` | Entry, 1440 × 900 | `499b98d9e11c1cf22cbd7f65b6c15da0e5f8bf499014341a93305568ee9be984` |
| `projects-desktop-1440x900.png` | Projects, 1440 × 900 | `36a44e65bdf5490227e765dc1b07e4e82e50175ac0e01c688368535969906a56` |
| `systems-narrow-500x900.png` | Systems, compact navigation breakpoint, 500 × 900 | `b6ee4c475fe853d6fe16631849b0976eaf351ca0b190544fea7612861422c3e3` |

The desktop Entry and Projects captures verify the cinematic plate, wordmark, route treatment, panel geometry, eight-project rail, and repository-backed project presentation. The narrow Systems capture verifies D1/D2: compact navigation and a contained, readable diagram with a horizontally scrollable selector whose native scrollbar is visually suppressed.

Interactive inspection also covered Systems, Research/Journal, Contact, the compact menu, canonical hashes, and the contact mail link. The static local server correctly showed the Journal error state because `/api/journal` is a separate Worker/D1 runtime path and no Worker was started for this evidence pass.

## Validation

- `npm run build`: PASS; Next.js static export generated `/`, `/admin`, and `/journal`.
- Focused V10/design/routing suite: PASS, 35/35.
- Content and D1 compatibility suite: PASS, 46/46.
- `git diff --check`: PASS.
- Full `npm test`: attempted; not green on this Windows host. Failures are outside the V10-A surfaces and include the repository's fail-closed S6 Windows isolation checks, child fixtures that intentionally launch with an empty environment and therefore cannot locate `git`, and existing skill-frontmatter/bridge assertions. V10, content, D1 compatibility, public routing, and build checks above pass. No S6, governance-skill, Worker, migration, package, or lockfile file was changed to bypass those failures.

## Deliberate differences

The accepted D1–D5 differences are recorded in `docs/product/V10_DIVERGENCE_REGISTER.md`. No production, Cloudflare, D1, R2, Access, DNS, main-branch, or deployment evidence is claimed.
