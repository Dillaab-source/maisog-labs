// V10 controlled clean replacement (D-092; facts per D-088).
//
// components/v10/V10Home.js is a JSX client component that `node --test`
// cannot render without a build step, so these tests assert on the
// governed content document, the validator, and the component/stylesheet
// source contract. Visual parity against the V10 reference is browser
// evidence (docs/product/evidence/v10/clean/).
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { test } from "node:test";

import { siteContent, v10Content } from "../data/site.js";
import { validateV10Content } from "../lib/content/schema.mjs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const exists = file => fs.existsSync(new URL(`../${file}`, import.meta.url));
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(new URL(`../${file}`, import.meta.url))).digest("hex");
const component = read("components/v10/V10Home.js");
const page = read("app/page.js");
const layout = read("app/layout.js");
const globals = read("app/globals.css");
const published = siteContent.projects.filter(project => project.state === "published" && project.featured);

test("V10 reference source is the pinned artifact", () => {
  assert.equal(hash("design-references/claude-v10/source/Maisog Labs Home v10.dc.html"), "6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab");
});

test("D-088 facts: eight unique approved projects, ClinicFlow once, approved contact address", () => {
  assert.deepEqual(published.map(project => project.title), [
    "Sentinel/DevOS", "SU", "ClinicFlow", "Maisog Kilat", "Maisog Guild",
    "Automation Hub", "Cybersecurity Lab", "Experimental Projects",
  ]);
  assert.equal(published.filter(project => project.title === "ClinicFlow").length, 1);
  assert.equal(siteContent.contact.email, "paulo.maisog@maisoglabs.com");
  assert.doesNotMatch(component, /maisog36/);
  assert.match(component, /mailto:\$\{email\}/);
  assert.match(component, /const t = this\.props\.content\.email;/);
});

test("V10 content validates and every published project has exactly one profile", () => {
  assert.equal(validateV10Content(v10Content, published), v10Content);
  assert.deepEqual(v10Content.projectProfiles.map(profile => profile.slug).sort(), published.map(project => project.slug).sort());
  assert.deepEqual(v10Content.disciplines.map(item => item.name), ["AI", "Automation", "Research", "Security", "Systems", "Architecture"]);
  for (const profile of v10Content.projectProfiles) {
    assert.ok(profile.flowSteps.length === 0 || profile.flowSteps.length === 4, profile.slug);
  }
});

test("the V10 content validator fails closed", () => {
  const clone = () => structuredClone(v10Content);
  const missing = clone(); missing.projectProfiles.pop();
  const unknownDiscipline = clone(); unknownDiscipline.projectProfiles[0].disciplines.push("marketing");
  const badFlow = clone(); badFlow.projectProfiles[0].flowSteps.pop();
  const badLink = clone(); badLink.disciplines[0].links.push("ai");
  const extraField = clone(); extraField.projectProfiles[0].metrics = "10x";
  const markup = clone(); markup.projectProfiles[0].tagline = "<b>bold</b>";
  for (const [name, document] of Object.entries({ missing, unknownDiscipline, badFlow, badLink, extraField, markup })) {
    assert.throws(() => validateV10Content(document, published), /Invalid V10 content/, name);
  }
});

test("the homepage renders V10Home from the governed content boundary and never imports D1", () => {
  assert.match(page, /import V10Home from "\.\.\/components\/v10\/V10Home";/);
  assert.match(page, /getPublicContent\(\)/);
  assert.match(page, /validateV10Content\(v10Content, published\)/);
  assert.doesNotMatch(page, /worker\/|d1|DB\b/);
  assert.doesNotMatch(layout, /DesignRuntime/);
  for (const removed of ["app/DesignRuntime.js", "components/site", "lib/design", "app/v10.css"]) assert.ok(!exists(removed), removed);
});

test("runtime requests: only GET /api/journal, never /api/design", () => {
  const fetches = [...component.matchAll(/fetch\(([^,)]+)/g)].map(match => match[1].trim());
  assert.deepEqual(fetches, ["'/api/journal'"]);
  assert.doesNotMatch(component, /\/api\/design|design-preview/);
});

test("no dc runtime, Babel, CDN, remote font or remote asset in the shipped source", () => {
  for (const source of [component, globals, page, layout]) {
    assert.doesNotMatch(source.replace(/^\s*\/\/.*$/gm, ""), /https?:\/\//);
    assert.doesNotMatch(source, /support\.js|image-slot|unpkg|@babel\/standalone|fonts\.googleapis|fonts\.gstatic|DCLogic/);
  }
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|eval\(|new Function/);
});

test("every V10 asset and font the page references exists and keeps its approved hash", () => {
  const referenced = new Set([...`${component}\n${globals}`.matchAll(/\/v10\/(?:assets|fonts)\/[\w./-]+?\.(?:png|mp4|svg|ttf)/g)].map(match => match[0]));
  for (const icon of v10Content.disciplines.map(item => item.icon)) referenced.add(`/v10/assets/icons/${icon}.svg`);
  assert.ok(referenced.size >= 10);
  for (const file of referenced) assert.ok(exists(`public${file}`), file);
  const expected = {
    "public/v10/assets/plate-hero-v4.png": "afb05bc4ccb5cfd00577e20c236670cb4769faca8e046816822ba341ba5c4ec4",
    "public/v10/assets/logo-mark.mp4": "ac6124585dc489d88f38ac57a2b8729863486c78b51e59a64ec8ab0734225ed4",
    "public/v10/assets/logo-mark-poster.png": "931e2fc037832c27b084bcca0df5a683c9c28376ac78b77cbbe24db8ecd9c851",
    "public/v10/assets/favicon.svg": "b34acfe1395e080c2d551982d6e5c550171b6b877ec535de4f4dc60ae3676d04",
  };
  for (const [file, digest] of Object.entries(expected)) assert.equal(hash(file), digest, file);
});

test("routing: V10 hashes plus the D-088 compatibility aliases; new links use #journal", () => {
  assert.match(component, /SECS = \[\['systems', 'Systems'\], \['projects', 'Projects'\], \['journal', 'Research'\], \['contact', 'Contact'\]\];/);
  assert.match(component, /ALIASES = \{ research: 'journal', process: 'systems', about: 'contact' \};/);
  assert.doesNotMatch(component, /href="#research"/);
});

test("Research shows real Journal entries only: no placeholder notes, imagery or filters", () => {
  assert.doesNotMatch(component, /NOTES = \[|Drop note image|plate-aqueduct|aria-label="Filter notes"/);
  assert.match(component, /href: '\/journal\?slug=' \+ encodeURIComponent\(e\.slug\)/);
  assert.match(component, /<a href="\/journal"/);
});

test("approved divergences D1 (compact menu) and D2 (narrow ring captions) are present", () => {
  assert.match(component, /className="v10-nav-links"/);
  assert.match(component, /aria-expanded=\{menuOpen\} aria-controls="v10-menu-list"/);
  assert.match(component, /min-height:44px/);
  assert.match(globals, /@media \(max-width: 699px\) \{\n  \.v10-nav-links \{ display: none !important; \}/);
  assert.match(component, /className="v10-dcap"/);
  assert.match(globals, /\.v10-dcap \{ display: none; \}/);
});

test("the pre-V10 stylesheet loads on /journal only", () => {
  assert.match(read("app/journal/page.js"), /import "\.\/journal\.css";/);
  assert.doesNotMatch(layout, /journal\.css/);
  assert.doesNotMatch(globals, /spatial|cinematic-background|research-thumb/);
});
