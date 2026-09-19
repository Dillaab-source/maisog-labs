// ML-DEVOS-AS-032 Remediation Cycle 1 (AS32-B002) — direct unit tests for
// the overlay_intensity -> {opacity, boost} mapping, independent of any
// browser/Playwright evidence. This is a plain, DOM-free pure function
// (lib/design/overlay.mjs), imported unmodified by both this test and
// app/DesignRuntime.js.
import test from "node:test";
import assert from "node:assert/strict";
import { computeOverlayLayers, OVERLAY_INTENSITY_MIN, OVERLAY_INTENSITY_MAX, OVERLAY_INTENSITY_BASELINE } from "../lib/design/overlay.mjs";

test("the baseline (68) maps to exactly opacity 1 / boost 0 — byte-identical to the pre-remediation baseline", () => {
  assert.deepEqual(computeOverlayLayers(OVERLAY_INTENSITY_BASELINE), { opacity: 1, boost: 0 });
});

test("the minimum (40) maps to a visibly lighter opacity with no boost", () => {
  const result = computeOverlayLayers(OVERLAY_INTENSITY_MIN);
  assert.equal(result.opacity, 40 / 68);
  assert.equal(result.boost, 0);
  assert.ok(result.opacity < 1);
});

test("the maximum (85) maps to opacity pinned at 1 and boost pinned at 1 — the fully darkened end of the range", () => {
  assert.deepEqual(computeOverlayLayers(OVERLAY_INTENSITY_MAX), { opacity: 1, boost: 1 });
});

test("40, 68, and 85 each produce a distinct combined visual weight (AS32-B002 'must produce meaningfully distinct outputs')", () => {
  // A single scalar "visual weight" proxy: opacity contributes up to 1 of
  // darkening from the base layer, boost contributes up to 1 more from the
  // independent second layer — their sum is monotonic across the whole
  // range precisely because boost is never clamped by opacity's own cap.
  const weight = value => {
    const { opacity, boost } = computeOverlayLayers(value);
    return opacity + boost;
  };
  const low = weight(40);
  const mid = weight(68);
  const high = weight(85);
  assert.ok(low < mid, `expected 40's weight (${low}) < 68's weight (${mid})`);
  assert.ok(mid < high, `expected 68's weight (${mid}) < 85's weight (${high})`);
});

test("values above the baseline are not saturated/clamped into a no-op — each step increases boost", () => {
  const boosts = [69, 70, 75, 80, 85].map(value => computeOverlayLayers(value).boost);
  for (let i = 1; i < boosts.length; i += 1) {
    assert.ok(boosts[i] > boosts[i - 1], `expected boost to strictly increase: ${boosts[i - 1]} -> ${boosts[i]}`);
  }
  // Opacity, in contrast, is intentionally pinned (not re-derived) for the
  // entire upper half — this is the property that used to silently
  // saturate before the fix; it must stay exactly 1 throughout, with boost
  // carrying all further differentiation instead.
  for (const value of [69, 70, 75, 80, 85]) {
    assert.equal(computeOverlayLayers(value).opacity, 1);
  }
});

test("values at or below the baseline never engage the boost layer", () => {
  for (const value of [40, 50, 60, 67, 68]) {
    assert.equal(computeOverlayLayers(value).boost, 0);
  }
});

test("out-of-range and non-finite values return null (caller removes both custom properties)", () => {
  assert.equal(computeOverlayLayers(OVERLAY_INTENSITY_MIN - 1), null);
  assert.equal(computeOverlayLayers(OVERLAY_INTENSITY_MAX + 1), null);
  assert.equal(computeOverlayLayers(Number.NaN), null);
  assert.equal(computeOverlayLayers(undefined), null);
  assert.equal(computeOverlayLayers("68"), null);
});
