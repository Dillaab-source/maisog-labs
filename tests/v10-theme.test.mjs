import assert from "node:assert/strict";
import test from "node:test";

import { normalizeV10Theme, V10_DEFAULT_THEME } from "../lib/design/v10-theme.mjs";

test("V10 theme defaults are exact and invalid input falls back", () => {
  assert.deepEqual(normalizeV10Theme(null), V10_DEFAULT_THEME);
  assert.deepEqual(normalizeV10Theme({
    overlayIntensity: "68",
    panelOpacityPct: Number.NaN,
    borderIntensityPct: null,
    radiusScalePct: Infinity,
    animationPreset: "cinematic",
    reducedMotionMode: "never",
    projectRailMode: "free-form",
  }), V10_DEFAULT_THEME);
});

test("V10 numeric controls round and clamp at every accepted boundary", () => {
  assert.deepEqual(normalizeV10Theme({ panelOpacityPct: 55, borderIntensityPct: 9, radiusScalePct: 79 }), {
    ...V10_DEFAULT_THEME,
    panelOpacityPct: 80,
    borderIntensityPct: 10,
    radiusScalePct: 80,
  });
  assert.deepEqual(normalizeV10Theme({ panelOpacityPct: 91, borderIntensityPct: 45, radiusScalePct: 121 }), {
    ...V10_DEFAULT_THEME,
    panelOpacityPct: 90,
    borderIntensityPct: 25,
    radiusScalePct: 120,
  });
  assert.equal(normalizeV10Theme({ panelOpacityPct: 84.6 }).panelOpacityPct, 85);
});

test("removed presentation fields have no effect on the normalized V10 contract", () => {
  const result = normalizeV10Theme({
    heroBackgroundPreset: "minimal-orbit",
    cardStylePreset: "solid-night",
    panelPreset: "opaque-night",
    layoutDensityPreset: "compact",
    typographyPreset: "system",
    headingScalePreset: "display",
    journalCardMode: "rail",
    accentPreset: "violet",
  });
  assert.deepEqual(result, V10_DEFAULT_THEME);
  for (const key of ["heroBackgroundPreset", "cardStylePreset", "panelPreset", "layoutDensityPreset", "typographyPreset", "headingScalePreset", "journalCardMode", "accentPreset"]) {
    assert.ok(!Object.hasOwn(result, key));
  }
});

test("only the three fixed V10 motion mappings and two fixed rail modes survive", () => {
  assert.equal(normalizeV10Theme({ animationPreset: "calm" }).animationPreset, "calm");
  assert.equal(normalizeV10Theme({ animationPreset: "minimal" }).animationPreset, "minimal");
  assert.equal(normalizeV10Theme({ animationPreset: "off" }).animationPreset, "off");
  assert.equal(normalizeV10Theme({ reducedMotionMode: "always-reduced" }).reducedMotionMode, "always-reduced");
  assert.equal(normalizeV10Theme({ projectRailMode: "free-scroll" }).projectRailMode, "free-scroll");
});
