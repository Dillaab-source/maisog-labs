import Logo from "../components/Logo";
import { processSteps, projects, site } from "../data/site";

function ProjectVisual({ project }) {
  const visualClass = `project-visual ${project.slug}`;
  return (
    <div className={visualClass} aria-hidden="true">
      <div className="visual-grid" />
      <div className="visual-orbit orbit-a" />
      <div className="visual-orbit orbit-b" />
      <div className="visual-node node-a" />
      <div className="visual-node node-b" />
      <div className="visual-node node-c" />
      <div className="visual-core">{project.number}</div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="v31-shell">
      <section className="v31-hero" id="home">
        <div className="space-layer" />
        <div className="earth-layer" />
        <div className="architecture-layer" />
        <div className="hero-vignette" />
        <div className="hero-grid" />
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <div className="hero-star hero-star-a" />
        <div className="hero-star hero-star-b" />

        <header className="v31-header">
          <a href="#home" className="brand-link" aria-label="Maisog Labs home">
            <Logo />
          </a>
          <nav className="v31-nav" aria-label="Primary navigation">
            <a href="#projects">Projects</a>
            <a href="#process">Process</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <a href="#projects" className="header-cta">Explore Work <span>→</span></a>
        </header>

        <aside className="left-manifesto" aria-hidden="true">
          <span>EXPLORE</span>
          <span>AUTOMATE</span>
          <span>LEARN</span>
          <span>BUILD</span>
          <span>GROW</span>
          <i />
        </aside>

        <section className="hero-center">
          <p className="hero-kicker">{site.eyebrow}</p>
          <div className="hero-brand-lockup">
            <div className="brand-orbit" />
            <div className="brand-star" />
            <h1>MAISOG</h1>
            <div className="labs-word">L A B S</div>
          </div>
          <h2>{site.tagline}</h2>
          <p className="hero-description">{site.description}</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#projects">Explore Projects <span>→</span></a>
            <a className="secondary-cta" href="#process">How I Build</a>
          </div>
        </section>

        <aside className="focus-card glass-panel">
          <span className="panel-label">CURRENT FOCUS</span>
          <div className="focus-row"><i className="status-dot" />Building real systems</div>
          <p>AI Automation · Integrations · Practical Experiments</p>
          <div className="mini-bars" aria-hidden="true"><i/><i/><i/><i/><i/></div>
        </aside>

        <aside className="system-card glass-panel">
          <div className="system-card-head">
            <span className="panel-label">SYSTEM STATUS</span>
            <span className="online"><i className="status-dot" />Online</span>
          </div>
          <dl>
            <div><dt>Projects</dt><dd>04</dd></div>
            <div><dt>Integrations</dt><dd>20+</dd></div>
            <div><dt>Experiments</dt><dd>∞</dd></div>
          </dl>
          <div className="status-bars" aria-hidden="true"><i/><i/><i/><i/><i/></div>
        </aside>

        <section className="projects-float" id="projects" aria-label="Featured projects">
          {projects.map((project) => (
            <article className="floating-project glass-panel" key={project.slug}>
              <div className="project-topline">
                <span className="project-number">{project.number}</span>
                <span>/</span>
                <span>{project.category}</span>
              </div>
              <ProjectVisual project={project} />
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <div className="stack-row">
                {project.stack.map((item) => <span key={item}>{item}</span>)}
              </div>
              <a href={`#${project.slug}`} className="project-link">View Project <span>→</span></a>
            </article>
          ))}
        </section>

        <section className="process-dock glass-panel" id="process" aria-label="Process">
          {processSteps.map((step) => (
            <div className="process-step" key={step.number}>
              <span className="process-icon">{step.icon}</span>
              <div>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="about-float glass-panel" id="about">
          <span className="panel-label">ABOUT MAISOG LABS</span>
          <h3>Brave enough to explore.<br/>Disciplined enough to build.</h3>
          <p>Maisog Labs is my independent technology lab for automation, AI systems, cybersecurity learning, and practical experiments.</p>
        </section>

        <footer className="v31-footer" id="contact">
          <div><strong>MAISOG LABS</strong><span>Ideas into systems.</span></div>
          <div className="footer-copy">© 2026 Maisog Labs. All rights reserved.</div>
        </footer>
      </section>
    </main>
  );
}
