#!/usr/bin/env node
// D-120 (ML-DEVOS-AS-144): builds the V10.1 desktop REVIEW CANDIDATE from the
// canonical D-093 artifact. It never touches public/index.html, which stays
// canonical and production-authoritative; the output goes to
// candidates/v10.1/site/.
//
// Source of truth is the current production implementation: this script reads
// public/index.html (verified against its pinned SHA-256), decodes the
// self-unpacking bundle (manifest + template), applies the bounded V10.1
// patches below, and writes a plain static page:
//
//   - no self-unpacking, no in-browser Babel: the six JSX panels and the mount
//     script are precompiled once with esbuild (the same classic
//     React.createElement transform Babel applied in the browser);
//   - React/ReactDOM 18.3.1 production UMD builds (candidates/v10.1/vendor/,
//     npm tarball integrity recorded in candidates/v10.1/README.md) replace the
//     development builds; the design-system and data scripts are unchanged
//     apart from the NoteCard patch;
//   - every script moves from <head> to the end of <body>, in the original
//     order, so the head stays script-free: the RFC-022 bridge hook, spliced
//     before </head>, must still install its window.MLData setter before the
//     data script assigns MLData (worker/bridge/inject.mjs);
//   - fonts, icon and scripts become content-fingerprinted files under
//     /v101/assets/ (cacheable as immutable).
//
// Every patch is an exact-match replacement that must match exactly once, so
// the candidate is an auditable, reproducible function of the canonical
// artifact. Usage: node scripts/build-v101-candidate.mjs [path-to-V10-artifact]
//
// D-129: public/index.html now holds the promoted V10.1 page, so the pinned
// V10 artifact is passed explicitly (for example, extracted byte-exact with
// `git show f2c13aa:public/index.html`); its SHA-256 is verified either way.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { transformSync } from "esbuild";

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "public/index.html");
const SOURCE_SHA256 = "2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9";
const CANDIDATE = path.join(ROOT, "candidates/v10.1");
const SITE = path.join(CANDIDATE, "site");
const ASSET_URL = "/v101/assets/";
const ASSET_DIR = path.join(SITE, "v101/assets");

const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

// Bundle resource roles (manifest UUID -> role). Anything not listed here is a
// font or the icon and is emitted as a fingerprinted asset unchanged.
const R = {
  reactDev: "30952005-23f1-41e3-bca3-9bc49f0dced6",
  reactDomDev: "233cf125-049e-4322-b6fb-feddf251d1ad",
  babel: "58998927-ee82-457a-b8b8-2bdedd69e008",
  designSystem: "39a4da26-c8f2-4099-9b94-fc86f9fcea1f",
  data: "86b837d9-34d4-4441-849c-ecc8d5fccac8",
  entry: "35a72b2d-c820-4847-8c0d-01bce61b61e0",
  overlay: "f349c30b-f39e-40d8-b738-e37decca3394",
  systems: "bda03168-4b72-4753-8b1d-4b7f49e91630",
  projects: "361c3ee8-b14b-4b27-9181-33951d3be60a",
  research: "9698e02a-75ae-4819-ad94-627387e8c479",
  contact: "bde8a9ab-02c1-49c6-94b0-22c6cca09137",
};
const JSX_ORDER = ["entry", "overlay", "systems", "projects", "research", "contact"];

function replaceOnce(text, find, replacement, label) {
  const count = text.split(find).length - 1;
  if (count !== 1) throw new Error(`patch "${label}": expected exactly 1 match, found ${count}`);
  return text.replace(find, () => replacement);
}

// ---- V10.1 bounded patches (D-120) ------------------------------------------

// 1. Research: working filters kept; no dead href="#" affordances.
// 1b. The wordmark home control: a real URL instead of "#" (its click handler
// already prevents navigation and returns to the entry view).
// 1c. D-129: the two homepage copy strings, and nothing else. The lower-left
// paragraph keeps its element and style and now holds the identity line and
// the supporting line; the lower-right stack keeps its three-span treatment.
function patchEntry(src) {
  src = replaceOnce(src,
    `<a href="#" onClick={e => { e.preventDefault(); go('entry'); }} aria-label="Maisog Labs home">`,
    `<a href="/" onClick={e => { e.preventDefault(); go('entry'); }} aria-label="Maisog Labs home">`,
    "entry: wordmark home href");
  src = replaceOnce(src,
    ">The independent technology laboratory of Paulo Maisog, building AI automation, research systems, and experimental software.</p>",
    ">{'Paulo Maisog \u2014 AI Automation & Technical Systems Builder'}<br />{'Building practical AI workflows, cloud automation, and technical systems for real-world business processes.'}</p>",
    "entry: D-129 lower-left identity + supporting line");
  src = replaceOnce(src,
    "<span>Humanity</span><span>Orbits</span><span>Higher</span>",
    "<span>AI</span><span>AUTOMATION</span><span>SYSTEMS</span>",
    "entry: D-129 lower-right stack");
  return src;
}

function patchResearch(src) {
  src = replaceOnce(src, "const { SectionHeader, FilterTabs, DisplayHeading, NoteCard, Button } = window.MaisogLabsDesignSystem_a728bd;",
    "const { SectionHeader, FilterTabs, DisplayHeading, NoteCard } = window.MaisogLabsDesignSystem_a728bd;", "research: drop unused Button");
  src = replaceOnce(src, ">Research Notes</DisplayHeading>", ">Research Previews</DisplayHeading>", "research: heading");
  src = replaceOnce(src, '<Button variant="text" href="#">More notes</Button>',
    "<span style={{ fontFamily: 'var(--ml-font-display)', fontSize: '.8rem', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: '#9AA8CC' }}>Notes in preparation</span>",
    "research: More notes link -> non-interactive text");
  return src;
}

// NoteCard (design system): no destination => not a link. The card renders a
// non-focusable block, and the link-only cues (title underline, trailing arrow)
// are suppressed; cards with a real href are unchanged.
function patchNoteCard(src) {
  src = replaceOnce(src, "  tags,\n  href = '#',\n  style\n}) {\n  const [h, setH] = useState(false);\n  const meta = {",
    "  tags,\n  href,\n  style\n}) {\n  const [h, setH] = useState(false);\n  const meta = {", "notecard: no default '#'");
  src = replaceOnce(src, '  })), /*#__PURE__*/React.createElement("a", {\n    href: href,\n    onFocus: () => setH(true),\n    onBlur: () => setH(false),',
    '  })), /*#__PURE__*/React.createElement(href ? "a" : "div", {\n    href: href || undefined,\n    onFocus: href ? () => setH(true) : undefined,\n    onBlur: href ? () => setH(false) : undefined,',
    "notecard: link only with a destination");
  src = replaceOnce(src, "      backgroundImage: 'linear-gradient(#3B82F6,#3B82F6)',\n      backgroundRepeat: 'no-repeat',\n      backgroundPosition: '0 100%',\n      backgroundSize: (h ? '100%' : '0%') + ' 1px',",
    "      backgroundImage: 'linear-gradient(#3B82F6,#3B82F6)',\n      backgroundRepeat: 'no-repeat',\n      backgroundPosition: '0 100%',\n      backgroundSize: (h && href ? '100%' : '0%') + ' 1px',",
    "notecard: title underline only for links");
  src = replaceOnce(src, '  }, "\\u2192"))));\n}\nObject.assign(__ds_scope, { NoteCard });',
    '  }, href ? "\\u2192" : null))));\n}\nObject.assign(__ds_scope, { NoteCard });', "notecard: arrow only for links");
  return src;
}

// 2. Contact: desktop wrapping only; the data source (MLData.EMAIL, or the
// RFC-022 contact override) is unchanged. Slightly smaller type, a wider
// column and a soft break opportunity before "@": a typical address stays on
// one line, a very long one breaks only at "@", and overflowWrap:anywhere
// stays as the last-resort guard for a single part longer than the column.
function patchContact(src) {
  src = replaceOnce(src,
    "marginLeft: 'clamp(20px,2.4vw,32px)', maxWidth: 'min(360px,62vw)' }}>",
    "marginLeft: 'clamp(20px,2.4vw,32px)', maxWidth: 'min(440px,62vw)' }}>",
    "contact: wider address column");
  src = replaceOnce(src,
    "fontSize: 'clamp(18px,2.2vw,30px)', letterSpacing: '.02em', color: '#F8FAFF', padding: '4px 0', overflowWrap: 'anywhere' }}>",
    "fontSize: 'clamp(16px,1.75vw,26px)', letterSpacing: '.02em', color: '#F8FAFF', padding: '4px 0', overflowWrap: 'anywhere' }}>",
    "contact: address type size");
  src = replaceOnce(src,
    "transition: 'background-size .4s var(--ml-ease)' }}>{E}</span>",
    "transition: 'background-size .4s var(--ml-ease)' }}>{E.split('@')[0]}<wbr />{E.slice(E.split('@')[0].length)}</span>",
    "contact: break only before @");
  return src;
}

// 3. Accessibility: a real main landmark around the application.
function patchMount(src) {
  src = replaceOnce(src, "return (<div style={{ background: '#020918', minHeight: '100vh' }}>",
    "return (<main id=\"main\" style={{ background: '#020918', minHeight: '100vh' }}>", "mount: main landmark open");
  src = replaceOnce(src, "    </div>\n  </div>);\n}\nReactDOM.createRoot", "    </div>\n  </main>);\n}\nReactDOM.createRoot", "mount: main landmark close");
  return src;
}

// 3. Document metadata (the candidate is a real document: nothing replaces it
// at runtime, so this metadata persists for crawlers and after load).
const SITE_DESCRIPTION = "An independent technology lab building useful automation, secure systems, and human-centered AI experiences.";
const TITLE = "Maisog Labs — Ideas in Orbit";
const CANONICAL = "https://maisoglabs.com/";
const HEAD_META = [
  `<meta name="description" content="${SITE_DESCRIPTION}">`,
  `<link rel="canonical" href="${CANONICAL}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:site_name" content="Maisog Labs">`,
  `<meta property="og:title" content="${TITLE}">`,
  `<meta property="og:description" content="${SITE_DESCRIPTION}">`,
  `<meta property="og:url" content="${CANONICAL}">`,
  `<meta property="og:locale" content="en_PH">`,
  `<meta name="twitter:card" content="summary">`,
  `<meta name="twitter:title" content="${TITLE}">`,
  `<meta name="twitter:description" content="${SITE_DESCRIPTION}">`,
].join("\n");

// ---- build ------------------------------------------------------------------

function jsx(code, label) {
  return transformSync(code, { loader: "jsx", jsxFactory: "React.createElement", jsxFragment: "React.Fragment", target: "es2019", minify: true, legalComments: "none", sourcefile: label }).code;
}

function main() {
  const artifact = fs.readFileSync(SOURCE);
  if (sha256(artifact) !== SOURCE_SHA256) throw new Error(`${SOURCE} is not the canonical D-093 artifact`);
  const html = artifact.toString("utf8");
  const manifest = JSON.parse(html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]);
  let template = JSON.parse(html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
  const decode = uuid => {
    const entry = manifest[uuid];
    const raw = Buffer.from(entry.data, "base64");
    return entry.compressed ? zlib.gunzipSync(raw) : raw;
  };

  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const emitted = [];
  const emit = (name, ext, bytes) => {
    const file = `${name}.${sha256(bytes).slice(0, 12)}.${ext}`;
    fs.writeFileSync(path.join(ASSET_DIR, file), bytes);
    emitted.push({ file, bytes: bytes.length });
    return ASSET_URL + file;
  };

  // Fonts and icon: fingerprinted, byte-identical to the bundle's resources.
  const EXT = { "font/woff2": "woff2", "image/svg+xml": "svg" };
  for (const [uuid, entry] of Object.entries(manifest)) {
    if (!EXT[entry.mime]) continue;
    const url = emit(entry.mime === "font/woff2" ? "font" : "icon", EXT[entry.mime], decode(uuid));
    template = template.split(uuid).join(url);
  }

  // Scripts, in the original execution order.
  const scripts = [];
  scripts.push(emit("react.production", "js", fs.readFileSync(path.join(CANDIDATE, "vendor/react.production.min.js"))));
  scripts.push(emit("react-dom.production", "js", fs.readFileSync(path.join(CANDIDATE, "vendor/react-dom.production.min.js"))));
  const ds = patchNoteCard(decode(R.designSystem).toString("utf8"));
  scripts.push(emit("design-system", "js", Buffer.from(transformSync(ds, { loader: "js", target: "es2019", minify: true, legalComments: "none" }).code)));
  scripts.push(emit("data", "js", decode(R.data)));
  const PATCH = { entry: patchEntry, research: patchResearch, contact: patchContact };
  for (const key of JSX_ORDER) {
    const source = decode(R[key]).toString("utf8");
    scripts.push(emit(key, "js", Buffer.from(jsx(PATCH[key] ? PATCH[key](source) : source, `${key}.jsx`))));
  }
  const mountSource = template.match(/<script type="text\/babel">([\s\S]*?)<\/script>/)[1];
  scripts.push(emit("app", "js", Buffer.from(jsx(patchMount(mountSource), "app.jsx"))));

  // Template: script-free head with metadata; scripts at the end of body.
  for (const key of ["reactDev", "reactDomDev", "babel", "designSystem", "data"]) {
    template = template.replace(new RegExp(`<script src="${R[key]}"[^>]*></script>\\n?`), "");
  }
  for (const key of JSX_ORDER) template = replaceOnce(template, `<script type="text/babel" src="${R[key]}"></script>\n`, "", `template: drop ${key} tag`);
  template = template.replace(/<script type="text\/babel">[\s\S]*?<\/script>\s*/, "");
  if (/<script/i.test(template)) throw new Error("template: unexpected remaining script");
  template = replaceOnce(template, "<html>", '<html lang="en-PH">', "template: lang");
  template = replaceOnce(template, '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' + HEAD_META, "template: metadata");
  const tags = scripts.map(src => `<script src="${src}"></script>`).join("\n");
  template = replaceOnce(template, '<div id="root"></div>', `<div id="root"></div>\n${tags}`, "template: body scripts");
  const head = template.slice(0, template.indexOf("</head>"));
  if (/<script/i.test(head)) throw new Error("RFC-022 seam: the candidate <head> must stay script-free");

  const index = Buffer.from(template, "utf8");
  fs.writeFileSync(path.join(SITE, "index.html"), index);

  // 4. Static SEO basics (for promotion to public/; nothing is served from here).
  fs.writeFileSync(path.join(SITE, "robots.txt"), "User-agent: *\nDisallow: /admin\n\nSitemap: https://maisoglabs.com/sitemap.xml\n");
  fs.writeFileSync(path.join(SITE, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      "  <url><loc>https://maisoglabs.com/</loc></url>\n  <url><loc>https://maisoglabs.com/journal</loc></url>\n</urlset>\n");
  // 6. Long-lived caching for the fingerprinted assets only (Workers static
  // assets _headers format); index.html keeps the platform default.
  fs.writeFileSync(path.join(SITE, "_headers"), "/v101/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n");

  const report = {
    sourceArtifactSha256: SOURCE_SHA256,
    candidateIndexSha256: sha256(index),
    candidateIndexBytes: index.length,
    insertionOffset: Buffer.byteLength(template.slice(0, template.indexOf("</head>")), "utf8"),
    assets: emitted,
    totalAssetBytes: emitted.reduce((n, a) => n + a.bytes, 0),
  };
  fs.writeFileSync(path.join(CANDIDATE, "build-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ candidateIndexSha256: report.candidateIndexSha256, candidateIndexBytes: report.candidateIndexBytes, insertionOffset: report.insertionOffset, assets: emitted.length, totalAssetBytes: report.totalAssetBytes }, null, 2));
}

main();
