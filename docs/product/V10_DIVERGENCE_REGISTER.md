# V10-A divergence register

Reference: `design-references/claude-v10/source/Maisog Labs Home v10.dc.html`, SHA-256 `6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab`.

| ID | Implemented difference | Reason | Authority |
|---|---|---|---|
| D1 | Desktop navigation becomes an accessible compact menu below 700px. | The V10 prototype clips navigation at narrow widths. | D-088 / RFC-021 |
| D2 | Systems diagram labels reduce and remain backed by a separate text column at narrow widths. | The V10 prototype overlaps labels at 390px. | D-088 / RFC-021 |
| D3 | Research renders real published Journal data and an explicit loading/empty/error state; it does not ship prototype notes or unsupported filters. | Prototype entries are not content authority and the current Journal schema has no category/tag filter field. | RFC-021 content boundary |
| D4 | Projects use the eight owner-approved unique profiles and the approved contact email, not prototype facts. | Content authority belongs to the governed repository content boundary. | D-088 / D-089 |
| D5 | Unknown public details for Maisog Kilat and Maisog Guild are disclosed as awaiting verified source records. | Avoids turning design-placeholder copy into unsupported factual claims. | D-088 factual-copy rule |
