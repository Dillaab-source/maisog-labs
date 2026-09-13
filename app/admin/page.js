"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";
import { projects as initialProjects, site as initialSite } from "../../data/site";

const tabs = ["Overview", "Site", "Projects", "Media", "Publishing"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [siteDraft, setSiteDraft] = useState({
    eyebrow: initialSite.eyebrow,
    tagline: initialSite.tagline,
    description: initialSite.description,
    email: initialSite.email,
  });
  const [projects, setProjects] = useState(
    initialProjects.map((project) => ({ ...project, status: "published" }))
  );
  const [notice, setNotice] = useState("Preview mode — changes are local until D1/R2 is connected.");

  const stats = useMemo(() => {
    const published = projects.filter((project) => project.status === "published").length;
    const drafts = projects.length - published;
    return { published, drafts, total: projects.length };
  }, [projects]);

  function updateSiteField(field, value) {
    setSiteDraft((current) => ({ ...current, [field]: value }));
    setNotice("Unsaved local changes");
  }

  function toggleProjectStatus(slug) {
    setProjects((current) =>
      current.map((project) =>
        project.slug === slug
          ? { ...project, status: project.status === "published" ? "draft" : "published" }
          : project
      )
    );
    setNotice("Unsaved local changes");
  }

  function savePreview() {
    setNotice("Local preview saved in this browser session. Backend persistence is the next deployment step.");
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>◯</div>
          <div>
            <strong>MAISOG LABS</strong>
            <span>ADMIN / V1</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? styles.activeNav : ""}
              onClick={() => setActiveTab(tab)}
            >
              <span>{tab}</span>
              <i>›</i>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <span className={styles.onlineDot} />
          <div>
            <strong>Preview environment</strong>
            <span>admin-v1</span>
          </div>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>CONTROL CENTER</span>
            <h1>{activeTab}</h1>
          </div>
          <div className={styles.topActions}>
            <span className={styles.notice}>{notice}</span>
            <a href="/" target="_blank" rel="noreferrer" className={styles.secondaryButton}>View site ↗</a>
            <button className={styles.primaryButton} onClick={savePreview}>Save preview</button>
          </div>
        </header>

        {activeTab === "Overview" && (
          <div className={styles.contentGrid}>
            <section className={styles.heroPanel}>
              <span className={styles.panelLabel}>SYSTEM STATUS</span>
              <h2>Website management, without touching code.</h2>
              <p>This first deploy gives you the admin interface and preview workflow. Secure login, D1 persistence, R2 uploads, and publishing APIs are wired in the next backend phase.</p>
              <div className={styles.heroActions}>
                <button className={styles.primaryButton} onClick={() => setActiveTab("Site")}>Edit site content</button>
                <button className={styles.secondaryButton} onClick={() => setActiveTab("Projects")}>Manage projects</button>
              </div>
            </section>

            <section className={styles.statsRow}>
              <article><span>PROJECTS</span><strong>{stats.total.toString().padStart(2, "0")}</strong><small>Total entries</small></article>
              <article><span>PUBLISHED</span><strong>{stats.published.toString().padStart(2, "0")}</strong><small>Visible on site</small></article>
              <article><span>DRAFTS</span><strong>{stats.drafts.toString().padStart(2, "0")}</strong><small>Awaiting publish</small></article>
              <article><span>VERSION</span><strong>V{initialSite.version}</strong><small>Production baseline</small></article>
            </section>

            <section className={styles.activityPanel}>
              <div className={styles.sectionHead}><div><span className={styles.panelLabel}>IMPLEMENTATION ROADMAP</span><h3>Admin V1 rollout</h3></div><span className={styles.statusPill}>PHASE 1</span></div>
              {["Admin interface + responsive layout", "Cloudflare Access authentication", "D1 content persistence", "R2 media uploads", "Draft → preview → publish API", "QA + production merge"].map((item, index) => (
                <div className={styles.roadmapRow} key={item}>
                  <span className={index === 0 ? styles.doneDot : styles.todoDot}>{index === 0 ? "✓" : index + 1}</span>
                  <strong>{item}</strong>
                  <small>{index === 0 ? "DEPLOYING" : "NEXT"}</small>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === "Site" && (
          <section className={styles.editorLayout}>
            <div className={styles.editorPanel}>
              <div className={styles.sectionHead}><div><span className={styles.panelLabel}>SITE CONTENT</span><h3>Hero & contact</h3></div><span className={styles.statusPill}>DRAFT</span></div>
              <label>Eyebrow<input value={siteDraft.eyebrow} onChange={(event) => updateSiteField("eyebrow", event.target.value)} /></label>
              <label>Tagline<input value={siteDraft.tagline} onChange={(event) => updateSiteField("tagline", event.target.value)} /></label>
              <label>Description<textarea rows="5" value={siteDraft.description} onChange={(event) => updateSiteField("description", event.target.value)} /></label>
              <label>Public contact email<input value={siteDraft.email} onChange={(event) => updateSiteField("email", event.target.value)} /></label>
            </div>
            <div className={styles.previewPanel}>
              <span className={styles.panelLabel}>LIVE PREVIEW</span>
              <div className={styles.previewCanvas}>
                <small>{siteDraft.eyebrow}</small>
                <h2>MAISOG LABS</h2>
                <h3>{siteDraft.tagline}</h3>
                <p>{siteDraft.description}</p>
                <button>{siteDraft.email}</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Projects" && (
          <section className={styles.projectsPanel}>
            <div className={styles.sectionHead}><div><span className={styles.panelLabel}>CONTENT COLLECTION</span><h3>Projects</h3></div><button className={styles.primaryButton}>+ New project</button></div>
            <div className={styles.projectTable}>
              <div className={styles.tableHead}><span>PROJECT</span><span>CATEGORY</span><span>STATUS</span><span>ACTION</span></div>
              {projects.map((project) => (
                <div className={styles.projectRow} key={project.slug}>
                  <div><strong>{project.title}</strong><small>{project.text}</small></div>
                  <span>{project.category}</span>
                  <span className={project.status === "published" ? styles.published : styles.draft}>{project.status}</span>
                  <button onClick={() => toggleProjectStatus(project.slug)}>{project.status === "published" ? "Move to draft" : "Mark published"}</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Media" && (
          <section className={styles.emptyPanel}>
            <span className={styles.panelLabel}>R2 MEDIA LIBRARY</span>
            <h2>Media uploads are next.</h2>
            <p>This screen will connect to Cloudflare R2 after the secure API is configured. Uploads will be type-checked and size-limited before storage.</p>
            <button className={styles.secondaryButton} disabled>Upload media — backend required</button>
          </section>
        )}

        {activeTab === "Publishing" && (
          <section className={styles.emptyPanel}>
            <span className={styles.panelLabel}>RELEASE CONTROL</span>
            <h2>Draft → preview → publish.</h2>
            <p>Publishing stays disabled until D1 and the authenticated Worker API are connected. This prevents a frontend-only admin screen from pretending to be secure.</p>
            <div className={styles.publishChecklist}>
              <span>✓ Admin UI</span><span>○ Cloudflare Access</span><span>○ D1 database</span><span>○ R2 storage</span><span>○ Publish API</span>
            </div>
            <button className={styles.primaryButton} disabled>Publish changes</button>
          </section>
        )}
      </section>
    </main>
  );
}
