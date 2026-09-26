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
// RFC-021 / AS118-F001: 68 is the exact V10 point. Finite values are
// rounded and clamped to 40..85; missing, non-numeric and non-finite values
// fall back to 68. The returned combined visual weight is monotonic across
// the entire accepted range.
export const OVERLAY_INTENSITY_MIN = 40;
export const OVERLAY_INTENSITY_MAX = 85;
export const OVERLAY_INTENSITY_BASELINE = 68;

export function computeOverlayLayers(value) {
  const normalized = Number.isFinite(value)
    ? Math.min(OVERLAY_INTENSITY_MAX, Math.max(OVERLAY_INTENSITY_MIN, Math.round(value)))
    : OVERLAY_INTENSITY_BASELINE;
  const opacity = normalized <= OVERLAY_INTENSITY_BASELINE ? normalized / OVERLAY_INTENSITY_BASELINE : 1;
  const boost =
    normalized <= OVERLAY_INTENSITY_BASELINE
      ? 0
      : (normalized - OVERLAY_INTENSITY_BASELINE) / (OVERLAY_INTENSITY_MAX - OVERLAY_INTENSITY_BASELINE);
  return { opacity, boost };
}
