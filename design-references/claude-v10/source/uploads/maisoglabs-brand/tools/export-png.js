// Renders every SVG in ../svg to high-resolution PNGs in ../png using headless Chrome/Edge,
// and captures poster stills from the animated logos in ../video.
// Run: node tools/export-png.js      (run build.js first)
// SVGs are inlined into a page that loads Montserrat, so wordmark text renders in the brand font.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SVG = path.join(ROOT, 'svg');
const PNG = path.join(ROOT, 'png');
const VIDEO = path.join(ROOT, 'video');

const BROWSER = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
if (!BROWSER) throw new Error('Chrome or Edge not found');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ml-png-'));
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/');

// Each job: { html, out, w, h }
const jobs = [];
const square = (sizes) => sizes.map((s) => [s, s]);

function svgPage(svgText, w, h) {
  const inner = svgText.replace(/<svg /, `<svg width="${w}" height="${h}" `);
  return `<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">
<style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body>${inner}</body></html>`;
}

function addSvg(rel, outBase, sizes, suffix = true) {
  const text = fs.readFileSync(path.join(SVG, rel), 'utf8');
  for (const [w, h] of sizes) {
    jobs.push({ html: svgPage(text, w, h), out: path.join(PNG, suffix ? `${outBase}-${w}.png` : `${outBase}.png`), w, h });
  }
}

for (const f of fs.readdirSync(path.join(SVG, 'logo'))) {
  if (['mark-currentcolor.svg', 'outline.svg', 'glyph-only.svg'].includes(f)) continue;
  addSvg(`logo/${f}`, `logo/${f.replace('.svg', '')}`, square([512, 1024, 2048]));
}
for (const f of fs.readdirSync(path.join(SVG, 'icons'))) {
  addSvg(`icons/${f}`, `icons/${f.replace('.svg', '')}`, square([256, 512, 1024]));
}
for (const f of fs.readdirSync(path.join(SVG, 'ui')).filter((f) => f.endsWith('-steel.svg'))) {
  addSvg(`ui/${f}`, `ui/${f.replace('.svg', '')}`, square([64, 128]));
}
const aspect = {
  'wordmark-dark-bg': 820 / 80,
  'wordmark-light-bg': 820 / 80,
  'lockup-horizontal-dark-bg': 1060 / 216,
  'lockup-horizontal-light-bg': 1060 / 216,
  'lockup-stacked-dark-bg': 820 / 400,
  'lockup-stacked-light-bg': 820 / 400,
};
for (const [name, a] of Object.entries(aspect)) {
  addSvg(`wordmark/${name}.svg`, `wordmark/${name}`, [1200, 2400].map((w) => [w, Math.round(w / a)]));
}
addSvg('backgrounds/hero-space.svg', 'backgrounds/hero-space', [[1920, 1080], [3840, 2160]]);

// Favicon set (exact file names browsers/platforms expect)
[
  ['favicon/favicon.svg', 'favicon/favicon-16', 16],
  ['favicon/favicon.svg', 'favicon/favicon-32', 32],
  ['favicon/favicon.svg', 'favicon/favicon-48', 48],
  ['favicon/favicon.svg', 'favicon/apple-touch-icon', 180],
  ['favicon/favicon.svg', 'favicon/icon-192', 192],
  ['favicon/favicon.svg', 'favicon/icon-512', 512],
  ['favicon/maskable.svg', 'favicon/icon-maskable-512', 512],
].forEach(([rel, out, s]) => addSvg(rel, out, [[s, s]], false));

// Poster stills from the animated logos (used as <video poster> and for reduced-motion visitors).
// [video, output, time (s), frame w, frame h, crop top, crop height]
const POSTERS = [
  ['logo-mark.mp4', 'video/logo-mark-poster.png', 0.04, 960, 960, 0, 960],
  ['logo-lockup.mp4', 'video/logo-lockup-poster.png', 4.9, 1108, 828, 0, 828],
  ['logo-lockup.mp4', 'video/logo-lockup-still-wide.png', 4.9, 1108, 828, 234, 360],
];
for (const [src, out, t, w, h, top, ch] of POSTERS) {
  if (!fs.existsSync(path.join(VIDEO, src))) continue;
  jobs.push({
    html: `<!doctype html><style>html,body{margin:0;overflow:hidden;background:#000}video{display:block;width:${w}px;height:${h}px;margin-top:-${top}px}</style>
<video muted preload="auto" src="${fileUrl(path.join(VIDEO, src))}#t=${t}"></video>`,
    out: path.join(PNG, out),
    w,
    h: ch,
    video: true,
  });
}

function shot(htmlFile, out, w, h, video) {
  return new Promise((resolve, reject) => {
    execFile(
      BROWSER,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        `--user-data-dir=${path.join(TMP, 'profile-' + Math.random().toString(36).slice(2))}`,
        '--default-background-color=00000000',
        '--force-device-scale-factor=1',
        '--allow-file-access-from-files',
        `--virtual-time-budget=${video ? 15000 : 5000}`,
        `--window-size=${w},${h}`,
        `--screenshot=${out}`,
        fileUrl(htmlFile),
      ],
      { timeout: 90000 },
      (err) => (err && !fs.existsSync(out) ? reject(err) : resolve())
    );
  });
}

// Minimal .ico writer: embeds PNG frames directly (supported by all modern browsers & Windows Vista+).
function writeIco(pngFiles, out) {
  const imgs = pngFiles.map((f) => fs.readFileSync(f));
  const header = Buffer.alloc(6 + 16 * imgs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(imgs.length, 4);
  let offset = header.length;
  imgs.forEach((img, i) => {
    const size = img.readUInt32BE(16); // PNG IHDR width
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(img.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += img.length;
  });
  fs.writeFileSync(out, Buffer.concat([header, ...imgs]));
}

(async () => {
  const tasks = jobs.map((j, i) => () => {
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    const html = path.join(TMP, `${i}.html`);
    fs.writeFileSync(html, j.html);
    return shot(html, j.out, j.w, j.h, j.video).then(() => console.log(path.relative(ROOT, j.out)));
  });
  const CONCURRENCY = 6;
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (i < tasks.length) await tasks[i++](); }));

  writeIco(['favicon-16', 'favicon-32', 'favicon-48'].map((n) => path.join(PNG, 'favicon', n + '.png')), path.join(PNG, 'favicon', 'favicon.ico'));
  console.log('png/favicon/favicon.ico');
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`done: ${tasks.length} PNGs`);
})();
