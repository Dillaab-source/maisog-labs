// Maisog Labs brand asset generator.
// Run: node tools/build.js   (writes every SVG into ../svg)
// All assets share the geometry defined here so the system stays consistent.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'svg');

const C = {
  navy: '#0A1433',
  navy2: '#050B1F',
  blue: '#2563EB',
  blueBright: '#3B82F6',
  white: '#F8FAFF',
  steel: '#93B4FF',
};

// ---------- core geometry (240 x 240 canvas, content centred on 120,120) ----------

// Signature glyph, traced from the animated logo (video/logo-mark.mp4):
// stem up to the tip, down-left to the point, crossbar with heartbeat pulse, curled right tip, sweep back to base.
const GLYPH =
  'M86.85 199.6 L147.6 25.1 L43.6 132 L76 127.3 L80 123.5 L84 131 L89 118.5 L93.5 129 L97 123 L123.25 118.5 L180 114.5 C192 114 190.5 120.5 184 124 Q137.55 150 86.85 199.6 Z';

// Orbit ellipse around the glyph.
const ORBIT = { cx: 116, cy: 118, rx: 101, ry: 24, rot: -11 };

function ellipsePoint(o, deg) {
  const t = (deg * Math.PI) / 180;
  const r = (o.rot * Math.PI) / 180;
  const x = o.rx * Math.cos(t);
  const y = o.ry * Math.sin(t);
  return [
    +(o.cx + x * Math.cos(r) - y * Math.sin(r)).toFixed(2),
    +(o.cy + x * Math.sin(r) + y * Math.cos(r)).toFixed(2),
  ];
}

function orbitArcs(o) {
  const [x0, y0] = ellipsePoint(o, 0);
  const [x1, y1] = ellipsePoint(o, 180);
  return {
    front: `M${x0} ${y0} A${o.rx} ${o.ry} ${o.rot} 0 1 ${x1} ${y1}`,
    back: `M${x1} ${y1} A${o.rx} ${o.ry} ${o.rot} 0 1 ${x0} ${y0}`,
  };
}

const NODE = ellipsePoint(ORBIT, -32);

// ---------- helpers ----------

const svg = (body, { vb = '0 0 240 240', title = '', w, h } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''} role="img"${title ? ` aria-label="${title}"` : ''}>\n${title ? `<title>${title}</title>\n` : ''}${body}\n</svg>\n`;

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('svg/' + rel);
}

// Shared defs. `id` prefixes keep ids unique when several SVGs are inlined on one page.
function defs(id) {
  return `<defs>
  <linearGradient id="${id}-stroke" x1="1" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset=".55" stop-color="#E4ECFF"/>
    <stop offset="1" stop-color="${C.steel}"/>
  </linearGradient>
  <linearGradient id="${id}-orbit" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.steel}" stop-opacity=".25"/>
    <stop offset=".6" stop-color="${C.steel}" stop-opacity=".9"/>
    <stop offset="1" stop-color="#FFFFFF"/>
  </linearGradient>
  <radialGradient id="${id}-node" cx=".35" cy=".35" r=".7">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset=".45" stop-color="#BFD2FF"/>
    <stop offset="1" stop-color="${C.blue}"/>
  </radialGradient>
  <radialGradient id="${id}-halo" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="${C.blue}" stop-opacity=".55"/>
    <stop offset=".6" stop-color="${C.blue}" stop-opacity=".12"/>
    <stop offset="1" stop-color="${C.blue}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="${id}-disc" cx=".5" cy=".4" r=".65">
    <stop offset="0" stop-color="#13265E"/>
    <stop offset=".7" stop-color="${C.navy}"/>
    <stop offset="1" stop-color="${C.navy2}"/>
  </radialGradient>
  <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/></feMerge>
  </filter>
  <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3"/>
  </filter>
</defs>`;
}

// The full mark: glow underlay, orbit back, glyph, orbit front, planetary node.
function mark(id, { glow = 1, strokeW = 5.5, orbit = true, node = true, color } = {}) {
  const a = orbitArcs(ORBIT);
  const stroke = color || `url(#${id}-stroke)`;
  const orbitStroke = color || `url(#${id}-orbit)`;
  const nodeFill = color || `url(#${id}-node)`;
  const parts = [];
  if (glow && !color) {
    parts.push(
      `<g filter="url(#${id}-glow)" opacity="${0.75 * glow}"><path d="${GLYPH}" fill="none" stroke="${C.blue}" stroke-width="${strokeW + 6}" stroke-linejoin="round" stroke-linecap="round"/></g>`
    );
  }
  if (orbit) parts.push(`<path d="${a.back}" fill="none" stroke="${orbitStroke}" stroke-width="2.5" stroke-linecap="round" opacity="${color ? 0.35 : 0.3}"/>`);
  parts.push(`<path d="${GLYPH}" fill="none" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" stroke-linecap="round"/>`);
  if (orbit) parts.push(`<path d="${a.front}" fill="none" stroke="${orbitStroke}" stroke-width="3" stroke-linecap="round"/>`);
  if (node) {
    if (glow && !color) parts.push(`<circle cx="${NODE[0]}" cy="${NODE[1]}" r="14" fill="${C.blue}" opacity=".7" filter="url(#${id}-soft)"/>`);
    parts.push(`<circle cx="${NODE[0]}" cy="${NODE[1]}" r="8" fill="${nodeFill}"/>`);
  }
  return parts.join('\n');
}

// Scale a group about the canvas centre.
const scaled = (s, inner, cx = 120, cy = 120) =>
  `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-120 -120)">${inner}</g>`;

// ---------- logo variations ----------

write('logo/mark.svg', svg(`${defs('mk')}\n${mark('mk')}`, { title: 'Maisog Labs mark' }));

write('logo/mark-flat.svg', svg(`${defs('mf')}\n${mark('mf', { glow: 0 })}`, { title: 'Maisog Labs mark (no glow)' }));

// Used only to illustrate the "don't remove core elements" rule.
write('logo/glyph-only.svg', svg(`${defs('go')}\n${mark('go', { orbit: false, node: false })}`, { title: 'Incorrect: glyph without orbit' }));

write('logo/mark-white.svg', svg(mark('mw', { color: C.white }), { title: 'Maisog Labs mark, white' }));
write('logo/mark-navy.svg', svg(mark('mn', { color: C.navy }), { title: 'Maisog Labs mark, navy' }));
write('logo/mark-blue.svg', svg(mark('mb', { color: C.blue }), { title: 'Maisog Labs mark, blue' }));
write('logo/mark-currentcolor.svg', svg(mark('mc', { color: 'currentColor' }), { title: 'Maisog Labs mark' }));

// Target rings + cross flares, as in the animated logo.
function rings(opacity = 1) {
  return `<g fill="none" stroke="${C.blue}" opacity="${opacity}">
<circle cx="120" cy="120" r="104" stroke-width="1" opacity=".55"/>
<circle cx="120" cy="120" r="86" stroke-width="1" opacity=".4"/>
<path d="M120 4 V236 M4 120 H236" stroke-width=".6" opacity=".25"/>
</g>`;
}

write(
  'logo/seal.svg',
  svg(
    `${defs('se')}
<circle cx="120" cy="120" r="116" fill="url(#se-disc)"/>
<circle cx="120" cy="120" r="114" fill="none" stroke="${C.steel}" stroke-width="2.5" opacity=".9"/>
<circle cx="120" cy="120" r="105" fill="none" stroke="${C.steel}" stroke-width="1" opacity=".45"/>
${scaled(0.78, mark('se'))}`,
    { title: 'Maisog Labs seal' }
  )
);

write(
  'logo/app-avatar.svg',
  svg(
    `${defs('av')}
<linearGradient id="av-bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${C.blueBright}"/>
  <stop offset=".55" stop-color="${C.blue}"/>
  <stop offset="1" stop-color="#132A7A"/>
</linearGradient>
<linearGradient id="av-shine" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".28"/>
  <stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/>
</linearGradient>
<rect x="4" y="4" width="232" height="232" rx="54" fill="url(#av-bg)"/>
<rect x="4" y="4" width="232" height="232" rx="54" fill="url(#av-shine)"/>
<rect x="5" y="5" width="230" height="230" rx="53" fill="none" stroke="#FFFFFF" stroke-opacity=".25" stroke-width="2"/>
${scaled(0.8, mark('av', { glow: 0.5 }))}`,
    { title: 'Maisog Labs app avatar' }
  )
);

write(
  'logo/outline.svg',
  svg(
    `<circle cx="120" cy="120" r="112" fill="none" stroke="currentColor" stroke-width="3.5"/>
${scaled(0.78, mark('ol', { color: 'currentColor' }))}`,
    { title: 'Maisog Labs outline icon' }
  )
);

write(
  'logo/outline-white.svg',
  svg(
    `<circle cx="120" cy="120" r="112" fill="none" stroke="${C.white}" stroke-width="3.5"/>
${scaled(0.78, mark('ow', { color: C.white }))}`,
    { title: 'Maisog Labs outline icon, white' }
  )
);

write(
  'logo/outline-navy.svg',
  svg(
    `<circle cx="120" cy="120" r="112" fill="none" stroke="${C.navy}" stroke-width="3.5"/>
${scaled(0.78, mark('on', { color: C.navy }))}`,
    { title: 'Maisog Labs outline icon, navy' }
  )
);

write(
  'logo/hero.svg',
  svg(
    `${defs('he')}
<circle cx="120" cy="120" r="118" fill="url(#he-halo)"/>
${rings()}
${scaled(0.9, mark('he', { glow: 1.4 }))}`,
    { title: 'Maisog Labs glowing hero mark' }
  )
);

// Favicon: heavier stroke, no orbit ring (too thin at 16px), keeps the node.
const favGlyph = `<path d="${GLYPH}" fill="none" stroke="${C.white}" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>`;
const favNode = (fill) => `<circle cx="${NODE[0] - 6}" cy="${NODE[1] - 4}" r="15"${fill ? ` fill="${fill}"` : ''}/>`;
write(
  'favicon/favicon.svg',
  svg(
    `<rect width="240" height="240" rx="52" fill="${C.navy}"/>
${scaled(0.82, `${favGlyph}${favNode(C.blueBright)}`)}`,
    { title: 'Maisog Labs' }
  )
);
write(
  'favicon/favicon-transparent.svg',
  svg(
    `<style>path{stroke:${C.navy}}circle{fill:${C.blue}}@media (prefers-color-scheme:dark){path{stroke:${C.white}}circle{fill:${C.steel}}}</style>
${scaled(0.95, `${favGlyph.replace(` stroke="${C.white}"`, '')}${favNode()}`)}`,
    { title: 'Maisog Labs' }
  )
);
// Maskable (Android): full-bleed background, glyph inside the 80% safe zone.
write(
  'favicon/maskable.svg',
  svg(
    `${defs('ms')}
<rect width="240" height="240" fill="${C.navy}"/>
<circle cx="120" cy="120" r="96" fill="url(#ms-halo)"/>
${scaled(0.62, mark('ms'))}`,
    { title: 'Maisog Labs' }
  )
);

// ---------- wordmark & lockups (text uses Montserrat; see README) ----------

const FONT = `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600&amp;display=swap');.wm{font-family:Montserrat,'Segoe UI',Arial,sans-serif;font-weight:500;letter-spacing:.28em}.tg{font-family:Montserrat,'Segoe UI',Arial,sans-serif;font-weight:500;letter-spacing:.9em}</style>`;

function wordmarkText(x, y, size, white, blue) {
  return `<text class="wm" x="${x}" y="${y}" font-size="${size}" fill="${white}">MAISOG<tspan fill="${blue}">LABS</tspan></text>`;
}

write('wordmark/wordmark-dark-bg.svg', svg(`${FONT}${wordmarkText(0, 62, 72, C.white, C.blueBright)}`, { vb: '0 0 820 80', title: 'Maisog Labs' }));
write('wordmark/wordmark-light-bg.svg', svg(`${FONT}${wordmarkText(0, 62, 72, C.navy, C.blue)}`, { vb: '0 0 820 80', title: 'Maisog Labs' }));

function lockup(id, dark) {
  const text = dark ? C.white : C.navy;
  const blue = dark ? C.blueBright : C.blue;
  const sub = dark ? C.steel : '#3B4A75';
  const m = dark ? mark(id) : mark(id, { color: C.navy, glow: 0 });
  return svg(
    `${FONT}${dark ? defs(id) : ''}
<g transform="scale(0.9)">${m}</g>
${wordmarkText(240, 118, 74, text, blue)}
<text class="tg" x="242" y="168" font-size="26" fill="${sub}">IDEAS IN ORBIT</text>`,
    { vb: '0 0 1060 216', title: 'Maisog Labs — Ideas in Orbit' }
  );
}
write('wordmark/lockup-horizontal-dark-bg.svg', lockup('lh', true));
write('wordmark/lockup-horizontal-light-bg.svg', lockup('ll', false));

function stacked(id, dark) {
  const text = dark ? C.white : C.navy;
  const blue = dark ? C.blueBright : C.blue;
  const sub = dark ? C.steel : '#3B4A75';
  const m = dark ? mark(id) : mark(id, { color: C.navy, glow: 0 });
  return svg(
    `${FONT}${dark ? defs(id) : ''}
<g transform="translate(290 0)">${m}</g>
<text class="wm" x="410" y="316" text-anchor="middle" font-size="68" fill="${text}">MAISOG<tspan fill="${blue}">LABS</tspan></text>
<text class="tg" x="410" y="370" text-anchor="middle" font-size="24" fill="${sub}">IDEAS IN ORBIT</text>`,
    { vb: '0 0 820 400', title: 'Maisog Labs — Ideas in Orbit' }
  );
}
write('wordmark/lockup-stacked-dark-bg.svg', stacked('sd', true));
write('wordmark/lockup-stacked-light-bg.svg', stacked('sl', false));

// ---------- sample icon set ----------

function gearPath(cx, cy, rOuter, rInner, teeth) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const w = step * 0.22;
    [
      [a - step / 2 + w, rInner],
      [a - w * 1.1, rInner],
      [a - w * 0.7, rOuter],
      [a + w * 0.7, rOuter],
      [a + w * 1.1, rInner],
      [a + step / 2 - w, rInner],
    ].forEach(([t, r]) => pts.push(`${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`));
  }
  return `M${pts.join(' L')} Z`;
}

function starPath(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r : R;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function cube(cx, cy, s, fill) {
  const k = 0.866 * s;
  const p = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  return `<path d="M${p(cx, cy - s)} L${p(cx + k, cy - s / 2)} L${p(cx + k, cy + s / 2)} L${p(cx, cy + s)} L${p(cx - k, cy + s / 2)} L${p(cx - k, cy - s / 2)} Z" fill="${fill}"/>
<path d="M${p(cx - k, cy - s / 2)} L${p(cx, cy)} L${p(cx + k, cy - s / 2)} M${p(cx, cy)} L${p(cx, cy + s)}"/>
<path d="M${p(cx, cy - s)} L${p(cx + k, cy - s / 2)} L${p(cx + k, cy + s / 2)} L${p(cx, cy + s)} L${p(cx - k, cy + s / 2)} L${p(cx - k, cy - s / 2)} Z" fill="none"/>`;
}

const ACCENT = C.blueBright;

const GLYPHS = {
  ai: `<path d="M120 78 C110 66 86 68 84 86 C70 88 64 106 73 116 C63 127 70 146 85 147 C88 162 108 166 120 154 Z" fill="${ACCENT}" fill-opacity=".18"/>
<path d="M120 78 C110 66 86 68 84 86 C70 88 64 106 73 116 C63 127 70 146 85 147 C88 162 108 166 120 154"/>
<path d="M120 78 C130 66 154 68 156 86 C170 88 176 106 167 116 C177 127 170 146 155 147 C152 162 132 166 120 154"/>
<path d="M120 78 V154 M96 94 C104 97 106 105 101 112 M82 124 C92 119 103 125 103 135 M144 94 C136 97 134 105 139 112 M158 124 C148 119 137 125 137 135"/>`,
  automation: `<path d="${gearPath(106, 130, 34, 26, 9)}" fill="${ACCENT}" fill-opacity=".18"/>
<circle cx="106" cy="130" r="10"/>
<path d="${gearPath(150, 96, 22, 16, 7)}"/>
<circle cx="150" cy="96" r="6"/>`,
  security: `<path d="M120 70 L162 86 V116 C162 142 145 160 120 170 C95 160 78 142 78 116 V86 Z"/>
<path d="M120 84 L150 96 V117 C150 136 138 149 120 157 Z" fill="${ACCENT}" stroke="none" opacity=".85"/>
<path d="M120 84 L90 96 V117 C90 136 102 149 120 157" stroke-width="3" opacity=".5"/>`,
  research: `<path d="M120 98 C106 87 88 85 72 89 V153 C88 149 106 151 120 162 C134 151 152 149 168 153 V89 C152 85 134 87 120 98 Z"/>
<path d="M120 98 V162"/>
<path d="M84 104 C94 103 104 105 110 109 M84 118 C94 117 104 119 110 123 M130 109 C136 105 146 103 156 104 M130 123 C136 119 146 117 156 118" stroke-width="3" opacity=".7"/>`,
  systems: `${cube(99, 140, 22, C.navy)}${cube(141, 140, 22, C.navy)}${cube(120, 104, 22, C.navy)}
<path d="M120 104 L139 94.5 L120 82 L101 94.5 Z" fill="${ACCENT}" fill-opacity=".35" stroke="none"/>`,
  orbit: `<ellipse cx="120" cy="122" rx="54" ry="15" transform="rotate(-20 120 122)" stroke-width="4" opacity=".55"/>
<circle cx="120" cy="120" r="27" fill="${C.navy}"/>
<circle cx="120" cy="120" r="27" fill="${ACCENT}" fill-opacity=".3"/>
<path d="M69.3 140.4 A54 15 -20 0 0 170.7 103.6" stroke-width="4"/>
<path d="M100 108 C110 104 128 104 138 110" stroke-width="3" opacity=".6"/>`,
  labs: `<path d="M106 76 H134 M112 76 V108 L86 152 C82 160 86 167 95 167 H145 C154 167 158 160 154 152 L128 108 V76"/>
<path d="M96.6 134 H143.4 L152 149 C156 158 152 162 145 162 H95 C88 162 84 158 88 149 Z" fill="${ACCENT}" stroke="none" opacity=".85"/>
<circle cx="112" cy="122" r="3" fill="${C.white}" stroke="none"/><circle cx="124" cy="114" r="2.5" fill="${C.white}" stroke="none"/>`,
  strategy: `<rect x="82" y="140" width="12" height="26" rx="2" fill="${ACCENT}" fill-opacity=".35"/>
<rect x="102" y="126" width="12" height="40" rx="2" fill="${ACCENT}" fill-opacity=".5"/>
<rect x="122" y="112" width="12" height="54" rx="2" fill="${ACCENT}" fill-opacity=".7"/>
<rect x="142" y="96" width="12" height="70" rx="2" fill="${ACCENT}"/>
<path d="M78 124 L104 104 L122 110 L150 80" stroke-width="3.5"/>
<path d="${starPath(160, 70, 12, 5)}" fill="${C.white}" stroke="none"/>`,
};

const TEMPLATE_GLYPH = '<rect x="70" y="70" width="100" height="100" fill="none" stroke="#93B4FF" stroke-dasharray="4 4" opacity=".4"/>';

// Icon container: disc, ring, orbit sweep with node, glowing line-art glyph.
function iconSvg(key, label) {
  const id = 'ic' + key;
  const o = { cx: 120, cy: 128, rx: 104, ry: 26, rot: -18 };
  const a = orbitArcs(o);
  const n = ellipsePoint(o, -30);
  const glyph = key
    ? `<g fill="none" stroke="${C.blue}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}-glow)" opacity=".45">${GLYPHS[key].replace(/fill="[^"]*"/g, 'fill="none"')}</g>
<g fill="none" stroke="${C.white}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[key]}</g>`
    : `<!-- Draw your glyph here: white 5px round strokes, inside the 70–170 box -->\n${TEMPLATE_GLYPH}`;
  return svg(
    `${defs(id)}
<circle cx="120" cy="120" r="80" fill="url(#${id}-disc)"/>
<path d="${a.back}" fill="none" stroke="url(#${id}-orbit)" stroke-width="2" opacity=".35"/>
<circle cx="120" cy="120" r="80" fill="none" stroke="${C.steel}" stroke-width="2" opacity=".75"/>
${glyph}
<path d="${a.front}" fill="none" stroke="url(#${id}-orbit)" stroke-width="3" stroke-linecap="round"/>
<circle cx="${n[0]}" cy="${n[1]}" r="12" fill="${C.blue}" opacity=".7" filter="url(#${id}-soft)"/>
<circle cx="${n[0]}" cy="${n[1]}" r="7" fill="url(#${id}-node)"/>`,
    { title: `${label} icon` }
  );
}

const ICONS = [
  ['01', 'ai', 'AI'],
  ['02', 'automation', 'Automation'],
  ['03', 'security', 'Security'],
  ['04', 'research', 'Research'],
  ['05', 'systems', 'Systems'],
  ['06', 'orbit', 'Orbit'],
  ['07', 'labs', 'Labs'],
  ['08', 'strategy', 'Strategy'],
];
ICONS.forEach(([n, key, label]) => write(`icons/${n}-${key}.svg`, iconSvg(key, label)));
write('icons/_template.svg', iconSvg('', 'Template')); // blank container for new icons

// ---------- principle (UI) icons: single colour, 24px grid ----------

const UI = {
  clarity: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"/>',
  consistency: '<path d="M12 3 21 8l-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  recognizability: '<path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z"/>',
  scalability: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6"/>',
  symbolism: '<path d="M12 12c-2-3-4-4.5-6-4.5a4.5 4.5 0 0 0 0 9c2 0 4-1.5 6-4.5Zm0 0c2 3 4 4.5 6 4.5a4.5 4.5 0 0 0 0-9c-2 0-4 1.5-6 4.5Z"/>',
};
const uiSvg = (d, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>\n`;
Object.entries(UI).forEach(([k, d]) => {
  write(`ui/${k}.svg`, uiSvg(d, 'currentColor')); // inline in HTML to inherit text colour
  write(`ui/${k}-steel.svg`, uiSvg(d, C.steel)); // for <img> use
});

// ---------- hero background (vector, any resolution) ----------

function rand(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const r = rand(42);
let stars = '';
for (let i = 0; i < 260; i++) {
  const x = (r() * 1920).toFixed(1);
  const y = (r() * 820).toFixed(1);
  const rad = (r() * r() * 1.8 + 0.3).toFixed(2);
  const op = (0.25 + r() * 0.75).toFixed(2);
  stars += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#FFFFFF" opacity="${op}"/>`;
}
write(
  'backgrounds/hero-space.svg',
  svg(
    `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.navy2}"/><stop offset=".7" stop-color="${C.navy}"/><stop offset="1" stop-color="#0E1D4A"/>
  </linearGradient>
  <radialGradient id="neb" cx=".5" cy=".35" r=".55">
    <stop offset="0" stop-color="${C.blue}" stop-opacity=".35"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="planet" cx=".5" cy="0" r="1">
    <stop offset="0" stop-color="#1B3A8F"/><stop offset=".25" stop-color="#0D1C4D"/><stop offset="1" stop-color="${C.navy2}"/>
  </radialGradient>
  <filter id="rim" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<rect width="1920" height="1080" fill="url(#bg)"/>
<rect width="1920" height="1080" fill="url(#neb)"/>
${stars}
<ellipse cx="960" cy="1880" rx="1500" ry="1000" fill="url(#planet)"/>
<ellipse cx="960" cy="1880" rx="1500" ry="1000" fill="none" stroke="${C.blueBright}" stroke-width="14" opacity=".55" filter="url(#rim)"/>
<ellipse cx="960" cy="1880" rx="1500" ry="1000" fill="none" stroke="#CFE0FF" stroke-width="2"/>`,
    { vb: '0 0 1920 1080', title: 'Space hero background' }
  ).replace('role="img"', 'preserveAspectRatio="xMidYMid slice" role="img"')
);

console.log('done');
