// Website Redesign V1 (D-076 / ML-DEVOS-AS-104, docs/product/WEBSITE_REDESIGN_V1_PLAN.md):
// the pure spatial route/derivation contract, the local static content
// extension, the fixed WEB-INC-007 mapping and content-integrity guards.
// Browser interaction/motion evidence lives in
// docs/product/evidence/website-redesign-v1/ (ACTOR_REPORTED).
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

import { siteContent, spatialContent } from "../data/site.js";
import { ROUTES, disciplineGraph, managedTriggerSlots, motionMode, relatedProjects, resolveHash } from "../components/site/routes.mjs";
import { getPublicContent } from "../lib/content/local.mjs";
import { projectPublishedContent } from "../lib/content/public.mjs";
import { validateSpatialContent } from "../lib/content/schema.mjs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("routes: four fixed destinations with the fixed WEB-INC-007 mapping (plan §19)", () => {
  assert.deepEqual(ROUTES.map(r => [r.id, r.section, r.slot]), [
    ["systems", "process", 1], ["projects", "projects", 2], ["research", null, 3], ["contact", "about", 4],
  ]);
});

test("resolveHash: no/unknown hash is Entry; routes resolve; legacy anchors alias", () => {
  for (const hash of ["", "#", "#home", "#main-content", "#nope", "#Systems", "#systems/x", "#../contact", null]) {
    assert.deepEqual(resolveHash(hash), { route: null, canonical: null }, String(hash));
  }
  for (const id of ["systems", "projects", "research", "contact"]) assert.deepEqual(resolveHash(`#${id}`), { route: id, canonical: null });
  assert.deepEqual(resolveHash("#process"), { route: "systems", canonical: "#systems" });
  assert.deepEqual(resolveHash("#about"), { route: "contact", canonical: "#contact" });
});

test("managedTriggerSlots: order permutes only the managed triggers among slots 1,2,4; Research keeps 3", () => {
  const defaults = { process: 1, projects: 2, about: 4 };
  assert.deepEqual(managedTriggerSlots(null), defaults);
  assert.deepEqual(managedTriggerSlots({ projects: { order: 1 }, process: { order: 2 } }), defaults, "missing about => default");
  assert.deepEqual(managedTriggerSlots({ projects: { order: 1 }, process: { order: 2 }, about: { order: 99 } }), defaults, "out of range => default");
  assert.deepEqual(managedTriggerSlots({ projects: { order: 1 }, process: { order: "2" }, about: { order: 3 } }), defaults, "non-integer => default");
  assert.deepEqual(managedTriggerSlots({ home: { order: 0 }, projects: { order: 9 }, process: { order: 5 }, about: { order: 2 } }), { about: 1, process: 2, projects: 4 });
  assert.deepEqual(managedTriggerSlots({ projects: { order: 3 }, process: { order: 3 }, about: { order: 3 } }), defaults, "ties keep default order");
  for (const value of Object.values(managedTriggerSlots({ projects: { order: 0 }, process: { order: 20 }, about: { order: 7 } }))) assert.notEqual(value, 3);
});

test("disciplineGraph: relationships derive only from published project category/stack names", async () => {
  const content = { ...(await getPublicContent()), spatial: validateSpatialContent(structuredClone(spatialContent)) };
  const projects = content.projects.filter(p => p.featured);
  const graph = disciplineGraph(content.spatial.disciplines, projects);
  assert.deepEqual(graph.nodes.map(n => n.label), ["AI", "Automation", "Research", "Security", "Systems", "Architecture"]);
  // Every edge is justified by a project related to both ends.
  for (const edge of graph.edges) {
    assert.ok(edge.via.length > 0);
    for (const id of edge.via) {
      const project = projects.find(p => p.id === id);
      for (const end of [edge.a, edge.b]) {
        const discipline = content.spatial.disciplines.find(d => d.id === end);
        assert.ok(relatedProjects(discipline, [project]).length === 1, `${id} does not name ${end}`);
      }
    }
  }
  assert.deepEqual(graph.edges.map(e => `${e.a}~${e.b}`), [
    "discipline-ai~discipline-automation", "discipline-ai~discipline-systems",
    "discipline-automation~discipline-systems", "discipline-research~discipline-security",
  ]);
  const architecture = graph.nodes.find(n => n.label === "Architecture");
  assert.deepEqual([architecture.projects, architecture.connections], [[], []], "no invented relationship");
  // A project with no matching names creates nothing; removing the evidence removes the edge.
  const withoutHub = disciplineGraph(content.spatial.disciplines, projects.filter(p => p.slug !== "automation-hub"));
  assert.ok(!withoutHub.edges.some(e => e.a === "discipline-ai" && e.b === "discipline-systems"));
});

test("motionMode: off wins; minimal; calm default", () => {
  assert.equal(motionMode({ prefersReduced: false, reducedMotionMode: null, animation: null }), "calm");
  assert.equal(motionMode({ prefersReduced: false, reducedMotionMode: "respect-system", animation: "calm" }), "calm");
  assert.equal(motionMode({ prefersReduced: false, reducedMotionMode: null, animation: "minimal" }), "minimal");
  assert.equal(motionMode({ prefersReduced: false, reducedMotionMode: null, animation: "off" }), "off");
  assert.equal(motionMode({ prefersReduced: true, reducedMotionMode: null, animation: "calm" }), "off");
  assert.equal(motionMode({ prefersReduced: false, reducedMotionMode: "always-reduced", animation: "minimal" }), "off");
});

test("content: spatial copy is a separate, validated, fail-closed local document", () => {
  assert.equal(validateSpatialContent(spatialContent), spatialContent);
  // The legacy content document (mirrored by the D1 migration) is unchanged.
  assert.ok(!Object.hasOwn(siteContent, "spatial"));
  assert.ok(!Object.hasOwn(projectPublishedContent(siteContent), "spatial"));
  for (const [name, mutate] of [
    ["missing descriptor", c => delete c.entryDescriptor],
    ["unknown field", c => c.cssClass = "x"],
    ["destination reorder", c => c.destinations.reverse()],
    ["destination missing", c => c.destinations.pop()],
    ["duplicate destination", c => c.destinations[1] = { ...c.destinations[0] }],
    ["unknown destination route", c => c.destinations[0].route = "admin"],
    ["HTML in descriptor", c => c.entryDescriptor = "<img src=x onerror=alert(1)>"],
    ["HTML in discipline", c => c.disciplines[0].text = "<b>x</b>"],
    ["duplicate discipline id", c => c.disciplines[1].id = c.disciplines[0].id],
    ["invalid discipline id", c => c.disciplines[0].id = "Bad Id"],
    ["oversized statement", c => c.contactStatement = "a".repeat(121)],
    ["non-array terms", c => c.disciplines[0].terms = "AI"],
  ]) {
    const source = structuredClone(spatialContent);
    mutate(source);
    assert.throws(() => validateSpatialContent(source), /Invalid spatial content/, name);
  }
});

test("content integrity: approved Entry sentence and repository contact address", async () => {
  const content = { ...(await getPublicContent()), spatial: spatialContent };
  assert.equal(content.spatial.entryDescriptor, "MaisogLabs is Paulo Maisog's independent technology lab, building practical AI automation, research systems, software, and security-focused experiments.");
  assert.equal(content.contact.email, "hello@maisoglabs.com");
  assert.equal(content.spatial.contactStatement, "Humanity orbits higher.");
  // Discipline copy restates already-published copy (plan §20: no new claims).
  const published = JSON.stringify([siteContent.services, siteContent.foundations, siteContent.process, siteContent.about, siteContent.projects]);
  const sources = {
    "discipline-ai": "AI experiences designed around real user needs and clear boundaries",
    "discipline-automation": "Connected workflows that reduce repetitive work",
    "discipline-research": "Hands-on labs, notes, and practical",
    "discipline-security": "Practical systems built with reliability and security in mind",
    "discipline-systems": "Connect the right tools into a dependable system",
    "discipline-architecture": "Start with the real problem and the people living with it",
  };
  for (const d of content.spatial.disciplines) {
    assert.ok(published.toLowerCase().includes(sources[d.id].toLowerCase()), `${d.id} source missing from published content`);
    assert.ok(d.text.toLowerCase().includes(sources[d.id].toLowerCase().slice(0, 20)), `${d.id} text drifted from its source`);
  }
});

test("content integrity: spatial components carry no hardcoded research entries, dates, emails or external URLs", () => {
  const dir = new URL("../components/site/", import.meta.url);
  for (const file of fs.readdirSync(dir)) {
    const source = fs.readFileSync(new URL(file, dir), "utf8");
    assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(source), `${file}: hardcoded email`);
    assert.ok(!/https?:\/\//.test(source.replace(/^\s*\/\/.*$/gm, "")), `${file}: hardcoded external URL`);
    assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(source), `${file}: hardcoded date`);
    assert.ok(!/dangerouslySetInnerHTML|innerHTML|eval\(|new Function/.test(source), `${file}: HTML/code injection surface`);
  }
  const research = read("components/site/ResearchSurface.js");
  assert.match(research, /getJson\("\/api\/journal"\)/);
  assert.match(research, /\/api\/journal\/\$\{encodeURIComponent\(slug\)\}/);
});

test("DesignRuntime: fixed managed ids only; triggers get order, visibility applies to every marked element", () => {
  const source = read("app/DesignRuntime.js");
  assert.match(source, /const MANAGED_SECTION_IDS = \["home", "projects", "process", "about"\];/);
  assert.match(source, /document\.querySelectorAll\(`\[data-section="\$\{id\}"\]`\)/);
  assert.equal((source.replace(/^\s*\/\/.*$/gm, "").match(/querySelector(All)?\(/g) || []).length, 1, "exactly one selector, built from the fixed list");
  assert.match(source, /hasAttribute\("data-section-trigger"\)/);
  const code = source.replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/dangerouslySetInnerHTML|innerHTML|createElement\("style"\)|eval\(/.test(code));
});

test("page markup: managed ids are the fixed four; Research is unmanaged", () => {
  const shell = read("components/site/SpatialShell.js");
  assert.match(shell, /data-section="home"/);
  assert.match(shell, /route\.section \? \{ "data-section": route\.section \}/);
  assert.ok(!/data-section="(?!home")/.test(shell), "no other literal managed id");
});
