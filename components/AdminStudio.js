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

  const updateSite = (key, value) => setContent((c) => ({ ...c, site: { ...c.site, [key]: value } }));
  const updateAbout = (key, value) => setContent((c) => ({ ...c, about: { ...c.about, [key]: value } }));
  const updateProject = (index, key, value) => setContent((c) => ({
    ...c,
    projects: c.projects.map((p, i) => i === index ? { ...p, [key]: value } : p),
  }));

  const publish = async () => {
    if (!token.trim()) {
      setStatus("Enter a fine-grained GitHub token with Contents: Read and write access.");
      return;
    }
    setPublishing(true);
    setStatus("Reading current content…");
    try {
      const endpoint = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token.trim()}`,
        "X-GitHub-Api-Version": "2022-11-28",
      };
      const read = await fetch(endpoint, { headers });
      if (!read.ok) throw new Error(`GitHub read failed (${read.status})`);
      const currentFile = await read.json();
      setStatus("Publishing changes…");
      const write = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
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
    <>
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
            <a href="#hero">Homepage</a><a href="#projects-admin">Projects</a><a href="#about-admin">About</a><a href="#publish">Publish</a>
          </aside>

          <div className="admin-editor">
            <section className="admin-card" id="hero">
              <p className="eyebrow">HOMEPAGE</p><h2>Hero</h2>
              <label>Eyebrow<input value={content.site.eyebrow} onChange={(e) => updateSite("eyebrow", e.target.value)} /></label>
              <label>Headline<input value={content.site.tagline} onChange={(e) => updateSite("tagline", e.target.value)} /></label>
              <label>Description<textarea rows="4" value={content.site.description} onChange={(e) => updateSite("description", e.target.value)} /></label>
              <label>Bridge statement<input value={content.site.bridgeLabel} onChange={(e) => updateSite("bridgeLabel", e.target.value)} /></label>
              <label>Contact email<input type="email" value={content.site.email} onChange={(e) => updateSite("email", e.target.value)} /></label>
            </section>

            <section className="admin-card" id="projects-admin">
              <p className="eyebrow">SELECTED WORK</p><h2>Projects</h2>
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
              <p className="eyebrow">ABOUT</p><h2>Paulo</h2>
              <label>Headline<textarea rows="3" value={content.about.title} onChange={(e) => updateAbout("title", e.target.value)} /></label>
              <label>Biography<textarea rows="6" value={content.about.body} onChange={(e) => updateAbout("body", e.target.value)} /></label>
            </section>

            <section className="admin-card publish-card" id="publish">
              <p className="eyebrow">PUBLISH</p><h2>Send changes live</h2>
              <p className="admin-help">Use a fine-grained GitHub token scoped only to this repository with <strong>Contents: Read and write</strong>. It is used only for this publish action and cleared after success.</p>
              <label>GitHub token<input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" /></label>
              <button className="admin-publish" type="button" onClick={publish} disabled={publishing}>{publishing ? "Publishing…" : "Publish website"}</button>
              <p className="admin-status" role="status">{status}</p>
            </section>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .admin-shell{min-height:100vh;background:#ece9e1;color:#171717;padding:42px 5vw 80px}.admin-header{display:flex;justify-content:space-between;gap:28px;align-items:flex-end;max-width:1240px;margin:0 auto 42px}.admin-header h1{font:500 clamp(44px,6vw,78px)/.95 "Cormorant Garamond",serif;max-width:760px;margin:12px 0 0}.admin-header .eyebrow,.admin-card .eyebrow{color:#6a675f}.admin-preview{border:1px solid rgba(20,20,20,.25);padding:12px 16px;font-family:"Cormorant Garamond",serif}.admin-layout{max-width:1240px;margin:auto;display:grid;grid-template-columns:190px 1fr;gap:28px}.admin-sidebar{position:sticky;top:26px;height:max-content;display:grid;gap:6px}.admin-sidebar a{padding:10px 12px;border-left:1px solid rgba(20,20,20,.18);font-family:"Cormorant Garamond",serif;font-size:18px}.admin-editor{display:grid;gap:24px}.admin-card{background:#f7f4ed;border:1px solid rgba(20,20,20,.12);box-shadow:0 14px 38px rgba(0,0,0,.06);padding:30px}.admin-card h2{font:500 38px/1 "Cormorant Garamond",serif;margin:8px 0 24px}.admin-card label{display:grid;gap:7px;margin:14px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase}.admin-card input,.admin-card textarea{width:100%;border:1px solid rgba(20,20,20,.18);background:white;color:#171717;padding:13px 14px;font:400 16px/1.4 Inter,sans-serif;resize:vertical}.admin-card input:focus,.admin-card textarea:focus{outline:1px solid #171717}.admin-projects{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.admin-project{background:#eeebe3;border:1px solid rgba(20,20,20,.1);padding:20px}.admin-project strong{font:500 22px "Cormorant Garamond",serif}.admin-help{max-width:760px;color:#5f5b53;line-height:1.55}.admin-publish{border:0;background:#161616;color:white;padding:14px 20px;cursor:pointer}.admin-publish:disabled{opacity:.55;cursor:wait}.admin-status{margin:14px 0 0;font-family:"Cormorant Garamond",serif;font-size:18px}.publish-card{border-top:3px solid #171717}@media(max-width:800px){.admin-shell{padding:28px 18px 60px}.admin-header{align-items:flex-start;flex-direction:column}.admin-layout{grid-template-columns:1fr}.admin-sidebar{position:static;display:flex;overflow-x:auto}.admin-projects{grid-template-columns:1fr}.admin-card{padding:22px}}
      `}</style>
    </>
  );
}
