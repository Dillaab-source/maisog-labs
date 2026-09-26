# V10 runtime asset manifest

This directory contains the fixed, source-controlled V10 runtime allowlist. Runtime code may refer only to these repository paths; no content or design payload supplies an asset URL.

## Approved reference assets

These files are byte-for-byte copies from `design-references/claude-v10/source/assets/**`.

| Runtime path | Bytes | SHA-256 |
|---|---:|---|
| `assets/plate-hero-v4.png` | 2407344 | `afb05bc4ccb5cfd00577e20c236670cb4769faca8e046816822ba341ba5c4ec4` |
| `assets/logo-mark.mp4` | 3736250 | `ac6124585dc489d88f38ac57a2b8729863486c78b51e59a64ec8ab0734225ed4` |
| `assets/logo-mark-poster.png` | 373851 | `931e2fc037832c27b084bcca0df5a683c9c28376ac78b77cbbe24db8ecd9c851` |
| `assets/plate-aqueduct-v4.png` | 2593327 | `285ac4b3b2f4be7033bfc3e3b32f7d6b0397aca9f197702c780f071f2fe21928` |
| `assets/favicon.svg` | 8384 | `b34acfe1395e080c2d551982d6e5c550171b6b877ec535de4f4dc60ae3676d04` |
| `assets/icons/01-ai.svg` | 11492 | `380672cca0e810d1f213dd1150f587c210e5937f22260c9563c8fccfd6e9537d` |
| `assets/icons/02-automation.svg` | 13232 | `7ca3b747160b5734e15a8a53a071cc1347efb96f90e4c7b455bdf903e147df6c` |
| `assets/icons/03-security.svg` | 11080 | `c1e5481fdbb6086ec71d579e30da5a8bd5d2b8f749bfcb11f6b01bb47a95bb95` |
| `assets/icons/04-research.svg` | 11175 | `ea27af84196270fd74df9880c95879a44f49533c73959f89a7361bc7d560316f` |
| `assets/icons/05-systems.svg` | 12472 | `be8373dc0c2d9618fbeeb0b91555416ef249c38ae036ebbdf81eed8d30f3e05d` |
| `assets/icons/08-strategy.svg` | 11668 | `2b55c4fd582a6064a48fc5e226874175047f0483f1016f9a02d7908d6f9b1b8a` |

No derivative is present in V10-A; the copied source bytes are served directly.

## Self-hosted fonts

The font files and license texts were retrieved on 2026-09-26 from the official `google/fonts` repository at `main`.

| Runtime path | Source | SHA-256 |
|---|---|---|
| `fonts/Montserrat-Variable.ttf` | `ofl/montserrat/Montserrat[wght].ttf` | `0f7b311b2f3279e4eef9b2f968bcdbab6e28f4daeb1f049f4f278a902bcd82f7` |
| `fonts/Inter-Variable.ttf` | `ofl/inter/Inter[opsz,wght].ttf` | `29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031` |
| `fonts/IBMPlexMono-Regular.ttf` | `ofl/ibmplexmono/IBMPlexMono-Regular.ttf` | `6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46` |
| `fonts/IBMPlexMono-Medium.ttf` | `ofl/ibmplexmono/IBMPlexMono-Medium.ttf` | `a9b4c49bb299e05b5f6c481e7fb5e78943d2793249a0c8874ab574a2d1ea6755` |

The accompanying `OFL-*.txt` files are retained beside the fonts. No runtime request is made to Google Fonts or another CDN.
