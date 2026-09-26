export const V10_DEFAULT_THEME = Object.freeze({
  overlayIntensity: 68,
  panelOpacityPct: 90,
  borderIntensityPct: 16,
  radiusScalePct: 100,
  animationPreset: "calm",
  reducedMotionMode: "respect-system",
  projectRailMode: "snap",
});

function boundedInteger(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function fixedEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

// RFC-021 allows only these bounded V10 variations. Deliberately omitted
// payload fields cannot affect the public presentation.
export function normalizeV10Theme(theme) {
  const value = theme && typeof theme === "object" ? theme : {};
  return {
    overlayIntensity: boundedInteger(value.overlayIntensity, 40, 85, V10_DEFAULT_THEME.overlayIntensity),
    panelOpacityPct: boundedInteger(value.panelOpacityPct, 80, 90, V10_DEFAULT_THEME.panelOpacityPct),
    borderIntensityPct: boundedInteger(value.borderIntensityPct, 10, 25, V10_DEFAULT_THEME.borderIntensityPct),
    radiusScalePct: boundedInteger(value.radiusScalePct, 80, 120, V10_DEFAULT_THEME.radiusScalePct),
    animationPreset: fixedEnum(value.animationPreset, ["calm", "minimal", "off"], V10_DEFAULT_THEME.animationPreset),
    reducedMotionMode: fixedEnum(value.reducedMotionMode, ["respect-system", "always-reduced"], V10_DEFAULT_THEME.reducedMotionMode),
    projectRailMode: fixedEnum(value.projectRailMode, ["snap", "free-scroll"], V10_DEFAULT_THEME.projectRailMode),
  };
}
