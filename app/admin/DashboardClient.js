"use client";

// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-015 / D-025) read-only
// dashboard client component. This is the ONE bounded client component
// authorized by this increment (AS15-F009): it fetches the single
// authorized same-origin endpoint (GET /admin/api/dashboard) and renders
// status only. It imports no D1/server/repository module, no SQL, and no
// binding of any kind — it is ordinary client-side React using `fetch`.
// It contains no create/edit/save/delete/publish/unpublish/upload/theme/
// journal/audit control of any kind, hidden or visible.
import { useEffect, useState } from "react";

const STATE_LABELS = {
  published: "Published",
  draft: "Draft",
  published_with_draft: "Published (draft pending)",
  archived: "Archived",
};

function StatusEntry({ item }) {
  return (
    <li>
      <strong>{item.displayLabel}</strong>
      {" — "}
      {STATE_LABELS[item.state] ?? item.state}
      {item.slug ? ` · slug: ${item.slug}` : ""}
      {typeof item.visible === "boolean" ? ` · ${item.visible ? "visible" : "hidden"}` : ""}
    </li>
  );
}

function Section({ title, items }) {
  if (!items) return null;
  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2 style={{ fontSize: "1.1rem" }}>{title}</h2>
      {items.length === 0 ? (
        <p>No entries.</p>
      ) : (
        <ul>
          {items.map(item => (
            <StatusEntry key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DashboardClient() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/admin/api/dashboard", { headers: { Accept: "application/json" } })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Dashboard request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch(error => {
        if (!cancelled) setState({ status: "error", data: null, error: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p>Loading dashboard status…</p>;
  }

  if (state.status === "error") {
    return <p role="alert">Unable to load dashboard status. Please refresh.</p>;
  }

  const { data } = state;

  return (
    <div>
      {data.siteSettings && (
        <section>
          <h2 style={{ fontSize: "1.1rem" }}>Site settings</h2>
          <ul>
            <StatusEntry item={data.siteSettings} />
          </ul>
        </section>
      )}
      <Section title="Navigation" items={data.navigation} />
      <Section title="Foundations" items={data.foundations} />
      <Section title="Projects" items={data.projects} />
      <Section title="Services" items={data.services} />
      <Section title="Process steps" items={data.processSteps} />
      <Section title="Sections" items={data.sections} />
    </div>
  );
}
