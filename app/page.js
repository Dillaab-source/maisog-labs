import Logo from "../components/Logo";
import ProjectRail from "../components/ProjectRail";
import content from "../data/site.json";

const { about, processSteps, projects, site } = content;

export default function Home() {
  return (
    <main className="experience-shell">
      <div className="world" aria-hidden="true">
        <div className="world-image" />
        <div className="world-vignette" />
        <div className="world-grid" />
        <div className="orbit orbit-a" />
        <div className="orbit orbit-b" />
        <div className="contact-glow" />
      </div>

      <header className="topbar">
        <a className="brand-link" href="#home" aria-label="Maisog Labs home"><Logo /></a>
        <nav className="nav" aria-label="Primary navigation">
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#process">Process</a>
          <a href="#lab">Lab</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="talk-link" href={`mailto:${site.email}`}>Let&apos;s Talk <span>→</span></a>
      </header>

      <section className="scene hero-scene" id="home">
        <div className="hero-copy glass-panel">
          <p className="eyebrow">{site.eyebrow}</p>
          <h1>{site.tagline}</h1>
          <p className="hero-description">{site.description}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">View Projects <span>→</span></a>
            <a className="btn btn-ghost" href="#about">About Paulo</a>
          </div>
        </div>

        <button className="bridge-point" type="button" aria-label="Human and machine bridge">
          <span className="bridge-pulse" />
          <span className="bridge-label">IDEAS<br />INTO<br />REALITY</span>
        </button>

        <p className="human-note">HUMAN IDEAS<br />HIGHER POSSIBILITIES.</p>
        <p className="machine-note">SAME CURIOSITY.<br />A BRIGHTER TOMORROW.</p>
        <p className="bridge-manifesto">{site.bridgeLabel}</p>
        <a className="scroll-cue" href="#projects">SCROLL <span>↓</span></a>
      </section>

      <section className="scene floating-section projects-section" id="projects">
        <div className="section-heading glass-panel compact-panel">
          <p className="eyebrow">SELECTED WORK</p>
          <h2>Projects for a brighter tomorrow.</h2>
          <p>Independent projects exploring automation, intelligent workflows, practical systems, and real-world ventures.</p>
        </div>
        <ProjectRail projects={projects} />
      </section>

      <section className="scene floating-section process-section" id="process">
        <div className="section-heading glass-panel compact-panel">
          <p className="eyebrow">A DISCIPLINED APPROACH</p>
          <h2>How I work.</h2>
          <p>Good systems rarely begin with complicated technology. They begin with understanding the problem.</p>
        </div>

        <div className="process-orbit glass-panel">
          <div className="process-path" aria-hidden="true" />
          {processSteps.map((step) => (
            <article className="process-node" key={step.number}>
              <span className="process-index">{step.number}</span>
              <span className="process-symbol">{step.symbol}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scene floating-section about-section" id="about">
        <div className="about-panel glass-panel">
          <p className="eyebrow">ABOUT / PAULO MAISOG</p>
          <h2>{about.title}</h2>
          <p>{about.body}</p>
          <a className="text-link" href="#lab">Explore the Lab <span>→</span></a>
        </div>
      </section>

      <section className="scene floating-section lab-section" id="lab">
        <div className="lab-panel glass-panel">
          <p className="eyebrow">THE LAB</p>
          <h2>Not everything starts as a business.</h2>
          <p>
            Some projects begin as a question. Can this process be automated? Can these tools communicate?
            Can a small operation become more useful? Maisog Labs exists to explore those questions by building.
          </p>
          <p className="lab-statement">Build something real enough to learn from.</p>
        </div>
      </section>

      <footer className="scene footer-scene" id="contact">
        <div className="footer-panel glass-panel">
          <div>
            <Logo />
            <p className="footer-tag">IDEAS INTO SYSTEMS.</p>
          </div>
          <div className="footer-cta">
            <p className="eyebrow">LET&apos;S BUILD</p>
            <h2>Have an idea worth turning into a system?</h2>
            <a href={`mailto:${site.email}`}>{site.email} <span>→</span></a>
          </div>
          <div className="footer-meta">
            <a href="#projects">Projects</a>
            <a href="#about">About</a>
            <a href="#process">Process</a>
            <a href="#lab">Lab</a>
          </div>
        </div>
        <p className="copyright">© 2026 MAISOG LABS. BUILT WITH CURIOSITY.</p>
      </footer>
    </main>
  );
}
