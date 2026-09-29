// D-120: local-only static server for the V10.1 candidate browser checks
// (never a deployment). Usage: node serve.mjs, then node run.cjs. Variants by port:
// 8101 baseline (public/index.html), 8102 candidate, 8103 candidate + bridge
// span (D-115 projects), 8104 baseline + same bridge span, 8105 candidate +
// bridge span with a long synthetic email.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { buildBridgeSpan } from "../../../../worker/bridge/inject.mjs";
import { buildBridgePayload } from "../../../../worker/bridge/payload.mjs";

const REPO = path.resolve(import.meta.dirname, "../../../..");
const DIST = REPO + "/candidates/v10.1/site";
// The five D-115 projects in bridge shape (brain/DECISION_LOG.md § D-115).
const log = fs.readFileSync(REPO + "/brain/DECISION_LOG.md", "utf8");
const d115 = log.indexOf("### D-115");
const jsonStart = log.indexOf("```json", d115) + 7;
const projects = JSON.parse(log.slice(jsonStart, log.indexOf("```", jsonStart)))
  .map(p => ({ name: p.title, kind: p.category, description: p.summary, ...p.v10 }));
const base = fs.readFileSync(REPO + "/public/index.html");
const cand = fs.readFileSync(DIST + "/index.html");
const report = JSON.parse(fs.readFileSync(REPO + "/candidates/v10.1/build-report.json", "utf8"));
const LONG = process.env.LONG_EMAIL || "correspondence.long-address@maisoglabs-example.com";

function splice(buf, off, payload) {
  if (buf.subarray(off, off + 7).toString() !== "</head>") throw new Error("marker not at offset " + off);
  return Buffer.concat([buf.subarray(0, off), Buffer.from(buildBridgeSpan(payload)), buf.subarray(off)]);
}
const variants = {
  8101: base,
  8102: cand,
  8103: splice(cand, report.insertionOffset, buildBridgePayload({ projects })),
  8104: splice(base, 1324, buildBridgePayload({ projects })),
  8105: splice(cand, report.insertionOffset, buildBridgePayload({ projects, email: LONG })),
  8106: splice(base, 1324, buildBridgePayload({ projects, email: LONG })),
};
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".txt": "text/plain", ".xml": "application/xml", ".mp4": "video/mp4", ".webm": "video/webm" };
for (const [port, body] of Object.entries(variants)) {
  http.createServer((req, res) => {
    const u = new URL(req.url, "http://x").pathname;
    if (u === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(body); }
    let file = null;
    if (u.startsWith("/v101/")) file = path.join(DIST, u);
    else if (u === "/robots.txt" || u === "/sitemap.xml") file = path.join(DIST, u);
    else file = path.join(REPO, "public", u);
    if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(Number(port), "127.0.0.1");
}
console.log("serving", Object.keys(variants).join(","));
