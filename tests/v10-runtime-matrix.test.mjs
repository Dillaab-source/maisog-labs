// V10-A remediation cycle 1 (D-091 / ML-DEVOS-AS-119, finding AS119-F004).
// Deterministic coverage of the RFC-021 runtime contract that the earlier
// V10 suites sampled only partially:
//   - F1: /api/design 404, 500, malformed and invalid payloads (plus network
//     failure and a never-settling request) leave the static V10 baseline;
//   - §7.2: every listed stale/direct clamp input;
//   - §7.1: every allowed and an unknown value of each ignored field;
//   - overlay monotonicity at each integer from 40 through 85.
//
// app/DesignRuntime.js is a client component that `node --test` cannot
// render without a DOM. Its logic lives entirely in one effect, so this
// suite evaluates the unmodified component source with its imports
// injected, a synchronous `useEffect`, and a minimal fake `<html>` root.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

import { computeOverlayLayers } from "../lib/design/overlay.mjs";
import { normalizeV10Theme, V10_DEFAULT_THEME } from "../lib/design/v10-theme.mjs";
import { DESIGN_APPLIED_EVENT, managedTriggerSlots, motionMode } from "../components/site/routes.mjs";
import {
  ACCENT_PRESET_VALUES,
  CARD_STYLE_PRESET_VALUES,
  HEADING_SCALE_PRESET_VALUES,
  HERO_BACKGROUND_PRESET_VALUES,
  JOURNAL_CARD_MODE_VALUES,
  LAYOUT_DENSITY_PRESET_VALUES,
  PANEL_PRESET_VALUES,
  TYPOGRAPHY_PRESET_VALUES,
} from "../worker/d1/validate.mjs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const runtimeSource = read("app/DesignRuntime.js");
const css = read("app/globals.css");

function loadDesignRuntime() {
  const body = runtimeSource
    .replace(/^"use client";\s*$/m, "")
    .replace(/^import [^\n]*;\s*$/gm, "")
    .replace("export default function DesignRuntime", "function DesignRuntime");
  assert.doesNotMatch(body, /^\s*(import|export)\s/m, "all module syntax removed");
  return new Function(
    "useEffect", "computeOverlayLayers", "normalizeV10Theme", "DESIGN_APPLIED_EVENT", "managedTriggerSlots",
    "fetch", "document", "window", "URLSearchParams", "Event",
    `${body}\nreturn DesignRuntime;`,
  );
}
const makeRuntime = loadDesignRuntime();

function fakeRoot() {
  const attributes = new Map();
  const properties = new Map();
  return {
    attributes,
    properties,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: name => attributes.delete(name),
    getAttribute: name => (attributes.has(name) ? attributes.get(name) : null),
    style: {
      setProperty: (name, value) => properties.set(name, String(value)),
      removeProperty: name => properties.delete(name),
    },
  };
}

const settle = async () => {
  for (let i = 0; i < 10; i += 1) await new Promise(resolve => setImmediate(resolve));
};

// Runs DesignRuntime once against `respond(url)` and returns the observable
// result: the <html> state, the applied-event count, and the fetched URLs.
async function runDesign(respond, { search = "" } = {}) {
  const root = fakeRoot();
  const requested = [];
  let applied = 0;
  const fetchImpl = url => {
    requested.push(url);
    return respond(url);
  };
  const documentImpl = { documentElement: root, querySelectorAll: () => [] };
  const windowImpl = { location: { search }, dispatchEvent: event => { if (event.type === DESIGN_APPLIED_EVENT) applied += 1; } };
  const DesignRuntime = makeRuntime(
    effect => effect(), computeOverlayLayers, normalizeV10Theme, DESIGN_APPLIED_EVENT, managedTriggerSlots,
    fetchImpl, documentImpl, windowImpl, URLSearchParams, class { constructor(type) { this.type = type; } },
  );
  assert.equal(DesignRuntime(), null);
  await settle();
  return {
    attributes: Object.fromEntries(root.attributes),
    properties: Object.fromEntries(root.properties),
    applied,
    requested,
  };
}

const jsonResponse = (body, status = 200) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
const STATIC_BASELINE = { attributes: {}, properties: {}, applied: 0, requested: ["/api/design"] };

// The state a fully-default V10 theme produces. Every value below is the
// static CSS fallback (asserted separately), so it renders identically to
// the untouched baseline.
const DEFAULT_APPLIED = {
  attributes: { "data-animation": "calm", "data-reduced-motion-mode": "respect-system", "data-project-rail": "snap" },
  properties: {
    "--design-overlay-opacity": "1",
    "--design-overlay-boost": "0",
    "--design-panel-alpha": "0.9",
    "--design-border-alpha": "0.16",
    "--design-radius-scale": "1",
  },
  applied: 1,
  requested: ["/api/design"],
};

test("F1: 404, 500 and other non-2xx /api/design responses apply nothing", async () => {
  for (const status of [404, 500, 400, 401, 403, 502, 503]) {
    assert.deepEqual(await runDesign(() => jsonResponse({ theme: { panelOpacityPct: 80 } }, status)), STATIC_BASELINE, `status ${status}`);
  }
});

test("F1: malformed bodies, network failure and a never-settling request apply nothing", async () => {
  const malformed = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError("Unexpected token < in JSON")) });
  assert.deepEqual(await runDesign(malformed), STATIC_BASELINE);
  assert.deepEqual(await runDesign(() => Promise.reject(new TypeError("Failed to fetch"))), STATIC_BASELINE);
  assert.deepEqual(await runDesign(() => new Promise(() => {})), STATIC_BASELINE);
});

test("F1: invalid payload shapes resolve to exactly the default V10 presentation", async () => {
  const invalidPayloads = [
    null, [], "theme", 42, {}, { theme: null }, { theme: "x" }, { theme: [] },
    { theme: { overlayIntensity: "68", panelOpacityPct: null, borderIntensityPct: "16", radiusScalePct: Number.NaN,
      animationPreset: "cinematic", reducedMotionMode: "never", projectRailMode: 1 } },
    { theme: {}, sections: "bad" },
    { theme: {}, sections: { home: "x", process: { visible: "yes" } } },
  ];
  for (const payload of invalidPayloads) {
    assert.deepEqual(await runDesign(() => jsonResponse(payload)), DEFAULT_APPLIED, JSON.stringify(payload));
  }
});

test("F1: the default applied state equals the static CSS fallbacks, so both render the same V10", () => {
  const finalCascade = css.slice(css.lastIndexOf("V10-A final cascade"));
  assert.match(finalCascade, /--line: rgba\(147,180,255,var\(--design-border-alpha,\.16\)\)/);
  assert.match(finalCascade, /--panel: rgba\(3,9,26,var\(--design-panel-alpha,\.9\)\)/);
  assert.match(finalCascade, /opacity:var\(--design-overlay-opacity,1\)/);
  assert.match(finalCascade, /opacity:calc\(var\(--design-overlay-boost,0\)\*\.42\)/);
  assert.match(finalCascade, /calc\(6px\*var\(--design-radius-scale,1\)\)/);
  assert.equal(Number(DEFAULT_APPLIED.properties["--design-border-alpha"]), 0.16);
  assert.equal(Number(DEFAULT_APPLIED.properties["--design-panel-alpha"]), 0.9);
  // The default enum values carry no CSS of their own, and map to the same
  // motion mode as an absent attribute.
  for (const selector of ['[data-animation="calm"]', '[data-reduced-motion-mode="respect-system"]', '[data-project-rail="snap"]']) {
    assert.ok(!css.includes(selector), `${selector} has no CSS`);
  }
  for (const prefersReduced of [false, true]) {
    assert.equal(
      motionMode({ prefersReduced, reducedMotionMode: "respect-system", animation: "calm" }),
      motionMode({ prefersReduced, reducedMotionMode: null, animation: null }),
    );
  }
});

test("§7.2: every listed panelOpacityPct and borderIntensityPct input normalizes as RFC-021 specifies", async () => {
  const MISSING = Symbol("missing");
  const panel = [[55, 80], [79, 80], [80, 80], [90, 90], [91, 90], ["x", 90], [MISSING, 90]];
  const border = [[9, 10], [10, 10], [25, 25], [26, 25], [45, 25], ["x", 16], [MISSING, 16]];
  for (const [field, cases, property] of [["panelOpacityPct", panel, "--design-panel-alpha"], ["borderIntensityPct", border, "--design-border-alpha"]]) {
    for (const [input, effective] of cases) {
      const theme = input === MISSING ? {} : { [field]: input };
      assert.equal(normalizeV10Theme(theme)[field], effective, `${field} ${String(input)}`);
      // Stale stored and direct API-shaped values take the same runtime path.
      const result = await runDesign(() => jsonResponse({ theme }));
      assert.equal(result.properties[property], String(effective / 100), `${field} ${String(input)} at runtime`);
    }
  }
});

test("§7.1: every allowed and unknown value of each ignored field leaves the presentation at default", async () => {
  const ignored = {
    heroBackgroundPreset: HERO_BACKGROUND_PRESET_VALUES,
    accentPreset: ACCENT_PRESET_VALUES,
    cardStylePreset: CARD_STYLE_PRESET_VALUES,
    panelPreset: PANEL_PRESET_VALUES,
    layoutDensityPreset: LAYOUT_DENSITY_PRESET_VALUES,
    typographyPreset: TYPOGRAPHY_PRESET_VALUES,
    headingScalePreset: HEADING_SCALE_PRESET_VALUES,
    journalCardMode: JOURNAL_CARD_MODE_VALUES,
  };
  assert.equal(Object.keys(ignored).length, 8);
  for (const [field, allowed] of Object.entries(ignored)) {
    assert.ok(allowed.length > 0, `${field} has allowed values`);
    for (const value of [...allowed, "unknown-value", "", 7, null]) {
      const theme = { [field]: value };
      assert.deepEqual(normalizeV10Theme(theme), V10_DEFAULT_THEME, `${field}=${String(value)}`);
      assert.deepEqual(await runDesign(() => jsonResponse({ theme })), DEFAULT_APPLIED, `${field}=${String(value)} at runtime`);
    }
  }
});

test("overlay: combined layer weight is strictly monotonic at each integer from 40 through 85", () => {
  const weight = value => {
    const { opacity, boost } = computeOverlayLayers(value);
    return opacity + boost;
  };
  for (let value = 40; value < 85; value += 1) {
    const current = computeOverlayLayers(value);
    const next = computeOverlayLayers(value + 1);
    assert.ok(next.opacity >= current.opacity, `opacity ${value} -> ${value + 1}`);
    assert.ok(next.boost >= current.boost, `boost ${value} -> ${value + 1}`);
    assert.ok(weight(value + 1) > weight(value), `weight ${value} -> ${value + 1}`);
  }
  assert.deepEqual(computeOverlayLayers(68), { opacity: 1, boost: 0 });
});

test("the runtime applies each integer overlay input 40..85 as the mapped layers", async () => {
  for (let value = 40; value <= 85; value += 1) {
    const { opacity, boost } = computeOverlayLayers(value);
    const result = await runDesign(() => jsonResponse({ theme: { overlayIntensity: value } }));
    assert.equal(result.properties["--design-overlay-opacity"], String(opacity), `opacity at ${value}`);
    assert.equal(result.properties["--design-overlay-boost"], String(boost), `boost at ${value}`);
  }
});

test("Research surface ships no fixed Journal-entry imagery (AS119-F003)", () => {
  const research = read("components/site/ResearchSurface.js");
  assert.doesNotMatch(research, /\/v10\/assets\/|plate-|research-thumb|backgroundImage|<img/);
  assert.doesNotMatch(css, /research-thumb/);
});

test("V10 rules live in app/globals.css; no separate V10 stylesheet (AS119-F001)", () => {
  assert.ok(!fs.existsSync(new URL("../app/v10.css", import.meta.url)));
  assert.doesNotMatch(read("app/layout.js"), /v10\.css/);
  assert.match(read("app/layout.js"), /^import "\.\/globals\.css";$/m);
  assert.ok(css.lastIndexOf("V10-A final cascade") > css.indexOf("V10-A canonical public baseline"), "V10 final cascade is last");
});
