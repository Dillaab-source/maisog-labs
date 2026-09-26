import { Suspense } from "react";
import Logo from "../../components/Logo";
import JournalClient from "./JournalClient";
// D-092: the pre-V10 site stylesheet, relocated so it loads on /journal only.
import "./journal.css";
import { getPublicContent } from "../../lib/content/local.mjs";

// WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 / ML-DEVOS-AS-028 / D-031):
// a statically exported shell (AS28-F011) — this file is an ordinary async
// server component reading only the existing static content module
// (`getPublicContent`, unrelated to D1), exactly like `app/page.js`. No D1
// module is imported here and no D1 access is attempted at build or
// request time. All journal data is fetched client-side, at runtime, by
// `JournalClient` below, from the two public read-only Worker routes.
//
// `useSearchParams` (used by JournalClient to read `?slug=`) requires a
// Suspense boundary during static export/prerendering — this wrapper is
// that boundary, not a data-loading concern.
export default async function JournalPage() {
  const { site } = await getPublicContent();
  return (
    <main className="v4-shell journal-shell">
      <div className="cinematic-background" aria-hidden="true" />
      <header className="site-header journal-page-header">
        <a className="header-brand" href="/" aria-label={`${site.name} home`}>
          <Logo name={site.name} />
        </a>
        <span />
        <a className="header-action" href="/">
          Back to site <span aria-hidden="true">↗</span>
        </a>
      </header>
      <section className="content-section journal-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Field notes</span>
            <h2>Journal</h2>
          </div>
          <p>Notes from the lab — published entries only, newest first.</p>
        </div>
        <Suspense fallback={<p className="journal-empty">Loading…</p>}>
          <JournalClient />
        </Suspense>
      </section>
    </main>
  );
}
