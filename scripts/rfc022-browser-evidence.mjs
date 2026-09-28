#!/usr/bin/env node
// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-106) local browser evidence.
//
// Serves (1) the untouched D-093 artifact and (2) the artifact with a bridge
// span built by the real worker/bridge library from a TEST FIXTURE payload
// (placeholder copy only — never production content), then renders both in
// Chromium at 1440x900 and 390x844 and records: console/page errors, a
// non-blank render, the published project names and email appearing in the
// Projects/Contact panels, and screenshots.
//
// Playwright is not a project dependency. Resolve it from PLAYWRIGHT_MODULE, or
// the global install (`npm root -g`/playwright). Output:
// docs/product/evidence/rfc022-tier1/.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { buildBridgePayload, INITIAL_ACTIVATION_PROJECT_NAMES } from "../worker/bridge/payload.mjs";
import { isApprovedArtifact, spliceArtifact, ARTIFACT_SHA256 } from "../worker/bridge/inject.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/product/evidence/rfc022-tier1");
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

async function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, path.join(execSync("npm root -g").toString().trim(), "playwright/index.js")].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return await import(pathToFileURL(candidate).href);
    } catch {}
  }
  return import("playwright");
}

const FIXTURE_EMAIL = "fixture-contact@example.com";
const fixturePayload = buildBridgePayload({
  projects: INITIAL_ACTIVATION_PROJECT_NAMES.map((name, i) => ({
    name,
    kind: "Fixture kind",
    status: i === 0 ? "Active" : "",
    tagline: `Test fixture tagline for ${name}.`,
    description: `Test fixture description for ${name}. Placeholder copy for local evidence only.`,
    disciplines: [i % 6, (i + 2) % 6],
    flow: ["Fixture step one", "Fixture step two", "Fixture step three", "Fixture person decides"],
  })),
  email: FIXTURE_EMAIL,
});

const artifact = new Uint8Array(fs.readFileSync(path.join(ROOT, "public/index.html")));
if (!(await isApprovedArtifact(artifact))) throw new Error("public/index.html is not the approved artifact");
const bridged = spliceArtifact(artifact, fixturePayload);

const MIME = { ".png": "image/png", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".html": "text/html" };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/" || url.pathname === "/bridged/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(url.pathname === "/" ? artifact : bridged);
  }
  const file = path.join(ROOT, "public", path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(path.join(ROOT, "public")) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const playwright = await loadPlaywright();
const chromium = playwright.chromium ?? playwright.default?.chromium;
const browser = await chromium.launch();
const report = { artifactSha256: sha(artifact), approvedSha256: ARTIFACT_SHA256, bridgedBytesDelta: bridged.length - artifact.length, runs: [] };
fs.mkdirSync(OUT, { recursive: true });

// "/bridged/" resolves the artifact's ../../assets paths to /assets, like "/".
for (const [variant, route] of [["artifact", "/"], ["bridged", "/bridged/"]]) {
  for (const [viewport, size] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size });
    const errors = [];
    page.on("console", message => message.type() === "error" && errors.push(`console: ${message.text()}`));
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    const started = Date.now();
    await page.goto(`${base}${route}`, { waitUntil: "load" });
    await page.waitForFunction(() => document.querySelector("#root")?.children.length > 0, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    const run = { variant, viewport, renderMs: Date.now() - started, nonBlank: await page.evaluate(() => document.body.innerText.trim().length > 0) };
    run.mlData = await page.evaluate(() => ({ projects: window.MLData?.PROJ?.map(p => p.name), email: window.MLData?.EMAIL, flows: window.MLData?.FLOW?.map(f => f.length) }));
    await page.screenshot({ path: path.join(OUT, `${variant}-${viewport}-entry.png`) });
    await page.goto(`${base}${route}#projects`);
    await page.waitForTimeout(1500);
    run.projectsPanelText = (await page.locator("#projects").innerText()).slice(0, 400);
    await page.screenshot({ path: path.join(OUT, `${variant}-${viewport}-projects.png`) });
    await page.goto(`${base}${route}#contact`);
    await page.waitForTimeout(1500);
    run.contactShowsFixtureEmail = (await page.locator("#contact").innerText()).includes(FIXTURE_EMAIL);
    await page.screenshot({ path: path.join(OUT, `${variant}-${viewport}-contact.png`) });
    run.errors = errors;
    report.runs.push(run);
    await page.close();
  }
}
await browser.close();
server.close();

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2) + "\n");
const failures = report.runs.filter(run => !run.nonBlank || run.errors.length > 0);
const bridgedOk = report.runs.filter(run => run.variant === "bridged").every(run =>
  JSON.stringify(run.mlData.projects) === JSON.stringify([...INITIAL_ACTIVATION_PROJECT_NAMES]) && run.mlData.email === FIXTURE_EMAIL && run.contactShowsFixtureEmail && run.mlData.flows.every(n => n === 4)
);
console.log(JSON.stringify({ failures: failures.length, bridgedOk, runs: report.runs.map(r => ({ variant: r.variant, viewport: r.viewport, renderMs: r.renderMs, nonBlank: r.nonBlank, errors: r.errors.length, email: r.mlData.email })) }, null, 2));
if (failures.length > 0 || !bridgedOk) process.exitCode = 1;
