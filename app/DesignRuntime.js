"use client";

// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) public design
// runtime.
//
// Mounted once, in app/layout.js, on every page. It fetches only
// `GET /api/design` (RFC-010 "Public runtime application") and applies the
// result using exactly:
//   - fixed `data-*` enum attributes on `<html>` (never a caller-controlled
//     attribute name — the attribute names below are hardcoded, and the
//     enum values it accepts are each independently re-validated against
//     the exact fixed vocabulary before being written, so a compromised or
//     buggy API response can never inject an arbitrary attribute value);
//   - four validated numeric CSS custom properties on `<html>`, each
//     derived from a bounds-checked integer (never a raw server-provided
//     CSS value/string);
//   - `style.order`/`style.display` on exactly the four `[data-section]`
//     elements app/page.js already renders (never a server-provided
//     selector — the four ids are a fixed, hardcoded list).
// It never injects a server-returned CSS string, never creates a <style>
// element from arbitrary text, never uses dangerouslySetInnerHTML, never
// evaluates code, and never loads a remote font/asset. If the fetch fails,
// returns a non-OK status, or the payload doesn't match the expected shape,
// this component does nothing at all — every attribute/custom property is
// simply left unset, so the page keeps rendering the static V3 +
// UI-PATCH-001 baseline (RFC-010 "Fail-safe baseline"); a design API
// failure must not blank or materially break the public site.
import { useEffect } from "react";

const HERO_BACKGROUND_PRESET_VALUES = ["cinematic-v3", "deep-night", "minimal-orbit"];
const CARD_STYLE_PRESET_VALUES = ["soft-glass", "quiet-border", "solid-night"];
const LAYOUT_DENSITY_PRESET_VALUES = ["compact", "comfortable", "spacious"];
const TYPOGRAPHY_PRESET_VALUES = ["cinematic", "editorial", "system"];
const HEADING_SCALE_PRESET_VALUES = ["compact", "standard", "display"];
const PANEL_PRESET_VALUES = ["soft-glass", "clear-glass", "opaque-night"];
const ANIMATION_PRESET_VALUES = ["calm", "minimal", "off"];
const REDUCED_MOTION_MODE_VALUES = ["respect-system", "always-reduced"];
const PROJECT_RAIL_MODE_VALUES = ["snap", "free-scroll"];
const JOURNAL_CARD_MODE_VALUES = ["stack", "rail"];
const ACCENT_PRESET_VALUES = ["cobalt", "teal", "violet"];
const MANAGED_SECTION_IDS = ["home", "projects", "process", "about"];

function setEnumAttribute(root, attribute, value, allowed) {
  if (typeof value === "string" && allowed.includes(value)) {
    root.setAttribute(attribute, value);
  } else {
    root.removeAttribute(attribute);
  }
}

function setBoundedNumberProperty(root, property, value, { min, max, transform }) {
  if (Number.isFinite(value) && value >= min && value <= max) {
    root.style.setProperty(property, String(transform(value)));
  } else {
    root.style.removeProperty(property);
  }
}

function applyTheme(root, theme) {
  if (!theme || typeof theme !== "object") return;
  setEnumAttribute(root, "data-hero-bg", theme.heroBackgroundPreset, HERO_BACKGROUND_PRESET_VALUES);
  setEnumAttribute(root, "data-card-style", theme.cardStylePreset, CARD_STYLE_PRESET_VALUES);
  setEnumAttribute(root, "data-density", theme.layoutDensityPreset, LAYOUT_DENSITY_PRESET_VALUES);
  setEnumAttribute(root, "data-typography", theme.typographyPreset, TYPOGRAPHY_PRESET_VALUES);
  setEnumAttribute(root, "data-heading-scale", theme.headingScalePreset, HEADING_SCALE_PRESET_VALUES);
  setEnumAttribute(root, "data-panel", theme.panelPreset, PANEL_PRESET_VALUES);
  setEnumAttribute(root, "data-animation", theme.animationPreset, ANIMATION_PRESET_VALUES);
  setEnumAttribute(root, "data-reduced-motion-mode", theme.reducedMotionMode, REDUCED_MOTION_MODE_VALUES);
  setEnumAttribute(root, "data-project-rail", theme.projectRailMode, PROJECT_RAIL_MODE_VALUES);
  setEnumAttribute(root, "data-journal-cards", theme.journalCardMode, JOURNAL_CARD_MODE_VALUES);
  setEnumAttribute(root, "data-accent", theme.accentPreset, ACCENT_PRESET_VALUES);

  // Overlay intensity is expressed relative to the bootstrap default (68),
  // so the default value maps to opacity 1 — byte-identical to the
  // pre-WEB-INC-007 baseline (see app/globals.css's `.cinematic-background::after`).
  setBoundedNumberProperty(root, "--design-overlay-opacity", theme.overlayIntensity, { min: 40, max: 85, transform: v => v / 68 });
  setBoundedNumberProperty(root, "--design-panel-alpha", theme.panelOpacityPct, { min: 55, max: 90, transform: v => v / 100 });
  setBoundedNumberProperty(root, "--design-border-alpha", theme.borderIntensityPct, { min: 10, max: 45, transform: v => v / 100 });
  setBoundedNumberProperty(root, "--design-radius-scale", theme.radiusScalePct, { min: 80, max: 120, transform: v => v / 100 });
}

function applySections(sections) {
  if (!sections || typeof sections !== "object") return;
  for (const id of MANAGED_SECTION_IDS) {
    const element = document.querySelector(`[data-section="${id}"]`);
    if (!element) continue; // e.g. /journal has no managed sections at all
    const entry = sections[id];
    if (!entry || typeof entry !== "object") continue;
    if (Number.isSafeInteger(entry.order) && entry.order >= 0 && entry.order <= 20) {
      element.style.order = String(entry.order);
    }
    if (typeof entry.visible === "boolean") {
      element.style.display = entry.visible ? "" : "none";
    }
  }
}

export default function DesignRuntime() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/design")
      .then(response => {
        if (!response.ok) throw new Error("design request failed");
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        applyTheme(document.documentElement, data?.theme);
        applySections(data?.sections);
      })
      .catch(() => {
        // Fail-safe (RFC-010): leave the static baseline exactly as it was
        // rendered — never blank the page, never throw past this boundary.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
