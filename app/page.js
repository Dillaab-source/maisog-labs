const projects = [
  {
    number: "01",
    title: "ClinicFlow",
    text: "Smarter appointment workflows for clinics.",
    image:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85",
  },
  {
    number: "02",
    title: "Eternal Eggs",
    text: "A practical venture exploring agriculture and growth.",
    image:
      "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=1200&q=85",
  },
  {
    number: "03",
    title: "Automation Hub",
    text: "Systems, integrations, and workflow experiments.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85",
  },
  {
    number: "04",
    title: "Paulo Maisog",
    text: "Portfolio, process, and what I’m building next.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
  },
];

const process = [
  ["01", "⌕", "Understand", "Listen, research, and define what actually matters."],
  ["02", "⚗", "Test", "Try simple solutions, validate assumptions, learn quickly."],
  ["03", "◇", "Build", "Turn working ideas into useful systems."],
  ["04", "↻", "Refine", "Improve, simplify, and make it more valuable over time."],
];

function Logo({ dark = false }) {
  return (
    <div className={`logo ${dark ? "dark" : ""}`}>
      <div className="logo-word">MAISOG</div>
      <div className="logo-sub">LABS</div>
      <span className="logo-orbit" />
      <span className="logo-star" />
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <section className="hero" id="home">
        <div className="hero-left">
          <div className="hero-noise" />
          <Logo />
          <div className="hero-copy">
            <p className="eyebrow light">REAL IDEAS.<br />A BRIGHTER TOMORROW.</p>
            <h1>Ideas into<br />systems.</h1>
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
            <article className="project-card" key={project.number}>
              <div
                className="project-image"
                style={{ backgroundImage: `url("${project.image}")` }}
              >
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
            {process.map(([num, icon, title, text], idx) => (
              <div className={`process-item ${idx ? "with-divider" : ""}`} key={num}>
                <span className="process-num">{num}</span>
                <span className="process-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
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
            <a href="mailto:hello@maisoglabs.com">hello@maisoglabs.com</a>
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
