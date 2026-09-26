# V10-A divergence register

Reference: `design-references/claude-v10/source/Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`.

| ID | Implemented difference | Reason | Authority |
|---|---|---|---|
| D1 | Desktop navigation becomes an accessible compact menu below 700px. | The V10 prototype clips navigation at narrow widths. | D-088 / RFC-021 |
| D2 | Systems diagram labels reduce and remain backed by a separate text column at narrow widths. | The V10 prototype overlaps labels at 390px. | D-088 / RFC-021 |
| D3 | Research renders real published Journal data and an explicit loading/empty/error state; it does not ship prototype notes or unsupported filters. | Prototype entries are not content authority and the current Journal schema has no category/tag filter field. | RFC-021 content boundary |
| D4 | Projects use the eight owner-approved unique profiles and the approved contact email, not prototype facts. | Content authority belongs to the governed repository content boundary. | D-088 / D-089 |
| D5 | Unknown public details for Maisog Kilat and Maisog Guild are disclosed as awaiting verified source records. | Avoids turning design-placeholder copy into unsupported factual claims. | D-088 factual-copy rule |

## Residual differences observed in remediation cycle 1 (not approved)

Source: the per-pixel comparison in `docs/product/evidence/v10/rem1/` (0/20 views within the 1.0% threshold). These differences are recorded, not approved. They are not covered by D1–D5, and closing them needs component changes outside D-091's corrective scope.

| ID | View | Observed difference from the V10 reference | Status |
|---|---|---|---|
| R1 | Entry | Logo mark larger and lower; wordmark and "Ideas in orbit" lockup lower; descriptor sits bottom-left rather than beside the horizon; the "Humanity orbits higher" mantra is hidden at 390px. | OPEN — needs Paulo approval or implementation |
| R2 | Systems | Different heading ("How the lab's disciplines connect" vs "Six disciplines, one working system."); list without V10's numbering and indicators; different default selection (AI vs Research); diagram layout, node set and legend differ; detail column lacks V10's "Connects to" and "Used in projects" tables. | OPEN |
| R3 | Projects | Title, lead and 8-item list layout differ from V10's numbered list; the detail lacks V10's status tag, tagline, discipline chips and four-step "How it works" flow with a marked human step; previous/next controls differ. Project facts differ by design (D4/D5). | OPEN (content part covered by D4/D5) |
| R4 | Research | V10's filter row (All/Research/Build/Thoughts), "More notes" link and image cards are absent; the candidate shows a list with an inline reader. Thumbnails are removed deliberately (AS119-F003). Filters are covered by D3. | OPEN (thumbnails and filters covered by AS119-F003/D3) |
| R5 | Contact | V10's two-column layout (heading left, "Correspondence" block right, connector line) is replaced by a single column with a blue heading, a tagline and a copy button. The email differs by design (D4). | OPEN |
| R6 | All panels | The panel header shows a mono trail and an "Entry / Esc" close control in place of V10's progress rule; the panel title sits in a different row. | OPEN |

## D-092 controlled clean replacement

D-092 replaced the public homepage with a direct port of the V10 reference (`components/v10/V10Home.js`). Residual differences R1–R6 above describe the superseded V10-A implementation and no longer apply. Evidence: `docs/product/evidence/v10/clean/` (9/20 views within 1.0%; every remaining difference is listed here). Status column: **APPROVED** = covered by an owner decision; **PROPOSED** = introduced by this replacement and awaiting Architect review and owner approval.

| ID | Difference from V10 | Reason | Status |
|---|---|---|---|
| C1 | Eight projects (V10 has five): Projects list, `08` counter, and an 8-slot outer project ring in the Systems diagram at the same radius, 45° apart (V10: 5 slots, 72° apart); spokes follow the slots. | D-088 project set | APPROVED (D-088); ring geometry PROPOSED |
| C2 | Project names use the approved spelling (e.g. `Sentinel/DevOS`, not `Sentinel / DevOS`). | D-088 facts | APPROVED |
| C3 | Automation Hub, Cybersecurity Lab and Experimental Projects show their published summary as the tagline, no description paragraph, disciplines only from exact published terms (Experimental Projects: none), and no "How it works" flow figure. | No sourced V10 copy or flow for them; nothing invented | PROPOSED |
| C4 | Contact shows `paulo.maisog@maisoglabs.com` (V10: `maisog36@gmail.com`); it wraps at 390px. | D-088 | APPROVED |
| C5 | Research lists real published entries from `/api/journal` with a loading / empty / error line; cards have no image frame, no tag line, and link to `/journal?slug=…`; "More notes" links to `/journal`. | D-088 real Journal; AS119-F003 (no fixed imagery); no public media route | APPROVED (D-088); layout of the missing image frame PROPOSED |
| C6 | No category filter row (All / Research / Build / Thoughts). | Journal data has no category field | PROPOSED |
| D1 | Below 700px the link row becomes a 44px Menu button with a four-item menu (44px targets, Escape closes). The nav row keeps V10's 84px height. | V10 clips navigation at 390px | APPROVED (D-088) |
| D2 | Below 700px the Systems ring captions are hidden (names stay; the selected discipline's caption is in the detail column). | V10 captions overlap at 390px | APPROVED (D-088) |
| N1 | Legacy hash aliases: `#research` → `#journal`, `#process` → `#systems`, `#about` → `#contact` (hash rewritten to the canonical form). | D-088 routing | APPROVED |
| N2 | The static export pre-renders V10's markup, so the entry elements are hidden until the component mounts (with a 2.5 s CSS fail-safe reveal) to avoid a flash before V10's entry animation. Not applied with reduced motion or without scripting. | Static export vs V10's client-only render | PROPOSED |
| N3 | The V10 design-tool props are fixed at their defaults: `motion` Full (reduced-motion still forces Still), `heroArch` off, no `plateVideo`. | No Tweaks panel on the public site | PROPOSED |
| N4 | `/journal` keeps the pre-V10 page design. | V10 defines no Journal reading page | PROPOSED |
| N5 | The public homepage no longer reads `/api/design`; admin design controls and `?design-preview=1` have no effect on it. | V10 has no design-variation layer | PROPOSED (D-092 architecture consequence) |
