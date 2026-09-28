// D-093: the published Design System artifact is the homepage, byte-for-byte.
//
// public/index.html is `publish/index.html` from the uploaded
// "Maisog Labs Design System.zip" and must never be edited. The Next.js
// static export has no `/` route, so it copies public/index.html to
// out/index.html unchanged. The artifact's relative media paths
// (../../assets/...) resolve to /assets/... and are served by byte-identical
// copies of the approved V10 assets.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { test } from "node:test";
import zlib from "node:zlib";

const url = file => new URL(`../${file}`, import.meta.url);
const read = file => fs.readFileSync(url(file));
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

const ARTIFACT = "public/index.html";
const ARTIFACT_SHA256 = "2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9";
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

// Decodes the bundler manifest the artifact unpacks in the browser.
function decodeArtifact() {
  const html = read(ARTIFACT).toString("utf8");
  const section = type => JSON.parse(html.match(new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`))[1]);
  const manifest = section("manifest");
  const resources = Object.values(manifest).map(entry => {
    const raw = Buffer.from(entry.data, "base64");
    return { mime: entry.mime, bytes: entry.compressed ? zlib.gunzipSync(raw) : raw };
  });
  return { template: section("template"), resources };
}

test("the homepage artifact is byte-identical to the uploaded ZIP entry", () => {
  const zip = read(ZIP);
  assert.equal(sha(zip), ZIP_SHA256);
  const entries = zipEntries(zip);
  assert.deepEqual(Object.keys(entries), ["publish/index.html"]);
  assert.equal(sha(entries["publish/index.html"]), ARTIFACT_SHA256);
  assert.equal(sha(read(ARTIFACT)), ARTIFACT_SHA256);
});

test("Next.js has no / route, so the export copies the artifact unchanged", () => {
  for (const file of ["app/page.js", "app/page.jsx", "app/page.tsx", "pages/index.js"]) assert.ok(!fs.existsSync(url(file)), file);
  assert.match(read("next.config.mjs").toString(), /output: "export"/);
});

test("every media path the artifact expects resolves to a byte-identical approved asset", () => {
  const { resources } = decodeArtifact();
  const sources = resources.filter(r => /javascript/.test(r.mime)).map(r => r.bytes.toString("utf8")).join("\n");
  const expected = new Set();
  for (const match of sources.matchAll(/\.\.\/\.\.\/assets\/([\w./-]+?\.(?:png|mp4|svg))/g)) expected.add(`public/assets/${match[1]}`);
  const data = resources.map(r => r.bytes.toString("utf8")).find(text => text.startsWith("window.MLData = {"));
  assert.ok(data, "UI kit data resource present");
  for (const match of data.matchAll(/icon: '([\w-]+)'/g)) expected.add(`public/assets/icons/${match[1]}.svg`);
  assert.ok(expected.size >= 10, `found ${expected.size} media paths`);
  for (const file of expected) {
    assert.ok(Object.hasOwn(MEDIA, file), `${file} is mapped`);
  }
  for (const [served, approved] of Object.entries(MEDIA)) {
    assert.equal(sha(read(served)), sha(read(approved)), served);
  }
});

test("the artifact loads nothing from the network: every script, stylesheet, icon and font is embedded", () => {
  const { template } = decodeArtifact();
  const refs = [
    ...[...template.matchAll(/<(?:script|img|video|source)[^>]*\ssrc="([^"]*)"/g)].map(match => match[1]),
    ...[...template.matchAll(/<link[^>]*\shref="([^"]*)"/g)].map(match => match[1]),
    ...[...template.matchAll(/url\(([^)]*)\)/g)].map(match => match[1].replace(/["']/g, "")),
  ];
  assert.ok(refs.length > 30);
  for (const ref of refs) assert.match(ref, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, ref);
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
