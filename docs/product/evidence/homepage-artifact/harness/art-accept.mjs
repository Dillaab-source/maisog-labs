// D-093 homepage-artifact acceptance against a local `wrangler dev` runtime.
// Usage: node art-accept.mjs <baseUrl> <outDir>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const [, , BASE, OUT] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const R = {};

async function open({ vp = { w: 1440, h: 900 }, mobile = false, reduced = false, query = "" } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const log = { errors: [], warnings: [], requests: [] };
  page.on("pageerror", e => log.errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") log.errors.push(m.text().slice(0, 240)); else if (m.type() === "warning") log.warnings.push(m.text().slice(0, 160)); });
  page.on("request", q => log.requests.push(q.url()));
  // Harness-only: Playwright's open-source Chromium has no H.264 decoder, so the
  // artifact's /assets/video/logo-mark.mp4 request is answered with a VP9
  // transcode of the same 5.04 s clip. The shipped MP4 is unchanged.
  if (process.env.LOGO_WEBM) await page.route(u => u.pathname === "/assets/video/logo-mark.mp4", r => r.fulfill({ path: process.env.LOGO_WEBM, contentType: "video/webm" }));
  await page.goto(`${BASE}/${query}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#root nav") !== null, null, { timeout: 30000 });
  await page.waitForTimeout(2500);
  return { ctx, page, log };
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name) });

// 2-8: Full mode (default) — JS executes, logo video plays, crossfade, orbit, plate push.
{
  const { ctx, page, log } = await open();
  R.jsExecutes = await page.evaluate(() => ({ motion: window.MLMotion, root: !!document.querySelector("#root header nav"), bundleError: !!document.getElementById("__bundler_err"), dsErrors: (window.MaisogLabsDesignSystem_a728bd?.__errors || []).length }));
  const vids = () => page.evaluate(() => [...document.querySelectorAll("video")].map(v => ({ t: +v.currentTime.toFixed(2), paused: v.paused, opacity: getComputedStyle(v).opacity, dur: +(v.duration || 0).toFixed(2), src: v.getAttribute("src"), ready: v.readyState })));
  const v1 = await vids(); await page.waitForTimeout(1500); const v2 = await vids();
  R.logoPlays = { before: v1, after: v2, pass: v1.length >= 2 && v2[0].t > v1[0].t && !v2[0].paused && v2[0].ready >= 2 };
  // Crossfade: sample both logo videos for 7 s (the clip is 5.04 s long).
  const samples = [];
  for (let k = 0; k < 28; k += 1) { samples.push((await vids()).map(v => v.opacity + (v.paused ? "p" : "") + "@" + v.t).join(" | ")); await page.waitForTimeout(250); }
  const swapped = samples.some(x => x.startsWith("0")) && samples.some(x => x.startsWith("1"));
  R.crossfade = { samples: samples.filter((x, n) => n % 4 === 0), pass: swapped };
  const orbit = () => page.evaluate(() => { const c = [...document.querySelectorAll("header svg circle")].find(x => x.getAttribute("r") === "4.5"); return c ? [+c.getAttribute("cx"), +c.getAttribute("cy")] : null; });
  const o1 = await orbit(); await page.waitForTimeout(1500); const o2 = await orbit();
  R.orbitFull = { o1, o2, pass: !!o1 && (o1[0] !== o2[0] || o1[1] !== o2[1]) };
  R.plateAnimation = await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getKeyframes?.().some(k => String(k.transform).includes("1.145"))).length);
  await page.mouse.move(200, 200); await page.mouse.move(1200, 700); await page.waitForTimeout(900);
  R.parallax = await page.evaluate(() => { const bg = document.querySelector("header > div"); return bg ? bg.style.transform : null; });
  await shot(page, "full-desktop-entry.png");
  // 9: panels and interactions.
  const i = {};
  for (const [id, label] of [["systems", "Systems"], ["projects", "Projects"], ["journal", "Research"], ["contact", "Contact"]]) {
    await page.click(`nav a[href="#${id}"]`); await page.waitForTimeout(1300);
    i[id] = await page.evaluate(x => { const s = document.getElementById(x); const cs = getComputedStyle(s); return { hash: location.hash, visible: cs.visibility, opacity: cs.opacity }; }, id);
    await shot(page, `full-desktop-${id}.png`);
  }
  await page.keyboard.press("Escape"); await page.waitForTimeout(900);
  i.escape = await page.evaluate(() => ({ hash: location.hash, anyOpen: [...document.querySelectorAll("section[id]")].some(s => getComputedStyle(s).visibility === "visible") }));
  await page.evaluate(() => { location.hash = "#systems"; }); await page.waitForTimeout(1200);
  await page.locator("#systems ol button").first().click(); await page.waitForTimeout(900);
  i.systemsSelect = await page.evaluate(() => document.querySelector("#systems h3")?.textContent);
  await page.evaluate(() => { location.hash = "#projects"; }); await page.waitForTimeout(1200);
  const before = await page.evaluate(() => document.querySelector("#projects h3")?.textContent);
  await page.locator('#projects button[aria-label^="Next"]').click(); await page.waitForTimeout(700);
  const after = await page.evaluate(() => document.querySelector("#projects h3")?.textContent);
  i.projectPager = { before, after };
  await page.evaluate(() => { location.hash = "#journal"; }); await page.waitForTimeout(1200);
  await page.locator('#journal button[aria-pressed]', { hasText: "Build" }).click(); await page.waitForTimeout(500);
  i.researchFilterBuild = await page.evaluate(() => [...document.querySelectorAll("#journal article")].filter(a => getComputedStyle(a).display !== "none").length);
  await page.evaluate(() => { location.hash = "#contact"; }); await page.waitForTimeout(1200);
  i.mailto = await page.evaluate(() => document.querySelector("#contact a[href^='mailto:']")?.getAttribute("href"));
  R.panels = i;
  R.fullLog = { errors: log.errors, warnings: [...new Set(log.warnings)].slice(0, 8), requests: [...new Set(log.requests.map(u => u.startsWith("blob:") ? "blob:" : u.startsWith("data:") ? "data:" : new URL(u).pathname))].sort() };
  R.external = log.requests.filter(u => !u.startsWith(BASE) && !u.startsWith("blob:") && !u.startsWith("data:"));
  await ctx.close();
}
// 6: Calm mode (artifact query override).
{
  const { ctx, page, log } = await open({ query: "?motion=Calm" });
  const orbit = () => page.evaluate(() => { const c = [...document.querySelectorAll("header svg circle")].find(x => x.getAttribute("r") === "4.5"); return c ? [+c.getAttribute("cx"), +c.getAttribute("cy")] : null; });
  const o1 = await orbit(); await page.waitForTimeout(1500); const o2 = await orbit();
  R.calm = { motion: await page.evaluate(() => window.MLMotion), orbitStatic: JSON.stringify(o1) === JSON.stringify(o2), videos: await page.evaluate(() => document.querySelectorAll("video").length), errors: log.errors };
  await ctx.close();
}
// 7: Still / reduced motion.
{
  const { ctx, page, log } = await open({ reduced: true });
  R.still = await page.evaluate(() => ({ motion: window.MLMotion, videos: document.querySelectorAll("video").length, posterImg: !!document.querySelector('img[alt="Maisog Labs mark"]'), animations: document.getAnimations().length }));
  R.still.errors = log.errors;
  await shot(page, "still-desktop-entry.png");
  await ctx.close();
}
// 10: mobile.
{
  const { ctx, page, log } = await open({ vp: { w: 390, h: 844 }, mobile: true });
  R.mobile = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth, navLinks: [...document.querySelectorAll("nav a[href^='#']")].map(a => { const r = a.getBoundingClientRect(); return { t: a.textContent, right: Math.round(r.right), clipped: r.right > innerWidth }; }) }));
  await shot(page, "full-mobile-entry.png");
  await page.evaluate(() => { location.hash = "#systems"; }); await page.waitForTimeout(1300);
  await shot(page, "full-mobile-systems.png");
  R.mobile.errors = log.errors;
  await ctx.close();
}
// 11: /journal still renders.
{
  const ctx = await browser.newContext(); const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  const res = await page.goto(`${BASE}/journal`, { waitUntil: "load" }); await page.waitForTimeout(2000);
  R.journal = { status: res.status(), heading: await page.evaluate(() => document.querySelector("h2")?.textContent), state: await page.evaluate(() => document.querySelector(".journal-empty")?.textContent || null), errors: errs };
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "acceptance.json"), JSON.stringify(R, null, 2) + "\n");
console.log(JSON.stringify(R, null, 1));
