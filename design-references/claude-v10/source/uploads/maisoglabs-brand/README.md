# Maisog Labs — Brand & Icon Package

Everything from the *Icon Framework* sheet, rebuilt for the web around the animated logo.
Open **`index.html`** to see the full guide as a live page.

## Folder map

| Folder | What's inside | Use it for |
|---|---|---|
| `video/` | `logo-mark.mp4` (960×960 loop), `logo-lockup.mp4` (1108×828 logo reveal) | **The master logo.** Hero sections, intros, presentations |
| `png/video/` | `logo-mark-poster.png`, `logo-lockup-poster.png`, `logo-lockup-still-wide.png` | Still frames from the videos: posters, footer logo, social images |
| `svg/logo/` | `mark` (glowing), `mark-flat`, `mark-white`, `mark-navy`, `mark-blue`, `mark-currentcolor`, `seal`, `app-avatar`, `outline` (+ `-white`, `-navy`), `hero` | Vector versions of the mark, traced from the video. Sharp at any size — use for small sizes (nav, icons) and light backgrounds |
| `svg/wordmark/` | `wordmark-*`, `lockup-horizontal-*`, `lockup-stacked-*` (dark-bg / light-bg) | Header logo, footer, documents |
| `svg/icons/` | `01-ai` … `08-strategy`, `_template.svg` | Feature/service icons. Draw new ones on `_template.svg` |
| `svg/ui/` | `clarity`, `consistency`, `recognizability`, `scalability`, `symbolism` (+ `-steel`) | Small line icons for lists/bullets |
| `svg/favicon/` | `favicon.svg`, `favicon-transparent.svg` (auto light/dark), `maskable.svg` | Browser tab / app install icons |
| `svg/backgrounds/` | `hero-space.svg` | Starfield + planet-horizon hero background |
| `png/…` | Same artwork as transparent PNG at 512 / 1024 / 2048 px (icons 256–1024, wordmarks 1200/2400 wide, background 1920×1080 and 4K) | Social media, slide decks, email, anywhere SVG isn't accepted |
| `png/favicon/` | `favicon.ico` (16/32/48), `favicon-16/32/48.png`, `apple-touch-icon.png` (180), `icon-192/512.png`, `icon-maskable-512.png` | Referenced by `head-snippet.html` and `site.webmanifest` |
| `css/brand.css` | Color tokens, fonts, `.ml-logo-video`, `.ml-wordmark`, `.ml-eyebrow`, `.ml-icon`, `.ml-btn`, glow utilities | Include on every page |

## Quick start

1. Copy the `maisoglabs-brand` folder to your site root.
2. Paste `head-snippet.html` into your `<head>`.
3. Use the pieces:

```html
<!-- Animated logo (dark backgrounds). The class blends away the video's own background. -->
<video class="ml-logo-video" src="/maisoglabs-brand/video/logo-mark.mp4"
       poster="/maisoglabs-brand/png/video/logo-mark-poster.png"
       autoplay muted loop playsinline></video>

<!-- Logo in the header (live text, crisp, SEO-friendly) -->
<a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none">
  <img src="/maisoglabs-brand/svg/logo/mark.svg" width="44" height="44" alt="">
  <span class="ml-wordmark">MAISOG<b>LABS</b></span>
</a>

<!-- Section heading -->
<h2 class="ml-eyebrow"><span>07</span>Sample icon set</h2>

<!-- Marked icon (number + name + purpose, per rule 03) -->
<figure class="ml-icon">
  <img src="/maisoglabs-brand/svg/icons/01-ai.svg" alt="">
  <figcaption><span>01</span>AI</figcaption>
  <p>Artificial intelligence and human potential.</p>
</figure>
```

Videos must be `muted` + `playsinline` to autoplay on phones. The `poster` shows until the video loads,
and is what visitors with "reduce motion" turned on will see.

## Colors

| Name | Hex | CSS variable | Meaning |
|---|---|---|---|
| Deep Navy | `#0A1433` | `--ml-deep-navy` | Foundation, depth, stability, trust |
| Orbit Blue | `#2563EB` | `--ml-orbit-blue` | Primary accent, innovation, energy, progress |
| Pure White | `#F8FAFF` | `--ml-pure-white` | Clarity, focus, balance, purity |
| Steel Blue | `#93B4FF` | `--ml-steel-blue` | Sophistication, technology, momentum, possibility |

Fonts: **Montserrat** (display, wide tracking) and **Inter** (body), both free from Google Fonts.

## Rules (short version)
- Clear space: at least 2× the mark's core width on all sides. Always center it in its container.
- Animated logo / glowing mark on dark backgrounds; `mark-navy` / `outline-navy` / `*-light-bg` on light backgrounds.
- Don't recolor, stretch, or remove the orbit/node (the favicon is the only simplified version).

## Editing / regenerating
All vector artwork is generated from one file, so every variation stays consistent:

```
node tools/build.js        # rewrites svg/
node tools/export-png.js   # rewrites png/ and the video stills (uses installed Chrome or Edge)
```

The signature glyph is the `GLYPH` path near the top of `tools/build.js`; colors are in `C`.

> Note: the wordmark SVGs reference Montserrat. On your website they render correctly because the
> page loads the font; opened standalone (or as `<img>`) they fall back to a system font. Use the PNGs or the
> HTML `.ml-wordmark` class when that matters.
