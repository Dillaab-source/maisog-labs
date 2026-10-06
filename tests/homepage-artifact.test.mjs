// D-093 / D-121: the homepage artifact, byte-for-byte.
//
// The V10 design source is `publish/index.html` from the uploaded
// "Maisog Labs Design System.zip" (D-093). Since D-121 (ML-DEVOS-AS-145)
// public/index.html is the accepted V10.1 artifact derived from it, promoted
// byte-for-byte from candidates/v10.1/site/index.html; it must never be
// edited. Its scripts, fonts and icon are content-fingerprinted files under
// public/v101/assets/. The Next.js static export has no `/` route, so it
// copies public/index.html to out/index.html unchanged. The artifact's
// relative media paths (../../assets/...) resolve to /assets/... and are
// served by byte-identical copies of the approved V10 assets.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { test } from "node:test";
import zlib from "node:zlib";

const url = file => new URL(`../${file}`, import.meta.url);
const read = file => fs.readFileSync(url(file));
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

const ARTIFACT = "public/index.html";
const ARTIFACT_SHA256 = "7598a6c87fcdf7a80533dea697fc59d19e5400af59f6cd722297c373563fc283";
const CANDIDATE = "candidates/v10.1/site/index.html";
const V10_SOURCE_SHA256 = "2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9";
const ASSET_DIR = "public/v101/assets";
const ZIP = "design-references/maisoglabs-design-system/Maisog Labs Design System.zip";
const ZIP_SHA256 = "3ff9fbbaaf40f61fc9b82babafac4e33e9cdc5b723ed78157ef1b2068da6ead2";
const MEDIA = {
  "public/assets/plates/plate-hero-v4.png": "public/v10/assets/plate-hero-v4.png",
  "public/assets/plates/plate-aqueduct-v4.png": "public/v10/assets/plate-aqueduct-v4.png",
  "public/assets/video/logo-mark.mp4": "public/v10/assets/logo-mark.mp4",
  "public/assets/video/logo-mark-poster.png": "public/v10/assets/logo-mark-poster.png",
  ...Object.fromEntries(["01-ai", "02-automation", "03-security", "04-research", "05-systems", "08-strategy"]
    .map(icon => [`public/assets/icons/${icon}.svg`, `public/v10/assets/icons/${icon}.svg`])),
};

// Minimal ZIP reader (central directory, stored or deflated entries); the
// uploaded archive writes sizes in a trailing data descriptor.
function zipEntries(bytes) {
  let end = bytes.length - 22;
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end -= 1;
  assert.ok(end >= 0, "end of central directory found");
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16);
  const entries = {};
  for (let i = 0; i < count; i += 1) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const local = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + compressedSize);
    if (!name.endsWith("/")) entries[name] = method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

// The promoted artifact's fingerprinted asset references, in document order.
function artifactAssetRefs() {
  const html = read(ARTIFACT).toString("utf8");
  return [...new Set(html.match(/\/v101\/assets\/[^"')\s]+/g))];
}
const assetText = prefix => {
  const file = fs.readdirSync(url(ASSET_DIR)).find(name => name.startsWith(prefix + "."));
  return read(`${ASSET_DIR}/${file}`).toString("utf8");
};

test("the homepage artifact is the accepted V10.1 bytes, derived from the uploaded D-093 ZIP entry", () => {
  const zip = read(ZIP);
  assert.equal(sha(zip), ZIP_SHA256);
  const entries = zipEntries(zip);
  assert.deepEqual(Object.keys(entries), ["publish/index.html"]);
  assert.equal(sha(entries["publish/index.html"]), V10_SOURCE_SHA256);
  const report = JSON.parse(read("candidates/v10.1/build-report.json").toString());
  assert.equal(report.sourceArtifactSha256, V10_SOURCE_SHA256);
  assert.equal(report.candidateIndexSha256, ARTIFACT_SHA256);
  assert.equal(sha(read(ARTIFACT)), ARTIFACT_SHA256);
  assert.ok(read(ARTIFACT).equals(read(CANDIDATE)), "promoted byte-for-byte from the accepted candidate");
});

test("Next.js has no / route, so the export copies the artifact unchanged", () => {
  for (const file of ["app/page.js", "app/page.jsx", "app/page.tsx", "pages/index.js"]) assert.ok(!fs.existsSync(url(file)), file);
  assert.match(read("next.config.mjs").toString(), /output: "export"/);
});

test("every media path the artifact expects resolves to a byte-identical approved asset", () => {
  const sources = artifactAssetRefs().filter(ref => ref.endsWith(".js")).map(ref => read(`public${ref}`).toString("utf8")).join("\n");
  const expected = new Set();
  for (const match of sources.matchAll(/\.\.\/\.\.\/assets\/([\w./-]+?\.(?:png|mp4|svg))/g)) expected.add(`public/assets/${match[1]}`);
  const data = assetText("data");
  assert.ok(data.startsWith("window.MLData = {"), "UI kit data resource present");
  for (const match of data.matchAll(/icon: '([\w-]+)'/g)) expected.add(`public/assets/icons/${match[1]}.svg`);
  assert.ok(expected.size >= 10, `found ${expected.size} media paths`);
  for (const file of expected) {
    assert.ok(Object.hasOwn(MEDIA, file), `${file} is mapped`);
  }
  for (const [served, approved] of Object.entries(MEDIA)) {
    assert.equal(sha(read(served)), sha(read(approved)), served);
  }
});

test("the artifact loads nothing from the network: every script, icon and font is a same-origin fingerprinted file", () => {
  const html = read(ARTIFACT).toString("utf8");
  const refs = [
    ...[...html.matchAll(/<(?:script|img|video|source)[^>]*\ssrc="([^"]*)"/g)].map(match => match[1]),
    ...[...html.matchAll(/<link[^>]*\shref="([^"]*)"/g)].filter(match => !/rel="canonical"/.test(match[0])).map(match => match[1]),
    ...[...html.matchAll(/url\(([^)]*)\)/g)].map(match => match[1].replace(/["']/g, "")),
  ];
  assert.ok(refs.length > 30);
  for (const ref of refs) {
    const [, fingerprint] = ref.match(/^\/v101\/assets\/[\w-]+(?:\.[\w-]+)*\.([0-9a-f]{12})\.(?:js|woff2|svg)$/) || [];
    assert.ok(fingerprint, ref);
    assert.equal(sha(read(`public${ref}`)).slice(0, 12), fingerprint, ref);
  }
  assert.deepEqual(fs.readdirSync(url(ASSET_DIR)).map(name => `/v101/assets/${name}`).sort(), artifactAssetRefs().sort(), "no unreferenced or missing assets");
});

// RFC-022 (ML-DEVOS-AS-132, D-105 Q2, D-106) adds exactly the path "/" for
// the published-content bridge; the artifact file itself stays byte-identical
// (asserted above) and no other asset route becomes Worker-first.
test("the Worker routing contract: exact / (RFC-022) plus /admin and the APIs are Worker-first", () => {
  const config = read("wrangler.jsonc").toString();
  assert.match(config, /"run_worker_first": \["\/", "\/admin", "\/admin\/\*", "\/api\/journal", "\/api\/journal\/\*", "\/api\/design"\]/);
  assert.match(config, /"html_handling": "auto-trailing-slash"/);
  assert.ok(fs.existsSync(url("app/journal/page.js")));
  assert.ok(fs.existsSync(url("app/admin/page.js")));
});
