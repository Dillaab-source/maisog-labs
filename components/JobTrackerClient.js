"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../app/jobs/jobs.module.css";

const CLOSED = new Set(["Rejected", "Withdrawn", "Closed"]);
const LIVE = new Set(["Applied", "Acknowledged", "Recruiter Reply", "Interview", "Assessment", "Offer"]);

const statusTone = {
  "To Apply": styles.statusNeutral,
  Applied: styles.statusApplied,
  Acknowledged: styles.statusAcknowledged,
  "Recruiter Reply": styles.statusReply,
  Interview: styles.statusPositive,
  Assessment: styles.statusPositive,
  Offer: styles.statusPositive,
  Rejected: styles.statusClosed,
  Withdrawn: styles.statusClosed,
  Closed: styles.statusClosed,
};

function display(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-NZ", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function normalizePayload(payload) {
  return {
    source: payload?.source || "snapshot",
    warning: payload?.warning || "",
    generatedAt: payload?.generatedAt || null,
    applications: Array.isArray(payload?.applications) ? payload.applications : [],
    responses: Array.isArray(payload?.responses) ? payload.responses : [],
    jobDetails: Array.isArray(payload?.jobDetails) ? payload.jobDetails : [],
  };
}

export default function JobTrackerClient({ sheetUrl }) {
  const [payload, setPayload] = useState(() => normalizePayload(null));
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const live = await fetch("/api/jobs", { cache: "no-store" });
      if (!live.ok) throw new Error(`API ${live.status}`);
      const next = normalizePayload(await live.json());
      setPayload(next);
      setSelectedId((current) => current || next.applications[0]?.jobId || null);
    } catch {
      try {
        const fallback = await fetch("/jobs-data.json", { cache: "no-store" });
        if (!fallback.ok) throw new Error(`snapshot ${fallback.status}`);
        const next = normalizePayload(await fallback.json());
        next.warning = next.warning || "Live Google Sheets sync is not configured; showing the bundled tracker snapshot.";
        setPayload(next);
        setSelectedId((current) => current || next.applications[0]?.jobId || null);
      } catch {
        setLoadError("Tracker data could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const detailById = useMemo(
    () => Object.fromEntries(payload.jobDetails.map((item) => [item.jobId, item])),
    [payload.jobDetails],
  );

  const responsesById = useMemo(() => {
    const grouped = {};
    for (const response of payload.responses) {
      (grouped[response.jobId] ||= []).push(response);
    }
    for (const list of Object.values(grouped)) {
      list.sort((a, b) => `${b.date || ""} ${b.timePht || ""}`.localeCompare(`${a.date || ""} ${a.timePht || ""}`));
    }
    return grouped;
  }, [payload.responses]);

  const metrics = useMemo(() => {
    const apps = payload.applications;
    return {
      tracked: apps.length,
      live: apps.filter((item) => LIVE.has(item.status)).length,
      replies: apps.filter((item) => ["Acknowledged", "Recruiter Reply", "Interview", "Assessment", "Offer"].includes(item.status)).length,
      interviews: apps.filter((item) => item.status === "Interview").length,
      needsAction: apps.filter((item) => item.status === "To Apply" || (!CLOSED.has(item.status) && item.nextAction)).length,
    };
  }, [payload.applications]);

  const filtered = useMemo(() => payload.applications.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Needs action") return item.status === "To Apply" || Boolean(item.nextAction);
    if (filter === "Live") return LIVE.has(item.status);
    if (filter === "Replies") return ["Acknowledged", "Recruiter Reply", "Interview", "Assessment", "Offer"].includes(item.status);
    return true;
  }), [filter, payload.applications]);

  const selected = payload.applications.find((item) => item.jobId === selectedId) || filtered[0] || payload.applications[0];
  const selectedDetail = selected ? detailById[selected.jobId] : null;
  const selectedResponses = selected ? (responsesById[selected.jobId] || []) : [];

  if (loadError) {
    return <section className={styles.errorPanel}><strong>Tracker unavailable.</strong><p>{loadError}</p><button onClick={load}>Retry</button></section>;
  }

  return (
    <>
      <section className={styles.metrics} aria-label="Application summary">
        <Metric label="Tracked" value={metrics.tracked} />
        <Metric label="Live" value={metrics.live} />
        <Metric label="Replies" value={metrics.replies} />
        <Metric label="Interviews" value={metrics.interviews} />
        <Metric label="Needs action" value={metrics.needsAction} />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filters} aria-label="Filter applications">
          {["All", "Needs action", "Live", "Replies"].map((label) => (
            <button key={label} className={filter === label ? styles.filterActive : ""} onClick={() => setFilter(label)}>{label}</button>
          ))}
        </div>
        <div className={styles.syncState}>
          <span className={payload.source === "google_sheets" ? styles.liveDot : styles.snapshotDot} aria-hidden="true" />
          <span>{loading ? "Syncing…" : payload.source === "google_sheets" ? "Live Google Sheets" : "Snapshot mode"}</span>
          <button onClick={load} disabled={loading}>Refresh</button>
        </div>
      </section>

      {payload.warning ? <div className={styles.warning}>{payload.warning}</div> : null}

      <section className={styles.workspace}>
        <div className={styles.applicationList}>
          <div className={styles.listHeading}><span>APPLICATIONS</span><small>{filtered.length} shown</small></div>
          {filtered.map((item) => (
            <button
              className={`${styles.applicationCard} ${selected?.jobId === item.jobId ? styles.applicationCardActive : ""}`}
              key={item.jobId}
              onClick={() => setSelectedId(item.jobId)}
            >
              <div className={styles.cardTopline}><span>{item.jobId}</span><Status status={item.status} /></div>
              <strong>{item.company}</strong>
              <p>{item.role}</p>
              <div className={styles.cardMeta}><span>{display(item.location)}</span><span>{item.appliedDate ? formatDate(item.appliedDate) : "Not applied"}</span></div>
            </button>
          ))}
        </div>

        <article className={styles.detailPanel} aria-live="polite">
          {selected ? (
            <>
              <div className={styles.detailHeader}>
                <div><span className={styles.detailId}>{selected.jobId}</span><h2>{selected.company}</h2><p>{selected.role}</p></div>
                <Status status={selected.status} />
              </div>

              <div className={styles.factGrid}>
                <Fact label="Applied" value={selected.appliedDate ? `${formatDate(selected.appliedDate)}${selected.appliedTimePht ? ` · ${selected.appliedTimePht} PHT` : ""}` : "Not yet"} />
                <Fact label="Location" value={selected.location} />
                <Fact label="Priority" value={selected.priority} />
                <Fact label="Contact" value={selected.employerContact} />
                <Fact label="Follow-up" value={selected.followUpDate ? formatDate(selected.followUpDate) : "Not scheduled"} />
                <Fact label="Resume" value={selected.resumeVersion} />
              </div>

              <section className={styles.detailSection}>
                <div className={styles.sectionTitle}><span>NEXT ACTION</span></div>
                <p className={styles.nextAction}>{display(selected.nextAction, "No action queued.")}</p>
              </section>

              <section className={styles.detailSection}>
                <div className={styles.sectionTitle}><span>WHY THIS ROLE</span></div>
                <p>{display(selectedDetail?.detailedFit, selected.notes)}</p>
              </section>

              <section className={styles.detailSection}>
                <div className={styles.sectionTitle}><span>VISA + LICENSING</span></div>
                <div className={styles.twoCol}>
                  <div><small>WORK RIGHTS</small><p>{display(selected.visaWorkRights || selectedDetail?.offshoreVisaPosition)}</p></div>
                  <div><small>LICENSING</small><p>{display(selected.coaLicensing || selectedDetail?.licensingTraining)}</p></div>
                </div>
              </section>

              <section className={styles.detailSection}>
                <div className={styles.sectionTitle}><span>RESPONSE TIMELINE</span><small>{selectedResponses.length} event{selectedResponses.length === 1 ? "" : "s"}</small></div>
                {selectedResponses.length ? (
                  <div className={styles.timeline}>
                    {selectedResponses.map((response) => (
                      <div className={styles.timelineItem} key={response.responseId}>
                        <div><time>{formatDate(response.date)}{response.timePht ? ` · ${response.timePht}` : ""}</time><strong>{response.type}</strong></div>
                        <p>{response.summary}</p>
                        {response.gmailLink ? <a href={response.gmailLink} target="_blank" rel="noreferrer">Open Gmail ↗</a> : null}
                      </div>
                    ))}
                  </div>
                ) : <p className={styles.empty}>No employer response logged yet.</p>}
              </section>

              <div className={styles.detailActions}>
                {selected.sourceJobUrl ? <a href={selected.sourceJobUrl} target="_blank" rel="noreferrer">Open source ↗</a> : null}
                <a href={sheetUrl} target="_blank" rel="noreferrer">Edit in Google Sheets ↗</a>
              </div>
            </>
          ) : <p className={styles.empty}>No applications match this filter.</p>}
        </article>
      </section>
    </>
  );
}

function Metric({ label, value }) {
  return <div className={styles.metric}><span>{label}</span><strong>{value}</strong></div>;
}

function Status({ status }) {
  return <span className={`${styles.status} ${statusTone[status] || styles.statusNeutral}`}>{status || "Unknown"}</span>;
}

function Fact({ label, value }) {
  return <div className={styles.fact}><small>{label}</small><span>{display(value)}</span></div>;
}
