// S5 Capability & Permission Gateway V1 -- focused tests of the PUBLIC
// adapter-wrapper surface (ML-DEVOS-RFC-017 §3, §7, §9, §10, Failure modes;
// D-063). In this process the real static registry claims the brand minters,
// so these tests see exactly what an external caller sees.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as gatewayApi from "../devos/capabilities/index.mjs";
import { createGateway, createAuditEnvelope, TrustedSourceUnavailableError, GatewayConfigurationError } from "../devos/capabilities/index.mjs";
import { evaluate } from "../devos/capabilities/evaluate.mjs";
import { main as validatorCli, validateCapabilityPolicy } from "../devos/capabilities/validate-capability-policy.mjs";
import * as V from "../devos/capabilities/vocabulary.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAP = path.join(ROOT, "devos", "capabilities");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(CAP, p), "utf8"));
const BASELINE = readJson("examples/valid/baseline.policy.json");
const V1 = BASELINE.policy_version;
const P = "Dillaab-source/maisog-labs";

function host(over = {}) {
  return {
    subject: () => ({ actor_role: "Builder", actor_id: "builder-1", credential_class: "github_pat_scoped", credential_available: true, attestation_ref: "job-1" }),
    now: () => "2026-09-24T12:00:00Z",
    revocations: () => [],
    ...over,
  };
}
const gw = (hosts, policies = [BASELINE]) => createGateway({ policies, hosts });
const req = (provider, action, resource, over = {}) => ({ project: P, provider, action, resource, environment: "local", policy_version: V1, ...over });
const outcome = (r) => r.decision.denial_reason ?? r.decision.outcome;

// ------------------------------------------------------------ public surface

test("the public entry never exposes the raw evaluate() core or any minting surface", () => {
  assert.equal("evaluate" in gatewayApi, false);
  for (const k of Object.keys(gatewayApi)) assert.doesNotMatch(k, /mint|register|brand/i);
});

test("hand-built contexts handed to the raw core are denied even with a valid policy", () => {
  const { github } = gw({ github: host() });
  const r = github.request(req("github", "git.push", "dillaab-source/maisog-labs:refs/heads/feature/x"));
  assert.equal(r.decision.outcome, "ALLOW");
  // Replay the adapter's own presented snapshots into the raw core: rejected.
  const { subject_context: s, request_intent: i, evaluation_context: e } = r.presented;
  assert.equal(evaluate(s, i, BASELINE, [], e).denial_reason, "UNTRUSTED_SUBJECT_CONTEXT");
});

test("the adapter derives who/when from its trusted host, never from request fields", () => {
  const { github } = gw({ github: host({ subject: () => ({ actor_role: "QA", actor_id: "qa-1", credential_class: null, credential_available: false, attestation_ref: "qa-job" }) }) });
  const forged = req("github", "git.push", "dillaab-source/maisog-labs:refs/heads/feature/x", { actor_role: "Builder" });
  assert.equal(outcome(github.request(forged)), "MALFORMED_REQUEST");
  assert.equal(outcome(github.request(req("github", "git.push", "dillaab-source/maisog-labs:refs/heads/feature/x"))), "UNKNOWN_PROJECT");
  // A request naming another provider cannot be laundered through this adapter.
  assert.equal(outcome(github.request(req("shell", "fs.read", "/srv/repo/a"))), "MALFORMED_REQUEST");
});

test("provider laundering: a resource valid for two providers cannot be routed through the wrong adapter to skip its contract", () => {
  // "dillaab-source/maisog-labs:refs/heads/feature/x" is canonical for BOTH
  // github and cloudflare (an opaque string). Through the github adapter it
  // would dodge the cloudflare adapter's genuine-reference check.
  const policy = { policy_version: "cf-1", descriptors: [{
    descriptor_id: "CF-ZONE-READ", actor_role: "Builder", project: P, provider: "cloudflare", action: "zone.read",
    resource_scope: ["dillaab-source/maisog-labs:refs/heads/feature/x"], environment: "local", expiry: null,
    credential_requirement: { required: false, credential_class: null }, consequence_tier: "low",
  }] };
  const g = createGateway({ policies: [policy], hosts: { github: host(), cloudflare: host({ cloudflareReferences: [] }) } });
  const laundered = req("cloudflare", "zone.read", "dillaab-source/maisog-labs:refs/heads/feature/x", { policy_version: "cf-1" });
  assert.equal(outcome(g.github.request(laundered)), "MALFORMED_REQUEST");
  assert.equal(outcome(g.cloudflare.request(laundered)), "MALFORMED_REQUEST"); // not a genuine reference
});

test("fail closed on trusted-source failures: no placeholder clock, no empty revocation list, no fabricated decision", () => {
  const r = req("github", "git.push", "dillaab-source/maisog-labs:refs/heads/feature/x");
  assert.throws(() => gw({ github: host({ now: () => { throw new Error("clock down"); } }) }).github.request(r), (e) => e instanceof TrustedSourceUnavailableError && e.source === "clock");
  assert.throws(() => gw({ github: host({ now: () => "yesterday" }) }).github.request(r), /malformed evaluation time/);
  assert.throws(() => gw({ github: host({ revocations: () => { throw new Error("CRL fetch failed"); } }) }).github.request(r), (e) => e.source === "revocation list");
  assert.throws(() => gw({ github: host({ revocations: () => null }) }).github.request(r), TrustedSourceUnavailableError);
  // A non-list (e.g. a bare string) must never be coerced into "no revocations".
  for (const junk of ["GH-PUSH-FEATURE", { ids: ["GH-PUSH-FEATURE"] }, 7]) {
    assert.throws(() => gw({ github: host({ revocations: () => junk }) }).github.request(r), TrustedSourceUnavailableError);
  }
  assert.throws(() => gw({ github: host({ subject: () => { throw new Error("no identity"); } }) }).github.request(r), (e) => e.source === "subject identity");
});

test("gateway construction: every policy validated (whole-document rejection), no duplicate versions, no unregistered provider, complete hosts", () => {
  const bad = readJson("examples/invalid/one-bad-descriptor-rejects-whole-policy.policy.json");
  assert.throws(() => createGateway({ policies: [bad], hosts: {} }), gatewayApi.PolicyValidationError);
  assert.throws(() => createGateway({ policies: [BASELINE, BASELINE], hosts: {} }), GatewayConfigurationError);
  assert.throws(() => createGateway({ policies: [BASELINE], hosts: { future: host() } }), GatewayConfigurationError);
  assert.throws(() => createGateway({ policies: [BASELINE], hosts: { github: { now: () => "x" } } }), GatewayConfigurationError);
  assert.equal(gw({ github: host() }).shell, undefined);
});

test("live revocation reaches a request through the adapter on every call", () => {
  let revoked = [];
  const { github } = gw({ github: host({ revocations: () => revoked }) });
  const r = req("github", "git.push", "dillaab-source/maisog-labs:refs/heads/feature/x");
  assert.equal(outcome(github.request(r)), "ALLOW");
  revoked = ["GH-PUSH-FEATURE"];
  assert.equal(outcome(github.request(r)), "REVOKED");
});

// --------------------------------------------- per-adapter canonicalization (§9)

test("shell: traversal and symlinks resolved with OS semantics, dangling and escaping paths rejected", (t) => {
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "s5-shell-")));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const repo = path.join(tmp, "repo");
  fs.mkdirSync(path.join(repo, "src"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "outside"));
  fs.writeFileSync(path.join(repo, "src", "a.txt"), "x");
  fs.symlinkSync(path.join(tmp, "outside"), path.join(repo, "escape"));
  fs.symlinkSync(path.join(repo, "src"), path.join(repo, "srclink"));
  fs.symlinkSync(path.join(tmp, "missing-target"), path.join(repo, "dangling"));
  const policy = { policy_version: "sh-1", descriptors: [{
    descriptor_id: "SH-READ", actor_role: "Builder", project: P, provider: "shell", action: "fs.read",
    resource_scope: [`${repo}/*`], environment: "local", expiry: null,
    credential_requirement: { required: false, credential_class: null }, consequence_tier: "low",
  }] };
  const { shell } = createGateway({ policies: [policy], hosts: { shell: host({ shellRoots: [repo] }) } });
  const ask = (p) => shell.request(req("shell", "fs.read", p, { policy_version: "sh-1" }));
  assert.equal(outcome(ask(`${repo}/src/a.txt`)), "ALLOW");
  assert.equal(ask(`${repo}/src/../src/./a.txt`).presented.request_intent.resource, `${repo}/src/a.txt`);
  assert.equal(ask(`${repo}/srclink/a.txt`).presented.request_intent.resource, `${repo}/src/a.txt`);
  assert.equal(outcome(ask(`${repo}/escape/secret`)), "MALFORMED_REQUEST"); // symlink out of root
  assert.equal(outcome(ask(`${repo}/../outside/x`)), "MALFORMED_REQUEST"); // traversal out of root
  assert.equal(outcome(ask(`${repo}/dangling/x`)), "MALFORMED_REQUEST"); // dangling symlink
  assert.equal(outcome(ask("relative/path")), "MALFORMED_REQUEST");
  assert.equal(outcome(ask(`${repo}/src/new-file.txt`)), "ALLOW"); // not-yet-existing tail
});

test("github: owner/repo normalized per GitHub's rules; malformed identifiers rejected, never guessed", () => {
  const { github } = gw({ github: host() });
  const ask = (r) => github.request(req("github", "git.push", r));
  assert.equal(ask("Dillaab-Source/MAISOG-LABS:refs/heads/feature/x").presented.request_intent.resource, "dillaab-source/maisog-labs:refs/heads/feature/x");
  for (const bad of ["maisog-labs", "-bad/repo:refs/heads/feature/x", "a--b/repo:refs/heads/x", "owner/..:refs/heads/x",
    "dillaab-source/maisog-labs:refs/heads/../main", "dillaab-source/maisog-labs:refs heads", "dillaab-source/maisog-labs:refs/heads/x.lock",
    "dillaab-source/maisog-labs:", "a/b/c"]) {
    assert.equal(outcome(ask(bad)), "MALFORMED_REQUEST", bad);
  }
});

test("cloudflare: opaque IDs byte-for-byte (no percent-decoding); only genuine host references accepted", () => {
  const cf = host({ credential_class: "cloudflare_api_token", cloudflareReferences: ["zone-7f3a%2Fedge", "zone-7f3a/edge"] });
  cf.subject = () => ({ actor_role: "Builder", actor_id: "builder-1", credential_class: "cloudflare_api_token", credential_available: true, attestation_ref: "job-1" });
  const { cloudflare } = gw({ cloudflare: cf });
  const ask = (r) => cloudflare.request(req("cloudflare", "worker.deploy", r, { environment: "staging" }));
  assert.equal(outcome(ask("zone-7f3a%2Fedge")), "ALLOW");
  assert.equal(ask("zone-7f3a%2Fedge").presented.request_intent.resource, "zone-7f3a%2Fedge");
  // The decoded form is a DIFFERENT opaque ID: it does not match the %2F descriptor.
  assert.equal(outcome(ask("zone-7f3a/edge")), "RESOURCE_SCOPE_MISMATCH");
  assert.equal(outcome(ask("zone-caller-invented")), "MALFORMED_REQUEST");
  assert.equal(outcome(ask("zone 7f3a")), "MALFORMED_REQUEST");
});

test("mcp: RFC 3986 URI grammar as MCP uses it; scheme/percent-hex normalized, nothing decoded", () => {
  const { mcp } = gw({ mcp: host() });
  const ask = (r) => mcp.request(req("mcp", "resource.read", r));
  assert.equal(outcome(ask("FILE:///srv/docs/guide.md")), "ALLOW");
  assert.equal(ask("file:///srv/docs/a%2fb.md").presented.request_intent.resource, "file:///srv/docs/a%2Fb.md");
  for (const bad of ["no-scheme/path", "file:///srv/docs/bad%zz", "file:///srv/docs/has space", "1bad:///x"]) {
    assert.equal(outcome(ask(bad)), "MALFORMED_REQUEST", bad);
  }
});

test("browser: WHATWG normalization (host case, default port, fragment dropped); credentials and non-http rejected", () => {
  const { browser } = gw({ browser: host() });
  const ask = (r) => browser.request(req("browser", "page.visit", r));
  assert.equal(ask("HTTPS://MaisogLabs.com:443/work#top").presented.request_intent.resource, "https://maisoglabs.com/work");
  assert.equal(outcome(ask("https://maisoglabs.com/work?x=1#frag")), "ALLOW");
  for (const bad of ["https://user:pw@maisoglabs.com/work", "javascript:alert(1)", "file:///etc/passwd", "not a url"]) {
    assert.equal(outcome(ask(bad)), "MALFORMED_REQUEST", bad);
  }
  // Descriptor expiry 2026-12-31: past it the same request is EXPIRED.
  const late = gw({ browser: host({ now: () => "2027-01-01T00:00:00Z" }) });
  assert.equal(outcome(late.browser.request(req("browser", "page.visit", "https://maisoglabs.com/work"))), "EXPIRED");
});

// ------------------------------------------------------- envelope via adapter

test("a caller builds its own AuditEnvelope from the adapter's presented snapshots and its own clock", () => {
  const { github } = gw({ github: host() });
  const r = github.request(req("github", "pr.merge", "dillaab-source/maisog-labs:refs/heads/main"));
  assert.equal(r.decision.outcome, "ALLOW");
  assert.equal(r.consequence_tier, "highest");
  const env = createAuditEnvelope({
    eventId: "evt-merge-1", timestamp: "2026-09-24T12:00:09Z", evidenceProvenance: "ACTOR_REPORTED",
    decision: r.decision, subjectContext: r.presented.subject_context, requestIntent: r.presented.request_intent,
    evaluationContext: r.presented.evaluation_context, consequenceTier: r.consequence_tier,
  });
  assert.equal(env.decision.non_authority_disclaimer, V.NON_AUTHORITY_DISCLAIMER);
  assert.notEqual(env.timestamp, env.evaluation_context.time);
});

// ------------------------------------------------- schemas <-> code (no drift)

test("schemas are valid JSON draft-07 documents whose enums/patterns equal the code vocabularies", () => {
  const s = (f) => readJson(f);
  const desc = s("capability-descriptor.schema.json");
  assert.equal(desc.$schema, "http://json-schema.org/draft-07/schema#");
  assert.deepEqual(desc.properties.actor_role.enum, [...V.ACTOR_ROLES]);
  assert.deepEqual(desc.properties.provider.enum, [...V.PROVIDERS]);
  assert.deepEqual(desc.properties.environment.enum, [...V.ENVIRONMENTS]);
  assert.deepEqual(desc.properties.consequence_tier.enum, [...V.CONSEQUENCE_TIERS]);
  assert.equal(desc.properties.descriptor_id.pattern, V.DESCRIPTOR_ID_PATTERN.source);
  assert.equal(desc.additionalProperties, false);
  assert.match(desc.description, /not grantable to new attempts after supersession/);
  assert.match(desc.properties.expiry.description, /not grantable to new attempts after supersession/);
  const dec = s("decision.schema.json");
  assert.deepEqual(dec.properties.denial_reason.oneOf[0].enum, [...V.DENIAL_REASONS]);
  assert.equal(dec.properties.non_authority_disclaimer.const, V.NON_AUTHORITY_DISCLAIMER);
  assert.equal("event_id" in dec.properties || "timestamp" in dec.properties, false);
  assert.deepEqual(Object.keys(s("evaluation-context.schema.json").properties), ["time"]);
  const ri = s("request-intent.schema.json");
  assert.equal(ri.additionalProperties, false);
  assert.equal(Object.keys(ri.properties).some((k) => /time|now|actor|credential|subject/.test(k)), false);
  assert.deepEqual(s("subject-context.schema.json").properties.attested_by.enum, [...V.PROVIDERS]);
});

test("validator CLI: every valid fixture passes and every invalid fixture fails for its intended reason", () => {
  const out = { text: "", write(x) { this.text += x; } };
  assert.equal(validatorCli([], out), 0, out.text);
  const why = {
    "sensitive-merge-main-underclassified": "RFC-017 §8",
    "sensitive-deploy-underclassified": "RFC-017 §8",
    "empty-resource-scope": "non-empty array",
    "infix-wildcard": "outside the V1 grammar",
    "noncanonical-literal": "not canonical",
    "reserved-future-provider": "reserved",
    "credential-value-not-class": "never a value",
    "unknown-field": "unknown field",
    "duplicate-descriptor-id": "duplicate",
    "one-bad-descriptor-rejects-whole-policy": "actor_role",
  };
  const files = fs.readdirSync(path.join(CAP, "examples", "invalid")).filter((f) => f.endsWith(".policy.json"));
  assert.equal(files.length, Object.keys(why).length);
  for (const f of files) {
    const r = validateCapabilityPolicy(readJson(`examples/invalid/${f}`));
    const key = f.replace(".policy.json", "");
    assert.equal(r.ok, false, f);
    assert.ok(r.errors.some((e) => e.includes(why[key])), `${f}: ${r.errors.join(" | ")}`);
  }
});

// ------------------------------------------------ boundaries (§10, CORE-008)

test("no S3/S4 wiring, no network, no plugin discovery, no secret literals in the S5 sources", () => {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))));
  walk(CAP);
  for (const f of files.filter((x) => x.endsWith(".mjs"))) {
    const src = fs.readFileSync(f, "utf8");
    const code = src.replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /devos\/(state|contracts)|\.\.\/(state|contracts)\//, `${f} must not import S3/S4`);
    assert.doesNotMatch(code, /fetch\(|node:https?|node:net|child_process|import\(\s*[^"'`]/, `${f} must not reach the network, spawn processes, or load plugins dynamically`);
  }
  for (const f of files.filter((x) => x.endsWith(".json"))) {
    const text = fs.readFileSync(f, "utf8");
    assert.doesNotMatch(text, /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|PRIVATE KEY|AKIA[0-9A-Z]{16}/, f);
  }
});
