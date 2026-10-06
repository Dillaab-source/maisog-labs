// D-120 (ML-DEVOS-AS-144): structural checks for the V10.1 desktop candidate
// in candidates/v10.1/site/, accepted by ML-DEVOS-AS-145. D-121 promoted it
// byte-for-byte to public/ (with the /v101/ assets, SEO files and _headers),
// and the RFC-022 bridge constants now pin exactly those bytes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ARTIFACT_SHA256, ARTIFACT_LENGTH, INSERTION_OFFSET, buildBridgeSpan } from "../worker/bridge/inject.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const SITE = path.join(ROOT, "candidates/v10.1/site");
const report = JSON.parse(fs.readFileSync(path.join(ROOT, "candidates/v10.1/build-report.json"), "utf8"));
const index = fs.readFileSync(path.join(SITE, "index.html"));
const html = index.toString("utf8");
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

const ACCEPTED_SHA256 = "98c60c4c6574471fad5ec199fc30f51d60f869af79e365cf500230a837ab3820";

test("the promoted artifact, the bridge constants and the accepted candidate are the same bytes (D-121)", () => {
  assert.equal(sha256(index), ACCEPTED_SHA256);
  assert.equal(ARTIFACT_SHA256, ACCEPTED_SHA256);
  assert.equal(ARTIFACT_LENGTH, report.candidateIndexBytes);
  assert.equal(INSERTION_OFFSET, report.insertionOffset);
  assert.ok(fs.readFileSync(path.join(ROOT, "public/index.html")).equals(index));
  for (const file of ["robots.txt", "sitemap.xml", "_headers"]) {
    assert.ok(fs.readFileSync(path.join(ROOT, "public", file)).equals(fs.readFileSync(path.join(SITE, file))), file);
  }
  const assets = fs.readdirSync(path.join(SITE, "v101/assets")).sort();
  assert.deepEqual(fs.readdirSync(path.join(ROOT, "public/v101/assets")).sort(), assets);
  for (const name of assets) {
    assert.ok(fs.readFileSync(path.join(ROOT, "public/v101/assets", name)).equals(fs.readFileSync(path.join(SITE, "v101/assets", name))), name);
  }
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
