"use client";

import { useMemo, useState } from "react";

const OWNER = "Dillaab-source";
const REPO = "maisog-labs";
const BRANCH = "main";
const PATH = "data/site.json";

function encodeBase64Unicode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export default function AdminStudio({ initialContent }) {
  const [content, setContent] = useState(initialContent);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Ready");
  const [publishing, setPublishing] = useState(false);

  const previewUrl = useMemo(() => "/", []);

  const updateSite = (key, value) => {
    setContent((current) => ({ ...current, site: { ...current.site, [key]: value } }));
  };

  const updateAbout = (key, value) => {
    setContent((current) => ({ ...current, about: { ...current.about, [key]: value } }));
  };

  const updateProject = (index, key, value) => {
    setContent((current) => ({
      ...current,
      projects: current.projects.map((project, i) => i === index ? { ...project, [key]: value } : project),
    }));
  };

  const publish = async () => {
    if (!token.trim()) {
      setStatus("Enter a fine-grained GitHub token with Contents: Read and write access.");
      return;
    }

    setPublishing(true);
    setStatus("Reading current content…");

    try {
      const endpoint = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
      const read = await fetch(endpoint, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token.trim()}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!read.ok) throw new Error(`GitHub read failed (${read.status})`);
      const currentFile = await read.json();

      setStatus("Publishing changes…");
      const write = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message: "Update website content from Maisog Labs Admin",
          branch: BRANCH,
          sha: currentFile.sha,
          content: encodeBase64Unicode(`${JSON.stringify(content, null, 2)}\n`),
        }),
      });

      if (!write.ok) {
        const detail = await write.json().catch(() => null);
        throw new Error(detail?.message || `GitHub publish failed (${write.status})`);
      }

      setStatus("Published. Cloudflare will rebuild the public site from the new content.");
      setToken("");
    } catch (error) {
      setStatus(error.message || "Publishing failed.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">MAISOG LABS / CONTENT STUDIO</p>
          <h1>Edit the website without touching code.</h1>
        </div>
        <a className="admin-preview" href={previewUrl} target="_blank" rel="noreferrer">Open site ↗</a>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <a href="#hero">Homepage</a>
          <a href="#projects-admin">Projects</a>
          <a href="#about-admin">About</a>
          <a href="#publish">Publish</a>
        </aside>

        <div className="admin-editor">
          <section className="admin-card" id="hero">
            <p className="eyebrow">HOMEPAGE</p>
            <h2>Hero</h2>
            <label>Eyebrow<input value={content.site.eyebrow} onChange={(e) => updateSite("eyebrow", e.target.value)} /></label>
            <label>Headline<input value={content.site.tagline} onChange={(e) => updateSite("tagline", e.target.value)} /></label>
            <label>Description<textarea rows="4" value={content.site.description} onChange={(e) => updateSite("description", e.target.value)} /></label>
            <label>Bridge statement<input value={content.site.bridgeLabel} onChange={(e) => updateSite("bridgeLabel", e.target.value)} /></label>
            <label>Contact email<input type="email" value={content.site.email} onChange={(e) => updateSite("email", e.target.value)} /></label>
          </section>

          <section className="admin-card" id="projects-admin">
            <p className="eyebrow">SELECTED WORK</p>
            <h2>Projects</h2>
            <div className="admin-projects">
              {content.projects.map((project, index) => (
                <div className="admin-project" key={project.slug}>
                  <strong>{project.number} / {project.title}</strong>
                  <label>Title<input value={project.title} onChange={(e) => updateProject(index, "title", e.target.value)} /></label>
                  <label>Description<textarea rows="3" value={project.text} onChange={(e) => updateProject(index, "text", e.target.value)} /></label>
                  <label>Image URL<input value={project.image} onChange={(e) => updateProject(index, "image", e.target.value)} /></label>
                  <label>Tags<input value={(project.tags || []).join(", ")} onChange={(e) => updateProject(index, "tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></label>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card" id="about-admin">
            <p className="eyebrow">ABOUT</p>
            <h2>Paulo</h2>
            <label>Headline<textarea rows="3" value={content.about.title} onChange={(e) => updateAbout("title", e.target.value)} /></label>
            <label>Biography<textarea rows="6" value={content.about.body} onChange={(e) => updateAbout("body", e.target.value)} /></label>
          </section>

          <section className="admin-card publish-card" id="publish">
            <p className="eyebrow">PUBLISH</p>
            <h2>Send changes live</h2>
            <p className="admin-help">Use a fine-grained GitHub token scoped only to this repository with <strong>Contents: Read and write</strong>. The token stays in this browser session and is cleared after a successful publish.</p>
            <label>GitHub token<input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" /></label>
            <button className="admin-publish" type="button" onClick={publish} disabled={publishing}>{publishing ? "Publishing…" : "Publish website"}</button>
            <p className="admin-status" role="status">{status}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
