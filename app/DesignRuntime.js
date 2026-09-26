"use client";

// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032) public design
// runtime, remediated per ML-DEVOS-AS-032 Remediation Cycle 1 (AS32-B001,
// AS32-B002).
//
// Mounted once, in app/layout.js, on every page. In normal (non-preview)
// operation it fetches only `GET /api/design` (RFC-010 "Public runtime
// application") and applies the result using exactly:
//   - fixed `data-*` enum attributes on `<html>` (never a caller-controlled
//     attribute name — the attribute names below are hardcoded, and the
//     enum values it accepts are each independently re-validated against
//     the exact fixed vocabulary before being written, so a compromised or
//     buggy API response can never inject an arbitrary attribute value);
//   - four validated numeric CSS custom properties on `<html>`, each
//     derived from a bounds-checked integer (never a raw server-provided
//     CSS value/string);
//   - `style.order`/`style.display` on the `[data-section]` elements for
//     exactly the four fixed managed ids (never a server-provided selector —
//     the four ids are a fixed, hardcoded list; see applySections below for
//     the Website Redesign V1 route-trigger/surface mapping).
// It never injects a server-returned CSS string, never creates a <style>
// element from arbitrary text, never uses dangerouslySetInnerHTML, never
// evaluates code, and never loads a remote font/asset. If the fetch fails,
// returns a non-OK status, or the payload doesn't match the expected shape,
// this component does nothing at all — every attribute/custom property is
// simply left unset, so the page keeps rendering the static V3 +
// UI-PATCH-001 baseline (RFC-010 "Fail-safe baseline"); a design API
// failure must not blank or materially break the public site.
//
// AS32-B001 remediation — authenticated visual draft preview: when the
// current URL carries `?design-preview=1`, this component instead fetches
// the existing PROTECTED `GET /admin/api/design/preview` endpoint (no new
// public API is added). That endpoint already enforces Cloudflare Access
// (worker/auth.mjs/worker/admin/design.mjs, unmodified by this
// remediation) — an unauthenticated browser's request is rejected (401)
// exactly as it always was, and this component treats that rejection
// identically to any other fetch failure: it falls back to the normal
// published `GET /api/design` fetch below, so an unauthenticated visitor
// who stumbles onto a `?design-preview=1` URL sees only the ordinary
// published/baseline presentation, never draft data. An authenticated
// admin's browser (already signed in to Cloudflare Access from visiting
// `/admin`) sends its Access session on this same-origin fetch exactly as
// it would on any other request to that path, so the preview endpoint
// resolves normally. The returned draft-if-present-else-published payload
// is applied through the exact same `applyTheme`/`applySections` functions
// used for the published projection below — no separate/parallel
// application code path, no new attribute, no new CSS capability.
import { useEffect } from "react";
import { computeOverlayLayers } from "../lib/design/overlay.mjs";
import { normalizeV10Theme } from "../lib/design/v10-theme.mjs";
import { DESIGN_APPLIED_EVENT, managedTriggerSlots } from "../components/site/routes.mjs";

const DESIGN_PREVIEW_QUERY_PARAM = "design-preview";

const ANIMATION_PRESET_VALUES = ["calm", "minimal", "off"];
const REDUCED_MOTION_MODE_VALUES = ["respect-system", "always-reduced"];
const PROJECT_RAIL_MODE_VALUES = ["snap", "free-scroll"];
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

// AS32-B002 remediation: the actual opacity/boost mapping lives in
// ../lib/design/overlay.mjs (a plain, DOM-free module) so it has its own
// direct unit test (tests/design-overlay.test.mjs) independent of any
// browser/Playwright evidence. This just applies the two computed values
// (or removes both custom properties when the input is out of range) —
// see that module's header comment for the full rationale.
function applyOverlayIntensity(root, value) {
  const layers = computeOverlayLayers(value);
  root.style.setProperty("--design-overlay-opacity", String(layers.opacity));
  root.style.setProperty("--design-overlay-boost", String(layers.boost));
}

function applyTheme(root, theme) {
  const effective = normalizeV10Theme(theme);
  setEnumAttribute(root, "data-animation", effective.animationPreset, ANIMATION_PRESET_VALUES);
  setEnumAttribute(root, "data-reduced-motion-mode", effective.reducedMotionMode, REDUCED_MOTION_MODE_VALUES);
  setEnumAttribute(root, "data-project-rail", effective.projectRailMode, PROJECT_RAIL_MODE_VALUES);

  applyOverlayIntensity(root, effective.overlayIntensity);
  setBoundedNumberProperty(root, "--design-panel-alpha", effective.panelOpacityPct, { min: 80, max: 90, transform: v => v / 100 });
  setBoundedNumberProperty(root, "--design-border-alpha", effective.borderIntensityPct, { min: 10, max: 25, transform: v => v / 100 });
  setBoundedNumberProperty(root, "--design-radius-scale", effective.radiusScalePct, { min: 80, max: 120, transform: v => v / 100 });
}

// Website Redesign V1 (D-076 / ML-DEVOS-AS-104 plan §19): the same four
// fixed managed IDs now mark every element that presents that section --
// its spatial route trigger(s) and its route surface (home -> Entry content,
// projects -> Projects, process -> Systems, about -> Contact; Research is
// unmanaged). Visibility hides every marked element, trigger and surface
// alike. Published order only permutes the managed route triggers among
// their own default slots (components/site/routes.mjs managedTriggerSlots);
// surfaces never receive an order. The selector is still built only from
// the hardcoded MANAGED_SECTION_IDS list.
function applySections(sections) {
  if (!sections || typeof sections !== "object") return;
  const slots = managedTriggerSlots(sections);
  for (const id of MANAGED_SECTION_IDS) {
    const entry = sections[id];
    for (const element of document.querySelectorAll(`[data-section="${id}"]`)) {
      if (element.hasAttribute("data-section-trigger") && Object.hasOwn(slots, id)) {
        element.style.order = String(slots[id]);
      }
      if (entry && typeof entry === "object" && typeof entry.visible === "boolean") {
        element.style.display = entry.visible ? "" : "none";
      }
    }
  }
}

// Lets the public spatial shell re-check its open route (a hidden managed
// route fails safe to Entry) and its motion mode. Carries no data.
function announceApplied() {
  window.dispatchEvent(new Event(DESIGN_APPLIED_EVENT));
}

function fetchJson(url) {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`design request failed (${response.status})`);
    return response.json();
  });
}

// GET /api/design — the ordinary published-only path, unchanged.
function applyPublished(root, cancelledRef) {
  return fetchJson("/api/design").then(data => {
    if (cancelledRef.cancelled) return;
    applyTheme(root, data?.theme);
    applySections(data?.sections);
    announceApplied();
  });
}

export default function DesignRuntime() {
  useEffect(() => {
    const cancelledRef = { cancelled: false };
    const root = document.documentElement;
    const previewRequested = new URLSearchParams(window.location.search).get(DESIGN_PREVIEW_QUERY_PARAM) === "1";

    let request;
    if (previewRequested) {
      // AS32-B001: try the existing PROTECTED preview endpoint first. Same
      // application functions, same fixed mappings — the only difference
      // from the published path is which same-origin endpoint is fetched.
      request = fetchJson("/admin/api/design/preview")
        .then(data => {
          if (cancelledRef.cancelled) return;
          applyTheme(root, data?.theme);
          applySections(data?.sections);
          announceApplied();
        })
        .catch(() => {
          // Not authenticated for preview (401), or any other failure:
          // fall back to the ordinary published projection — never show
          // draft data to an unauthenticated visitor, and never leave the
          // page in a half-applied state.
          if (cancelledRef.cancelled) return;
          return applyPublished(root, cancelledRef);
        });
    } else {
      request = applyPublished(root, cancelledRef);
    }

    request.catch(() => {
      // Fail-safe (RFC-010): leave the static baseline exactly as it was
      // rendered — never blank the page, never throw past this boundary.
    });

    return () => {
      cancelledRef.cancelled = true;
    };
  }, []);

  return null;
}
