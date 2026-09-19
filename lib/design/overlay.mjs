// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032), remediated per
// ML-DEVOS-AS-032 Remediation Cycle 1 (AS32-B002).
//
// Pure mapping from DESIGN-008's `overlay_intensity` (40..85, baseline 68)
// to the two independent, bounded CSS custom-property values
// `app/globals.css` applies them as (`--design-overlay-opacity` on
// `.cinematic-background::after`, `--design-overlay-boost` on the new
// `.cinematic-background::before` darkening layer). Extracted into its own
// plain module (no DOM/React dependency) so the mapping itself — not just
// its visual effect — has a direct, deterministic unit test
// (tests/design-overlay.test.mjs), independent of any browser/Playwright
// evidence.
//
// The CSS `opacity` property clamps at 1, so a single `value / 68` mapping
// silently saturates for every value above the baseline (AS32-B002's
// reported defect: 70, 75, and 85 all rendered identically to 68). This
// splits the range in two instead:
//   - 40..68 (at or below baseline): `opacity` continues the same
//     `value / 68` mapping as before (~0.588..1); `boost` stays 0.
//   - 68..85 (at or above baseline): `opacity` is pinned to exactly 1 (the
//     base gradient layer fully applied, matching the baseline exactly),
//     and `boost` scales linearly 0..1 across this half, driving a wholly
//     separate CSS property that cannot be clamped away by the first
//     layer's own saturation.
// At exactly the baseline (68): { opacity: 1, boost: 0 } — byte-identical
// to the pre-remediation baseline (68/68 = 1, and no boost layer existed
// before this fix).
export const OVERLAY_INTENSITY_MIN = 40;
export const OVERLAY_INTENSITY_MAX = 85;
export const OVERLAY_INTENSITY_BASELINE = 68;

export function computeOverlayLayers(value) {
  if (!Number.isFinite(value) || value < OVERLAY_INTENSITY_MIN || value > OVERLAY_INTENSITY_MAX) {
    return null;
  }
  const opacity = value <= OVERLAY_INTENSITY_BASELINE ? value / OVERLAY_INTENSITY_BASELINE : 1;
  const boost =
    value <= OVERLAY_INTENSITY_BASELINE
      ? 0
      : (value - OVERLAY_INTENSITY_BASELINE) / (OVERLAY_INTENSITY_MAX - OVERLAY_INTENSITY_BASELINE);
  return { opacity, boost };
}
