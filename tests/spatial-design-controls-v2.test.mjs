// Spatial Design Controls V2A — Admin UX Alignment (D-082 / ML-DEVOS-AS-107,
// docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md §25).
//
// app/admin/DesignControls.js is a JSX client component that `node --test`
// cannot import without a build step. Its V2A metadata tables are plain JS,
// so this suite evaluates exactly that source slice and asserts on it
// against the server's own fixed allowlists, and asserts on the component
// source for the rendered-control and wording contract.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

import {
  ACCENT_PRESET_VALUES,
  ANIMATION_PRESET_VALUES,
  CARD_STYLE_PRESET_VALUES,
  HEADING_SCALE_PRESET_VALUES,
  HERO_BACKGROUND_PRESET_VALUES,
  JOURNAL_CARD_MODE_VALUES,
  LAYOUT_DENSITY_PRESET_VALUES,
  MANAGED_SECTION_IDS as SERVER_SECTION_IDS,
  PANEL_PRESET_VALUES,
  PROJECT_RAIL_MODE_VALUES,
  REDUCED_MOTION_MODE_VALUES,
  TYPOGRAPHY_PRESET_VALUES,
  sectionDesignOrder,
} from "../worker/d1/validate.mjs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const source = read("app/admin/DesignControls.js");

const SERVER_ENUMS = {
  heroBackgroundPreset: HERO_BACKGROUND_PRESET_VALUES,
  cardStylePreset: CARD_STYLE_PRESET_VALUES,
  layoutDensityPreset: LAYOUT_DENSITY_PRESET_VALUES,
  typographyPreset: TYPOGRAPHY_PRESET_VALUES,
  headingScalePreset: HEADING_SCALE_PRESET_VALUES,
  panelPreset: PANEL_PRESET_VALUES,
  animationPreset: ANIMATION_PRESET_VALUES,
  reducedMotionMode: REDUCED_MOTION_MODE_VALUES,
  projectRailMode: PROJECT_RAIL_MODE_VALUES,
  journalCardMode: JOURNAL_CARD_MODE_VALUES,
  accentPreset: ACCENT_PRESET_VALUES,
};
const SERVER_RANGE_KEYS = ["overlayIntensity", "panelOpacityPct", "borderIntensityPct", "radiusScalePct"];

// Evaluate the plain-JS metadata slice (no JSX) of the component source.
function loadMetadata() {
  const start = source.indexOf("const THEME_GROUPS");
  const end = source.indexOf("function emptyThemeDraft");
  assert.ok(start > 0 && end > start, "metadata slice markers present");
  const slice = source.slice(start, end);
  assert.doesNotMatch(slice, /<[A-Za-z]/, "metadata slice contains no JSX");
  return new Function(
    `${slice}\nreturn { THEME_GROUPS, THEME_FIELDS, SELECT_KEYS, RANGE_KEYS, OPTION_LABELS, optionLabel, MANAGED_SURFACES, MANAGED_SECTION_IDS, ORDER_MIN, ORDER_MAX, SPATIAL_PREVIEW_LINKS, LIFECYCLE_LABELS, lifecycleLabel };`,
  )();
}
const meta = loadMetadata();

test("backend section ids map to the spatial admin labels, in spatial order", () => {
  assert.deepEqual(
    meta.MANAGED_SURFACES.map(({ id, label }) => [id, label]),
    [
      ["home", "Entry"],
      ["process", "Systems"],
      ["projects", "Projects"],
      ["about", "Contact"],
    ],
  );
  // Exactly the server's four managed ids — none added, none renamed.
  assert.deepEqual([...meta.MANAGED_SECTION_IDS].sort(), [...SERVER_SECTION_IDS].sort());
  // Submissions use the backend id, never the display label.
  assert.match(source, /`\/admin\/api\/design\/sections\/\$\{id\}\/draft`/);
  assert.match(source, /`\/admin\/api\/design\/sections\/\$\{id\}\/publish`/);
  assert.doesNotMatch(source, /sections\/\$\{label\}/);
  // Legacy long-scroll labels are gone from the admin vocabulary.
  assert.doesNotMatch(source, /home: "Home"|process: "Process"|about: "About"/);
});

test("Research is preview-only and never a managed surface", () => {
  assert.ok(!meta.MANAGED_SURFACES.some(surface => /research/i.test(surface.id) || /research/i.test(surface.label)));
  assert.ok(!SERVER_SECTION_IDS.includes("research"));
  const research = meta.SPATIAL_PREVIEW_LINKS.find(link => link.label === "Research");
  assert.equal(research.href, "/?design-preview=1#research");
  assert.equal(research.note, "preview only; fixed destination");
});

test("Entry has no navigation-order control; its stored order passes through unchanged", () => {
  const entry = meta.MANAGED_SURFACES.find(surface => surface.id === "home");
  assert.equal(entry.navigationOrder, false);
  assert.equal(entry.heading, "Entry content");
  // The order input renders only for surfaces with navigationOrder.
  assert.match(source, /\{surface\.navigationOrder && \(\s*<div[\s\S]*?Navigation order[\s\S]*?type="number"/);
  // Drafts are seeded from the stored order and submitted whole, so Entry's
  // existing order is sent back unchanged.
  assert.match(source, /nextSectionDrafts\[id\] = source \? \{ order: source\.order, visible: source\.visible \}/);
  assert.match(source, /\.\.\.sectionDrafts\[id\],\s*expectedPublishedRevisionId/);
});

test("Systems, Projects and Contact keep the existing bounded order range", () => {
  for (const id of ["process", "projects", "about"]) {
    assert.equal(meta.MANAGED_SURFACES.find(surface => surface.id === id).navigationOrder, true);
  }
  assert.equal(meta.ORDER_MIN, 0);
  assert.equal(meta.ORDER_MAX, 20);
  assert.ok(sectionDesignOrder(meta.ORDER_MIN) && sectionDesignOrder(meta.ORDER_MAX));
  assert.ok(!sectionDesignOrder(meta.ORDER_MAX + 1));
  assert.match(source, /Lower values appear earlier among managed destinations\. Research remains in its fixed position\./);
});

test("theme groups cover exactly the existing payload keys, once each, with no new field", () => {
  assert.deepEqual(
    meta.THEME_GROUPS.map(group => group.title),
    ["Atmosphere", "Surfaces", "Typography", "Motion", "Collections"],
  );
  const keys = meta.THEME_FIELDS.map(field => field.key);
  assert.equal(new Set(keys).size, keys.length, "no key appears twice");
  assert.deepEqual([...meta.SELECT_KEYS].sort(), Object.keys(SERVER_ENUMS).sort());
  assert.deepEqual([...meta.RANGE_KEYS].sort(), [...SERVER_RANGE_KEYS].sort());
  const labels = Object.fromEntries(meta.THEME_FIELDS.map(field => [field.key, field.label]));
  assert.equal(labels.heroBackgroundPreset, "Entry background");
  assert.equal(labels.overlayIntensity, "Environment overlay");
  assert.equal(labels.panelPreset, "Surface glass");
  assert.equal(labels.layoutDensityPreset, "Spatial density");
  assert.equal(labels.headingScalePreset, "Surface heading scale");
  assert.equal(labels.projectRailMode, "Project selector scrolling");
  assert.equal(labels.journalCardMode, "Journal index layout");
});

test("friendly option labels cover every server enum value and never replace the submitted value", () => {
  for (const [key, values] of Object.entries(SERVER_ENUMS)) {
    for (const value of values) {
      assert.ok(Object.hasOwn(meta.OPTION_LABELS, value), `${key}: ${value} has a label`);
      assert.notEqual(meta.optionLabel(value), "", `${value} label is non-empty`);
    }
  }
  assert.equal(meta.optionLabel("cinematic-v3"), "Cinematic V3");
  assert.equal(meta.optionLabel("respect-system"), "Respect system setting");
  assert.equal(meta.optionLabel("free-scroll"), "Free scroll");
  assert.equal(meta.optionLabel("not-a-value"), "not-a-value", "unknown values are shown, not invented");
  // Options come from the server allowlist and submit the raw enum value.
  assert.match(source, /\(allowedValues\?\.\[field\.key\] \?\? \[\]\)\.map\(option =>/);
  assert.match(source, /<option key=\{option\} value=\{option\}>\s*\{optionLabel\(option\)\}/);
});

test("Spatial Preview shortcuts are the six fixed source-authored paths", () => {
  assert.deepEqual(
    meta.SPATIAL_PREVIEW_LINKS.map(({ label, href }) => [label, href]),
    [
      ["Entry", "/?design-preview=1"],
      ["Systems", "/?design-preview=1#systems"],
      ["Projects", "/?design-preview=1#projects"],
      ["Research", "/?design-preview=1#research"],
      ["Contact", "/?design-preview=1#contact"],
      ["Journal", "/journal?design-preview=1"],
    ],
  );
  for (const { href } of meta.SPATIAL_PREVIEW_LINKS) {
    assert.ok(href.startsWith("/") && !href.startsWith("//"), `${href} is same-origin`);
  }
  assert.match(source, /SPATIAL_PREVIEW_LINKS\.map\(link =>/);
  assert.match(source, /href=\{link\.href\}/);
});

test("no arbitrary-input capability: only native bounded controls and the existing endpoints", () => {
  const inputTypes = [...source.matchAll(/type="([a-z]+)"/g)].map(match => match[1]);
  for (const type of inputTypes) {
    assert.ok(["range", "number", "checkbox", "button"].includes(type), `unexpected input type ${type}`);
  }
  assert.doesNotMatch(source, /<textarea|contentEditable|dangerouslySetInnerHTML|<iframe|type="(text|url|color|file)"/);
  assert.doesNotMatch(source, /draggable|onDrag|onDrop/);
  const fetchTargets = [...source.matchAll(/fetch\(\s*("[^"]*"|`[^`]*`|[A-Za-z_]+)/g)].map(match => match[1]);
  assert.deepEqual(fetchTargets.sort(), ['"/admin/api/design"', '"/admin/api/design/preview"', "url"].sort());
  const submitTargets = [...source.matchAll(/submitJson\(\s*("[^"]*"|`[^`]*`)/g)].map(match => match[1]);
  assert.deepEqual(submitTargets.sort(), [
    '"/admin/api/design/theme/draft"',
    '"/admin/api/design/theme/publish"',
    "`/admin/api/design/sections/${id}/draft`",
    "`/admin/api/design/sections/${id}/publish`",
  ].sort());
});

test("Draft, Preview, Publish and Deployment are distinguished; buttons are scope-explicit", () => {
  assert.match(source, /Publish activates these design settings\. It does not deploy code or publish website content\./);
  for (const term of ["Draft", "Preview", "Publish", "Deployment"]) {
    assert.match(source, new RegExp(`<dt style=\\{\\{ fontWeight: 600 \\}\\}>${term}</dt>`));
  }
  assert.match(source, />\s*Save Theme Draft\s*</);
  assert.match(source, />\s*Publish Theme\s*</);
  assert.match(source, /Save \{label\} Draft/);
  assert.match(source, /Publish \{label\}/);
  assert.deepEqual(meta.LIFECYCLE_LABELS, {
    published_with_draft: "Published + Draft",
    published: "Published",
    draft: "Draft",
    archived: "No published setting",
  });
  assert.equal(meta.lifecycleLabel(null), "No published setting");
});

test("raw preview data is a secondary collapsed disclosure; the endpoint is kept", () => {
  assert.match(source, /<details[\s\S]*?<summary[^>]*>Technical preview data<\/summary>[\s\S]*?Refresh raw preview data[\s\S]*?<\/details>/);
  assert.match(source, /fetch\("\/admin\/api\/design\/preview"/);
});
