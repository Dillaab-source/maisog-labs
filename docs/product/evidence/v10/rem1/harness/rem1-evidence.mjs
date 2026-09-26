// V10-A remediation cycle 1 evidence harness (scratch tooling, not committed).
// Usage: node rem1-evidence.mjs <referenceDir> <candidateOut> <beforeOut> <evidenceDir> <axePath>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const [, , REF_DIR, CAND_DIR, BEFORE_DIR, EVID, AXE] = process.argv;
const UMD = (process.env.V10_UMD_DIR || "").replace(/\/?$/, "/"); // react@18.3.1, react-dom@18.3.1, @babel/standalone@7.29.0 unpacked from npm pack
if (UMD === "/") throw new Error("set V10_UMD_DIR");
const FONTS = path.join(CAND_DIR, "v10/fonts");
const CAPS = path.join(EVID, "captures"), CMP = path.join(EVID, "compare");
fs.mkdirSync(CAPS, { recursive: true }); fs.mkdirSync(CMP, { recursive: true });
const sha = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".mp4": "video/mp4", ".webp": "image/webp", ".txt": "text/plain", ".json": "application/json", ".ttf": "font/ttf", ".woff2": "font/woff2" };
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
const servers = [serve(REF_DIR), serve(CAND_DIR), serve(BEFORE_DIR)];
const [REF, CAND, BEFORE] = await Promise.all(servers.map(listen));
const REF_URL = `${REF}/${encodeURIComponent("Maisog Labs Home v10.dc.html")}`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const VIEWPORTS = [{ n: "desktop", w: 1440, h: 900 }, { n: "mobile", w: 390, h: 844, mobile: true }];
const MODES = ["still", "full"];
const VIEWS = [["entry", ""], ["systems", "#systems"], ["projects", "#projects"], ["journal", "#journal"], ["contact", "#contact"]];
const FIXED_TIME = new Date("2026-09-26T00:00:00Z");
const FULL_TIMESTAMP_MS = 3000;

const JOURNAL = {
  entries: [
    { slug: "fixture-note-one", title: "Fixture note one", summary: "Deterministic fixture entry used only for local evidence.", publishedAt: "2026-09-01T00:00:00.000Z" },
    { slug: "fixture-note-two", title: "Fixture note two", summary: "Second deterministic fixture entry.", publishedAt: "2026-08-15T00:00:00.000Z" },
    { slug: "fixture-note-three", title: "Fixture note three", summary: "Third deterministic fixture entry.", publishedAt: "2026-07-30T00:00:00.000Z" },
  ],
};
const GOOGLE_CSS = ["Montserrat|Montserrat-Variable.ttf|100 900", "Inter|Inter-Variable.ttf|100 900", "IBM Plex Mono|IBMPlexMono-Regular.ttf|400", "IBM Plex Mono|IBMPlexMono-Medium.ttf|500"]
  .map(line => { const [family, file, weight] = line.split("|"); return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(https://fonts.gstatic.com/local/${file}) format('truetype');}`; }).join("\n");

async function newPage(site, vp, mode, designResponder = r => r.fulfill({ status: 404, json: { error: "not_found" } })) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, reducedMotion: mode === "still" ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const requests = [], errors = [];
  page.on("request", q => requests.push(q.url()));
  page.on("pageerror", e => errors.push(e.message));
  if (mode === "full") await page.clock.install({ time: FIXED_TIME });
  if (site === "reference") {
    await page.route(u => u.hostname === "unpkg.com", r => {
      const m = r.request().url().match(/unpkg\.com\/(@babel\/standalone|react-dom|react)@([\d.]+)\/(.*)$/);
      const dir = (m[1] === "@babel/standalone" ? "babel-standalone" : m[1]) + "-" + m[2];
      return r.fulfill({ path: UMD + dir + "/" + m[3], contentType: "text/javascript" });
    });
    await page.route(u => u.hostname === "fonts.googleapis.com", r => r.fulfill({ body: GOOGLE_CSS, contentType: "text/css" }));
    await page.route(u => u.hostname === "fonts.gstatic.com", r => r.fulfill({ path: path.join(FONTS, path.basename(new URL(r.request().url()).pathname)), contentType: "font/ttf" }));
  } else {
    await page.route(u => u.pathname === "/api/design", designResponder);
    await page.route(u => u.pathname === "/api/journal", r => r.fulfill({ json: JOURNAL }));
    await page.route(u => u.pathname.startsWith("/api/journal/"), r => {
      const slug = decodeURIComponent(r.request().url().split("/api/journal/")[1]);
      const entry = JOURNAL.entries.find(e => e.slug === slug);
      return entry ? r.fulfill({ json: { ...entry, body: `${entry.summary} Fixture body.` } }) : r.fulfill({ status: 404, json: {} });
    });
    // Any non-local request from the candidate is recorded and refused.
    await page.route(u => u.hostname !== "127.0.0.1", r => r.abort());
  }
  return { ctx, page, requests, errors };
}

async function freeze(page, mode) {
  if (mode === "full") {
    await page.clock.runFor(FULL_TIMESTAMP_MS);
    await page.evaluate(t => {
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; }
    }, FULL_TIMESTAMP_MS);
    await page.evaluate(() => Promise.all([...document.querySelectorAll("video")].map(v => new Promise(done => {
      v.pause();
      if (v.readyState < 2 && !v.poster) return done();
      const t = setTimeout(done, 3000);
      v.addEventListener("seeked", () => { clearTimeout(t); done(); }, { once: true });
      try { v.currentTime = 0.001; } catch { clearTimeout(t); done(); }
    }))));
  } else {
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function capture(site, base, vp, mode, view, hash, extra = {}) {
  const { ctx, page, requests, errors } = await newPage(site, vp, mode, extra.design);
  await page.goto(base + (hash || ""), { waitUntil: "load" });
  if (mode === "full") await page.clock.runFor(1500); else await page.waitForTimeout(2500);
  if (site === "reference" && hash) {
    // Reference opens panels from the hash on load; re-assert in case the
    // prototype reset it while booting.
    await page.evaluate(h => { if (location.hash !== h) location.hash = h; }, hash);
    if (mode === "full") await page.clock.runFor(1500); else await page.waitForTimeout(1500);
  }
  await freeze(page, mode);
  const buf = await page.screenshot();
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, hash: location.hash }));
  return { ctx, page, buf, requests, errors, metrics };
}

// In-browser per-pixel comparison: a pixel differs when any RGB channel
// differs by more than TOL; returns the mismatch ratio and a composite.
const TOL = 32, PASS_RATIO = 0.01;
const cmpCtx = await browser.newContext({ viewport: { width: 800, height: 600 } });
const cmpPage = await cmpCtx.newPage();
await cmpPage.setContent("<canvas id=c></canvas>");
async function compare(a, b, tol, composite) {
  return cmpPage.evaluate(async ({ a, b, tol, composite }) => {
    const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = ia.width, h = ia.height;
    const read = img => { const c = new OffscreenCanvas(w, h); const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h); return x.getImageData(0, 0, w, h); };
    const da = read(ia), db = read(ib);
    const diff = new ImageData(w, h);
    let bad = 0;
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      const off = d > tol; if (off) bad += 1;
      const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 12;
      diff.data[i] = off ? 255 : g; diff.data[i + 1] = off ? 0 : g; diff.data[i + 2] = off ? 64 : g; diff.data[i + 3] = 255;
    }
    let jpeg = null;
    if (composite) {
      const scale = w > 800 ? 0.5 : 1;
      const cw = Math.round(w * scale), ch = Math.round(h * scale);
      const c = document.getElementById("c"); c.width = cw * 3 + 16; c.height = ch; const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(ia, 0, 0, cw, ch); x.drawImage(ib, cw + 8, 0, cw, ch);
      const dc = new OffscreenCanvas(w, h); dc.getContext("2d").putImageData(diff, 0, 0);
      x.drawImage(dc, (cw + 8) * 2, 0, cw, ch);
      jpeg = c.toDataURL("image/jpeg", 0.8);
    }
    return { width: w, height: h, mismatched: bad, ratio: bad / (w * h), jpeg };
  }, { a, b, tol, composite });
}
const dataUrl = buf => "data:image/png;base64," + buf.toString("base64");

const results = { tolerance: { channelDelta: TOL, passRatio: PASS_RATIO }, fixedTime: FIXED_TIME.toISOString(), fullTimestampMs: FULL_TIMESTAMP_MS, parity: [], consolidation: [], f1: [], axe: [], network: {}, a11y: {}, routing: {}, contrast: {}, errors: {} };
const candidateRequests = new Set();

// 1-3. Candidate/reference captures, parity comparison, and before/after consolidation check.
for (const vp of VIEWPORTS) for (const mode of MODES) for (const [view, hash] of VIEWS) {
  const tag = `${vp.n}-${mode}-${view}`;
  const cand = await capture("candidate", `${CAND}/`, vp, mode, view, hash);
  const ref = await capture("reference", REF_URL, vp, mode, view, hash);
  const before = await capture("candidate", `${BEFORE}/`, vp, mode, view, hash);
  cand.requests.forEach(u => candidateRequests.add(u));
  const cFile = path.join(CAPS, `candidate-${tag}.png`), rFile = path.join(CAPS, `reference-${tag}.png`);
  fs.writeFileSync(cFile, cand.buf); fs.writeFileSync(rFile, ref.buf);
  const p = await compare(dataUrl(cand.buf), dataUrl(ref.buf), TOL, true);
  const jFile = path.join(CMP, `${tag}.jpg`);
  fs.writeFileSync(jFile, Buffer.from(p.jpeg.split(",")[1], "base64"));
  results.parity.push({ view: tag, candidate: path.basename(cFile), candidateSha256: sha(cFile), reference: path.basename(rFile), referenceSha256: sha(rFile), sideBySide: path.basename(jFile), sideBySideSha256: sha(jFile), mismatchedPixels: p.mismatched, mismatchRatio: Number(p.ratio.toFixed(6)), pass: p.ratio <= PASS_RATIO, candidateOverflowX: cand.metrics.scrollWidth > cand.metrics.clientWidth, candidateHash: cand.metrics.hash });
  const again = await capture("candidate", `${CAND}/`, vp, mode, view, hash);
  const rep = await compare(dataUrl(again.buf), dataUrl(cand.buf), 0, false);
  await again.ctx.close();
  results.repeatability = results.repeatability || [];
  results.repeatability.push({ view: tag, mismatchedPixels: rep.mismatched, identical: rep.mismatched === 0 });
  const b = await compare(dataUrl(before.buf), dataUrl(cand.buf), 0, false);
  results.consolidation.push({ view: tag, mismatchedPixels: b.mismatched, identical: b.mismatched === 0 });
  if (cand.errors.length) results.errors[`candidate-${tag}`] = cand.errors;
  if (ref.errors.length) results.errors[`reference-${tag}`] = ref.errors;
  for (const r of [cand, ref, before]) await r.ctx.close();
  console.error(tag, results.parity.at(-1).mismatchRatio, results.consolidation.at(-1).mismatchedPixels);
}

// 4. F1: /api/design failure/invalid variants render pixel-identical to the no-API baseline.
const F1 = {
  "network-failure": r => r.abort("failed"),
  "status-404": r => r.fulfill({ status: 404, json: { error: "not_found" } }),
  "status-500": r => r.fulfill({ status: 500, body: "Internal Server Error" }),
  "malformed-json": r => r.fulfill({ status: 200, contentType: "application/json", body: "{\"theme\": <not json" }),
  "invalid-theme-string": r => r.fulfill({ json: { theme: "x", sections: "bad" } }),
  "invalid-theme-values": r => r.fulfill({ json: { theme: { overlayIntensity: "68", panelOpacityPct: "x", borderIntensityPct: null, radiusScalePct: "big", animationPreset: "cinematic", reducedMotionMode: "never", projectRailMode: 3, heroBackgroundPreset: "deep-night", panelPreset: "clear-glass", cardStylePreset: "solid-night" } } }),
  "default-v10-theme": r => r.fulfill({ json: { theme: { overlayIntensity: 68, panelOpacityPct: 90, borderIntensityPct: 16, radiusScalePct: 100, animationPreset: "calm", reducedMotionMode: "respect-system", projectRailMode: "snap" }, sections: {} } }),
};
for (const vp of VIEWPORTS) for (const [view, hash] of [["entry", ""], ["projects", "#projects"]]) {
  const baseline = await capture("candidate", `${CAND}/`, vp, "still", view, hash, { design: r => r.abort("failed") });
  await baseline.ctx.close();
  for (const [variant, responder] of Object.entries(F1)) {
    const shot = await capture("candidate", `${CAND}/`, vp, "still", view, hash, { design: responder });
    const d = await compare(dataUrl(baseline.buf), dataUrl(shot.buf), 0, false);
    results.f1.push({ viewport: vp.n, view, variant, mismatchedPixels: d.mismatched, identical: d.mismatched === 0 });
    await shot.ctx.close();
  }
}

// 5. Automated accessibility audit (axe-core) of Entry and every panel.
const axeSource = fs.readFileSync(AXE, "utf8");
for (const vp of VIEWPORTS) for (const [view, hash] of VIEWS) {
  const { ctx, page } = await newPage("candidate", vp, "still");
  await page.goto(`${CAND}/${hash}`, { waitUntil: "load" }); await page.waitForTimeout(2000);
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () => {
    const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
    return { violations: out.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map(n => n.target.join(" ")), data: v.id === "color-contrast" ? v.nodes.slice(0, 3).map(n => n.any[0]?.data) : undefined })), passes: out.passes.length, incomplete: out.incomplete.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) };
  });
  const seriousOrCritical = r.violations.filter(v => v.impact === "serious" || v.impact === "critical");
  results.axe.push({ viewport: vp.n, view, violations: r.violations, incomplete: r.incomplete, passes: r.passes, seriousOrCritical: seriousOrCritical.length });
  await ctx.close();
}

// 6. Keyboard/focus, D1/D2 and routing checks.
{
  const { ctx, page } = await newPage("candidate", VIEWPORTS[0], "still");
  await page.goto(`${CAND}/`, { waitUntil: "load" }); await page.waitForTimeout(1500);
  const checks = {};
  for (const [hash, expectHash, expectSurface] of [["#systems", "#systems", "systems"], ["#research", "#journal", "journal"], ["#process", "#systems", "systems"], ["#about", "#contact", "contact"], ["#unknown", "", null]]) {
    await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(700);
    checks[hash] = await page.evaluate(() => ({ hash: location.hash, active: document.activeElement?.id || document.activeElement?.tagName, open: [...document.querySelectorAll("[id^='surface-'][id$='-title']")].filter(e => e.offsetParent !== null).map(e => e.id) }));
    checks[hash].pass = expectSurface ? checks[hash].hash === expectHash && checks[hash].active === `surface-${expectSurface}-title` : checks[hash].open.length === 0;
    await page.evaluate(() => { location.hash = ""; }); await page.waitForTimeout(400);
  }
  results.routing = checks;
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href^='#']")].map(a => a.getAttribute("href")));
  results.routing.inPageLinks = [...new Set(links)];
  results.routing.noResearchLinks = !links.includes("#research");
  // Escape returns to Entry with focus back on the trigger.
  await page.click(".header-nav [data-route-trigger='projects']"); await page.waitForTimeout(700);
  const opened = await page.evaluate(() => document.activeElement?.id);
  await page.keyboard.press("Escape"); await page.waitForTimeout(700);
  const closed = await page.evaluate(() => ({ hash: location.hash, active: document.activeElement?.getAttribute("data-route-trigger") }));
  results.a11y.escape = { focusOnOpen: opened, afterEscape: closed, pass: opened === "surface-projects-title" && closed.active === "projects" && closed.hash === "" };
  await ctx.close();
}
{
  const { ctx, page } = await newPage("candidate", VIEWPORTS[1], "still");
  await page.goto(`${CAND}/`, { waitUntil: "load" }); await page.waitForTimeout(1500);
  const menu = page.locator(".menu-button");
  const menuBox = await menu.boundingBox();
  await menu.click(); await page.waitForTimeout(500);
  const routes = await page.evaluate(() => [...document.querySelectorAll(".lab-menu a, .lab-menu button")].filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), height: Math.round(r.height), clipped: r.right > innerWidth || r.left < 0 }; }));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  const navHidden = await page.evaluate(() => getComputedStyle(document.querySelector(".header-nav")).display === "none");
  results.a11y.d1 = { menuButtonHeight: Math.round(menuBox.height), routes, desktopNavHidden: navHidden, pass: menuBox.height >= 44 && routes.length >= 4 && routes.every(r => r.height >= 44 && !r.clipped) };
  await page.evaluate(() => { location.hash = "#systems"; }); await page.waitForTimeout(800);
  const labels = await page.evaluate(() => [...document.querySelectorAll(".diagram-node text")].filter(t => t.getBBox().width > 0).map(t => { const r = t.getBoundingClientRect(); return { text: t.textContent, l: r.left, r: r.right, t: r.top, b: r.bottom }; }));
  const overlaps = [];
  for (let i = 0; i < labels.length; i += 1) for (let j = i + 1; j < labels.length; j += 1) {
    const a = labels[i], b = labels[j];
    if (a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b) overlaps.push([a.text, b.text]);
  }
  results.a11y.d2 = { labels: labels.length, overlaps, pass: labels.length > 0 && overlaps.length === 0 };
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  results.a11y.mobileNoHorizontalOverflow = !overflow;
  await ctx.close();
}

// 7. Contrast measurement of the principal V10 text/surface pairs (WCAG 2.x relative luminance).
{
  const { ctx, page } = await newPage("candidate", VIEWPORTS[0], "still");
  await page.goto(`${CAND}/#systems`, { waitUntil: "load" }); await page.waitForTimeout(1500);
  results.contrast = await page.evaluate(() => {
    const parse = c => c.match(/[\d.]+/g).map(Number);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const blend = (fg, bg) => { const a = fg[3] ?? 1; return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const nightBehind = [2, 9, 24];
    const panel = blend(parse(getComputedStyle(document.querySelector(".surface:not([hidden])")).backgroundColor), nightBehind);
    const pick = sel => { const e = document.querySelector(sel); return e ? { selector: sel, color: getComputedStyle(e).color } : null; };
    return [".surface:not([hidden]) .surface-title", ".surface:not([hidden]) .surface-kicker", ".surface:not([hidden]) .selector:not([aria-pressed='true'])", ".surface:not([hidden]) .selector[aria-pressed='true']", ".surface:not([hidden]) .discipline-detail p"]
      .map(pick).filter(Boolean).map(({ selector, color }) => ({ selector, color, background: `rgb(${panel.map(Math.round).join(",")})`, ratio: Number(ratio(blend(parse(color), panel), panel).toFixed(2)) }));
  });
  await ctx.close();
}

// 8. Runtime network assertion.
const external = [...candidateRequests].filter(u => !u.startsWith("http://127.0.0.1"));
const staticScan = [];
const walk = dir => { for (const n of fs.readdirSync(dir)) { const f = path.join(dir, n); if (fs.statSync(f).isDirectory()) walk(f); else if (/\.(html|js|css|txt)$/.test(n)) { const s = fs.readFileSync(f, "utf8"); if (/support\.js|image-slot\.js|@babel\/standalone|unpkg\.com|fonts\.googleapis|fonts\.gstatic/.test(s)) staticScan.push(path.relative(CAND_DIR, f)); } } };
walk(CAND_DIR);
results.network = { candidateRequestCount: candidateRequests.size, externalRequests: external, candidateOrigins: [...new Set([...candidateRequests].map(u => new URL(u).origin.replace(/:\d+$/, ":<port>")))], outStaticForbiddenMatches: staticScan, pass: external.length === 0 && staticScan.length === 0 };

await browser.close(); servers.forEach(s => s.close());
fs.writeFileSync(path.join(EVID, "rem1-results.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify({
  parityPass: results.parity.filter(p => p.pass).length, parityTotal: results.parity.length,
  consolidationIdentical: results.consolidation.filter(c => c.identical).map(c => c.view).length, consolidationDiffs: results.consolidation.filter(c => !c.identical),
  repeatability: results.repeatability.filter(r => !r.identical),
  f1AllIdentical: results.f1.every(f => f.identical), f1: results.f1.filter(f => !f.identical),
  axeSeriousCritical: results.axe.reduce((n, a) => n + a.seriousOrCritical, 0), axe: results.axe.map(a => [a.viewport, a.view, a.violations.map(v => `${v.id}:${v.impact}`)]),
  routing: results.routing, a11y: results.a11y, contrast: results.contrast, network: results.network, errors: results.errors,
}, null, 1));
