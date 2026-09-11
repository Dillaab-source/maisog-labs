import Logo from "../components/Logo";
import { processSteps, projects, site } from "../data/site";

function ProjectVisual({ project }) {
  if (project.slug === "clinicflow") {
    return (
      <div className="project-visual clinicflow-visual" aria-hidden="true">
        <div className="flow-line" />
        <span className="flow-node n1">CHAT</span>
        <span className="flow-node n2">AI</span>
        <span className="flow-node n3">BOOK</span>
        <span className="flow-node n4">CAL</span>
        <span className="flow-status">BOOKING_COMPLETE = TRUE</span>
      </div>
    );
  }

  if (project.slug === "automation-hub") {
    return (
      <div className="project-visual automation-visual" aria-hidden="true">
        <span className="auto-node a1">WEBHOOK</span>
        <span className="auto-node a2">ROUTE</span>
        <span className="auto-node a3">API</span>
        <span className="auto-node a4">ACTION</span>
        <i className="connector c1" />
        <i className="connector c2" />
        <i className="connector c3" />
      </div>
    );
  }

  if (project.slug === "cybersecurity-lab") {
    return (
      <div className="project-visual security-visual" aria-hidden="true">
        <span>&gt; endpoint_check --status</span>
        <span className="ok">✓ defender: active</span>
        <span>✓ dns: resolved</span>
        <span>✓ vpn: healthy</span>
        <span className="cursor">_</span>
      </div>
    );
  }

  return (
    <div className="project-visual experiment-visual" aria-hidden="true">
      <div className="experiment-orbit orbit-one" />
      <div className="experiment-orbit orbit-two" />
      <span className="experiment-core">LAB</span>
      <i className="experiment-dot d1" />
      <i className="experiment-dot d2" />
      <i className="experiment-dot d3" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="v312-shell">
      <section className="v312-stage" id="home">
        <div className="space-field" aria-hidden="true" />
        <div className="earth" aria-hidden="true">
          <div className="earth-glow" />
          <div className="earth-grid-lines" />
        </div>
        <div className="architecture-scene" aria-hidden="true">
          <div className="arch-ring" />
          <div className="column column-a" />
          <div className="column column-b" />
          <div className="column column-c" />
          <div className="pedestal" />
        </div>
        <div className="atmosphere" aria-hidden="true" />
        <div className="global-grid" aria-hidden="true" />
        <div className="sweep-orbit orbit-left" aria-hidden="true" />
        <div className="sweep-orbit orbit-right" aria-hidden="true" />

        <header className="site-header">
          <a href="#home" className="header-brand" aria-label="Maisog Labs home">
            <Logo />
          </a>
          <nav className="site-nav" aria-label="Primary navigation">
            <a href="#projects">Projects</a>
            <a href="#process">Process</a>
            <a href="#about">About</a>
            <a href={`mailto:${site.email}`}>Contact</a>
          </nav>
          <a className="header-action" href="#projects">Explore work <span>↗</span></a>
        </header>

        <aside className="manifesto" aria-hidden="true">
          <span>EXPLORE</span>
          <span>AUTOMATE</span>
          <span>LEARN</span>
          <span>BUILD</span>
          <span>GROW</span>
          <i />
        </aside>

        <section className="hero-copy">
          <p className="hero-eyebrow">{site.eyebrow}</p>
          <div className="hero-logo-wrap">
            <Logo />
          </div>
          <h1>{site.tagline}</h1>
          <p>{site.description}</p>
          <div className="hero-actions">
            <a className="hero-primary" href="#projects">Explore projects <span>→</span></a>
            <a className="hero-secondary" href="#process">See the process</a>
          </div>
        </section>

        <aside className="build-card float-panel">
          <span className="micro-label">CURRENT BUILD</span>
          <strong>ClinicFlow</strong>
          <p>AI receptionist · appointment logic · booking automation</p>
          <div className="build-meter"><i /><i /><i /><i /><i /></div>
        </aside>

        <aside className="status-card float-panel">
          <div className="status-head">
            <span className="micro-label">SYSTEM / 01</span>
            <span className="live"><i />LIVE</span>
          </div>
          <strong>Maisog Labs</strong>
          <dl>
            <div><dt>VERSION</dt><dd>V{site.version}</dd></div>
            <div><dt>FOCUS</dt><dd>AI + SYSTEMS</dd></div>
            <div><dt>MODE</dt><dd>BUILDING</dd></div>
          </dl>
        </aside>

        <section className="projects-zone" id="projects" aria-label="Featured projects">
          <div className="projects-heading">
            <span className="micro-label">SELECTED SYSTEMS</span>
            <strong>Work in motion.</strong>
          </div>

          <div className="project-layout">
            {projects.map((project, index) => (
              <article
                id={project.slug}
                className={`project-card float-panel project-${index + 1}`}
                key={project.slug}
              >
                <div className="project-meta">
                  <span>{project.number}</span>
                  <span>{project.category}</span>
                </div>
                <ProjectVisual project={project} />
                <div className="project-copy">
                  <h2>{project.title}</h2>
                  <p>{project.text}</p>
                  <div className="stack-list">
                    {project.stack.map((item) => <span key={item}>{item}</span>)}
                  </div>
                  <a href={`#${project.slug}`} aria-label={`View ${project.title}`}>View project <span>→</span></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="process-dock float-panel" id="process" aria-label="Maisog Labs process">
          {processSteps.map((step) => (
            <div className="process-item" key={step.number}>
              <span className="process-symbol">{step.icon}</span>
              <div>
                <span className="process-number">{step.number}</span>
                <strong>{step.title}</strong>
                <small>{step.text}</small>
              </div>
            </div>
          ))}
        </section>

        <section className="about-card float-panel" id="about">
          <span className="micro-label">ABOUT THE LAB</span>
          <h2>Brave enough to explore.<br />Disciplined enough to build.</h2>
          <p>Maisog Labs is an independent technology lab exploring AI automation, integrations, cybersecurity learning, and practical systems that solve real problems.</p>
          <a href={`mailto:${site.email}`}>Let&apos;s build something useful <span>→</span></a>
        </section>

        <footer className="stage-footer">
          <div>
            <strong>MAISOG LABS</strong>
            <span>Ideas into systems.</span>
          </div>
          <div className="footer-center">CLASSICAL DISCIPLINE · FUTURE TECHNOLOGY</div>
          <div>© 2026 MAISOG LABS</div>
        </footer>
      </section>
    </main>
  );
}
