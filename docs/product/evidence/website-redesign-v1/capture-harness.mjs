// Website Redesign V1 local evidence harness (D-076). Builder-run, ACTOR_REPORTED.
// Not part of `npm test`; uses the environment's globally installed Playwright
// (no repository dependency is added).
// Serves the built static export and intercepts /api/* with labelled local
// fixtures. Usage: node capture-harness.mjs <outDir> <shotDir> <resultsJson>
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");

const [outDir, shotDir, resultsPath] = process.argv.slice(2);
fs.mkdirSync(shotDir, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".json": "application/json", ".txt": "text/plain", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  let file = path.join(outDir, p);
  if (fs.existsSync(file + ".html") && (!fs.existsSync(file) || fs.statSync(file).isDirectory())) file += ".html";
  if (!file.startsWith(outDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(4173, "127.0.0.1", r));
const BASE = "http://127.0.0.1:4173";

// Labelled local fixtures (NOT published content).
const FIXTURE_ENTRIES = [
  { slug: "fixture-entry-b", title: "[Local fixture] Newer test entry", summary: "Harness-supplied fixture used only to exercise the Research success state.", publishedAt: "2026-02-02T00:00:00.000Z" },
  { slug: "fixture-entry-a", title: "[Local fixture] Older test entry", summary: "Second harness fixture; order is the API's own newest-first order.", publishedAt: "2026-01-01T00:00:00.000Z" },
];
const fixtureDetail = slug => ({ ...FIXTURE_ENTRIES.find(e => e.slug === slug), body: "Local fixture body text rendered as plain text.\n<b>not html</b>" });

async function newPage(browser, { mobile = false, design = null, journal = "success", reducedMotion = "no-preference", journalDelay = 0 } = {}) {
  const context = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion }
    : { viewport: { width: 1440, height: 900 }, reducedMotion });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error" && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route("**/api/design", route => design ? route.fulfill({ json: design }) : route.fulfill({ status: 404, body: "no design" }));
  await page.route("**/api/journal**", async route => {
    const url = new URL(route.request().url());
    if (journalDelay) await new Promise(r => setTimeout(r, journalDelay));
    if (journal === "error") return route.fulfill({ status: 500, body: "fail" });
    if (url.pathname === "/api/journal") return route.fulfill({ json: { entries: journal === "empty" ? [] : FIXTURE_ENTRIES } });
    const slug = url.pathname.split("/").pop();
    return FIXTURE_ENTRIES.some(e => e.slug === slug) ? route.fulfill({ json: fixtureDetail(slug) }) : route.fulfill({ status: 404, body: "nf" });
  });
  return { context, page, errors };
}

const results = { checks: [], screenshots: [] };
const check = (area, name, pass, detail = "") => { results.checks.push({ area, name, pass: Boolean(pass), detail }); };
const state = page => page.evaluate(() => ({
  hash: location.hash,
  open: [...document.querySelectorAll(".surface")].filter(s => !s.hidden && s.style.display !== "none").map(s => s.id),
  focus: document.activeElement?.id || document.activeElement?.getAttribute("data-route-trigger") || document.activeElement?.className || document.activeElement?.tagName,
  focusTrigger: document.activeElement?.closest("nav")?.className + ":" + document.activeElement?.getAttribute("data-route-trigger"),
  motion: document.querySelector(".spatial")?.dataset.motion,
  parallax: document.querySelector(".spatial")?.dataset.parallax,
}));
const ambient = page => page.evaluate(() => document.getAnimations().filter(a => a.playState === "running" && (a.effect?.target?.closest?.(".entry-trajectory") || a.effect?.target?.closest?.(".entry-mark"))).length);
const noOverflow = page => page.evaluate(() => {
  const bad = [];
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) bad.push("document");
  for (const s of document.querySelectorAll(".surface:not([hidden])")) if (s.scrollWidth > s.clientWidth + 1) bad.push(s.id);
  return bad;
});
async function shot(page, name) {
  await page.waitForTimeout(450);
  const file = path.join(shotDir, `${name}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 82 });
  results.screenshots.push(path.basename(file));
}
async function ready(page, url = "/") {
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForSelector(".spatial[data-motion]");
  await page.waitForTimeout(200);
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
try {
  // ---------- Desktop screenshots (design API absent => baseline) ----------
  {
    const { page, errors, context } = await newPage(browser);
    await ready(page);
    await shot(page, "desktop-01-entry");
    for (const [i, id] of [["02", "systems"], ["03", "projects"], ["04", "research"], ["05", "contact"]]) {
      await page.click(`.header-nav [data-route-trigger="${id}"]`);
      if (id === "research") { await page.waitForSelector(".research-entry"); await page.click(".research-entry >> nth=0"); await page.waitForSelector(".research-reader article"); }
      await shot(page, `desktop-${i}-${id}`);
      check("visual", `desktop ${id}: no horizontal overflow`, (await noOverflow(page)).length === 0, JSON.stringify(await noOverflow(page)));
      await page.keyboard.press("Escape");
    }
    check("runtime", "desktop: no page/console errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  // ---------- Mobile screenshots ----------
  {
    const { page, errors, context } = await newPage(browser, { mobile: true });
    await ready(page);
    await shot(page, "mobile-01-entry");
    check("visual", "mobile entry: no horizontal overflow", (await noOverflow(page)).length === 0);
    check("mobile", "desktop nav hidden, Menu shown", await page.evaluate(() => getComputedStyle(document.querySelector(".header-nav")).display === "none" && getComputedStyle(document.querySelector(".menu-button")).display !== "none"));
    await page.click(".menu-button");
    await shot(page, "mobile-02-menu");
    const menu = await page.evaluate(() => ({ expanded: document.querySelector(".menu-button").getAttribute("aria-expanded"), labels: [...document.querySelectorAll("#lab-menu .route-label")].map(e => e.textContent), focus: document.activeElement?.getAttribute("data-route-trigger"), minH: Math.min(...[...document.querySelectorAll("#lab-menu a")].map(a => a.getBoundingClientRect().height)) }));
    check("mobile", "menu opens with four destinations, focus on first, targets >= 44px", menu.expanded === "true" && menu.labels.join() === "Systems,Projects,Research,Contact" && menu.focus === "systems" && menu.minH >= 44, JSON.stringify(menu));
    await page.keyboard.press("Escape");
    check("mobile", "Escape closes menu and returns focus to Menu", await page.evaluate(() => document.querySelector("#lab-menu").hidden && document.activeElement === document.querySelector(".menu-button")));
    for (const [i, id] of [["03", "systems"], ["04", "projects"], ["05", "research"], ["06", "contact"]]) {
      await page.click(".menu-button");
      await page.click(`#lab-menu [data-route-trigger="${id}"]`);
      if (id === "research") { await page.waitForSelector(".research-entry"); }
      await shot(page, `mobile-${i}-${id}`);
      const bad = await noOverflow(page);
      check("visual", `mobile ${id}: no horizontal overflow`, bad.length === 0, JSON.stringify(bad));
      await page.keyboard.press("Escape");
      if (id === "systems") check("focus", "mobile: focus returns to Menu button on close", await page.evaluate(() => document.activeElement === document.querySelector(".menu-button")));
    }
    await page.click(".menu-button");
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(150);
    check("mobile", "widening past the breakpoint closes the menu and releases scroll", await page.evaluate(() => document.querySelector("#lab-menu").hidden && getComputedStyle(document.body).overflow !== "hidden"));
    check("runtime", "mobile: no page/console errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  // ---------- Interaction matrix (desktop) ----------
  {
    const { page, context } = await newPage(browser);
    await ready(page, "/#projects");
    let s = await state(page);
    check("interaction", "direct hash #projects opens Projects and focuses its heading", s.open.join() === "surface-projects" && s.focus === "surface-projects-title", JSON.stringify(s));
    await ready(page, "/#nonsense");
    s = await state(page);
    check("interaction", "unknown direct hash stays on Entry", s.open.length === 0, JSON.stringify(s));
    await ready(page, "/#process");
    s = await state(page);
    check("interaction", "legacy #process resolves to #systems", s.open.join() === "surface-systems" && s.hash === "#systems", JSON.stringify(s));
    await page.click(".spatial-wordmark");
    s = await state(page);
    check("interaction", "wordmark returns to Entry (no hash)", s.open.length === 0 && s.hash === "", JSON.stringify(s));

    await ready(page, "/");
    await page.click('.header-nav [data-route-trigger="contact"]');
    await page.keyboard.press("Escape");
    s = await state(page);
    check("interaction", "Escape returns to Entry", s.open.length === 0 && s.hash === "", JSON.stringify(s));
    check("focus", "focus returns to the closed route's header trigger", s.focusTrigger === "header-nav:contact", JSON.stringify(s));

    await ready(page, "/");
    await page.click('.header-nav [data-route-trigger="systems"]');
    await page.click('.header-nav [data-route-trigger="projects"]');
    await page.goBack(); await page.waitForTimeout(150);
    const b1 = await state(page);
    await page.goBack(); await page.waitForTimeout(150);
    const b2 = await state(page);
    await page.goForward(); await page.waitForTimeout(150);
    const f1 = await state(page);
    check("interaction", "Back: projects -> systems", b1.open.join() === "surface-systems", JSON.stringify(b1));
    check("interaction", "Back: systems -> Entry", b2.open.length === 0, JSON.stringify(b2));
    check("interaction", "Forward: Entry -> systems", f1.open.join() === "surface-systems" && f1.focus === "surface-systems-title", JSON.stringify(f1));

    // keyboard route navigation
    await ready(page, "/");
    const order = [];
    for (let i = 0; i < 7; i += 1) { await page.keyboard.press("Tab"); order.push(await page.evaluate(() => document.activeElement.getAttribute("data-route-trigger") || document.activeElement.className)); }
    check("keyboard", "Tab order: skip link, wordmark, Systems, Projects, Research, Contact", order.slice(0, 6).join() === "skip-link,spatial-wordmark,systems,projects,research,contact", order.join());
    await page.focus('.header-nav [data-route-trigger="research"]');
    await page.keyboard.press("Enter");
    s = await state(page);
    check("keyboard", "Enter on a route trigger opens it and moves focus into it", s.open.join() === "surface-research" && s.focus === "surface-research-title", JSON.stringify(s));

    // Systems keyboard selection
    await ready(page, "/#systems");
    await page.focus(".discipline-list .selector >> nth=0");
    await page.keyboard.press("ArrowDown");
    let sel = await page.evaluate(() => ({ pressed: [...document.querySelectorAll(".discipline-list .selector")].map(b => b.getAttribute("aria-pressed")), focus: document.activeElement.textContent, detail: document.querySelector(".discipline-detail h3").textContent }));
    check("keyboard", "Systems: ArrowDown selects and focuses next discipline, detail follows", sel.pressed[1] === "true" && sel.focus === "Automation" && sel.detail === "Automation", JSON.stringify(sel));
    await page.keyboard.press("End");
    sel = await page.evaluate(() => ({ focus: document.activeElement.textContent, detail: document.querySelector(".discipline-detail").innerText }));
    check("keyboard", "Systems: End selects last (Architecture) with explicit no-relationship text", sel.focus === "Architecture" && /No published project/.test(sel.detail), JSON.stringify(sel));

    // Projects keyboard selection
    await ready(page, "/#projects");
    await page.focus(".project-list .project-selector >> nth=0");
    await page.keyboard.press("ArrowRight");
    let pj = await page.evaluate(() => ({ focus: document.activeElement.innerText, title: document.querySelector(".project-detail h3").textContent }));
    check("keyboard", "Projects: ArrowRight selects next project", pj.title === "Automation Hub" && /Automation Hub/.test(pj.focus), JSON.stringify(pj));
    await page.keyboard.press("Home");
    pj = await page.evaluate(() => document.querySelector(".project-detail h3").textContent);
    check("keyboard", "Projects: Home selects first project", pj === "ClinicFlow", pj);

    // Copy address
    await ready(page, "/#contact");
    await page.click(".contact-layout .inline-action");
    await page.waitForTimeout(150);
    const copied = await page.evaluate(async () => ({ status: document.querySelector(".copy-status").textContent, clip: await navigator.clipboard.readText(), mail: document.querySelector(".contact-email").getAttribute("href") }));
    check("interaction", "Copy address copies the repository address", copied.status === "Address copied." && copied.clip === "hello@maisoglabs.com" && copied.mail === "mailto:hello@maisoglabs.com", JSON.stringify(copied));
    await context.close();
  }

  // ---------- Hidden managed route + order (WEB-INC-007) ----------
  {
    const design = { theme: null, sections: { home: { order: 1, visible: true }, projects: { order: 9, visible: true }, process: { order: 5, visible: false }, about: { order: 2, visible: true } } };
    const { page, context } = await newPage(browser, { design });
    await ready(page, "/#systems");
    await page.waitForTimeout(300);
    const h = await page.evaluate(() => ({
      hash: location.hash,
      open: [...document.querySelectorAll(".surface")].filter(s => !s.hidden).map(s => s.id),
      triggers: [...document.querySelectorAll('[data-route-trigger="systems"]')].map(t => getComputedStyle(t).display),
      surface: document.getElementById("surface-systems").style.display,
      order: [...document.querySelectorAll(".header-nav a")].filter(a => getComputedStyle(a).display !== "none").sort((a, b) => Number(getComputedStyle(a).order) - Number(getComputedStyle(b).order)).map(a => a.dataset.routeTrigger),
      surfaceOrders: [...document.querySelectorAll(".surface")].map(s => s.style.order),
    }));
    check("web-inc-007", "hidden process: every Systems trigger and the surface hidden", h.triggers.every(d => d === "none") && h.surface === "none", JSON.stringify(h));
    check("web-inc-007", "direct #systems to hidden route fails safe to Entry", h.open.length === 0 && h.hash === "", JSON.stringify(h));
    check("web-inc-007", "published order permutes managed triggers only (about < projects), Research fixed at slot 3", h.order.join() === "contact,research,projects", JSON.stringify(h));
    check("web-inc-007", "surfaces never receive order", h.surfaceOrders.every(o => o === ""), JSON.stringify(h.surfaceOrders));
    await page.screenshot({ path: path.join(shotDir, "desktop-06-web-inc-007-hidden-systems.png") });
    results.screenshots.push("desktop-06-web-inc-007-hidden-systems.png");
    await context.close();
  }

  // ---------- Journal states ----------
  for (const [mode, delay, expect] of [["success", 900, "loading"], ["empty", 0, "empty"], ["error", 0, "error"], ["success", 0, "success"]]) {
    const { page, context } = await newPage(browser, { journal: mode, journalDelay: delay });
    await ready(page, "/");
    const before = await page.evaluate(() => document.querySelector(".research-layout").dataset.journalState);
    await page.click('.header-nav [data-route-trigger="research"]');
    if (expect !== "loading") await page.waitForFunction(e => document.querySelector(".research-layout").dataset.journalState === e, expect);
    const st = await page.evaluate(() => ({ state: document.querySelector(".research-layout").dataset.journalState, text: document.querySelector(".research-layout").innerText.slice(0, 200) }));
    let pass = st.state === expect;
    if (expect === "success") {
      await page.click(".research-entry >> nth=0");
      await page.waitForSelector(".research-reader article");
      const d = await page.evaluate(() => ({ titles: [...document.querySelectorAll(".research-title")].map(e => e.textContent), body: document.querySelector(".research-body").textContent, html: document.querySelector(".research-body").innerHTML, link: document.querySelector(".research-reader a").getAttribute("href") }));
      pass = pass && d.titles[0].includes("Newer") && d.body.includes("<b>not html</b>") && !d.html.includes("<b>") && d.link === "/journal?slug=fixture-entry-b";
      st.detail = d;
    }
    if (expect === "error") {
      await page.unroute("**/api/journal**");
      await page.route("**/api/journal**", r => r.fulfill({ json: { entries: [] } }));
      await page.click(".research-status .inline-action");
      await page.waitForFunction(() => document.querySelector(".research-layout").dataset.journalState === "empty");
      st.retry = "empty after retry";
    }
    if (expect === "loading") await shot(page, "desktop-07-research-loading");
    if (expect === "empty") await shot(page, "desktop-08-research-empty");
    if (expect === "error") await shot(page, "desktop-09-research-error");
    check("journal", `Journal ${expect} state`, pass && (expect === "loading" ? before === "idle" : true), JSON.stringify({ before, ...st }));
    await context.close();
  }

  // ---------- Motion matrix ----------
  const motionCase = async (label, opts, expectMode) => {
    const { page, context } = await newPage(browser, opts);
    await ready(page, "/");
    await page.mouse.move(700, 400); await page.mouse.move(900, 500); await page.waitForTimeout(200);
    const entry = { ...(await state(page)), ambient: await ambient(page), bgTransform: await page.evaluate(() => getComputedStyle(document.querySelector(".spatial-backdrop")).transform) };
    await page.click('.header-nav [data-route-trigger="projects"]');
    await page.waitForTimeout(80);
    const surfaceAnim = await page.evaluate(() => document.getElementById("surface-projects").getAnimations().map(a => a.animationName));
    await page.waitForTimeout(400);
    const open = { ...(await state(page)), ambient: await ambient(page), vars: await page.evaluate(() => document.querySelector(".spatial-backdrop").style.cssText) };
    await page.keyboard.press("Escape");
    // Hidden-document lifecycle (simulated: visibilityState overridden + visibilitychange dispatched).
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(100);
    const hidden = { ...(await state(page)), ambient: await ambient(page), docHidden: await page.evaluate(() => document.querySelector(".spatial").dataset.docHidden) };
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(100);
    const back = { ambient: await ambient(page), parallax: (await state(page)).parallax };
    const calm = expectMode === "calm";
    check("motion", `${label}: mode ${expectMode}`, entry.motion === expectMode, JSON.stringify(entry));
    check("motion", `${label}: Entry ambient motion ${calm ? "running" : "absent"}; parallax ${calm ? "on" : "off"}`, calm ? entry.ambient > 0 && entry.parallax === "on" : entry.ambient === 0 && entry.parallax === "off", JSON.stringify(entry));
    check("motion", `${label}: surface transition ${expectMode === "calm" ? "surface-in" : expectMode === "minimal" ? "surface-fade" : "none"}`, expectMode === "calm" ? surfaceAnim.includes("surface-in") : expectMode === "minimal" ? surfaceAnim.includes("surface-fade") : surfaceAnim.length === 0 || opts.reducedMotion === "reduce", JSON.stringify(surfaceAnim));
    check("motion", `${label}: open surface stops ambient motion and parallax`, open.ambient === 0 && open.parallax === "off" && !open.vars.includes("--parallax"), JSON.stringify(open));
    check("motion", `${label}: hidden document stops ambient motion and parallax (simulated visibility)`, hidden.ambient === 0 && hidden.parallax === "off" && hidden.docHidden === "true", JSON.stringify(hidden));
    if (calm) check("motion", `${label}: ambient motion and parallax resume on visible Entry`, back.ambient > 0 && back.parallax === "on", JSON.stringify(back));
    check("motion", `${label}: no <video> element shipped (MEDIA_GAP)`, (await page.evaluate(() => document.querySelectorAll("video").length)) === 0);
    await context.close();
  };
  await motionCase("normal/calm", {}, "calm");
  await motionCase("WEB-INC-007 minimal", { design: { theme: { animationPreset: "minimal" }, sections: null } }, "minimal");
  await motionCase("WEB-INC-007 off", { design: { theme: { animationPreset: "off" }, sections: null } }, "off");
  await motionCase("WEB-INC-007 always-reduced", { design: { theme: { reducedMotionMode: "always-reduced" }, sections: null } }, "off");
  await motionCase("prefers-reduced-motion", { reducedMotion: "reduce" }, "off");

  // /journal regression
  {
    const { page, context, errors } = await newPage(browser);
    await page.goto(BASE + "/journal", { waitUntil: "networkidle" });
    await page.waitForSelector(".journal-card");
    check("regression", "/journal page still lists entries", (await page.$$(".journal-card")).length === 2 && errors.length === 0, errors.join("|"));
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
results.summary = { total: results.checks.length, passed: results.checks.filter(c => c.pass).length };
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
for (const c of results.checks) console.log(`${c.pass ? "PASS" : "FAIL"} [${c.area}] ${c.name}${c.pass ? "" : "  :: " + c.detail}`);
console.log(JSON.stringify(results.summary));
process.exit(results.summary.total === results.summary.passed ? 0 : 1);
