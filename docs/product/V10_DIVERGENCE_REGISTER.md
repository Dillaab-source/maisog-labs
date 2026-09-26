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
