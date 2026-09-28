#!/usr/bin/env node
// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-106) admin Content UI evidence.
//
// Renders the real app/admin/ContentClient.js in Chromium without npm: React
// 18.3.1, ReactDOM and Babel standalone are decoded from the D-093 artifact's
// own bundle (public/index.html), exactly as tests/homepage-artifact.test.mjs
// decodes it. The component runs against an in-page mock of the admin API that
// records every request, so the evidence checks what the UI actually sends.
// It then runs the same checks against the real `next build` static export
// (out/admin.html, Next's bundled React 19), so run `npm run build` first; a
// missing build fails the run.
//
// Checks: tabs render; Tier 2 tabs show deferral notices and no inputs; the
// homepage status/gate is shown; a new V10 project saves with a complete v10
// group; a legacy project with a blank V10 section saves with v10: null;
// publish sends expected pointers; a HOMEPAGE_LIMIT 409 is explained; the
// contact publish button stays disabled until the deliverability box is
// ticked and then sends confirmDeliverability: true.
//
// Playwright is resolved from PLAYWRIGHT_MODULE or the global install.
// Output: docs/product/evidence/rfc022-tier1/admin-ui-*.png,
// admin-ui-nextjs-*.png, admin-ui-report.json.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/product/evidence/rfc022-tier1");

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, path.join(execSync("npm root -g").toString().trim(), "playwright/index.js")].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href);
      return mod.chromium ?? mod.default?.chromium;
    } catch {}
  }
  return (await import("playwright")).chromium;
}

function artifactLibraries() {
  const html = fs.readFileSync(path.join(ROOT, "public/index.html"), "utf8");
  const manifest = JSON.parse(html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]);
  const libs = {};
  for (const entry of Object.values(manifest)) {
    const raw = Buffer.from(entry.data, "base64");
    const text = (entry.compressed ? zlib.gunzipSync(raw) : raw).toString("utf8");
    if (text.includes("react.development.js") && !text.includes("react-dom")) libs.react = text;
    else if (text.includes("react-dom.development.js")) libs.reactDom = text;
    else if (/Babel|babel/.test(text.slice(0, 2000)) || text.length > 3_000_000) libs.babel ??= text;
  }
  for (const name of ["react", "reactDom", "babel"]) if (!libs[name]) throw new Error(`${name} not found in artifact bundle`);
  return libs;
}

// ContentClient as a browser global: drop "use client", map the react import
// to the UMD global, expose the default export.
function componentSource() {
  return fs
    .readFileSync(path.join(ROOT, "app/admin/ContentClient.js"), "utf8")
    .replace(/^"use client";\s*/, "")
    .replace(/import \{([^}]+)\} from "react";/, "const {$1} = React;")
    .replace("export default function ContentClient", "window.ContentClient = function ContentClient");
}

const MOCK_API = `
window.__requests = [];
window.__limitNext = false;
const state = {
  projects: [
    { id: "legacy-one", slug: "legacy-one", publishedRevisionId: 3, draftRevisionId: null,
      published: { title: "Automation Hub", category: "Automation", summary: "Legacy summary.", order: 5, featured: true, stack: ["n8n"], accent: "gold", icon: "automation", v10: null }, draft: null },
    { id: "clinicflow", slug: "clinicflow", publishedRevisionId: null, draftRevisionId: 7,
      published: null, draft: { title: "ClinicFlow", category: "Clinic automation", summary: "Fixture description.", order: 1, featured: true, stack: [], accent: "blue", icon: "lab",
        v10: { tagline: "Fixture tagline.", status: "Active", disciplines: [1, 4], flow: ["One", "Two", "Three", "Person decides"] } } },
  ],
  contact: { initialized: true, publishedRevisionId: 1, draftRevisionId: 9, published: { email: "seed@example.com", setThroughAdmin: false }, draft: { email: "fixture-contact@example.com", setThroughAdmin: true } },
  homepage: { maxProjects: 5, publishedEligibleProjects: 0, projectsGroupValid: false,
    activationGate: { enabled: true, requiredNames: ["ClinicFlow", "Eternal Eggs", "Sentinel / DevOS", "SU", "Maisog Kilat"], passes: false },
    live: { projects: false, contact: false } },
};
window.fetch = async (url, init = {}) => {
  const body = init.body ? JSON.parse(init.body) : null;
  window.__requests.push({ url, method: init.method || "GET", body });
  const json = (status, value) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
  if (url === "/admin/api/content") return json(200, state);
  if (url.endsWith("/publish") && url.startsWith("/admin/api/projects/") && window.__limitNext) return json(409, { error: "Conflict", reason: "HOMEPAGE_LIMIT" });
  return json(200, { ok: true });
};
`;

const libs = artifactLibraries();
const componentPage = `<!doctype html><html><head><meta charset="utf-8"><title>Admin Content UI evidence</title></head><body>
<div id="root"></div>
<script src="/react.js"></script><script src="/react-dom.js"></script><script src="/babel.js"></script>
<script type="text/babel" data-presets="react">${componentSource()}
ReactDOM.createRoot(document.getElementById("root")).render(<main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "48rem" }}><window.ContentClient /></main>);
</script></body></html>`;

// Variant 1 (component): the component with the artifact's React 18.
const componentFiles = { "/": ["text/html", componentPage], "/react.js": ["text/javascript", libs.react], "/react-dom.js": ["text/javascript", libs.reactDom], "/babel.js": ["text/javascript", libs.babel] };
function serveComponent(req, res) {
  const file = componentFiles[new URL(req.url, "http://localhost").pathname];
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": file[0] });
  res.end(file[1]);
}

// Variant 2 (nextjs): the real `next build` static export (out/), with
// /admin served from out/admin.html as the Worker's assets binding does.
const OUT_DIR = path.join(ROOT, "out");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
function serveNextExport(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (pathname === "/admin" || pathname === "/admin/") pathname = "/admin.html";
  const file = path.join(OUT_DIR, pathname);
  if (!file.startsWith(OUT_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
  res.end(fs.readFileSync(file));
}
function nextReactVersion() {
  const dir = path.join(OUT_DIR, "_next/static/chunks");
  for (const name of fs.readdirSync(dir, { recursive: true })) {
    if (!String(name).endsWith(".js")) continue;
    const match = fs.readFileSync(path.join(dir, String(name)), "utf8").match(/version:"(19\.[^"]+)"/);
    if (match) return match[1];
  }
  return null;
}

async function runVariant(chromium, { handler, url, shotPrefix }) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  const errors = [];
  p.on("pageerror", error => errors.push(error.message));
  p.on("console", message => message.type() === "error" && errors.push(message.text()));
  await p.addInitScript(MOCK_API);
  await p.goto(`http://127.0.0.1:${server.address().port}${url}`);
  await p.getByRole("heading", { name: "Homepage content" }).waitFor({ timeout: 30000 });
  await p.getByRole("heading", { name: "Homepage projects" }).waitFor();
  const content = p.locator('section[aria-labelledby="content-title"]');

  const checks = {};
  const requests = () => p.evaluate(() => window.__requests);
  await p.screenshot({ path: path.join(OUT, `${shotPrefix}-projects.png`), fullPage: true });
  checks.gateShown = (await content.getByText("First activation requires exactly these five").count()) === 1;

  // Legacy project with a blank V10 section -> v10: null.
  const legacyCard = content.locator("div", { has: p.getByRole("heading", { name: /Automation Hub/ }) }).last();
  await legacyCard.getByRole("button", { name: "Save draft" }).click();
  await p.waitForTimeout(300);
  const legacySave = (await requests()).find(r => r.url === "/admin/api/projects/legacy-one/draft");
  checks.legacySavesWithNullV10 = legacySave?.method === "PUT" && legacySave.body.v10 === null && legacySave.body.expectedPublishedRevisionId === 3 && legacySave.body.accent === "gold";

  // Existing V10 draft publishes with its expected pointers; a 409 limit is explained.
  await p.evaluate(() => { window.__limitNext = true; });
  const clinicCard = content.locator("div", { has: p.getByRole("heading", { name: /^ClinicFlow/ }) }).last();
  await clinicCard.getByRole("button", { name: "Publish" }).click();
  await p.waitForTimeout(300);
  const publish = (await requests()).find(r => r.url === "/admin/api/projects/clinicflow/publish");
  checks.publishSendsPointers = publish?.body.expectedPublishedRevisionId === null && publish.body.expectedDraftRevisionId === 7;
  checks.limitMessageShown = (await content.getByText("The homepage already shows five projects").count()) >= 1;

  // New project with complete V10 fields.
  const newCard = content.locator("div", { has: p.getByRole("heading", { name: "New project" }) }).last();
  await newCard.getByLabel(/Project id/).fill("maisog-kilat");
  await newCard.getByLabel("Slug").fill("maisog-kilat");
  await newCard.getByLabel(/^Name/).fill("Maisog Kilat");
  await newCard.getByLabel(/^Kind/).fill("Fixture kind");
  await newCard.getByLabel(/^Tagline/).fill("Fixture tagline.");
  await newCard.getByLabel(/^Description/).fill("Fixture description.");
  await newCard.getByLabel("Research").check();
  await newCard.getByLabel("AI").check();
  for (let i = 1; i <= 4; i++) await newCard.getByLabel(`Flow step ${i}`).fill(`Fixture step ${i}`);
  await newCard.getByLabel(/Show on homepage/).check();
  await newCard.getByRole("button", { name: "Save draft" }).click();
  await p.waitForTimeout(300);
  const create = (await requests()).find(r => r.url === "/admin/api/projects" && r.method === "POST");
  checks.createSendsCompleteV10 =
    create?.body.id === "maisog-kilat" && create.body.featured === true &&
    JSON.stringify(create.body.v10) === JSON.stringify({ tagline: "Fixture tagline.", status: "", disciplines: [0, 2], flow: ["Fixture step 1", "Fixture step 2", "Fixture step 3", "Fixture step 4"] });

  // Contact: publish disabled until attestation.
  await content.getByRole("tab", { name: "Contact" }).click();
  const publishEmail = content.getByRole("button", { name: "Publish email" });
  checks.contactPublishDisabledWithoutAttestation = await publishEmail.isDisabled();
  await content.getByLabel(/I have confirmed this address receives mail/).check();
  await publishEmail.click();
  await p.waitForTimeout(300);
  const contactPublish = (await requests()).find(r => r.url === "/admin/api/content/contact/publish");
  checks.contactPublishSendsAttestation = contactPublish?.body.confirmDeliverability === true && contactPublish.body.expectedDraftRevisionId === 9;
  await p.screenshot({ path: path.join(OUT, `${shotPrefix}-contact.png`), fullPage: true });

  // Tier 2 / design tabs: notices only, no inputs inside the Content section.
  for (const tab of ["Profile / Home", "About", "Navigation"]) {
    await content.getByRole("tab", { name: tab }).click();
    checks[`tier2Notice:${tab}`] = (await content.locator("input, textarea, select").count()) === 0;
  }
  await p.screenshot({ path: path.join(OUT, `${shotPrefix}-deferred.png`), fullPage: true });

  await browser.close();
  server.close();
  return { errors, checks };
}

fs.mkdirSync(OUT, { recursive: true });
const chromium = await loadPlaywright();
const variants = {
  component: { renderer: "React 18.3.1 + Babel standalone decoded from public/index.html", ...(await runVariant(chromium, { handler: serveComponent, url: "/", shotPrefix: "admin-ui" })) },
};
if (fs.existsSync(path.join(OUT_DIR, "admin.html"))) {
  variants.nextjs = { renderer: `next build static export out/admin.html (Next ${JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/next/package.json"), "utf8")).version}, bundled React ${nextReactVersion()})`, ...(await runVariant(chromium, { handler: serveNextExport, url: "/admin", shotPrefix: "admin-ui-nextjs" })) };
} else {
  variants.nextjs = { renderer: "not run: out/admin.html missing (run npm run build first)", errors: ["out/admin.html missing"], checks: {} };
}
const report = { variants };
fs.writeFileSync(path.join(OUT, "admin-ui-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (Object.values(variants).some(v => v.errors.length > 0 || Object.keys(v.checks).length === 0 || Object.values(v.checks).some(c => c !== true))) process.exitCode = 1;
