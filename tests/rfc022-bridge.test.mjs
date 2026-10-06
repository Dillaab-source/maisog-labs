// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-105/D-106): pure bridge tests.
// Covers the payload contract (RFC-022 §5.1), escaping and span-only splice
// (§5.2), the hook (§5.3, run in a vm sandbox against the artifact's real
// MLData resource), and the AS132-F001 transformed-response headers.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import {
  buildBridgePayload,
  serializeBridgePayload,
  validateProjectsGroup,
  initialReleaseReadiness,
  INITIAL_ACTIVATION_PROJECT_NAMES,
  MAX_HOMEPAGE_PROJECTS,
} from "../worker/bridge/payload.mjs";
import {
  ARTIFACT_SHA256,
  ARTIFACT_LENGTH,
  INSERTION_OFFSET,
  HOOK_SOURCE,
  createHookSource,
  buildBridgeSpan,
  isApprovedArtifact,
  spliceArtifact,
  buildTransformedResponse,
} from "../worker/bridge/inject.mjs";

const ARTIFACT = new Uint8Array(fs.readFileSync(new URL("../public/index.html", import.meta.url)));
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

export function project(name, overrides = {}) {
  return {
    name,
    kind: "Lab project",
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    caseStudyEnabled: false,
    status: "",
    tagline: `${name} tagline.`,
    description: `${name} description.`,
    disciplines: [0, 2],
    flow: ["Stage one", "Stage two", "Stage three", "Person reviews"],
    ...overrides,
  };
}
const initialFive = () => INITIAL_ACTIVATION_PROJECT_NAMES.map(name => project(name));

// The artifact's own MLData resource: the data script the promoted artifact
// (D-121) references under /v101/assets/.
function artifactMLDataSource() {
  const html = Buffer.from(ARTIFACT).toString("utf8");
  const ref = html.match(/<script src="(\/v101\/assets\/data\.[0-9a-f]{12}\.js)"><\/script>/)[1];
  const text = fs.readFileSync(new URL(`../public${ref}`, import.meta.url), "utf8");
  if (!text.startsWith("window.MLData = {")) throw new Error("MLData resource not found");
  return text.slice(0, text.indexOf("// Motion mode"));
}

// Runs the hook against an island, then executes the artifact's own MLData
// assignment, exactly as the page would.
function runHookThenArtifact(islandText, hookSource = HOOK_SOURCE) {
  const island = islandText === null ? null : { textContent: islandText };
  const sandbox = { document: { getElementById: id => (id === "ml-published" ? island : null) } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  if (islandText !== null) vm.runInContext(hookSource, sandbox);
  vm.runInContext(artifactMLDataSource(), sandbox);
  return sandbox.window.MLData;
}

test("the artifact is the promoted V10.1 bytes the constants pin (test 1)", () => {
  assert.equal(ARTIFACT.length, ARTIFACT_LENGTH);
  assert.equal(sha(ARTIFACT), ARTIFACT_SHA256);
  assert.equal(Buffer.from(ARTIFACT.subarray(INSERTION_OFFSET, INSERTION_OFFSET + 7)).toString(), "</head>");
  const head = Buffer.from(ARTIFACT.subarray(0, INSERTION_OFFSET)).toString("utf8");
  assert.ok(!head.includes("<script"), "the head holds no script, so the span precedes every script");
});

test("payload: a valid initial set of five builds; groups are all-or-nothing and independent", () => {
  const payload = buildBridgePayload({ projects: initialFive(), email: "owner@example.com" });
  assert.equal(payload.projects.length, 5);
  assert.deepEqual(payload.contact, { email: "owner@example.com" });
  const badProjects = buildBridgePayload({ projects: [...initialFive().slice(0, 4), project("Maisog Kilat", { flow: ["a", "b", "c"] })], email: "owner@example.com" });
  assert.equal(badProjects.projects, undefined, "invalid projects group dropped whole");
  assert.deepEqual(badProjects.contact, { email: "owner@example.com" }, "valid contact group still applies");
  assert.equal(buildBridgePayload({ projects: null, email: null }), null);
  assert.equal(buildBridgePayload({ projects: null, email: "not-an-email" }), null);
});

test("payload: more than five projects is rejected (test 8) and flow must have exactly four stages (test 9)", () => {
  const six = [...initialFive(), project("Maisog Guild")];
  assert.equal(six.length, MAX_HOMEPAGE_PROJECTS + 1);
  assert.throws(() => validateProjectsGroup(six));
  assert.throws(() => validateProjectsGroup([]));
  for (const flow of [["a", "b", "c"], ["a", "b", "c", "d", "e"], ["a", "b", "c", ""], ["a", "b", "c", 4]]) {
    assert.throws(() => validateProjectsGroup([project("X", { flow })]), JSON.stringify(flow));
  }
});

test("payload: hostile or out-of-bounds values are rejected (test 5)", () => {
  const cases = [
    { name: "<img src=x onerror=alert(1)>" },
    { name: "Line\nbreak" },
    { tagline: "</script><script>alert(1)</script>" },
    { description: "x".repeat(401) },
    { name: "x".repeat(41) },
    { status: "Retired" },
    { disciplines: [6] },
    { disciplines: [0, 0] },
    { disciplines: [] },
    { disciplines: ["0"] },
    { url: "javascript:alert(1)" },
    { style: "color:red" },
  ];
  for (const overrides of cases) {
    assert.throws(() => validateProjectsGroup([project("X", overrides)]), JSON.stringify(overrides));
  }
  assert.throws(() => validateProjectsGroup([project("Same"), project("same")]), "names unique case-insensitively");
});

test("AS133-F001 item 1: the exact D-105 five, in order, pass initial release readiness (AS132-F002)", () => {
  assert.equal(initialReleaseReadiness(initialFive()), true);
});

test("AS133-F001 item 2: a wrong or incomplete initial set fails release readiness", () => {
  const renamed = initialFive();
  renamed[1] = project("Maisog Guild");
  const cases = {
    reordered: initialFive().reverse(),
    incomplete: initialFive().slice(0, 4),
    wrongName: renamed,
    invalidGroup: initialFive().map((p, i) => (i === 2 ? project(p.name, { flow: ["One", "Two", "Three"] }) : p)),
    tooMany: [...initialFive(), project("Maisog Guild")],
    empty: [],
    notAnArray: null,
  };
  for (const [label, projects] of Object.entries(cases)) assert.equal(initialReleaseReadiness(projects), false, label);
});

test("AS133-F001 item 3: any valid group of 1..5 builds the public payload; no name gate at runtime", () => {
  for (let n = 1; n <= MAX_HOMEPAGE_PROJECTS; n++) {
    const projects = Array.from({ length: n }, (_, i) => project(`Fixture ${i + 1}`));
    const payload = buildBridgePayload({ projects });
    assert.deepEqual(payload.projects.map(p => p.name), projects.map(p => p.name), `n=${n}`);
    assert.equal(initialReleaseReadiness(projects), false, "release readiness is independent of runtime validity");
  }
  assert.equal(buildBridgePayload({ projects: initialFive().slice(0, 4) }).projects.length, 4, "four of the D-105 five still render");
});

test("serialization escapes <, >, &, U+2028 and U+2029 so the island cannot break out", () => {
  const json = serializeBridgePayload({ schemaVersion: 1, x: "</script><!-- & \u2028\u2029" });
  assert.ok(!/[<>&\u2028\u2029]/.test(json));
  assert.deepEqual(JSON.parse(json), { schemaVersion: 1, x: "</script><!-- & \u2028\u2029" });
});

test("splice: the injected response differs only by the bounded span (test 4)", async () => {
  assert.equal(await isApprovedArtifact(ARTIFACT), true);
  const payload = buildBridgePayload({ projects: initialFive(), email: "owner@example.com" });
  const out = spliceArtifact(ARTIFACT, payload);
  const span = new TextEncoder().encode(buildBridgeSpan(payload));
  assert.equal(out.length, ARTIFACT.length + span.length);
  assert.deepEqual(out.subarray(INSERTION_OFFSET, INSERTION_OFFSET + span.length), span);
  const removed = new Uint8Array(ARTIFACT.length);
  removed.set(out.subarray(0, INSERTION_OFFSET), 0);
  removed.set(out.subarray(INSERTION_OFFSET + span.length), INSERTION_OFFSET);
  assert.equal(sha(removed), ARTIFACT_SHA256);
  const spanText = new TextDecoder().decode(span);
  assert.match(spanText, /^<script type="application\/json" id="ml-published">[^<]*<\/script><script>/);
  assert.equal(spanText.split("<script").length - 1, 2, "exactly two script elements");
  assert.ok(spanText.endsWith(`<script>${HOOK_SOURCE}</script>`), "the hook is the fixed code constant");
});

test("splice precondition: anything but the exact artifact is never spliced", async () => {
  const altered = ARTIFACT.slice();
  altered[10] ^= 1;
  assert.equal(await isApprovedArtifact(altered), false);
  assert.equal(await isApprovedArtifact(ARTIFACT.subarray(1)), false);
  assert.equal(await isApprovedArtifact(new Uint8Array(0)), false);
});

test("hook: merges published projects/flow/email into the artifact's own MLData before render", () => {
  const payload = buildBridgePayload({ projects: initialFive(), email: "owner@example.com" });
  const original = runHookThenArtifact(null);
  // vm-realm objects are compared as plain data.
  const merged = JSON.parse(JSON.stringify(runHookThenArtifact(serializeBridgePayload(payload))));
  assert.deepEqual(
    merged.PROJ.map(p => p.name),
    INITIAL_ACTIVATION_PROJECT_NAMES.slice()
  );
  assert.deepEqual(merged.PROJ[0], { name: "ClinicFlow", kind: "Lab project", slug: "clinicflow", caseStudyEnabled: false, status: "", tags: [0, 2], tag: "ClinicFlow tagline.", desc: "ClinicFlow description." });
  assert.equal(merged.FLOW.length, 5);
  assert.ok(merged.FLOW.every(stages => stages.length === 4));
  assert.equal(merged.EMAIL, "owner@example.com");
  for (const key of ["SLOTS", "PSLOTS", "DISC", "NOTES"]) {
    assert.deepEqual(JSON.parse(JSON.stringify(merged[key])), JSON.parse(JSON.stringify(original[key])), key);
  }
  assert.deepEqual(Object.keys(merged).sort(), Object.keys(original).sort(), "no key added");
});

test("hook: malformed, hostile or oversized islands leave the artifact's MLData untouched and never throw", () => {
  const original = JSON.stringify(runHookThenArtifact(null));
  const islands = [
    "not json",
    "{}",
    JSON.stringify({ schemaVersion: 2, contact: { email: "a@example.com" } }),
    JSON.stringify({ schemaVersion: 1, projects: [...initialFive(), project("Six")] }),
    JSON.stringify({ schemaVersion: 1, projects: [project("X", { flow: ["a"] })] }),
    JSON.stringify({ schemaVersion: 1, projects: [project("<b>x</b>")] }),
    JSON.stringify({ schemaVersion: 1, contact: { email: "javascript:alert(1)" } }),
    JSON.stringify({ schemaVersion: 1, projects: [project("X", { disciplines: [99] })] }),
  ];
  for (const island of islands) {
    assert.equal(JSON.stringify(runHookThenArtifact(island)), original, island.slice(0, 60));
  }
});

test("hook independently validates case-study fields and supports a second registry-approved slug", () => {
  const genericHook = createHookSource(["clinicflow", "second-study"]);
  const second = project("Second Study", { slug: "second-study", caseStudyEnabled: true });
  const payload = JSON.stringify({ schemaVersion: 1, projects: [second] });
  const merged = JSON.parse(JSON.stringify(runHookThenArtifact(payload, genericHook)));
  assert.equal(merged.PROJ[0].slug, "second-study");
  assert.equal(merged.PROJ[0].caseStudyEnabled, true);

  const original = JSON.stringify(runHookThenArtifact(null));
  const malformed = [
    [project("Bad Slug", { slug: "../clinicflow" }), genericHook],
    [project("Too Long Slug", { slug: "a".repeat(81) }), genericHook],
    [project("Bad Boolean", { caseStudyEnabled: 1 }), genericHook],
    [project("String Boolean", { caseStudyEnabled: "true" }), genericHook],
    [project("Unregistered Enabled", { slug: "second-study", caseStudyEnabled: true }), HOOK_SOURCE],
  ];
  const validClinicFlow = project("ClinicFlow", { caseStudyEnabled: true });
  const malformedGroup = { schemaVersion: 1, projects: [validClinicFlow, project("Unregistered Enabled", { slug: "second-study", caseStudyEnabled: true })] };
  assert.equal(JSON.stringify(runHookThenArtifact(JSON.stringify(malformedGroup))), original, "one unregistered enabled project falls back the whole group");
  for (const [badProject, hookSource] of malformed) {
    const result = runHookThenArtifact(JSON.stringify({ schemaVersion: 1, projects: [badProject] }), hookSource);
    assert.equal(JSON.stringify(result), original, JSON.stringify(badProject));
  }
});

test("AS132-F001: transformed responses drop body-identity validators and are no-store", async () => {
  const original = new Response(ARTIFACT, {
    headers: {
      "Content-Type": "text/html",
      "Content-Length": String(ARTIFACT.length),
      "Content-Encoding": "br",
      ETag: '"artifact-etag"',
      "Last-Modified": "Mon, 28 Sep 2026 00:00:00 GMT",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Frame-Options": "DENY",
    },
  });
  const body = spliceArtifact(ARTIFACT, buildBridgePayload({ contact: undefined, email: "owner@example.com" }));
  const response = buildTransformedResponse(original, body);
  for (const header of ["content-encoding", "etag", "last-modified"]) assert.equal(response.headers.get(header), null, header);
  assert.notEqual(response.headers.get("content-length"), String(ARTIFACT.length));
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-type"), "text/html");
  assert.equal(response.headers.get("x-frame-options"), "DENY", "security headers preserved");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await response.arrayBuffer()).byteLength, body.length);
});
