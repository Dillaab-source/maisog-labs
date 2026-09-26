"use client";

// WEB-INC-007 (ML-DEVOS-RFC-010 / ML-DEVOS-AS-030 / D-032, screenshot-
// reference addendum ML-DEVOS-AS-031 / D-033) bounded authenticated
// design-control UI.
//
// This is an ordinary client component using `fetch` against the same-
// origin admin API family this increment adds
// (worker/admin/design.mjs) — it imports no D1/server/repository module,
// no SQL, and no binding of any kind. Every control below is a `<select>`,
// a bounded `<input type="range"|"number">`, or a checkbox generated from
// the fixed `allowedValues`/`allowedRanges` the server returns from its own
// fixed constants (never free text) — there is no input box for CSS, HTML,
// JS, a selector, a URL, a color, a custom token, or an arbitrary class
// name anywhere on this page (RFC-010 "Admin UI"). Section controls expose
// only the four managed section ids the server itself enumerates.
//
// The names/options/ranges rendered here are exactly what the
// screenshot-reference workflow (docs/product/DESIGN_REFERENCE_WORKFLOW.md,
// ML-DEVOS-AS-031/D-033) requires to be deterministic and inspectable, so
// an Architect-produced Design Reference Plan can be applied repeatably
// through this same surface.
//
// ML-DEVOS-AS-032 Remediation Cycle 1 (AS32-B001): the preview links below
// (since V2A, the fixed Spatial Preview shortcuts) are plain links to the real public pages
// with `?design-preview=1` appended — no new API call happens here. The
// actual authenticated visual preview is implemented entirely in
// app/DesignRuntime.js (mounted globally): it recognizes that query
// parameter and fetches the existing protected `GET /admin/api/design/
// preview` endpoint instead of the public one, applying the result through
// the same fixed-mapping functions. These links add no new capability to
// this page itself.
//
// Spatial Design Controls V2A — Admin UX Alignment (D-082 / ML-DEVOS-AS-107,
// docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md): presentation only. The
// alias, grouping, option-label and preview-path tables below are static
// source-controlled metadata. They rename nothing on the server: submitted
// payloads keep the exact backend section ids (`home`, `process`,
// `projects`, `about`), the exact theme payload keys and the exact
// server-enumerated option values. Research is a fixed spatial destination
// that appears only in Spatial Preview — it is not a managed section here.
import { useCallback, useEffect, useState } from "react";

// Theme controls grouped by purpose (plan §9). Keys are the unchanged
// server payload keys; `kind` picks the native control. Every key here is
// one of the server's fixed ALLOWED_VALUES / ALLOWED_RANGES keys.
const THEME_GROUPS = [
  {
    title: "Atmosphere",
    fields: [
      { key: "heroBackgroundPreset", kind: "select", label: "Entry background" },
      { key: "overlayIntensity", kind: "range", label: "Environment overlay" },
      { key: "accentPreset", kind: "select", label: "Accent" },
    ],
  },
  {
    title: "Surfaces",
    fields: [
      { key: "cardStylePreset", kind: "select", label: "Surface / card style" },
      { key: "panelPreset", kind: "select", label: "Surface glass" },
      { key: "layoutDensityPreset", kind: "select", label: "Spatial density" },
      { key: "panelOpacityPct", kind: "range", label: "Surface opacity (%)" },
      { key: "borderIntensityPct", kind: "range", label: "Surface border intensity (%)" },
      { key: "radiusScalePct", kind: "range", label: "Corner radius scale (%)" },
    ],
  },
  {
    title: "Typography",
    fields: [
      { key: "typographyPreset", kind: "select", label: "Typography" },
      { key: "headingScalePreset", kind: "select", label: "Surface heading scale" },
    ],
  },
  {
    title: "Motion",
    note: "A visitor's own reduced-motion system setting is always honored; no option here overrides it.",
    fields: [
      { key: "animationPreset", kind: "select", label: "Motion" },
      { key: "reducedMotionMode", kind: "select", label: "Reduced motion" },
    ],
  },
  {
    title: "Collections",
    note: "Journal index layout applies to the Journal presentation only; it does not show, hide or move Research.",
    fields: [
      { key: "projectRailMode", kind: "select", label: "Project selector scrolling" },
      { key: "journalCardMode", kind: "select", label: "Journal index layout" },
    ],
  },
];

const THEME_FIELDS = THEME_GROUPS.flatMap(group => group.fields);
const SELECT_KEYS = THEME_FIELDS.filter(field => field.kind === "select").map(field => field.key);
const RANGE_KEYS = THEME_FIELDS.filter(field => field.kind === "range").map(field => field.key);

// Friendly display labels for the existing server enum values (plan §10).
// Display only: each option element still submits its exact server value, and a
// value missing from this table is shown as-is rather than invented.
const OPTION_LABELS = {
  "cinematic-v3": "Cinematic V3",
  "deep-night": "Deep Night",
  "minimal-orbit": "Minimal Orbit",
  "soft-glass": "Soft Glass",
  "quiet-border": "Quiet Border",
  "solid-night": "Solid Night",
  "clear-glass": "Clear Glass",
  "opaque-night": "Opaque Night",
  compact: "Compact",
  comfortable: "Comfortable",
  spacious: "Spacious",
  cinematic: "Cinematic",
  editorial: "Editorial",
  system: "System",
  standard: "Standard",
  display: "Display",
  calm: "Calm",
  minimal: "Minimal",
  off: "Off",
  "respect-system": "Respect system setting",
  "always-reduced": "Always reduced",
  snap: "Snap",
  "free-scroll": "Free scroll",
  stack: "Stack",
  rail: "Rail",
  cobalt: "Cobalt",
  teal: "Teal",
  violet: "Violet",
};

function optionLabel(value) {
  return Object.prototype.hasOwnProperty.call(OPTION_LABELS, value) ? OPTION_LABELS[value] : value;
}

// Admin alias for the four fixed managed backend section ids (plan §5), in
// spatial order. The id is what is submitted; the label is display only and
// is never read from the server or from caller input. Entry is the base
// spatial state, not a route trigger, so it has no navigation-order control
// (plan §6) — its stored order is passed through unchanged on save.
const MANAGED_SURFACES = [
  { id: "home", label: "Entry", heading: "Entry content", navigationOrder: false },
  { id: "process", label: "Systems", heading: "Systems", navigationOrder: true },
  { id: "projects", label: "Projects", heading: "Projects", navigationOrder: true },
  { id: "about", label: "Contact", heading: "Contact", navigationOrder: true },
];
const MANAGED_SECTION_IDS = MANAGED_SURFACES.map(surface => surface.id);

// Existing bounded section-order range (unchanged from WEB-INC-007).
const ORDER_MIN = 0;
const ORDER_MAX = 20;

// Fixed source-authored Spatial Preview destinations (plan §13/§14). They
// reuse the existing `?design-preview=1` mechanism in app/DesignRuntime.js;
// there is no URL input, no database URL and no new preview endpoint.
const SPATIAL_PREVIEW_LINKS = [
  { label: "Entry", href: "/?design-preview=1" },
  { label: "Systems", href: "/?design-preview=1#systems" },
  { label: "Projects", href: "/?design-preview=1#projects" },
  { label: "Research", href: "/?design-preview=1#research", note: "preview only; fixed destination" },
  { label: "Contact", href: "/?design-preview=1#contact" },
  { label: "Journal", href: "/journal?design-preview=1" },
];

const LIFECYCLE_LABELS = {
  published_with_draft: "Published + Draft",
  published: "Published",
  draft: "Draft",
  archived: "No published setting",
};

function lifecycleLabel(entry) {
  if (!entry) return "No published setting";
  return LIFECYCLE_LABELS[entry.state] ?? "No published setting";
}

function emptyThemeDraft(allowedValues, allowedRanges) {
  const draft = {};
  for (const key of SELECT_KEYS) {
    draft[key] = allowedValues?.[key]?.[0] ?? "";
  }
  for (const key of RANGE_KEYS) {
    draft[key] = allowedRanges?.[key]?.min ?? 0;
  }
  return draft;
}

function themeValuesFromStatus(status) {
  const source = status?.draft ?? status?.published;
  if (!source) return null;
  const values = {};
  for (const key of [...SELECT_KEYS, ...RANGE_KEYS]) {
    values[key] = source[key];
  }
  return values;
}

function Message({ tone, children }) {
  const color = tone === "error" ? "#e0564f" : tone === "success" ? "#3fa66a" : "inherit";
  return (
    <p role="status" aria-live="polite" style={{ color, fontSize: "0.85rem", margin: "0.4rem 0", minHeight: "1em" }}>
      {children}
    </p>
  );
}

const styles = {
  root: { marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #ddd", maxWidth: "44rem" },
  hint: { fontSize: "0.85rem", color: "inherit", opacity: 0.8, margin: "0.25rem 0 0.5rem" },
  fieldset: { border: "1px solid #888", borderRadius: "6px", padding: "0.75rem", margin: "0 0 0.75rem", minWidth: 0 },
  legend: { fontWeight: 600, padding: "0 0.25rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))", gap: "0.75rem" },
  field: { fontSize: "0.85rem", display: "block", minWidth: 0 },
  control: { display: "block", width: "100%", minHeight: "2.25rem", boxSizing: "border-box" },
  buttons: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" },
  button: { minHeight: "2.5rem", padding: "0 0.9rem" },
  surfaceRow: { border: "1px solid #888", borderRadius: "6px", padding: "0.75rem", marginBottom: "0.75rem" },
  surfaceControls: { display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "0.75rem" },
  previewList: { listStyle: "none", padding: 0, margin: "0.5rem 0", display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  previewLink: { display: "inline-flex", alignItems: "center", minHeight: "2.5rem", padding: "0 0.75rem", border: "1px solid #bbb", borderRadius: "6px" },
  pre: { background: "#f4f4f4", color: "#111", padding: "0.75rem", fontSize: "0.75rem", overflowX: "auto", maxWidth: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word" },
};

export default function DesignControls() {
  const [status, setStatus] = useState({ state: "loading", data: null, error: null });
  const [themeDraft, setThemeDraft] = useState(null);
  const [themeMessage, setThemeMessage] = useState(null);
  const [sectionMessages, setSectionMessages] = useState({});
  const [sectionDrafts, setSectionDrafts] = useState({});
  const [previewMessage, setPreviewMessage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(() => {
    return fetch("/admin/api/design", { headers: { Accept: "application/json" } })
      .then(async response => {
        if (!response.ok) throw new Error(`status request failed (${response.status})`);
        return response.json();
      })
      .then(data => {
        setStatus({ state: "ready", data, error: null });
        setThemeDraft(themeValuesFromStatus(data.theme) ?? emptyThemeDraft(data.allowedValues, data.allowedRanges));
        const nextSectionDrafts = {};
        for (const id of MANAGED_SECTION_IDS) {
          const entry = data.sections?.[id];
          const source = entry?.draft ?? entry?.published;
          nextSectionDrafts[id] = source ? { order: source.order, visible: source.visible } : { order: 0, visible: true };
        }
        setSectionDrafts(nextSectionDrafts);
        return data;
      })
      .catch(error => {
        setStatus({ state: "error", data: null, error: error.message });
        return null;
      });
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (status.state === "loading") return <p>Loading design controls…</p>;
  if (status.state === "error") return <p role="alert">Unable to load design controls. Please refresh.</p>;

  const { data } = status;
  const theme = data.theme;
  const allowedValues = data.allowedValues;
  const allowedRanges = data.allowedRanges;

  async function submitJson(url, method, body) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, json };
  }

  async function handleThemeSaveDraft() {
    setBusy(true);
    setThemeMessage(null);
    try {
      const result = await submitJson("/admin/api/design/theme/draft", "PUT", {
        ...themeDraft,
        expectedPublishedRevisionId: theme?.publishedRevisionId ?? null,
        expectedDraftRevisionId: theme?.draftRevisionId ?? null,
      });
      if (result.status === 409) setThemeMessage({ tone: "error", text: "Stale conflict — someone else changed the theme. Reloading…" });
      else if (!result.ok) setThemeMessage({ tone: "error", text: result.json.error === "Validation failed" ? "Validation failed — check the values." : "Save failed." });
      else setThemeMessage({ tone: "success", text: "Theme draft saved. Not yet public — use Preview, then Publish Theme." });
      await loadStatus();
    } catch {
      setThemeMessage({ tone: "error", text: "Save failed (network error)." });
    } finally {
      setBusy(false);
    }
  }

  async function handleThemePublish() {
    setBusy(true);
    setThemeMessage(null);
    try {
      const result = await submitJson("/admin/api/design/theme/publish", "POST", {
        expectedPublishedRevisionId: theme?.publishedRevisionId ?? null,
        expectedDraftRevisionId: theme?.draftRevisionId ?? null,
      });
      if (result.status === 409) setThemeMessage({ tone: "error", text: "Stale conflict — reloading…" });
      else if (!result.ok) setThemeMessage({ tone: "error", text: "Publish failed." });
      else setThemeMessage({ tone: "success", text: "Theme published. Design settings are now active; no code was deployed." });
      await loadStatus();
    } catch {
      setThemeMessage({ tone: "error", text: "Publish failed (network error)." });
    } finally {
      setBusy(false);
    }
  }

  async function handleSectionSaveDraft(id, label) {
    setBusy(true);
    setSectionMessages(prev => ({ ...prev, [id]: null }));
    try {
      const entry = data.sections?.[id];
      const result = await submitJson(`/admin/api/design/sections/${id}/draft`, "PUT", {
        ...sectionDrafts[id],
        expectedPublishedRevisionId: entry?.publishedRevisionId ?? null,
        expectedDraftRevisionId: entry?.draftRevisionId ?? null,
      });
      if (result.status === 409) setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Stale conflict — reloading…" } }));
      else if (!result.ok) setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Save failed." } }));
      else setSectionMessages(prev => ({ ...prev, [id]: { tone: "success", text: `${label} draft saved. Not yet public.` } }));
      await loadStatus();
    } catch {
      setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Save failed (network error)." } }));
    } finally {
      setBusy(false);
    }
  }

  async function handleSectionPublish(id, label) {
    setBusy(true);
    setSectionMessages(prev => ({ ...prev, [id]: null }));
    try {
      const entry = data.sections?.[id];
      const result = await submitJson(`/admin/api/design/sections/${id}/publish`, "POST", {
        expectedPublishedRevisionId: entry?.publishedRevisionId ?? null,
        expectedDraftRevisionId: entry?.draftRevisionId ?? null,
      });
      if (result.status === 409) setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Stale conflict — reloading…" } }));
      else if (!result.ok) setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Publish failed." } }));
      else setSectionMessages(prev => ({ ...prev, [id]: { tone: "success", text: `${label} published. Design settings are now active; no code was deployed.` } }));
      await loadStatus();
    } catch {
      setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Publish failed (network error)." } }));
    } finally {
      setBusy(false);
    }
  }

  async function handlePreview() {
    setPreviewMessage(null);
    try {
      const response = await fetch("/admin/api/design/preview", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`preview failed (${response.status})`);
      setPreview(await response.json());
      setPreviewMessage({ tone: "success", text: "Technical preview data refreshed." });
    } catch {
      setPreviewMessage({ tone: "error", text: "Preview failed." });
    }
  }

  return (
    <section aria-labelledby="spatial-design-controls-title" style={styles.root}>
      <h2 id="spatial-design-controls-title" style={{ fontSize: "1.1rem" }}>
        Spatial Design Controls
      </h2>
      <p style={styles.hint}>
        Fixed presets and bounded ranges only — no CSS, HTML, JS, URL, or custom color input exists here.
      </p>

      <div role="note" aria-label="How design changes go live" style={styles.fieldset}>
        <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>How changes go live</p>
        <dl style={{ fontSize: "0.85rem", margin: 0 }}>
          <dt style={{ fontWeight: 600 }}>Draft</dt>
          <dd style={{ margin: "0 0 0.35rem" }}>Saved for you only. Visitors keep seeing the published design.</dd>
          <dt style={{ fontWeight: 600 }}>Preview</dt>
          <dd style={{ margin: "0 0 0.35rem" }}>Opens the real site with your draft applied, visible only to a signed-in admin.</dd>
          <dt style={{ fontWeight: 600 }}>Publish</dt>
          <dd style={{ margin: "0 0 0.35rem" }}>
            Publish activates these design settings. It does not deploy code or publish website content.
          </dd>
          <dt style={{ fontWeight: 600 }}>Deployment</dt>
          <dd style={{ margin: 0 }}>Code deployment is a separate, separately authorized operation. Nothing on this page deploys.</dd>
        </dl>
      </div>

      <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Theme</h3>
      <p style={styles.hint}>
        Status: <strong>{lifecycleLabel(theme)}</strong>
      </p>
      {themeDraft &&
        THEME_GROUPS.map(group => (
          <fieldset key={group.title} style={styles.fieldset}>
            <legend style={styles.legend}>{group.title}</legend>
            {group.note && <p style={styles.hint}>{group.note}</p>}
            <div style={styles.grid}>
              {group.fields.map(field => {
                const inputId = `design-${field.key}`;
                if (field.kind === "range") {
                  const range = allowedRanges?.[field.key] ?? { min: 0, max: 100 };
                  return (
                    <div key={field.key} style={styles.field}>
                      <label htmlFor={inputId}>
                        {field.label}: <output htmlFor={inputId}>{themeDraft[field.key]}</output>
                      </label>
                      <input
                        id={inputId}
                        type="range"
                        min={range.min}
                        max={range.max}
                        value={themeDraft[field.key] ?? range.min}
                        onChange={event => setThemeDraft(prev => ({ ...prev, [field.key]: Number(event.target.value) }))}
                        style={styles.control}
                      />
                    </div>
                  );
                }
                return (
                  <div key={field.key} style={styles.field}>
                    <label htmlFor={inputId}>{field.label}</label>
                    <select
                      id={inputId}
                      value={themeDraft[field.key] ?? ""}
                      onChange={event => setThemeDraft(prev => ({ ...prev, [field.key]: event.target.value }))}
                      style={styles.control}
                    >
                      {(allowedValues?.[field.key] ?? []).map(option => (
                        <option key={option} value={option}>
                          {optionLabel(option)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      <div style={styles.buttons}>
        <button type="button" disabled={busy} onClick={handleThemeSaveDraft} style={styles.button}>
          Save Theme Draft
        </button>
        <button type="button" disabled={busy || !theme?.draftRevisionId} onClick={handleThemePublish} style={styles.button}>
          Publish Theme
        </button>
      </div>
      <Message tone={themeMessage?.tone}>{themeMessage?.text}</Message>

      <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Spatial surfaces</h3>
      <p style={styles.hint}>
        Research is a fixed destination and is not managed here; it can still be previewed below.
      </p>
      {MANAGED_SURFACES.map(surface => {
        const { id, label } = surface;
        const visibleId = `design-surface-${id}-visible`;
        const orderId = `design-surface-${id}-order`;
        return (
          <fieldset key={id} style={styles.surfaceRow}>
            <legend style={styles.legend}>{surface.heading}</legend>
            <p style={styles.hint}>
              Status: <strong>{lifecycleLabel(data.sections?.[id])}</strong>
              {!surface.navigationOrder && " — Entry is the base spatial state, so it has no navigation order."}
            </p>
            <div style={styles.surfaceControls}>
              <label htmlFor={visibleId} style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", minHeight: "2.5rem" }}>
                <input
                  id={visibleId}
                  type="checkbox"
                  checked={sectionDrafts[id]?.visible ?? true}
                  onChange={event => setSectionDrafts(prev => ({ ...prev, [id]: { ...prev[id], visible: event.target.checked } }))}
                />
                Visible
              </label>
              {surface.navigationOrder && (
                <div style={{ fontSize: "0.85rem" }}>
                  <label htmlFor={orderId} style={{ display: "block" }}>
                    Navigation order
                  </label>
                  <input
                    id={orderId}
                    type="number"
                    min={ORDER_MIN}
                    max={ORDER_MAX}
                    aria-describedby={`${orderId}-help`}
                    value={sectionDrafts[id]?.order ?? 0}
                    onChange={event => setSectionDrafts(prev => ({ ...prev, [id]: { ...prev[id], order: Number(event.target.value) } }))}
                    style={{ width: "5rem", minHeight: "2.25rem" }}
                  />
                </div>
              )}
            </div>
            {surface.navigationOrder && (
              <p id={`${orderId}-help`} style={styles.hint}>
                Lower values appear earlier among managed destinations. Research remains in its fixed position.
              </p>
            )}
            <div style={styles.buttons}>
              <button type="button" disabled={busy} onClick={() => handleSectionSaveDraft(id, label)} style={styles.button}>
                Save {label} Draft
              </button>
              <button
                type="button"
                disabled={busy || !data.sections?.[id]?.draftRevisionId}
                onClick={() => handleSectionPublish(id, label)}
                style={styles.button}
              >
                Publish {label}
              </button>
            </div>
            <Message tone={sectionMessages[id]?.tone}>{sectionMessages[id]?.text}</Message>
          </fieldset>
        );
      })}

      <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Spatial Preview</h3>
      <p style={styles.hint}>
        Each link opens the real public site with the current draft (or published, where no draft exists) design
        applied. Draft state is never visible to a signed-out visitor — the same links show the ordinary published
        presentation to anyone without an active Access session.
      </p>
      <ul style={styles.previewList}>
        {SPATIAL_PREVIEW_LINKS.map(link => (
          <li key={link.href}>
            <a href={link.href} target="_blank" rel="noreferrer" style={styles.previewLink}>
              {link.label}
              {link.note ? ` — ${link.note}` : ""} ↗
            </a>
          </li>
        ))}
      </ul>

      <details style={{ marginTop: "0.75rem" }}>
        <summary style={{ cursor: "pointer", minHeight: "2rem" }}>Technical preview data</summary>
        <p style={styles.hint}>Raw preview values for diagnosis. The rendered Spatial Preview above is the primary check.</p>
        <button type="button" onClick={handlePreview} style={styles.button}>
          Refresh raw preview data
        </button>
        <Message tone={previewMessage?.tone}>{previewMessage?.text}</Message>
        {preview && <pre style={styles.pre}>{JSON.stringify(preview, null, 2)}</pre>}
      </details>
    </section>
  );
}
