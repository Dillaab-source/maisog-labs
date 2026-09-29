// V10.1 desktop candidate checks (local, headless Chromium).
const { execSync } = require("child_process");
const { chromium } = require(execSync("npm root -g").toString().trim() + "/playwright");
const fs = require("fs");

// Needs Playwright (global install) and Chromium. OUT defaults to ./shots.
const OUT = process.env.OUT || __dirname + "/shots";
fs.mkdirSync(OUT, { recursive: true });
const VARIANTS = (process.env.VARIANTS || "8101:baseline,8102:candidate,8103:candidate-bridge,8104:baseline-bridge,8105:candidate-bridge-longemail,8106:baseline-bridge-longemail")
  .split(",").map(s => { const [port, name] = s.split(":"); return { port, name }; });
const VIEWPORTS = [[1440, 900], [1280, 720]];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function overflow(page) {
  return page.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth }));
}
async function visibleText(page, sel) {
  return page.evaluate(s => { const el = document.querySelector(s); return el ? el.innerText : null; }, sel);
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const v of VARIANTS) for (const [w, h] of VIEWPORTS) {
    const r = { variant: v.name, viewport: `${w}x${h}`, errors: [], failed: [], checks: {} };
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error" || m.type() === "warning") r.errors.push(m.type() + ": " + m.text().slice(0, 300)); });
    page.on("pageerror", e => r.errors.push("pageerror: " + e.message.slice(0, 300)));
    page.on("requestfailed", q => r.failed.push(q.url() + " " + (q.failure() || {}).errorText));
    page.on("response", s => { if (s.status() >= 400) r.failed.push(s.status() + " " + s.url()); });
    const base = `http://127.0.0.1:${v.port}/`;
    const t0 = Date.now();
    await page.goto(base, { waitUntil: "load" });
    await page.waitForSelector("#root h1", { timeout: 20000 });
    r.checks.rootH1Ms = Date.now() - t0;
    await sleep(2500);
    const tag = `${v.name}-${w}x${h}`;
    await page.screenshot({ path: `${OUT}/${tag}-entry.png` });
    r.checks.doc = await page.evaluate(() => {
      const m = n => { const e = document.querySelector(`meta[name="${n}"],meta[property="${n}"]`); return e ? e.content : null; };
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e => e.tagName + ":" + e.textContent.replace(/\s+/g, " ").trim().slice(0, 40));
      return {
        lang: document.documentElement.lang || null, title: document.title,
        main: document.querySelectorAll("main").length, mainContainsRoot: !!document.querySelector("#root main"),
        description: m("description"), canonical: (document.querySelector('link[rel="canonical"]') || {}).href || null,
        og: ["og:type", "og:site_name", "og:title", "og:description", "og:url", "og:locale"].map(k => [k, m(k)]),
        twitter: ["twitter:card", "twitter:title", "twitter:description"].map(k => [k, m(k)]),
        headings: hs, h1: document.querySelectorAll("h1").length,
        babel: typeof window.Babel !== "undefined", textBabel: document.querySelectorAll('script[type="text/babel"]').length,
        reactProd: !!(window.React && !React.version.includes("dev")) && !(window.React && React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED && React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactDebugCurrentFrame && typeof React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactDebugCurrentFrame.getStackAddendum === "function"),
        reactVersion: window.React && React.version,
        scriptsInHead: document.head.querySelectorAll("script").length,
        focusVisibleRule: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => (r.selectorText || "").includes(":focus-visible")); } catch { return false; } }),
        mldata: { proj: MLData.PROJ.map(p => p.name), email: MLData.EMAIL, flow0: MLData.FLOW[0] },
      };
    });
    r.checks.entryOverflow = await overflow(page);

    // Focus visibility: tab to first focusable, read computed outline.
    await page.keyboard.press("Tab");
    r.checks.focus = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, text: (a.innerText || a.getAttribute("aria-label") || "").slice(0, 30), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor, fv: a.matches(":focus-visible") }; });
    await page.screenshot({ path: `${OUT}/${tag}-focus.png` });

    // Systems
    await page.evaluate(() => { location.hash = "systems"; });
    await sleep(2200);
    await page.screenshot({ path: `${OUT}/${tag}-systems.png` });
    r.checks.systems = { text: (await visibleText(page, "#systems")).slice(0, 200).replace(/\s+/g, " "), overflow: await overflow(page) };

    // Projects: all five via index list + pager
    await page.evaluate(() => { location.hash = "projects"; });
    await sleep(2200);
    const proj = [];
    const btns = await page.$$("#projects nav button, #projects [role=tablist] button, #projects ul button");
    const nameCount = await page.evaluate(() => MLData.PROJ.length);
    for (let i = 0; i < nameCount; i++) {
      await page.evaluate(i => { const list = document.querySelector("#projects"); const bs = [...list.querySelectorAll("button")].filter(b => !/^(Previous|Next):/.test(b.getAttribute("aria-label") || "")); bs[i].click(); }, i);
      await sleep(700);
      const info = await page.evaluate(() => { const h3 = document.querySelector("#projects h3"); const pane = h3.closest("[aria-live]"); return { h3: h3.innerText, text: pane.innerText.replace(/\s+/g, " ").slice(0, 400) }; });
      proj.push(info);
      await page.screenshot({ path: `${OUT}/${tag}-project${i + 1}.png` });
    }
    // Pager next cycles
    const pagerSeq = [];
    for (let i = 0; i < nameCount; i++) {
      await page.click('#projects button[aria-label^="Next:"]');
      await sleep(600);
      pagerSeq.push(await page.evaluate(() => document.querySelector("#projects h3").innerText));
    }
    r.checks.projects = { list: proj, pagerSeq, overflow: await overflow(page) };

    // Research
    await page.evaluate(() => { location.hash = "journal"; });
    await sleep(2200);
    await page.screenshot({ path: `${OUT}/${tag}-research.png` });
    const research = { filters: {} };
    research.heading = await page.evaluate(() => [...document.querySelectorAll("#journal h1,#journal h2,#journal h3")].map(h => h.tagName + ":" + h.innerText));
    research.deadLinks = await page.evaluate(() => [...document.querySelectorAll('#journal a')].map(a => a.getAttribute("href")));
    research.hashLinks = await page.evaluate(() => ({ journal: document.querySelectorAll('#journal a[href="#"]').length, page: [...document.querySelectorAll('a[href="#"]')].map(a => (a.closest("section[id]") || {}).id + ":" + (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 30)) }));
    research.moreNotes = await page.evaluate(() => { const t = document.querySelector("#journal").textContent; return { moreNotes: /More notes/.test(t), inPrep: /Notes in preparation/.test(t) }; });
    research.inPrepInteractive = await page.evaluate(() => { const el = [...document.querySelectorAll("#journal *")].find(e => e.childElementCount === 0 && e.textContent.trim() === "Notes in preparation"); return el ? { tag: el.tagName, closestA: !!el.closest("a,button"), tabIndex: el.tabIndex } : null; });
    for (const f of ["Research", "Build", "Thoughts", "All"]) {
      const clicked = await page.evaluate(f => { const b = [...document.querySelectorAll('#journal [role=group] button')].find(x => x.textContent.trim().toLowerCase() === f.toLowerCase()); if (!b) return false; b.click(); return b.getAttribute("aria-pressed"); }, f);
      await sleep(500);
      research.filters[f] = { clicked, pressed: await page.evaluate(f => { const b = [...document.querySelectorAll('#journal [role=group] button')].find(x => x.textContent.trim().toLowerCase() === f.toLowerCase()); return b && b.getAttribute("aria-pressed"); }, f), cards: await page.evaluate(() => [...document.querySelectorAll("#journal h3")].map(h => h.innerText)) };
    }
    research.cardTags = await page.evaluate(() => [...document.querySelectorAll("#journal h3")].map(h => { let c = h; while (c && c.parentElement && !/^(A|DIV)$/.test(c.tagName)) c = c.parentElement; const card = h.closest("a") || h.parentElement.parentElement; return { tag: card.tagName, href: card.getAttribute("href"), tabbable: card.tabIndex >= 0 }; }));
    research.overflow = await overflow(page);
    await page.screenshot({ path: `${OUT}/${tag}-research-all.png` });
    r.checks.research = research;

    // Contact
    await page.evaluate(() => { location.hash = "contact"; });
    await sleep(2600);
    await page.screenshot({ path: `${OUT}/${tag}-contact.png` });
    r.checks.contact = await page.evaluate(() => {
      const a = document.querySelector('#contact a[href^="mailto:"]'); const s = a.querySelector("span");
      const ar = a.getBoundingClientRect(), sr = s.getBoundingClientRect(), col = a.parentElement.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(s).lineHeight) || parseFloat(getComputedStyle(s).fontSize) * 1.2;
      const rects = Math.round(sr.height / (parseFloat(getComputedStyle(s).fontSize) * 1.25));
      return { email: s.innerText, fontSize: getComputedStyle(a).fontSize, lines: rects, spanH: Math.round(sr.height), spanW: Math.round(sr.width), linkRight: Math.round(ar.right), colRight: Math.round(col.right), colW: Math.round(col.width), vw: innerWidth, spanOverflowsCol: sr.right > col.right + 0.5, spanOffscreen: sr.right > innerWidth };
    });
    r.checks.contact.overflow = await overflow(page);
    // Focus on the mailto link via keyboard
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.focus('#contact a[href^="mailto:"]');
    await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
    r.checks.contactFocus = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, fv: a.matches(":focus-visible"), outline: cs.outlineStyle + " " + cs.outlineWidth }; });
    await page.screenshot({ path: `${OUT}/${tag}-contact-focus.png` });

    // Escape back to entry
    await page.keyboard.press("Escape");
    await sleep(1500);
    r.checks.backToEntry = await page.evaluate(() => location.hash === "");
    r.checks.finalOverflow = await overflow(page);
    await ctx.close();
    results.push(r);
    console.error("done", tag, "errors", r.errors.length, "failed", r.failed.length);
  }
  await browser.close();
  fs.writeFileSync(OUT + "/results.json", JSON.stringify(results, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
