import Logo from "../components/Logo";
import { processSteps, projects, site } from "../data/site";

export default function Home() {
  return (
    <main>
      <section className="hero hero-v2" id="home">
        <div className="hero-left">
          <div className="hero-noise" />
          <Logo />
          <div className="hero-copy">
            <p className="eyebrow light">{site.heroEyebrow}</p>
            <h1>{site.tagline}</h1>
            <p className="hero-description">{site.heroDescription}</p>
            <div className="hero-actions">
              <a className="btn btn-light" href="#projects">View Projects <span>→</span></a>
              <a className="btn btn-outline" href="#about">About Paulo</a>
            </div>
          </div>
        </div>

        <div className="hero-right hero-system-panel">
          <nav className="nav">
            <a href="#projects">Projects</a>
            <a href="#about">About</a>
            <a href="#process">Process</a>
            <a href="#contact">Contact</a>
            <span className="nav-line" />
          </nav>

          <div className="system-orbit system-orbit-a" />
          <div className="system-orbit system-orbit-b" />
          <div className="system-core">ML</div>
          <div className="system-label system-label-a">AUTOMATION</div>
          <div className="system-label system-label-b">SYSTEMS</div>
          <div className="system-label system-label-c">EXPERIMENTS</div>
          <p className="hero-micro">CLASSICAL DISCIPLINE<br />FUTURE SYSTEMS.</p>
        </div>
      </section>

      <section className="stone section" id="projects">
        <div className="section-head">
          <div>
            <p className="eyebrow">SELECTED WORK <span className="short-line" /></p>
            <h2>Projects<br />for a brighter tomorrow.</h2>
          </div>
          <p className="section-intro">
            Independent projects exploring automation, digital systems, and practical
            applications across different domains.
          </p>
          <a href="#projects" className="view-all">Browse work <span>→</span></a>
        </div>

        <div className="project-grid project-grid-v2">
          {projects.map((project) => (
            <article className="project-card project-card-v2" key={project.slug}>
              <div className="project-card-meta">
                <span>{project.number}</span>
                <span>{project.category}</span>
              </div>
              <div className="project-image" style={{ backgroundImage: `url("${project.image}")` }} />
              <div className="project-body">
                <h3>{project.title}</h3>
                <p>{project.text}</p>
                <div className="project-stack">{project.stack}</div>
                <a href="#">View case study <span>→</span></a>
              </div>
            </article>
          ))}
        </div>

        <section className="process" id="process">
          <div className="process-title-row">
            <div>
              <p className="eyebrow">A DISCIPLINED APPROACH</p>
              <h2>How I Work <span className="title-line" /></h2>
            </div>
            <p className="process-motto">CURIOUS ENOUGH TO EXPLORE.<br />DISCIPLINED ENOUGH TO SHIP.</p>
          </div>

          <div className="process-grid">
            {processSteps.map((step, idx) => (
              <div className={`process-item ${idx ? "with-divider" : ""}`} key={step.number}>
                <span className="process-num">{step.number}</span>
                <span className="process-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="about about-v2" id="about">
        <div className="portrait-placeholder" aria-label="Portrait placeholder">
          <span>PORTRAIT AREA</span>
          <strong>UPLOAD LATER</strong>
        </div>

        <div className="about-copy">
          <p className="eyebrow">ABOUT <span className="short-line" /></p>
          <h2>
            Resourceful, curious, and reliable —
            <br />
            focused on turning problems into working systems.
          </h2>
          <p>
            I’m Paulo Maisog, an independent builder exploring automation, AI-enabled
            workflows, and practical digital systems. Maisog Labs is where those ideas
            become real, testable work.
          </p>
          <a className="btn btn-soft" href="#projects">Explore the work <span>→</span></a>
        </div>

        <div className="about-architecture">
          <div className="arch" />
          <p>CLASSICAL FORM.<br />MODERN SYSTEMS.</p>
        </div>
      </section>

      <footer className="footer stone" id="contact">
        <div className="footer-brand">
          <Logo dark />
          <p>IDEAS INTO SYSTEMS.</p>
        </div>

        <div className="footer-links">
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer-contact">
          <p>
            Let’s build brighter systems.<br />
            <span className="muted-contact">Contact details coming soon.</span>
          </p>
        </div>

        <div className="copyright">© 2026 MAISOG LABS. ALL RIGHTS RESERVED.</div>
      </footer>
    </main>
  );
}
