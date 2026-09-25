"use client";

// Research surface (plan §8): real published Journal data only, from the
// existing public read-only Worker routes GET /api/journal and
// GET /api/journal/:slug (WEB-INC-006). No fallback or example entries.
// Entry order is the API's own newest-first order. Bodies render as plain
// text only, exactly like app/journal/JournalClient.js. The index is fetched
// the first time the surface is opened, not on Entry.
import { useCallback, useEffect, useState } from "react";

function formatPublishedAt(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return value;
  }
}

function getJson(url) {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`journal request failed (${response.status})`);
    return response.json();
  });
}

export default function ResearchSurface({ active }) {
  const [index, setIndex] = useState({ status: "idle", entries: [] });
  const [attempt, setAttempt] = useState(0);
  const [slug, setSlug] = useState(null);
  const [detail, setDetail] = useState({ status: "idle", entry: null });

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    setIndex({ status: "loading", entries: [] });
    getJson("/api/journal")
      .then(body => {
        if (cancelled) return;
        const entries = Array.isArray(body?.entries) ? body.entries : null;
        if (!entries) throw new Error("unexpected journal payload");
        setIndex({ status: entries.length ? "success" : "empty", entries });
      })
      .catch(() => {
        if (!cancelled) setIndex({ status: "error", entries: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [active, attempt]);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    setDetail({ status: "loading", entry: null });
    getJson(`/api/journal/${encodeURIComponent(slug)}`)
      .then(entry => {
        if (!cancelled) setDetail({ status: "success", entry });
      })
      .catch(() => {
        if (!cancelled) setDetail({ status: "error", entry: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);

  return (
    <div className="research-layout" data-journal-state={index.status}>
      <p className="surface-lead">Published entries from the MaisogLabs journal, newest first.</p>
      <div className="research-status" role="status">
        {index.status === "loading" && <p className="quiet">Loading journal entries…</p>}
        {index.status === "empty" && <p className="quiet">No journal entries have been published yet.</p>}
        {index.status === "error" && (
          <p className="quiet">The journal could not be loaded right now. <button type="button" className="inline-action" onClick={retry}>Try again</button></p>
        )}
      </div>
      {index.status === "success" && (
        <div className="research-columns">
          <ul className="research-list" aria-label="Journal entries">
            {index.entries.map(entry => (
              <li key={entry.slug}>
                <button type="button" className="research-entry" aria-pressed={slug === entry.slug} onClick={() => setSlug(entry.slug)}>
                  <time dateTime={entry.publishedAt}>{formatPublishedAt(entry.publishedAt)}</time>
                  <span className="research-title">{entry.title}</span>
                  <span className="research-summary">{entry.summary}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="research-reader" aria-live="polite">
            {!slug && <p className="quiet">Select an entry to read it here.</p>}
            {detail.status === "loading" && <p className="quiet">Loading entry…</p>}
            {detail.status === "error" && <p className="quiet">That journal entry is not available.</p>}
            {detail.status === "success" && detail.entry && (
              <article>
                <time dateTime={detail.entry.publishedAt}>{formatPublishedAt(detail.entry.publishedAt)}</time>
                <h3>{detail.entry.title}</h3>
                <p className="research-summary">{detail.entry.summary}</p>
                <p className="research-body">{detail.entry.body}</p>
                <a className="inline-action" href={`/journal?slug=${encodeURIComponent(detail.entry.slug)}`}>Open in Journal <span aria-hidden="true">↗</span></a>
              </article>
            )}
          </div>
        </div>
      )}
      <a className="inline-action research-all" href="/journal">All journal entries <span aria-hidden="true">↗</span></a>
    </div>
  );
}
