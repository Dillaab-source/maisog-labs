import BlueprintIcon from "../components/BlueprintIcon";
import Logo from "../components/Logo";
import ProjectRail from "../components/ProjectRail";
import { foundations, navigation, processSteps, projects, site } from "../data/site";

export default function Home() {
  return (
    <main className="v4-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="cinematic-background" aria-hidden="true" />
      <div className="blueprint-grid" aria-hidden="true" />
      <div className="blueprint-frame" aria-hidden="true"><i /><i /><i /><i /></div>

      <header className="site-header">
        <a className="header-brand" href="#home" aria-label="Maisog Labs home"><Logo /></a>
        <nav className="site-nav" aria-label="Primary navigation">
          {navigation.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <a className="header-action" href={`mailto:${site.email}`}>Start a conversation <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="home">
        <span className="coordinate coordinate-a" aria-hidden="true">PHILIPPINES · UTC+08</span>
        <span className="coordinate coordinate-b" aria-hidden="true">SYSTEM / {site.version}</span>
        <div className="hero-copy" id="main-content">
          <p className="eyebrow">{site.eyebrow}</p>
          <h1>Ideas made<br /><em>useful.</em></h1>
          <p className="hero-lead">{site.description}</p>
          <div className="hero-actions">
            <a className="primary-action" href="#projects">Explore the work <BlueprintIcon name="arrow" size={18} /></a>
            <a className="text-action" href={`mailto:${site.email}`}>Contact the lab</a>
          </div>
        </div>
        <aside className="human-ai-note"><span>THE BRIDGE / 01</span><p>Technology should extend human capability—not replace human purpose.</p></aside>
        <div className="contact-signal" aria-hidden="true"><i /><i /><i /></div>
        <nav className="foundation-dock" aria-label="Explore Maisog Labs">
          {foundations.map((item, index) => (
            <a href={item.href} key={item.label}>
              <span className="dock-number">0{index + 1}</span>
              <span className={`dock-icon tone-${index + 1}`}><BlueprintIcon name={item.icon} size={24} /></span>
              <span><strong>{item.label}</strong><small>{item.text}</small></span>
            </a>
          ))}
        </nav>
      </section>

      <section className="content-section projects-section" id="projects">
        <div className="section-heading">
          <div><span className="section-kicker">SELECTED SYSTEMS / 01—04</span><h2>Work in motion.</h2></div>
          <p>Practical experiments where people, automation, and resilient technology meet.</p>
        </div>
        <ProjectRail projects={projects} />
      </section>

      <section className="content-section process-section" id="process">
        <div className="section-heading compact-heading"><div><span className="section-kicker">METHOD / REPEATABLE BY DESIGN</span><h2>From question to system.</h2></div></div>
        <div className="process-grid">
          {processSteps.map((step) => (
            <article key={step.number}>
              <span className="process-index">{step.number}</span>
              <span className="process-icon"><BlueprintIcon name={step.icon} size={25} /></span>
              <h3>{step.title}</h3><p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section about-section" id="about">
        <div className="about-panel">
          <span className="section-kicker">ABOUT MAISOG LABS</span>
          <h2>Brave enough to explore.<br />Disciplined enough to build.</h2>
          <p>Maisog means brave. The lab is an independent practice by Paulo Maisog—building useful automation, learning security through real systems, and documenting the work honestly.</p>
          <a className="primary-action" href={`mailto:${site.email}`}><BlueprintIcon name="contact" size={18} /> Let&apos;s build something useful</a>
        </div>
        <blockquote><p>“Not a replacement for humanity, but a force multiplier for what&apos;s possible.”</p><cite>— MAISOG LABS</cite></blockquote>
      </section>

      <footer className="site-footer">
        <div><Logo compact /><span>Ideas today. A brighter tomorrow.</span></div>
        <div><span>MAHAPLAG, LEYTE · PHILIPPINES</span><span>© 2026 MAISOG LABS</span></div>
      </footer>
    </main>
  );
}
