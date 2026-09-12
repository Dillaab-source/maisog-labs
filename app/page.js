import { site } from "../data/site";

export default function Home() {
  return (
    <main className="foundation-shell">
      <header className="site-header">
        <a className="temporary-wordmark" href="#home" aria-label="Maisog Labs home">
          MAISOG LABS
        </a>
        <a className="contact-link" href={`mailto:${site.email}`}>Contact</a>
      </header>

      <section className="foundation-content" id="home">
        <p className="eyebrow">INDEPENDENT TECHNOLOGY LAB</p>
        <h1>Ideas into<br />useful systems.</h1>
        <p className="intro">
          Maisog Labs builds practical automation, secure digital systems,
          and human-centered AI experiences.
        </p>
        <a className="primary-link" href={`mailto:${site.email}`}>
          Start a conversation <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="site-footer">
        <span>MAISOG LABS</span>
        <span>MAHAPLAG, LEYTE · PHILIPPINES</span>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
