import BlueprintIcon from "../components/BlueprintIcon";
import Logo from "../components/Logo";
import ProjectRail from "../components/ProjectRail";
import { getPublicContent } from "../lib/content/local.mjs";

export default async function Home() {
  const content = await getPublicContent();
  const { site, hero, contact, foundations, navigation, process, about, footer, projectSection } = content;
  const projects = content.projects.filter(project => project.featured);
  return (
    <main className="v4-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="cinematic-background" aria-hidden="true" />
      <div className="blueprint-grid" aria-hidden="true" />
      <div className="blueprint-frame" aria-hidden="true"><i /><i /><i /><i /></div>

      <header className="site-header">
        <a className="header-brand" href="#home" aria-label={`${site.name} home`}><Logo name={site.name} /></a>
        <nav className="site-nav" aria-label="Primary navigation">
          {navigation.map((item) => <a href={item.href} key={item.id}>{item.label}</a>)}
        </nav>
        <a className="header-action" href={`mailto:${contact.email}`}>{contact.headerLabel} <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="home">
        <span className="coordinate coordinate-a" aria-hidden="true">{site.location.toUpperCase()} · {site.timezone}</span>
        <span className="coordinate coordinate-b" aria-hidden="true">SYSTEM / {content.meta.contentVersion}</span>
        <div className="hero-copy" id="main-content">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>{hero.title[0]}<br /><em>{hero.title[1]}</em></h1>
          <p className="hero-lead">{hero.description}</p>
          <div className="hero-actions">
            <a className="primary-action" href={hero.primaryAction.href}>{hero.primaryAction.label} <BlueprintIcon name="arrow" size={18} /></a>
            <a className="text-action" href={hero.secondaryAction.href}>{hero.secondaryAction.label}</a>
          </div>
        </div>
        <aside className="human-ai-note"><span>{hero.bridgeLabel}</span><p>{hero.bridgeStatement}</p></aside>
        <div className="contact-signal" aria-hidden="true"><i /><i /><i /></div>
        <nav className="foundation-dock" aria-label="Explore Maisog Labs">
          {foundations.map((item, index) => (
            <a href={item.href} key={item.id}>
              <span className="dock-number">0{index + 1}</span>
              <span className={`dock-icon tone-${index + 1}`}><BlueprintIcon name={item.icon} size={24} /></span>
              <span><strong>{item.label}</strong><small>{item.text}</small></span>
            </a>
          ))}
        </nav>
      </section>

      <section className="content-section projects-section" id="projects">
        <div className="section-heading">
          <div><span className="section-kicker">{projectSection.kicker}</span><h2>{projectSection.title}</h2></div>
          <p>{projectSection.description}</p>
        </div>
        {projects.length ? <ProjectRail projects={projects} /> : <p>{projectSection.emptyMessage}</p>}
      </section>

      <section className="content-section process-section" id="process">
        <div className="section-heading compact-heading"><div><span className="section-kicker">{process.kicker}</span><h2>{process.title}</h2></div></div>
        <div className="process-grid">
          {process.steps.map((step, index) => (
            <article key={step.id}>
              <span className="process-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="process-icon"><BlueprintIcon name={step.icon} size={25} /></span>
              <h3>{step.title}</h3><p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section about-section" id="about">
        <div className="about-panel">
          <span className="section-kicker">{about.kicker}</span>
          <h2>{about.title[0]}<br />{about.title[1]}</h2>
          <p>{about.body}</p>
          <a className="primary-action" href={`mailto:${contact.email}`}><BlueprintIcon name="contact" size={18} /> {contact.callToAction}</a>
        </div>
        <blockquote><p>“{about.quote}”</p><cite>— {about.quoteAttribution}</cite></blockquote>
      </section>

      <footer className="site-footer">
        <div><Logo compact name={site.name} /><span>{footer.statement}</span></div>
        <div><span>{site.location.toUpperCase()}</span><span>{footer.copyright}</span></div>
      </footer>
    </main>
  );
}
