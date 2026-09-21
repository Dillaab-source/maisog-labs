"use client";

// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031)
// public journal client component.
//
// This is the one client-interactive piece of the static `/journal` shell
// (app/journal/page.js). It never imports D1 code and never runs at build
// time — it only fetches the two public, unauthenticated, read-only Worker
// routes (GET /api/journal, GET /api/journal/:slug) at runtime, exactly as
// RFC-009 authorizes. Detail selection is a query parameter
// (`?slug=<slug>`) rather than a dynamic Next.js route, so no SSR
// conversion or per-entry static generation is required.
//
// Body is always rendered as escaped plain text — a `<p>` element's text
// content, never `dangerouslySetInnerHTML` — because journal bodies are
// plain text only in this increment (AS28-F006); there is nothing to
// interpret as HTML/Markdown.
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function formatPublishedAt(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return value;
  }
}

export default function JournalClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("slug");

  const [entries, setEntries] = useState(null);
  const [indexError, setIndexError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/journal")
      .then(response => {
        if (!response.ok) throw new Error("journal index request failed");
        return response.json();
      })
      .then(body => {
        if (!cancelled) setEntries(body.entries);
      })
      .catch(() => {
        if (!cancelled) setIndexError("The journal could not be loaded right now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    fetch(`/api/journal/${encodeURIComponent(selectedSlug)}`)
      .then(response => {
        if (!response.ok) throw new Error("journal entry not found");
        return response.json();
      })
      .then(body => {
        if (!cancelled) setDetail(body);
      })
      .catch(() => {
        if (!cancelled) setDetailError("That journal entry is not available.");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const openEntry = useCallback(
    slug => {
      router.push(`/journal?slug=${encodeURIComponent(slug)}`);
    },
    [router]
  );

  const closeEntry = useCallback(() => {
    router.push("/journal");
  }, [router]);

  if (selectedSlug) {
    return (
      <div className="journal-detail-view">
        <button type="button" className="journal-back" onClick={closeEntry}>
          <span aria-hidden="true">←</span> Back to journal
        </button>
        {detailLoading && <p className="journal-empty">Loading…</p>}
        {detailError && <p className="journal-empty">{detailError}</p>}
        {detail && (
          <article className="journal-detail">
            <time dateTime={detail.publishedAt}>{formatPublishedAt(detail.publishedAt)}</time>
            <h2>{detail.title}</h2>
            <p className="journal-summary">{detail.summary}</p>
            <p className="journal-body">{detail.body}</p>
          </article>
        )}
      </div>
    );
  }

  return (
    <div className="journal-index-view">
      {indexError && <p className="journal-empty">{indexError}</p>}
      {entries === null && !indexError && <p className="journal-empty">Loading…</p>}
      {entries !== null && entries.length === 0 && <p className="journal-empty">No journal entries have been published yet.</p>}
      {entries !== null && entries.length > 0 && (
        <div className="journal-index">
          {entries.map(entry => (
            <button type="button" className="journal-card" key={entry.slug} onClick={() => openEntry(entry.slug)}>
              <time dateTime={entry.publishedAt}>{formatPublishedAt(entry.publishedAt)}</time>
              <h3>{entry.title}</h3>
              <p>{entry.summary}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
