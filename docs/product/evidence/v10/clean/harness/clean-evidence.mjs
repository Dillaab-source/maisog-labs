// D-092 V10 clean-replacement evidence harness.
// Usage: V10_UMD_DIR=<dir> AXE_PATH=<axe.min.js> node clean-evidence.mjs <referenceDir> <candidateOut> <evidenceDir>
// V10_UMD_DIR holds react@18.3.1, react-dom@18.3.1 and @babel/standalone@7.29.0
// unpacked from `npm pack` (served in place of unpkg.com for the reference only).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const [, , REF_DIR, CAND_DIR, EVID] = process.argv;
const UMD = (process.env.V10_UMD_DIR || "").replace(/\/?$/, "/");
const AXE = process.env.AXE_PATH;
if (UMD === "/" || !AXE) throw new Error("set V10_UMD_DIR and AXE_PATH");
const FONTS = path.join(CAND_DIR, "v10/fonts");
const CAPS = path.join(EVID, "captures"), CMP = path.join(EVID, "compare");
fs.mkdirSync(CAPS, { recursive: true }); fs.mkdirSync(CMP, { recursive: true });
const sha = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".mp4": "video/mp4", ".webp": "image/webp", ".txt": "text/plain", ".json": "application/json", ".ttf": "font/ttf" };
function serve(root) {
  return http.createServer((q, r) => {
    const p = decodeURIComponent(new URL(q.url, "http://x").pathname);
    let f = path.join(root, p);
    if (p.endsWith("/")) f = path.join(f, "index.html");
    if ((!fs.existsSync(f) || fs.statSync(f).isDirectory()) && fs.existsSync(f + ".html")) f += ".html";
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(r);
  });
}
const listen = s => new Promise(x => s.listen(0, "127.0.0.1", () => x(`http://127.0.0.1:${s.address().port}`)));
const servers = [serve(REF_DIR), serve(CAND_DIR)];
const [REF, CAND] = await Promise.all(servers.map(listen));
const REF_URL = `${REF}/${encodeURIComponent("Maisog Labs Home v10.dc.html")}`;
const GOOGLE_CSS = ["Montserrat|Montserrat-Variable.ttf|100 900", "Inter|Inter-Variable.ttf|100 900", "IBM Plex Mono|IBMPlexMono-Regular.ttf|400", "IBM Plex Mono|IBMPlexMono-Medium.ttf|500"]
  .map(l => { const [f, file, w] = l.split("|"); return `@font-face{font-family:'${f}';font-style:normal;font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/local/${file}) format('truetype');}`; }).join("\n");
// Fixture mirrors V10's three placeholder notes so the Research comparison
// isolates presentation from content.
const JOURNAL = { entries: [
  { slug: "architecture-decisions", title: "Architecture Decisions for AI Systems", summary: "A practical framework for designing maintainable, auditable AI systems.", publishedAt: "2026-03-12T00:00:00.000Z", media: [] },
  { slug: "research-to-tools", title: "From Research to Real Tools", summary: "Notes on turning research prototypes into reliable, useful software.", publishedAt: "2026-02-28T00:00:00.000Z", media: [] },
  { slug: "human-judgment", title: "The Role of Human Judgment", summary: "Why human judgment remains essential in an age of increasingly capable AI systems.", publishedAt: "2026-02-10T00:00:00.000Z", media: [] },
] };
const VIEWPORTS = [{ n: "desktop", w: 1440, h: 900 }, { n: "mobile", w: 390, h: 844, m: true }];
const VIEWS = [["entry", ""], ["systems", "#systems"], ["projects", "#projects"], ["journal", "#journal"], ["contact", "#contact"]];
const FIXED_TIME = new Date("2026-09-26T00:00:00Z"), FULL_MS = 3000, TOL = 32, PASS = 0.01;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });

async function open(site, vp, mode) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const log = { errors: [], requests: [] };
  page.on("pageerror", e => log.errors.push("pageerror: " + e.message));
  page.on("console", m => { if (["error", "warning"].includes(m.type())) log.errors.push(m.type() + ": " + m.text().slice(0, 300)); });
  page.on("request", q => log.requests.push(q.url()));
  if (mode === "full") await page.clock.install({ time: FIXED_TIME });
  if (site === "reference") {
    await page.route(u => u.hostname === "unpkg.com", r => { const m = r.request().url().match(/unpkg\.com\/(@babel\/standalone|react-dom|react)@([\d.]+)\/(.*)$/); return r.fulfill({ path: UMD + (m[1] === "@babel/standalone" ? "babel-standalone" : m[1]) + "-" + m[2] + "/" + m[3], contentType: "text/javascript" }); });
    await page.route(u => u.hostname === "fonts.googleapis.com", r => r.fulfill({ body: GOOGLE_CSS, contentType: "text/css" }));
    await page.route(u => u.hostname === "fonts.gstatic.com", r => r.fulfill({ path: path.join(FONTS, path.basename(new URL(r.request().url()).pathname)), contentType: "font/ttf" }));
  } else {
    await page.route(u => u.pathname === "/api/journal", r => r.fulfill({ json: JOURNAL }));
    await page.route(u => u.hostname !== "127.0.0.1", r => r.abort());
  }
  return { ctx, page, log };
}

async function settle(page, mode) {
  if (mode === "full") {
    await page.clock.runFor(FULL_MS);
    await page.evaluate(t => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, FULL_MS);
    await page.evaluate(() => Promise.all([...document.querySelectorAll("video")].map(v => new Promise(done => {
      v.pause(); const t = setTimeout(done, 3000);
      v.addEventListener("seeked", () => { clearTimeout(t); done(); }, { once: true });
      try { v.currentTime = 0.001; } catch { clearTimeout(t); done(); }
    }))));
  } else {
    await page.waitForTimeout(2500);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

async function capture(site, vp, mode, hash) {
  const o = await open(site, vp, mode);
  await o.page.goto((site === "reference" ? REF_URL : `${CAND}/`) + hash, { waitUntil: "load" });
  await settle(o.page, mode);
  o.buf = await o.page.screenshot();
  return o;
}

const cmpPage = await (await browser.newContext()).newPage();
await cmpPage.setContent("<canvas id=c></canvas>");
async function compare(a, b, tol, composite) {
  return cmpPage.evaluate(async ({ a, b, tol, composite }) => {
    const load = s => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = ia.width, h = ia.height;
    const rd = img => { const c = new OffscreenCanvas(w, h); const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h); return x.getImageData(0, 0, w, h); };
    const da = rd(ia), db = rd(ib), diff = new ImageData(w, h); let bad = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      const off = d > tol; if (off) bad++;
      const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 12;
      diff.data[i] = off ? 255 : g; diff.data[i + 1] = off ? 0 : g; diff.data[i + 2] = off ? 64 : g; diff.data[i + 3] = 255;
    }
    let jpeg = null;
    if (composite) {
      const s = w > 800 ? 0.5 : 1, cw = Math.round(w * s), ch = Math.round(h * s);
      const c = document.getElementById("c"); c.width = cw * 3 + 16; c.height = ch; const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(ia, 0, 0, cw, ch); x.drawImage(ib, cw + 8, 0, cw, ch);
      const dc = new OffscreenCanvas(w, h); dc.getContext("2d").putImageData(diff, 0, 0); x.drawImage(dc, (cw + 8) * 2, 0, cw, ch);
      jpeg = c.toDataURL("image/jpeg", 0.8);
    }
    return { mismatched: bad, ratio: bad / (w * h), jpeg };
  }, { a, b, tol, composite });
}
const url = buf => "data:image/png;base64," + buf.toString("base64");

const results = { method: { channelTolerance: TOL, passRatio: PASS, fixedTime: FIXED_TIME.toISOString(), fullTimestampMs: FULL_MS }, parity: [], repeatability: [], candidateErrors: {}, axe: [], interactions: {}, network: {} };
const candidateRequests = new Set();

for (const vp of VIEWPORTS) for (const mode of ["still", "full"]) for (const [view, hash] of VIEWS) {
  const tag = `${vp.n}-${mode}-${view}`;
  const cand = await capture("candidate", vp, mode, hash);
  const again = await capture("candidate", vp, mode, hash);
  const ref = await capture("reference", vp, mode, hash);
  cand.log.requests.forEach(u => candidateRequests.add(u));
  const cFile = path.join(CAPS, `candidate-${tag}.png`);
  fs.writeFileSync(cFile, cand.buf);
  const p = await compare(url(cand.buf), url(ref.buf), TOL, true);
  const jFile = path.join(CMP, `${tag}.jpg`);
  fs.writeFileSync(jFile, Buffer.from(p.jpeg.split(",")[1], "base64"));
  const rep = await compare(url(cand.buf), url(again.buf), 0, false);
  results.parity.push({ view: tag, candidate: path.basename(cFile), candidateSha256: sha(cFile), referenceSha256: crypto.createHash("sha256").update(ref.buf).digest("hex"), sideBySide: path.basename(jFile), mismatchRatio: Number(p.ratio.toFixed(6)), pass: p.ratio <= PASS });
  results.repeatability.push({ view: tag, mismatchedPixels: rep.mismatched });
  if (cand.log.errors.length) results.candidateErrors[tag] = cand.log.errors;
  for (const o of [cand, again, ref]) await o.ctx.close();
  console.error(tag, p.ratio.toFixed(4), rep.mismatched);
}

// Accessibility audit (axe-core), Still mode, Entry and every panel.
const axeSource = fs.readFileSync(AXE, "utf8");
for (const vp of VIEWPORTS) for (const [view, hash] of VIEWS) {
  const o = await open("candidate", vp, "still");
  await o.page.goto(`${CAND}/${hash}`, { waitUntil: "load" }); await o.page.waitForTimeout(2000);
  await o.page.addScriptTag({ content: axeSource });
  const r = await o.page.evaluate(async () => {
    const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
    return { violations: out.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 4).map(n => n.target.join(" ")), data: v.id === "color-contrast" ? v.nodes.slice(0, 4).map(n => n.any[0]?.data) : undefined })), incomplete: out.incomplete.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) };
  });
  results.axe.push({ viewport: vp.n, view, ...r, seriousOrCritical: r.violations.filter(v => v.impact === "serious" || v.impact === "critical").length });
  await o.ctx.close();
}

// Interactions, desktop.
{
  const o = await open("candidate", VIEWPORTS[0], "still"); const pg = o.page;
  await pg.goto(`${CAND}/`, { waitUntil: "load" }); await pg.waitForTimeout(1500);
  const i = {};
  const state = () => pg.evaluate(() => ({ hash: location.hash, focus: document.activeElement?.id || document.activeElement?.tagName, open: [...document.querySelectorAll("section[id]")].filter(s => getComputedStyle(s).visibility === "visible").map(s => s.id) }));
  for (const [h, want] of [["#systems", "systems"], ["#projects", "projects"], ["#journal", "journal"], ["#contact", "contact"], ["#research", "journal"], ["#process", "systems"], ["#about", "contact"], ["#unknown", null]]) {
    await pg.evaluate(x => { location.hash = x; }, h); await pg.waitForTimeout(900);
    const s = await state();
    i[`hash ${h}`] = { ...s, pass: want ? s.open.join() === want && s.focus === want : s.open.length === 0 };
    await pg.evaluate(() => { location.hash = ""; }); await pg.waitForTimeout(500);
  }
  await pg.click("nav a[href='#projects']"); await pg.waitForTimeout(900);
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(700);
  i.escape = await state(); i.escape.pass = i.escape.open.length === 0;
  await pg.evaluate(() => { location.hash = "#projects"; }); await pg.waitForTimeout(900);
  const projName = () => pg.evaluate(() => document.querySelector("#projects h3")?.textContent);
  const first = await projName();
  await pg.locator("#projects [data-prow]").first().focus(); await pg.keyboard.press("ArrowDown"); await pg.waitForTimeout(500);
  const second = await projName();
  await pg.keyboard.press("End"); await pg.waitForTimeout(500);
  const last = await projName();
  i.projectKeys = { first, second, last, count: await pg.locator("#projects [data-prow]").count(), pass: first === "Sentinel/DevOS" && second === "SU" && last === "Experimental Projects" };
  const counter = await pg.evaluate(() => [...document.querySelectorAll("#projects span")].map(s => s.textContent).find(t => /\/ 0\d$/.test(t || "")));
  i.projectCounter = { counter, pass: counter === "08 / 08" };
  i.flowHiddenWithoutSource = { pass: !(await pg.evaluate(() => !!document.querySelector("#projects figure"))) };
  await pg.evaluate(() => { location.hash = "#systems"; }); await pg.waitForTimeout(900);
  await pg.locator("#systems [data-drow]").first().click(); await pg.waitForTimeout(700);
  i.systemsSelect = { selected: await pg.evaluate(() => document.querySelector("#systems h3")?.textContent), pass: false };
  i.systemsSelect.pass = i.systemsSelect.selected === "AI";
  await pg.evaluate(() => { location.hash = "#contact"; }); await pg.waitForTimeout(900);
  i.mailto = await pg.evaluate(() => document.querySelector("#contact a[href^='mailto:']")?.getAttribute("href"));
  i.mailtoPass = i.mailto === "mailto:paulo.maisog@maisoglabs.com";
  await pg.evaluate(() => { location.hash = "#journal"; }); await pg.waitForTimeout(1200);
  i.journalLinks = await pg.evaluate(() => [...document.querySelectorAll("#journal article a")].map(a => a.getAttribute("href")));
  i.journalLinksPass = i.journalLinks.length === 3 && i.journalLinks.every(h => h.startsWith("/journal?slug="));
  results.interactions.desktop = i;
  if (o.log.errors.length) results.candidateErrors["interactions-desktop"] = o.log.errors;
  o.log.requests.forEach(u => candidateRequests.add(u));
  await o.ctx.close();
}
// Interactions, mobile (D1 menu, D2 labels).
{
  const o = await open("candidate", VIEWPORTS[1], "still"); const pg = o.page;
  await pg.goto(`${CAND}/`, { waitUntil: "load" }); await pg.waitForTimeout(1500);
  const btn = pg.locator(".v10-menu button");
  const box = await btn.boundingBox();
  await btn.click(); await pg.waitForTimeout(300);
  const items = await pg.evaluate(() => [...document.querySelectorAll("#v10-menu-list a")].map(a => { const r = a.getBoundingClientRect(); return { text: a.textContent, h: Math.round(r.height), clipped: r.left < 0 || r.right > innerWidth }; }));
  const expanded = await btn.getAttribute("aria-expanded");
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(300);
  const closed = await pg.evaluate(() => !document.querySelector("#v10-menu-list"));
  await btn.click(); await pg.waitForTimeout(300);
  await pg.click("#v10-menu-list a[href='#projects']"); await pg.waitForTimeout(900);
  const nav = await pg.evaluate(() => ({ hash: location.hash, menuClosed: !document.querySelector("#v10-menu-list") }));
  results.interactions.mobileMenu = { buttonHeight: Math.round(box.height), expanded, items, closedByEscape: closed, navigate: nav, pass: box.height >= 44 && expanded === "true" && items.length === 4 && items.every(x => x.h >= 44 && !x.clipped) && closed && nav.hash === "#projects" && nav.menuClosed };
  await pg.evaluate(() => { location.hash = "#systems"; }); await pg.waitForTimeout(900);
  const labels = await pg.evaluate(() => [...document.querySelectorAll("#systems [role=group] button span")].filter(s => s.children.length === 0 && s.textContent.trim() && getComputedStyle(s).display !== "none" && s.offsetParent && getComputedStyle(s.closest("button")).opacity !== "0").map(s => { const r = s.getBoundingClientRect(); return { t: s.textContent.trim(), l: r.left, r: r.right, top: r.top, b: r.bottom }; }));
  const overlaps = [];
  for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) { const x = labels[a], y = labels[b]; if (x.t !== y.t && x.l < y.r && y.l < x.r && x.top < y.b && y.top < x.b) overlaps.push([x.t, y.t]); }
  results.interactions.mobileSystemsLabels = { labels: labels.length, overlaps };
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  results.interactions.mobileNoHorizontalOverflow = !overflow;
  if (o.log.errors.length) results.candidateErrors["interactions-mobile"] = o.log.errors;
  o.log.requests.forEach(u => candidateRequests.add(u));
  await o.ctx.close();
}

const external = [...candidateRequests].filter(u => !u.startsWith("http://127.0.0.1"));
const apiPaths = [...new Set([...candidateRequests].map(u => new URL(u).pathname).filter(p => p.startsWith("/api/")))];
const forbidden = [];
const walk = dir => { for (const n of fs.readdirSync(dir)) { const f = path.join(dir, n); if (fs.statSync(f).isDirectory()) walk(f); else if (/\.(html|js|css|txt)$/.test(n) && /support\.js|image-slot|@babel\/standalone|unpkg\.com|fonts\.googleapis|fonts\.gstatic/.test(fs.readFileSync(f, "utf8"))) forbidden.push(path.relative(CAND_DIR, f)); } };
walk(CAND_DIR);
results.network = { distinctRequests: candidateRequests.size, externalRequests: external, apiPaths, outForbiddenMatches: forbidden, pass: external.length === 0 && forbidden.length === 0 && apiPaths.join() === "/api/journal" };

await browser.close(); servers.forEach(s => s.close());
fs.writeFileSync(path.join(EVID, "results.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify({ parity: results.parity.map(p => `${p.view} ${p.mismatchRatio} ${p.pass ? "PASS" : "FAIL"}`), repeatabilityNonZero: results.repeatability.filter(r => r.mismatchedPixels), candidateErrors: results.candidateErrors, axe: results.axe.map(a => [a.viewport, a.view, a.violations.map(v => `${v.id}:${v.impact}x${v.nodes}`).join(",") || "-", a.incomplete.map(v => `${v.id}x${v.nodes}`).join(",")]), interactions: results.interactions, network: results.network }, null, 1));
