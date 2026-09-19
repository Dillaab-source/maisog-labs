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
// ML-DEVOS-AS-032 Remediation Cycle 1 (AS32-B001): "Open Homepage Preview"/
// "Open Journal Preview" below are plain links to the real public pages
// with `?design-preview=1` appended — no new API call happens here. The
// actual authenticated visual preview is implemented entirely in
// app/DesignRuntime.js (mounted globally): it recognizes that query
// parameter and fetches the existing protected `GET /admin/api/design/
// preview` endpoint instead of the public one, applying the result through
// the same fixed-mapping functions. These links add no new capability to
// this page itself.
import { useCallback, useEffect, useState } from "react";

const FIELD_LABELS = {
  heroBackgroundPreset: "Hero background",
  cardStylePreset: "Card style",
  layoutDensityPreset: "Layout density",
  typographyPreset: "Typography",
  headingScalePreset: "Heading scale",
  panelPreset: "Panel / glass preset",
  animationPreset: "Animation",
  reducedMotionMode: "Reduced motion",
  projectRailMode: "Project rail",
  journalCardMode: "Journal cards",
  accentPreset: "Accent",
};

const RANGE_LABELS = {
  overlayIntensity: "Overlay intensity",
  panelOpacityPct: "Panel opacity (%)",
  borderIntensityPct: "Border intensity (%)",
  radiusScalePct: "Radius scale (%)",
};

const SECTION_LABELS = { home: "Home", projects: "Projects", process: "Process", about: "About" };

function emptyThemeDraft(allowedValues, allowedRanges) {
  const draft = {};
  for (const key of Object.keys(FIELD_LABELS)) {
    draft[key] = allowedValues?.[key]?.[0] ?? "";
  }
  for (const key of Object.keys(RANGE_LABELS)) {
    draft[key] = allowedRanges?.[key]?.min ?? 0;
  }
  return draft;
}

function themeValuesFromStatus(status) {
  const source = status?.draft ?? status?.published;
  if (!source) return null;
  const values = {};
  for (const key of [...Object.keys(FIELD_LABELS), ...Object.keys(RANGE_LABELS)]) {
    values[key] = source[key];
  }
  return values;
}

function Message({ tone, children }) {
  if (!children) return null;
  const color = tone === "error" ? "#b3261e" : tone === "success" ? "#146c2e" : "#555";
  return <p style={{ color, fontSize: "0.85rem", margin: "0.4rem 0" }}>{children}</p>;
}

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
        for (const id of Object.keys(SECTION_LABELS)) {
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
      else setThemeMessage({ tone: "success", text: "Draft saved." });
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
      else setThemeMessage({ tone: "success", text: "Published." });
      await loadStatus();
    } catch {
      setThemeMessage({ tone: "error", text: "Publish failed (network error)." });
    } finally {
      setBusy(false);
    }
  }

  async function handleSectionSaveDraft(id) {
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
      else setSectionMessages(prev => ({ ...prev, [id]: { tone: "success", text: "Draft saved." } }));
      await loadStatus();
    } catch {
      setSectionMessages(prev => ({ ...prev, [id]: { tone: "error", text: "Save failed (network error)." } }));
    } finally {
      setBusy(false);
    }
  }

  async function handleSectionPublish(id) {
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
      else setSectionMessages(prev => ({ ...prev, [id]: { tone: "success", text: "Published." } }));
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
      setPreviewMessage({ tone: "success", text: "Preview refreshed." });
    } catch {
      setPreviewMessage({ tone: "error", text: "Preview failed." });
    }
  }

  return (
    <section style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #ddd" }}>
      <h2 style={{ fontSize: "1.1rem" }}>Design controls</h2>
      <p style={{ fontSize: "0.85rem", color: "#555" }}>
        Fixed presets and bounded ranges only — no CSS, HTML, JS, URL, or custom color input exists here.
      </p>

      <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Theme</h3>
      {themeDraft && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", maxWidth: "40rem" }}>
          {Object.entries(FIELD_LABELS).map(([key, label]) => (
            <label key={key} style={{ fontSize: "0.85rem" }}>
              {label}
              <select
                value={themeDraft[key] ?? ""}
                onChange={event => setThemeDraft(prev => ({ ...prev, [key]: event.target.value }))}
                style={{ display: "block", width: "100%" }}
              >
                {(allowedValues?.[key] ?? []).map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {Object.entries(RANGE_LABELS).map(([key, label]) => {
            const range = allowedRanges?.[key] ?? { min: 0, max: 100 };
            return (
              <label key={key} style={{ fontSize: "0.85rem" }}>
                {label} ({themeDraft[key]})
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  value={themeDraft[key] ?? range.min}
                  onChange={event => setThemeDraft(prev => ({ ...prev, [key]: Number(event.target.value) }))}
                  style={{ display: "block", width: "100%" }}
                />
              </label>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <button type="button" disabled={busy} onClick={handleThemeSaveDraft}>
          Save Draft
        </button>
        <button type="button" disabled={busy || !theme?.draftRevisionId} onClick={handleThemePublish}>
          Publish
        </button>
      </div>
      <Message tone={themeMessage?.tone}>{themeMessage?.text}</Message>

      <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Sections</h3>
      {Object.entries(SECTION_LABELS).map(([id, label]) => (
        <div key={id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <strong style={{ width: "6rem" }}>{label}</strong>
          <label style={{ fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={sectionDrafts[id]?.visible ?? true}
              onChange={event => setSectionDrafts(prev => ({ ...prev, [id]: { ...prev[id], visible: event.target.checked } }))}
            />{" "}
            Visible
          </label>
          <label style={{ fontSize: "0.85rem" }}>
            Order{" "}
            <input
              type="number"
              min={0}
              max={20}
              value={sectionDrafts[id]?.order ?? 0}
              onChange={event => setSectionDrafts(prev => ({ ...prev, [id]: { ...prev[id], order: Number(event.target.value) } }))}
              style={{ width: "4rem" }}
            />
          </label>
          <button type="button" disabled={busy} onClick={() => handleSectionSaveDraft(id)}>
            Save Draft
          </button>
          <button type="button" disabled={busy || !data.sections?.[id]?.draftRevisionId} onClick={() => handleSectionPublish(id)}>
            Publish
          </button>
          <Message tone={sectionMessages[id]?.tone}>{sectionMessages[id]?.text}</Message>
        </div>
      ))}

      <h3 style={{ fontSize: "1rem", marginTop: "1.5rem" }}>Preview</h3>
      <p style={{ fontSize: "0.85rem", color: "#555", maxWidth: "40rem" }}>
        These open the real public pages with the current draft (or published, where no draft exists) design state
        applied, so a screenshot-reference draft can be reviewed visually before Publish. Draft state is never
        visible to a signed-out visitor — the same links fall back to the ordinary published presentation for
        anyone without an active Access session.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <a href="/?design-preview=1" target="_blank" rel="noreferrer">
          Open Homepage Preview ↗
        </a>
        <a href="/journal?design-preview=1" target="_blank" rel="noreferrer">
          Open Journal Preview ↗
        </a>
      </div>
      <button type="button" onClick={handlePreview}>
        Refresh raw preview data
      </button>
      <Message tone={previewMessage?.tone}>{previewMessage?.text}</Message>
      {preview && (
        <pre style={{ background: "#f4f4f4", padding: "0.75rem", fontSize: "0.75rem", overflowX: "auto", maxWidth: "40rem" }}>
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </section>
  );
}
