import Image from "next/image";
import Link from "next/link";
import "./clinicflow.css";

export const metadata = {
  title: "ClinicFlow — Maisog Labs",
  description:
    "ClinicFlow turns natural patient requests into verified appointments in the clinic's real calendar.",
  alternates: { canonical: "/projects/clinicflow" },
  openGraph: {
    title: "ClinicFlow — Conversational Appointment Engine",
    description:
      "A case study in separating AI interpretation from deterministic booking and calendar proof.",
    type: "article",
  },
};

const architecture = [
  "Patient",
  "Messenger",
  "AI intent",
  "Booking core",
  "Availability",
  "Patient confirmation",
  "Revalidation",
  "Google Calendar",
  "Read-back verification",
];

const evidence = [
  {
    number: "01",
    featured: true,
    kind: "3,000-call reliability benchmark · real model execution",
    title: "3,000-call reliability benchmark",
    detail:
      "Initial frozen verdict: FAIL. 3,000 real model calls completed with 0 skipped calls and 0 API errors. Schema validity reached 100%, while service accuracy was 97.45% against the frozen 98% gate and emergency recall was 39/40. After a targeted no-call safety fix, offline replay reached 40/40 emergency recall; the service-accuracy gate remains open.",
    result:
      "Initial frozen verdict: FAIL · $0.3408 model cost · 6.68M input tokens · 5.31M cached · 300K output · p95 latency 2.87s",
  },
  {
    number: "02",
    featured: true,
    kind: "Google Calendar provider run",
    title: "15 of 15 provider cases passed",
    detail:
      "Real free/busy checks, exact-slot rechecks, event creation, retries, provider conflicts, uncertain outcomes, and read-back were exercised against a dedicated test calendar. Wrong, duplicate, unconfirmed, and false-success outcomes were each 0.",
    result: "15 / 15 · dedicated test calendar",
  },
  {
    number: "03",
    kind: "Same-slot exclusion · local integration",
    title: "18 contested pairs; 0 double bookings",
    detail:
      "Across 3 runs, forced and natural contenders competed for the same slots. Each pair had one canonical winner, with 0 loser provider creates and 0 false success. Scope: one n8n instance, SQLite, and a mock calendar.",
    result: "18 pairs · 3 runs · local test environment",
  },
  {
    number: "04",
    kind: "State-kernel recovery run",
    title: "12 of 12 checks passed after restart",
    detail:
      "The F2 state-kernel run checked isolation, duplicate and stale-message rejection, concurrent-write protection, invalid-schema handling, and state persistence across a server-process restart.",
    result: "12 / 12 · normal build · post-restart run",
  },
  {
    number: "05",
    kind: "Benchmark negative controls",
    title: "7 of 7 controls failed as designed",
    detail:
      "Each targeted control removed one protection—such as consent, offer binding, availability truth, or conversation isolation—and the frozen benchmark detected its intended invariant failure.",
    result: "7 / 7 targeted controls detected",
  },
  {
    number: "06",
    kind: "Controlled Messenger tester",
    title: "A real booking completed",
    detail:
      "One Development-mode tester completed a booking. An identity collision was detected and contained fail-closed; a targeted fix was verified. The test window was then closed.",
    result: "1 booking verified · window closed",
  },
  {
    number: "07",
    kind: "Isolated Messenger simulation",
    title: "12 of 12 interaction checks passed",
    detail:
      "Duplicate delivery, stale and tampered actions, rapid message fragments, handoff, concurrency, and conversation isolation were checked with mock model and send services.",
    result: "12 / 12 · isolated simulation",
  },
];

function SectionHeading({ index, label, title, emphasis, children }) {
  return (
    <div className="cf-section-heading">
      <span className="cf-kicker">{index} / {label}</span>
      <div>
        <h2>{title} <strong>{emphasis}</strong></h2>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}

export default function ClinicFlowPage() {
  return (
    <main className="clinicflow-page">
      <a className="cf-skip" href="#main-content">Skip to content</a>
      <header className="cf-wrap cf-topbar">
        <Link className="cf-wordmark" href="/" aria-label="Maisog Labs home">
          MAISOG<span>LABS</span>
        </Link>
        <Link className="cf-toplink" href="/#projects">← Projects</Link>
      </header>

      <div id="main-content">
        <section className="cf-hero cf-wrap" aria-labelledby="cf-title">
          <div className="cf-kicker"><span /> Maisog Labs · AI automation · Case study</div>
          <div className="cf-hero-grid">
            <div>
              <p className="cf-index">SYSTEMS CASE STUDY <span>01 / 04</span></p>
              <h1 id="cf-title">Clinic<span>Flow</span></h1>
              <p className="cf-subtitle">Conversational Appointment Engine</p>
              <p className="cf-lede">
                ClinicFlow is a conversational appointment engine that turns natural patient requests into verified appointments in the clinic&apos;s real calendar.
              </p>
              <div className="cf-cta">
                <a className="cf-button cf-button-primary" href="#real-system">Follow the evidence <span aria-hidden="true">↓</span></a>
                <a className="cf-button" href="#architecture">View architecture <span aria-hidden="true">↗</span></a>
              </div>
            </div>
            <aside className="cf-hero-proof" aria-label="Architecture principle">
              <span className="cf-kicker">THE TRANSACTION BOUNDARY</span>
              <p>AI understands the patient.</p>
              <p><strong>ClinicFlow controls the appointment.</strong></p>
              <p>Calendar proves the result.</p>
              <div className="cf-proof-rule"><span>INTERPRET</span><i /><span>COMMIT</span><i /><span>VERIFY</span></div>
            </aside>
          </div>
          <div className="cf-proofline" aria-label="Evidence overview">
            <span>Controlled tester · verified booking</span>
            <span>Google Calendar · provider cases passed</span>
            <span>Messenger simulation · 12/12 checks passed</span>
          </div>
        </section>

        <section className="cf-section" id="problem">
          <div className="cf-wrap">
            <SectionHeading index="01" label="The problem" title="Useful language models need" emphasis="hard boundaries.">
              Patients explain what they need in their own words. A model can interpret the request, but it should not decide whether a real appointment exists.
            </SectionHeading>
            <div className="cf-problem-grid">
              <article><span>01 — INPUT</span><h3>People speak naturally</h3><p>Service, timing, and preferences arrive as conversation, often in fragments.</p></article>
              <article><span>02 — INTERPRETATION</span><h3>AI structures intent</h3><p>Structured intent gives the booking system a clear request and a useful next step.</p></article>
              <article><span>03 — AUTHORITY</span><h3>The calendar is evidence</h3><p>Current availability, explicit confirmation, and provider read-back establish a booking.</p></article>
            </div>
          </div>
        </section>

        <section className="cf-section" id="architecture">
          <div className="cf-wrap">
            <SectionHeading index="02" label="How it works" title="A request moves through" emphasis="verified transitions.">
              Messenger and the AI model act as adapters. A deterministic booking core owns the draft, confirmation gate, provider call, and success criteria.
            </SectionHeading>
            <figure className="cf-architecture-figure">
              <div className="cf-architecture-scroll" tabIndex={0} aria-label="Scrollable architecture diagram">
                <Image
                  src="/projects/clinicflow/clinicflow-architecture.svg"
                  alt="ClinicFlow flow: patient request, Messenger adapter, structured AI intent, deterministic booking core, calendar availability, patient confirmation, provider revalidation, Google Calendar event, and read-back verification."
                  width={1120}
                  height={520}
                  priority
                  unoptimized
                />
              </div>
              <figcaption><span>FIG. 01 — BOOKING PATH</span><span>Interpretation is probabilistic · commitment is deterministic</span></figcaption>
            </figure>
            <ol className="cf-flow-list" aria-label="Booking stages">
              {architecture.map((step, index) => (
                <li key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="cf-section" id="real-system">
          <div className="cf-wrap">
            <SectionHeading index="03" label="Real system" title="What the evidence" emphasis="actually proves.">
              Results are shown by evidence class. These are controlled tester and provider runs, not a claim that an unrestricted public demo is live.
            </SectionHeading>
            <div className="cf-evidence-grid">
              {evidence.map((item) => (
                <article className={`cf-evidence-card${item.featured ? " cf-evidence-card-featured" : ""}`} key={item.number}>
                  <div className="cf-evidence-top"><span>{item.number} / EVIDENCE</span><span className="cf-evidence-mark" aria-hidden="true">↗</span></div>
                  <p className="cf-evidence-kind">{item.kind}</p>
                  <h3>{item.title}</h3>
                  <p className="cf-evidence-detail">{item.detail}</p>
                  <p className="cf-evidence-result"><span aria-hidden="true">●</span> {item.result}</p>
                </article>
              ))}
            </div>
            <div className="cf-note"><span>CAPTURE NOTE</span><p>The original tester window is closed and no sanitized Messenger or Calendar screenshots were present in the approved evidence set. No control-plane screen or synthetic product screenshot is presented as a real capture.</p></div>
          </div>
        </section>

        <section className="cf-section" id="engineering">
          <div className="cf-wrap">
            <SectionHeading index="04" label="Engineering" title="Protect the transaction at" emphasis="every boundary.">
              The model proposes structured intent. ClinicFlow checks the current state and provider truth before it changes the calendar.
            </SectionHeading>
            <div className="cf-engineering-grid">
              <ul>
                <li>Structured AI intent with a bounded schema</li>
                <li>Availability read from the calendar provider</li>
                <li>Explicit confirmation bound to the current offer</li>
                <li>Duplicate-message and replay protection</li>
                <li>Slot claims for same-slot contention</li>
              </ul>
              <ul>
                <li>Provider revalidation before event creation</li>
                <li>Deterministic event identity for retries</li>
                <li>Read-back and overlap check before success</li>
                <li>Rescheduling and cancellation paths</li>
                <li>Fail-closed handoff and recovery records</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="cf-principle" aria-labelledby="cf-principle-title">
          <div className="cf-wrap">
            <span className="cf-kicker">05 / ARCHITECTURE PRINCIPLE</span>
            <h2 id="cf-principle-title">AI understands the patient.<br /><strong>ClinicFlow controls the appointment.</strong><br />Calendar proves the result.</h2>
            <p>The model turns conversation into structured intent. The booking core validates and commits state. The connected calendar remains the source of truth for availability and the proof of a confirmed appointment.</p>
          </div>
        </section>

        <section className="cf-section cf-tech-section" id="technology">
          <div className="cf-wrap">
            <SectionHeading index="06" label="Technology" title="A small set of" emphasis="clear boundaries." />
            <div className="cf-tech-row">
              <span><strong>n8n</strong> Workflow orchestration</span>
              <span><strong>Google Calendar API</strong> Availability and event provider</span>
              <span><strong>Messenger / Meta</strong> Conversation adapter</span>
              <span><strong>REST + webhooks</strong> Provider boundaries</span>
              <span><strong>LLM</strong> Structured intent interpretation</span>
            </div>
            <p className="cf-scope"><span>DEMONSTRATION SCOPE</span>The Messenger trial was limited to a Development-mode tester and has been shut down. Calendar checks used a dedicated test calendar. Public pages do not expose live endpoints or control-plane access.</p>
          </div>
        </section>
      </div>

      <footer className="cf-wrap cf-footer">
        <span>MAISOG LABS · CLINICFLOW</span>
        <span>Human judgment · Traceable systems</span>
        <Link href="/#projects">Back to Maisog Labs ↗</Link>
      </footer>
    </main>
  );
}
