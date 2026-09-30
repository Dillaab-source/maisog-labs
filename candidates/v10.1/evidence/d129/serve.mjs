// D-129: local-only static server for the homepage copy checks (never a
// deployment). Variants by port:
//   8201 baseline-bridge  — the accepted V10.1 page before D-129 (index
//                           220ce809…, entry.7995859f655d.js, read from Git)
//                           with the unchanged RFC-022 bridge span (D-115 projects);
//   8202 candidate-bridge — the D-129 candidate with the same bridge span;
//   8203 candidate-raw    — the D-129 candidate without the bridge (fallback).
// Usage: node serve.mjs [baseCommit], then node run.cjs.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildBridgeSpan, INSERTION_OFFSET } from "../../../../worker/bridge/inject.mjs";
import { buildBridgePayload } from "../../../../worker/bridge/payload.mjs";

const REPO = path.resolve(import.meta.dirname, "../../../..");
const DIST = REPO + "/candidates/v10.1/site";
const BASE_COMMIT = process.argv[2] || "08d192276d89d96de3553ebe3a5487f00465b7c4";
const git = p => execFileSync("git", ["show", `${BASE_COMMIT}:${p}`], { cwd: REPO });
const OLD_ENTRY = "entry.7995859f655d.js";
const baseIndex = git("public/index.html");
const oldEntry = git(`public/v101/assets/${OLD_ENTRY}`);

const log = fs.readFileSync(REPO + "/brain/DECISION_LOG.md", "utf8");
const d115 = log.indexOf("### D-115");
const jsonStart = log.indexOf("```json", d115) + 7;
const projects = JSON.parse(log.slice(jsonStart, log.indexOf("```", jsonStart)))
  .map(p => ({ name: p.title, kind: p.category, description: p.summary, ...p.v10 }));

function splice(buf, payload) {
  if (buf.subarray(INSERTION_OFFSET, INSERTION_OFFSET + 7).toString() !== "</head>") throw new Error("marker not at offset " + INSERTION_OFFSET);
  return Buffer.concat([buf.subarray(0, INSERTION_OFFSET), Buffer.from(buildBridgeSpan(payload)), buf.subarray(INSERTION_OFFSET)]);
}
const cand = fs.readFileSync(DIST + "/index.html");
const payload = buildBridgePayload({ projects });
const variants = { 8201: splice(baseIndex, payload), 8202: splice(cand, payload), 8203: cand };
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".txt": "text/plain", ".xml": "application/xml", ".mp4": "video/mp4", ".webm": "video/webm" };

for (const [port, body] of Object.entries(variants)) {
  http.createServer((req, res) => {
    const u = new URL(req.url, "http://x").pathname;
    if (u === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(body); }
    if (port === "8201" && u === `/v101/assets/${OLD_ENTRY}`) { res.writeHead(200, { "content-type": "text/javascript" }); return res.end(oldEntry); }
    let file = u.startsWith("/v101/") || u === "/robots.txt" || u === "/sitemap.xml" ? path.join(DIST, u) : path.join(REPO, "public", u);
    if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(Number(port), "127.0.0.1");
}
console.log("serving 8201 baseline-bridge, 8202 candidate-bridge, 8203 candidate-raw");
