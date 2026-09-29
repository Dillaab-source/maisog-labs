// D-120 (ML-DEVOS-AS-144): structural checks for the V10.1 desktop REVIEW
// CANDIDATE in candidates/v10.1/site/. The candidate is not served: the
// canonical homepage stays public/index.html (D-093), and the RFC-022 bridge
// still pins that artifact. These checks keep the candidate honest until a
// separately governed promotion.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ARTIFACT_SHA256, buildBridgeSpan } from "../worker/bridge/inject.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const SITE = path.join(ROOT, "candidates/v10.1/site");
const report = JSON.parse(fs.readFileSync(path.join(ROOT, "candidates/v10.1/build-report.json"), "utf8"));
const index = fs.readFileSync(path.join(SITE, "index.html"));
const html = index.toString("utf8");
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

test("the canonical artifact is unchanged and still the one the bridge pins", () => {
  assert.equal(sha256(fs.readFileSync(path.join(ROOT, "public/index.html"))), ARTIFACT_SHA256);
  assert.equal(report.sourceArtifactSha256, ARTIFACT_SHA256);
});

test("the committed candidate matches its build report", () => {
  assert.equal(sha256(index), report.candidateIndexSha256);
  assert.equal(index.length, report.candidateIndexBytes);
});

test("the RFC-022 seam holds: script-free head, </head> at the reported offset", () => {
  assert.equal(index.subarray(report.insertionOffset, report.insertionOffset + 7).toString(), "</head>");
  assert.equal(html.indexOf("</head>"), html.lastIndexOf("</head>"));
  assert.doesNotMatch(html.slice(0, html.indexOf("</head>")), /<script/i);
  // The hook spliced before </head> runs before every body script (the data
  // script that assigns window.MLData is among them).
  const spliced = html.slice(0, report.insertionOffset) + buildBridgeSpan({ schemaVersion: 1, contact: { email: "a@b.co" } }) + html.slice(report.insertionOffset);
  assert.ok(spliced.indexOf('id="ml-published"') < spliced.indexOf('<script src="/v101/assets/data.'));
});

test("no in-browser compilation, no development React, no self-unpacking", () => {
  assert.doesNotMatch(html, /text\/babel|__bundler|babel/i);
  assert.match(html, /react\.production\.[0-9a-f]{12}\.js/);
  assert.match(html, /react-dom\.production\.[0-9a-f]{12}\.js/);
});

test("document basics: lang, description, canonical, Open Graph, Twitter", () => {
  assert.match(html, /<html lang="en-PH">/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/maisoglabs\.com\/">/);
  for (const p of ["og:type", "og:site_name", "og:title", "og:description", "og:url", "og:locale"]) assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+">`));
  for (const n of ["twitter:card", "twitter:title", "twitter:description"]) assert.match(html, new RegExp(`<meta name="${n}" content="[^"]+">`));
  assert.match(html, /:focus-visible\{outline:2px solid var\(--focus-ring\)/);
});

test("every referenced asset exists and its fingerprint matches its content", () => {
  const refs = [...new Set(html.match(/\/v101\/assets\/[^"')\s]+/g))];
  assert.equal(refs.length, report.assets.length);
  for (const ref of refs) {
    const file = path.join(SITE, ref);
    const [, fp] = path.basename(ref).match(/\.([0-9a-f]{12})\.[a-z0-9]+$/);
    assert.equal(sha256(fs.readFileSync(file)).slice(0, 12), fp, ref);
  }
});

test("Research and the wordmark carry no dead '#' links", () => {
  const assets = path.join(SITE, "v101/assets");
  const read = prefix => fs.readFileSync(path.join(assets, fs.readdirSync(assets).find(f => f.startsWith(prefix + "."))), "utf8");
  const research = read("research");
  assert.match(research, /Research Previews/);
  assert.match(research, /Notes in preparation/);
  assert.doesNotMatch(research, /More notes|href:\s*"#"[,}]/);
  assert.doesNotMatch(read("entry"), /href:\s*"#"[,}]/);
  // NoteCard renders a link only when given a destination (no default "#").
  // The bundle's own unused UI-kit copies are overridden by the panel files.
  assert.match(read("design-system"), /createElement\(\w+\?"a":"div",\{href:\w+\|\|void 0/);
});

test("SEO files and immutable caching are scoped", () => {
  assert.equal(fs.readFileSync(path.join(SITE, "robots.txt"), "utf8"), "User-agent: *\nDisallow: /admin\n\nSitemap: https://maisoglabs.com/sitemap.xml\n");
  assert.match(fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8"), /<loc>https:\/\/maisoglabs\.com\/<\/loc>/);
  assert.equal(fs.readFileSync(path.join(SITE, "_headers"), "utf8"), "/v101/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n");
});
