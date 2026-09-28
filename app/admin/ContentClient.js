"use client";

// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-105/D-106) admin Content area.
//
// Code owns the V10 design; admin owns approved content fields. This component
// edits only the Tier 1 fields RFC-022 allows — homepage project facts (name,
// kind, status, tagline, description, discipline indices, four flow stages,
// inclusion/order) and the contact email — through the existing project
// lifecycle (/admin/api/projects) and the bounded contact lifecycle
// (/admin/api/content/contact). It exposes no HTML, CSS, JS, URL, selector,
// asset-path or layout input. Every save is a draft; nothing is public until
// Publish, and drafts are visible only in the protected /admin/preview/home.
import { useCallback, useEffect, useState } from "react";

const TABS = ["Profile / Home", "Projects", "About", "Navigation", "Contact"];
// Display labels for the artifact's code-owned discipline indices (MLData.DISC order).
const DISCIPLINES = ["AI", "Automation", "Research", "Security", "Systems", "Architecture"];
const EMPTY_V10 = { tagline: "", status: "", disciplines: [], flow: ["", "", "", ""] };

const styles = {
  root: { marginTop: "2.5rem", borderTop: "1px solid #ccc", paddingTop: "1.5rem" },
  tabs: { display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "1rem 0" },
  tab: active => ({ padding: "0.4rem 0.8rem", border: "1px solid #888", background: active ? "#1f3a8a" : "#fff", color: active ? "#fff" : "#111", borderRadius: 6, cursor: "pointer" }),
  card: { border: "1px solid #ddd", borderRadius: 8, padding: "1rem", margin: "1rem 0" },
  label: { display: "block", fontSize: "0.85rem", marginTop: "0.6rem" },
  input: { width: "100%", padding: "0.35rem", fontSize: "0.95rem", boxSizing: "border-box" },
  row: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.8rem" },
  note: { fontSize: "0.85rem", color: "inherit", opacity: 0.8 },
};

async function submitJson(url, method, body) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, json };
}

function describeFailure(result) {
  if (result.status === 409 && result.json.reason === "HOMEPAGE_LIMIT") return "The homepage already shows five projects. Remove one from the homepage first.";
  if (result.status === 409 && result.json.reason === "SITE_SETTINGS_NOT_INITIALIZED") return "Site settings are not initialized in this database.";
  if (result.status === 409) return "Someone else changed this item. The latest version has been reloaded.";
  if (result.status === 400) return "Validation failed. Check every field (plain text only, 4 flow steps, at least one discipline).";
  return `Request failed (${result.status}).`;
}

function Message({ message }) {
  if (!message) return null;
  return (
    <p role="status" aria-live="polite" style={{ color: message.tone === "error" ? "#e0564f" : "#3fa66a", fontSize: "0.9rem" }}>
      {message.text}
    </p>
  );
}

function DeferredNotice({ title, children }) {
  return (
    <div style={styles.card}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={styles.note}>{children}</p>
    </div>
  );
}

function projectFormFrom(project) {
  const source = project?.draft ?? project?.published;
  return {
    title: source?.title ?? "",
    category: source?.category ?? "",
    summary: source?.summary ?? "",
    order: source?.order ?? 0,
    featured: source?.featured ?? false,
    stack: source?.stack ?? [],
    accent: source?.accent ?? "blue",
    icon: source?.icon ?? "lab",
    v10: source?.v10 && !source.v10.malformed ? { ...source.v10, flow: [...source.v10.flow], disciplines: [...source.v10.disciplines] } : { ...EMPTY_V10, flow: [...EMPTY_V10.flow] },
  };
}

function ProjectEditor({ project, onChanged }) {
  const isNew = !project;
  const [form, setForm] = useState(() => projectFormFrom(project));
  const [ids, setIds] = useState({ id: "", slug: "" });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const setV10 = (key, value) => setForm(current => ({ ...current, v10: { ...current.v10, [key]: value } }));

  // A completely blank V10 section is sent as `null` (not a homepage project),
  // so non-homepage/legacy projects stay editable without homepage fields.
  // Any partially filled section is sent as-is and validated by the server.
  const v10Blank = !form.v10.tagline.trim() && !form.v10.status && form.v10.disciplines.length === 0 && form.v10.flow.every(stage => !stage.trim());
  const body = () => ({
    order: Number(form.order),
    category: form.category.trim(),
    title: form.title.trim(),
    summary: form.summary.trim(),
    stack: form.stack,
    accent: form.accent,
    icon: form.icon,
    featured: form.featured,
    v10: v10Blank
      ? null
      : {
          tagline: form.v10.tagline.trim(),
          status: form.v10.status,
          disciplines: [...form.v10.disciplines].sort((a, b) => a - b),
          flow: form.v10.flow.map(stage => stage.trim()),
        },
  });

  async function saveDraft() {
    setBusy(true);
    setMessage(null);
    try {
      const result = isNew
        ? await submitJson("/admin/api/projects", "POST", { id: ids.id.trim(), slug: ids.slug.trim(), ...body() })
        : await submitJson(`/admin/api/projects/${project.id}/draft`, "PUT", {
            ...body(),
            expectedPublishedRevisionId: project.publishedRevisionId,
            expectedDraftRevisionId: project.draftRevisionId,
          });
      setMessage(result.ok ? { tone: "success", text: "Draft saved. Not public yet: check Preview homepage, then Publish." } : { tone: "error", text: describeFailure(result) });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await submitJson(`/admin/api/projects/${project.id}/publish`, "POST", {
        expectedPublishedRevisionId: project.publishedRevisionId,
        expectedDraftRevisionId: project.draftRevisionId,
      });
      setMessage(result.ok ? { tone: "success", text: "Published." } : { tone: "error", text: describeFailure(result) });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  const field = (label, value, onChange, props = {}) => (
    <label style={styles.label}>
      {label}
      <input style={styles.input} value={value} onChange={event => onChange(event.target.value)} {...props} />
    </label>
  );

  return (
    <div style={styles.card}>
      <h3 style={{ marginTop: 0 }}>
        {isNew ? "New project" : form.title || project.id}
        {!isNew && (
          <span style={{ ...styles.note, fontWeight: "normal" }}>
            {" "}
            · {project.draftRevisionId ? "draft pending" : project.publishedRevisionId ? "published" : "unpublished"}
          </span>
        )}
      </h3>
      {isNew && (
        <>
          {field("Project id (lowercase letters, numbers, dashes)", ids.id, value => setIds(current => ({ ...current, id: value })), { maxLength: 80 })}
          {field("Slug", ids.slug, value => setIds(current => ({ ...current, slug: value })), { maxLength: 80 })}
        </>
      )}
      {field("Name (max 40)", form.title, value => set("title", value), { maxLength: 40 })}
      {field("Kind (max 40)", form.category, value => set("category", value), { maxLength: 40 })}
      {field("Tagline (max 160)", form.v10.tagline, value => setV10("tagline", value), { maxLength: 160 })}
      <label style={styles.label}>
        Description (max 400)
        <textarea style={{ ...styles.input, minHeight: "4rem" }} maxLength={400} value={form.summary} onChange={event => set("summary", event.target.value)} />
      </label>
      <label style={styles.label}>
        Status
        <select style={styles.input} value={form.v10.status} onChange={event => setV10("status", event.target.value)}>
          <option value="">(none)</option>
          <option value="Active">Active</option>
        </select>
      </label>
      <fieldset style={{ ...styles.label, border: "1px solid #ddd" }}>
        <legend>Disciplines</legend>
        {DISCIPLINES.map((name, index) => (
          <label key={name} style={{ marginRight: "0.8rem" }}>
            <input
              type="checkbox"
              checked={form.v10.disciplines.includes(index)}
              onChange={event =>
                setV10("disciplines", event.target.checked ? [...form.v10.disciplines, index] : form.v10.disciplines.filter(d => d !== index))
              }
            />{" "}
            {name}
          </label>
        ))}
      </fieldset>
      <fieldset style={{ ...styles.label, border: "1px solid #ddd" }}>
        <legend>Flow (exactly four steps; step 4 is where a person decides)</legend>
        {form.v10.flow.map((stage, i) => (
          <input
            key={i}
            style={{ ...styles.input, marginTop: "0.3rem" }}
            maxLength={60}
            aria-label={`Flow step ${i + 1}`}
            value={stage}
            onChange={event => setV10("flow", form.v10.flow.map((s, j) => (j === i ? event.target.value : s)))}
          />
        ))}
      </fieldset>
      <label style={styles.label}>
        <input type="checkbox" checked={form.featured} onChange={event => set("featured", event.target.checked)} /> Show on homepage (max five)
      </label>
      {field("Homepage order", String(form.order), value => set("order", value.replace(/[^0-9]/g, "")), { inputMode: "numeric" })}
      <div style={styles.row}>
        <button type="button" disabled={busy} onClick={saveDraft}>
          Save draft
        </button>
        {!isNew && (
          <button type="button" disabled={busy || !project.draftRevisionId} onClick={publish}>
            Publish
          </button>
        )}
      </div>
      <Message message={message} />
    </div>
  );
}

function ProjectsTab({ data, reload }) {
  const { homepage } = data;
  return (
    <div>
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Homepage projects</h3>
        <p style={styles.note}>
          Published homepage projects: {homepage.publishedEligibleProjects} of {homepage.maxProjects}. Live on the homepage now:{" "}
          <strong>{homepage.live.projects ? "yes" : "no (the V10 design's built-in projects are shown)"}</strong>.
        </p>
        {homepage.activationGate.enabled && (
          <p style={styles.note}>
            First activation requires exactly these five, published and complete, in this order: {homepage.activationGate.requiredNames.join(", ")}. Status:{" "}
            <strong>{homepage.activationGate.passes ? "ready" : "not yet"}</strong>.
          </p>
        )}
        <p style={styles.note}>
          <a href="/admin/preview/home" target="_blank" rel="noopener noreferrer">
            Preview homepage with drafts
          </a>{" "}
          (only you can see it; the public homepage is unchanged until you publish).
        </p>
      </div>
      {data.projects.map(project => (
        <ProjectEditor key={`${project.id}:${project.publishedRevisionId}:${project.draftRevisionId}`} project={project} onChanged={reload} />
      ))}
      <ProjectEditor key="new" project={null} onChanged={reload} />
    </div>
  );
}

function ContactTab({ data, reload }) {
  const { contact } = data;
  const [email, setEmail] = useState(contact.draft?.email ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!contact.initialized) return <DeferredNotice title="Contact">Site settings are not initialized in this database.</DeferredNotice>;

  const expected = { expectedPublishedRevisionId: contact.publishedRevisionId, expectedDraftRevisionId: contact.draftRevisionId };
  async function run(action) {
    setBusy(true);
    setMessage(null);
    try {
      const result =
        action === "draft"
          ? await submitJson("/admin/api/content/contact/draft", "PUT", { email: email.trim(), ...expected })
          : await submitJson("/admin/api/content/contact/publish", "POST", { ...expected, confirmDeliverability: confirmed });
      setMessage(result.ok ? { tone: "success", text: action === "draft" ? "Draft saved. Not public yet." : "Published." } : { tone: "error", text: describeFailure(result) });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <h3 style={{ marginTop: 0 }}>Contact email</h3>
      <p style={styles.note}>
        Shown on the homepage:{" "}
        <strong>{data.homepage.live.contact ? contact.published?.email : "the V10 design's built-in address (no email published here yet)"}</strong>
        {contact.draft ? ` · draft: ${contact.draft.email}` : ""}
      </p>
      <label style={styles.label}>
        New public email
        <input style={styles.input} type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
      </label>
      <div style={styles.row}>
        <button type="button" disabled={busy} onClick={() => run("draft")}>
          Save draft
        </button>
      </div>
      <label style={styles.label}>
        <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I have confirmed this address receives mail
      </label>
      <div style={styles.row}>
        <button type="button" disabled={busy || !contact.draft || !confirmed} onClick={() => run("publish")}>
          Publish email
        </button>
      </div>
      <Message message={message} />
    </div>
  );
}

export default function ContentClient() {
  const [tab, setTab] = useState("Projects");
  const [state, setState] = useState({ status: "loading", data: null });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/admin/api/content", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(String(response.status));
      setState({ status: "ready", data: await response.json() });
    } catch {
      setState({ status: "error", data: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-labelledby="content-title" style={styles.root}>
      <h2 id="content-title" style={{ fontSize: "1.1rem" }}>
        Homepage content
      </h2>
      <p style={styles.note}>The V10 design is fixed in code. Here you edit approved text only: Save draft → Preview → Publish.</p>
      <div role="tablist" style={styles.tabs}>
        {TABS.map(name => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} style={styles.tab(tab === name)} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>
      {state.status === "loading" && <p>Loading content…</p>}
      {state.status === "error" && <p role="alert">Unable to load content. Please refresh.</p>}
      {state.status === "ready" && tab === "Projects" && <ProjectsTab data={state.data} reload={load} />}
      {state.status === "ready" && tab === "Contact" && <ContactTab key={state.data.contact.draftRevisionId ?? "none"} data={state.data} reload={load} />}
      {tab === "Profile / Home" && (
        <DeferredNotice title="Profile / Home">
          The homepage introduction is part of the V10 design artifact. Editing it needs a revised design artifact that exposes this text to the content
          system (deferred: RFC-022 Tier 2).
        </DeferredNotice>
      )}
      {tab === "About" && <DeferredNotice title="About">The V10 design has no About section. Adding one is a design change, not content editing.</DeferredNotice>}
      {tab === "Navigation" && (
        <DeferredNotice title="Navigation">
          Destinations are fixed in the design (Systems, Projects, Research, Contact). Editing labels needs the revised design artifact (deferred: RFC-022 Tier 2).
        </DeferredNotice>
      )}
    </section>
  );
}
