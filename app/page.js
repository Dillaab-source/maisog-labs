import Logo from "../components/Logo";
import { processSteps, projects, site } from "../data/site";

export default function Home() {
  return (
    <main>
      <section className="hero" id="home">
        <div className="hero-left">
          <div className="hero-noise" />
          <Logo />
          <div className="hero-copy">
            <p className="eyebrow light">REAL IDEAS.<br />A BRIGHTER TOMORROW.</p>
            <h1>{site.tagline.split(" ")[0]} into<br />systems.</h1>
            <p className="hero-description">
              A small studio exploring automation, digital systems, and practical
              experiments for a larger tomorrow.
            </p>
            <div className="hero-actions">
              <a className="btn btn-light" href="#projects">View Projects <span>→</span></a>
              <a className="btn btn-outline" href="#about">About Paulo</a>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <nav className="nav">
            <a href="#projects">Projects</a>
            <a href="#about">About</a>
            <a href="#process">Process</a>
            <a href="#contact">Contact</a>
            <span className="nav-line" />
          </nav>
          <div className="orbital-line" />
          <div className="orbital-dot" />
          <div className="side-copy">IDEAS<br />INTO<br />REALITY<span /></div>
          <p className="hero-micro">A SMALL STUDIO<br />FOR A LARGER TOMORROW.</p>
        </div>
      </section>

      <section className="stone section" id="projects">
        <div className="section-head">
          <div>
            <p className="eyebrow">SELECTED WORK <span className="short-line" /></p>
            <h2>Projects<br />for a brighter tomorrow.</h2>
          </div>
          <p className="section-intro">
            Independent projects exploring automation, digital systems, and real-world
            applications across different domains.
          </p>
          <a href="#" className="view-all">View all projects <span>→</span></a>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.slug}>
              <div className="project-image" style={{ backgroundImage: `url("${project.image}")` }}>
                <div className="project-index">{project.number}<span /></div>
              </div>
              <div className="project-body">
                <h3>{project.title}</h3>
                <p>{project.text}</p>
                <a href="#">View Project <span>→</span></a>
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
            <p className="process-motto">SAME CURIOSITY.<br />A MORE USEFUL TOMORROW.</p>
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

      <section className="about" id="about">
        <div className="portrait-block">
          <div className="portrait-overlay">
            <span>REPLACE WITH</span>
            <strong>PAULO.JPEG</strong>
          </div>
        </div>

        <div className="about-copy">
          <p className="eyebrow">ABOUT <span className="short-line" /></p>
          <h2>
            Resourceful, curious, and reliable —
            <br />
            focused on turning problems into working systems.
          </h2>
          <p>
            I’m Paulo Maisog, a builder and independent creator exploring automation,
            digital systems, and practical ventures. MAISOG LABS is where I turn ideas
            into real, useful outcomes.
          </p>
          <a className="btn btn-soft" href="#">Learn More About Me <span>→</span></a>
        </div>

        <div className="about-architecture">
          <div className="arch" />
          <div className="plant">✣</div>
          <p>SIMPLE SYSTEMS.<br />BRIGHTER<br />POSSIBILITIES.</p>
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
          <p>Let’s build brighter systems.<br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <div className="socials">
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="X">X</a>
            <a href="#" aria-label="YouTube">▶</a>
          </div>
        </div>

        <div className="copyright">© 2026 MAISOG LABS. ALL RIGHTS RESERVED.</div>
      </footer>
    </main>
  );
}
