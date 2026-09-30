// D-129 desktop checks (local, headless Chromium). Needs `node serve.mjs` running.
const { execSync } = require("child_process");
const { chromium } = require(execSync("npm root -g").toString().trim() + "/playwright");
const fs = require("fs");
const OUT = process.env.OUT || __dirname + "/shots";
fs.mkdirSync(OUT, { recursive: true });
const VARIANTS = [{ port: 8201, name: "baseline-bridge" }, { port: 8202, name: "candidate-bridge" }, { port: 8203, name: "candidate-raw" }];
const VIEWPORTS = [[1440, 900], [1280, 720]];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const text = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : null; }, sel);

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const v of VARIANTS) for (const [w, h] of VIEWPORTS) {
    const r = { variant: v.name, viewport: `${w}x${h}`, errors: [], failed: [], checks: {} };
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error" || m.type() === "warning") r.errors.push(m.type() + ": " + m.text().slice(0, 300)); });
    page.on("pageerror", e => r.errors.push("pageerror: " + e.message.slice(0, 300)));
    page.on("requestfailed", q => r.failed.push(q.url() + " " + (q.failure() || {}).errorText));
    page.on("response", s => { if (s.status() >= 400) r.failed.push(s.status() + " " + s.url()); });
    await page.goto(`http://127.0.0.1:${v.port}/`, { waitUntil: "load" });
    await page.waitForSelector("#root h1", { timeout: 20000 });
    await sleep(3000);
    const tag = `${v.name}-${w}x${h}`;
    await page.screenshot({ path: `${OUT}/${tag}-entry.jpg`, type: "jpeg", quality: 72 });
    r.checks.entry = await page.evaluate(() => {
      const box = e => { const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) }; };
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const row = [...document.querySelectorAll('[data-entry="4"]')].find(e => e.tagName === "DIV" && e.querySelector("p"));
      const p = row.querySelector("p"); const stack = row.querySelector('div[aria-hidden="true"]');
      const h1 = document.querySelector("#root h1");
      const stage = [...document.querySelectorAll('[data-entry="2"]')][0];
      const tagline = h1.nextElementSibling;
      const pb = box(p), sb = box(stack), hb = box(h1), gb = box(stage), tb = box(tagline);
      const lh = parseFloat(getComputedStyle(p).lineHeight);
      return {
        lowerLeftText: p.innerText, lowerLeftHtml: p.innerHTML, lowerLeftRenderedLines: Math.round(p.getBoundingClientRect().height / lh),
        stack: [...stack.querySelectorAll("span")].map(s => s.innerText), stackStyle: (({ flexDirection, fontSize, letterSpacing, textTransform }) => ({ flexDirection, fontSize, letterSpacing, textTransform }))(getComputedStyle(stack)),
        tagline: tagline.innerText.replace(/\s+/g, " ").trim(), wordmark: h1.innerText.replace(/\s+/g, " ").trim(),
        clipped: { p: p.scrollWidth > p.clientWidth + 1 || p.scrollHeight > p.clientHeight + 1, stack: stack.scrollWidth > stack.clientWidth + 1 || stack.scrollHeight > stack.clientHeight + 1 },
        inViewport: { p: pb.l >= 0 && pb.r <= innerWidth && pb.b <= innerHeight, stack: sb.l >= 0 && sb.r <= innerWidth && sb.b <= innerHeight },
        overlap: { pWithH1: hit(pb, hb), pWithLogo: hit(pb, gb), pWithTagline: hit(pb, tb), stackWithH1: hit(sb, hb), stackWithLogo: hit(sb, gb), stackWithTagline: hit(sb, tb), pWithStack: hit(pb, sb) },
        boxes: { p: pb, stack: sb, h1: hb, logo: gb, tagline: tb },
        overflow: { sw: document.documentElement.scrollWidth, iw: innerWidth },
        oldCopyInDom: /independent technology laboratory|Humanity|Orbits|Higher/.test(row.innerText),
      };
    });
    const panels = {};
    for (const id of ["systems", "projects", "journal", "contact"]) {
      await page.evaluate(id => { location.hash = id; }, id);
      await sleep(2300);
      await page.screenshot({ path: `${OUT}/${tag}-${id}.jpg`, type: "jpeg", quality: 72 });
      panels[id] = { text: await text(page, "#" + id), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) };
    }
    const proj = [];
    await page.evaluate(() => { location.hash = "projects"; }); await sleep(2000);
    const n = await page.evaluate(() => MLData.PROJ.length);
    for (let i = 0; i < n; i++) {
      await page.evaluate(i => { const bs = [...document.querySelector("#projects").querySelectorAll("button")].filter(b => !/^(Previous|Next):/.test(b.getAttribute("aria-label") || "")); bs[i].click(); }, i);
      await sleep(600);
      proj.push(await page.evaluate(() => { const h3 = document.querySelector("#projects h3"); return h3.closest("[aria-live]").innerText.replace(/\s+/g, " ").slice(0, 400); }));
    }
    panels.projectList = proj;
    await page.keyboard.press("Escape"); await sleep(1500);
    panels.backToEntry = await page.evaluate(() => location.hash === "");
    r.checks.panels = panels;
    r.checks.mldata = await page.evaluate(() => ({ proj: MLData.PROJ.map(p => p.name), email: MLData.EMAIL }));
    await ctx.close();
    results.push(r);
    console.error("done", tag, "errors", r.errors.length, "failed", r.failed.length);
  }
  await browser.close();
  fs.writeFileSync(OUT + "/results.json", JSON.stringify(results, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
