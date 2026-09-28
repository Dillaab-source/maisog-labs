// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-105/D-106): pure bridge tests.
// Covers the payload contract (RFC-022 §5.1), escaping and span-only splice
// (§5.2), the hook (§5.3, run in a vm sandbox against the artifact's real
// MLData resource), and the AS132-F001 transformed-response headers.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import zlib from "node:zlib";
import {
  buildBridgePayload,
  serializeBridgePayload,
  validateProjectsGroup,
  passesInitialActivationGate,
  INITIAL_ACTIVATION_PROJECT_NAMES,
  MAX_HOMEPAGE_PROJECTS,
} from "../worker/bridge/payload.mjs";
import {
  ARTIFACT_SHA256,
  ARTIFACT_LENGTH,
  INSERTION_OFFSET,
  HOOK_SOURCE,
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
    status: "",
    tagline: `${name} tagline.`,
    description: `${name} description.`,
    disciplines: [0, 2],
    flow: ["Stage one", "Stage two", "Stage three", "Person reviews"],
    ...overrides,
  };
}
const initialFive = () => INITIAL_ACTIVATION_PROJECT_NAMES.map(name => project(name));

// The artifact's own MLData resource, decoded exactly as tests/homepage-artifact.test.mjs does.
function artifactMLDataSource() {
  const html = Buffer.from(ARTIFACT).toString("utf8");
  const manifest = JSON.parse(html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]);
  for (const entry of Object.values(manifest)) {
    const raw = Buffer.from(entry.data, "base64");
    const text = (entry.compressed ? zlib.gunzipSync(raw) : raw).toString("utf8");
    if (text.startsWith("window.MLData = {")) return text.slice(0, text.indexOf("// Motion mode"));
  }
  throw new Error("MLData resource not found");
}

// Runs the hook against an island, then executes the artifact's own MLData
// assignment, exactly as the loader would.
function runHookThenArtifact(islandText) {
  const island = islandText === null ? null : { textContent: islandText };
  const sandbox = { document: { getElementById: id => (id === "ml-published" ? island : null) } };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  if (islandText !== null) vm.runInContext(HOOK_SOURCE, sandbox);
  vm.runInContext(artifactMLDataSource(), sandbox);
  return sandbox.window.MLData;
}

test("the artifact is still the approved D-093 bytes (test 1)", () => {
  assert.equal(ARTIFACT.length, ARTIFACT_LENGTH);
  assert.equal(sha(ARTIFACT), ARTIFACT_SHA256);
  assert.equal(Buffer.from(ARTIFACT.subarray(INSERTION_OFFSET, INSERTION_OFFSET + 7)).toString(), "</head>");
  const outerHead = Buffer.from(ARTIFACT.subarray(0, INSERTION_OFFSET)).toString("utf8");
  assert.ok(!outerHead.includes("<script"), "the outer head holds no script, so the span precedes every script");
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

test("activation gate (AS132-F002): only the exact D-105 set in order passes", () => {
  assert.equal(passesInitialActivationGate(validateProjectsGroup(initialFive())), true);
  assert.equal(passesInitialActivationGate(validateProjectsGroup(initialFive().reverse())), false);
  assert.equal(passesInitialActivationGate(validateProjectsGroup(initialFive().slice(0, 4))), false);
  assert.equal(buildBridgePayload({ projects: initialFive().slice(0, 4) }), null, "gate keeps artifact data");
  assert.equal(buildBridgePayload({ projects: initialFive().slice(0, 4), applyActivationGate: false }).projects.length, 4, "preview mode");
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
  assert.deepEqual(merged.PROJ[0], { name: "ClinicFlow", kind: "Lab project", status: "", tags: [0, 2], tag: "ClinicFlow tagline.", desc: "ClinicFlow description." });
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
