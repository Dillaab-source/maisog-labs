import Logo from "../../components/Logo";
import JobTrackerClient from "../../components/JobTrackerClient";
import styles from "./jobs.module.css";

export const metadata = {
  title: "Job Search | Maisog Labs",
  description: "Private job application dashboard for Maisog Labs.",
  robots: { index: false, follow: false, nocache: true },
};

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1rTFkw_g0OExqJOyhvsU-tOC5404FPTgmy3T1vpAshIo/edit";

export default function JobsPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.grid} aria-hidden="true" />
      <header className={styles.header}>
        <a className={styles.brand} href="https://maisoglabs.com" aria-label="Maisog Labs home">
          <Logo name="Maisog Labs" />
        </a>
        <div className={styles.headerMeta}>
          <span>PRIVATE TOOL</span>
          <strong>JOB SEARCH</strong>
        </div>
      </header>

      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>MAISOGLABS / OPERATIONS</p>
          <h1>Job search,<br /><em>under control.</em></h1>
        </div>
        <div className={styles.introCopy}>
          <p>Track applications, employer replies, follow-ups, and visa notes without losing the thread.</p>
          <a href={SHEET_URL} target="_blank" rel="noreferrer">Open source sheet ↗</a>
        </div>
      </section>

      <JobTrackerClient sheetUrl={SHEET_URL} />

      <footer className={styles.footer}>
        <span>Maisog Labs / Job Tracker V1</span>
        <a href="https://maisoglabs.com">Back to Maisog Labs ↗</a>
      </footer>
    </main>
  );
}
