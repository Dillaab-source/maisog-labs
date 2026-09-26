# MaisogLabs Design System — published artifact (D-093)

`Maisog Labs Design System.zip` is the file Paulo supplied, stored unchanged for provenance.

| Item | SHA-256 |
|---|---|
| `Maisog Labs Design System.zip` | `3ff9fbbaaf40f61fc9b82babafac4e33e9cdc5b723ed78157ef1b2068da6ead2` |
| its only entry, `publish/index.html` | `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` |

`publish/index.html` is served byte-for-byte as the public homepage from `public/index.html` (never edited). It is a self-unpacking Claude Design bundle: on `DOMContentLoaded` it decodes an embedded manifest into blob/data URLs and swaps in its page template. Embedded resources (34):

- React 18 and ReactDOM 18 **development** builds, Babel standalone (the page's JSX is transformed in the browser);
- the MaisogLabs Design System component bundle (`MaisogLabsDesignSystem_a728bd`, 20 components: Button, NavLink, Eyebrow, MarkVideo, Tagline, Wordmark, DisplayHeading, IconFigure, LinkList, NoteCard, StatusDot, Tag, FilterTabs, IndexList, Pager, SectionHeader, BlueprintFigure, FlowDiagram, Node, Panel) and design tokens (`--ml-*` colours, type, spacing, radii, glows, motion);
- the website UI kit: Entry, Overlay, Systems / Projects / Research / Contact panels, and `window.MLData` (five projects, three placeholder notes, contact `maisog36@gmail.com`), plus `window.MLMotion` (Full / Calm / Still, `?motion=` override, reduced motion forces Still);
- 27 WOFF2 font subsets (Montserrat 300–600, Inter 400/500, IBM Plex Mono 400/500) and an SVG favicon.

Media are **not** in the ZIP. The page requests them at `../../assets/…`, which resolves to `/assets/…` at the site root; they are served by byte-identical copies of the approved V10 assets:

| Requested path | Served from (copy of) |
|---|---|
| `/assets/plates/plate-hero-v4.png` | `public/v10/assets/plate-hero-v4.png` |
| `/assets/plates/plate-aqueduct-v4.png` | `public/v10/assets/plate-aqueduct-v4.png` |
| `/assets/video/logo-mark.mp4` | `public/v10/assets/logo-mark.mp4` |
| `/assets/video/logo-mark-poster.png` | `public/v10/assets/logo-mark-poster.png` |
| `/assets/icons/{01-ai,02-automation,03-security,04-research,05-systems,08-strategy}.svg` | `public/v10/assets/icons/*.svg` |
