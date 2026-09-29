// D-121: local-only server for the promoted homepage (never a deployment).
// Serves the Next build output (out/) and, on /, the artifact exactly as the
// Worker's RFC-022 path would: isApprovedArtifact() with the promoted
// constants, then spliceArtifact() with a payload built by the production
// buildBridgePayload() from the five D-115 projects (brain/DECISION_LOG.md).
// Ports: 8201 promoted artifact unbridged; 8202 promoted artifact bridged;
// 8203 the pre-promotion V10 artifact (git HEAD~ copy passed as V10_FILE)
// bridged at its old offset, for content comparison only.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { isApprovedArtifact, spliceArtifact, buildBridgeSpan } from "../../../../worker/bridge/inject.mjs";
import { buildBridgePayload } from "../../../../worker/bridge/payload.mjs";

const REPO = path.resolve(import.meta.dirname, "../../../..");
const OUT = path.join(REPO, "out");
const log = fs.readFileSync(path.join(REPO, "brain/DECISION_LOG.md"), "utf8");
const d115 = log.indexOf("### D-115");
const jsonStart = log.indexOf("```json", d115) + 7;
const projects = JSON.parse(log.slice(jsonStart, log.indexOf("```", jsonStart)))
  .map(p => ({ name: p.title, kind: p.category, description: p.summary, ...p.v10 }));
const payload = buildBridgePayload({ projects });

const promoted = new Uint8Array(fs.readFileSync(path.join(OUT, "index.html")));
if (!(await isApprovedArtifact(promoted))) throw new Error("out/index.html is not the approved artifact");
const variants = { 8201: Buffer.from(promoted), 8202: Buffer.from(spliceArtifact(promoted, payload)) };
if (process.env.V10_FILE) {
  const v10 = fs.readFileSync(process.env.V10_FILE);
  if (v10.subarray(1324, 1331).toString() !== "</head>") throw new Error("V10 marker");
  variants[8203] = Buffer.concat([v10.subarray(0, 1324), Buffer.from(buildBridgeSpan(payload)), v10.subarray(1324)]);
}
const TYPES = { ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".txt": "text/plain", ".xml": "application/xml", ".mp4": "video/mp4" };
for (const [port, body] of Object.entries(variants)) {
  http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (u === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(body); }
    const file = path.join(OUT, u);
    if (!file.startsWith(OUT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(Number(port), "127.0.0.1");
}
console.log("serving", Object.keys(variants).join(","));
