#!/usr/bin/env python3
"""Assemble components/v10/V10Home.js from the converted V10 template and logic.

Every change against the V10 source is an exact, asserted replacement so the
port stays reviewable against the reference. Scratch tooling, not committed.
"""
import json
import re
import sys

port, out = sys.argv[1], sys.argv[2]
body = open(f"{port}/body.jsx", encoding="utf-8").read()
logic = open(f"{port}/logic.js", encoding="utf-8").read()
names = json.load(open(f"{port}/names.json"))


def sub(text, old, new, count=1):
    n = text.count(old)
    assert n == count, (old[:80], n)
    return text.replace(old, new)


def sub_re(text, pattern, new, count=1):
    result, n = re.subn(pattern, new, text, flags=re.S)
    assert n == count, (pattern[:80], n)
    return result


# ---------------------------------------------------------------- template
body = body.replace("url(assets/", "url(/v10/assets/").replace('"assets/', '"/v10/assets/')
assert "assets/" not in body.replace("/v10/assets/", "")

# Root element: mount marker for the entry reveal (see componentDidMount).
body = sub(body, '<div style={css("background:#020918;min-height:100vh")}>',
           '<div ref={rootRef} className="v10-root" style={css("background:#020918;min-height:100vh")}>')

# D-092 / D-088 D1: accessible compact navigation below 700px.
nav_open = '<div style={css("display:flex;align-items:center;gap:clamp(14px,3vw,40px);'
body = sub(body, nav_open, '<div className="v10-nav-links" style={css("display:flex;align-items:center;gap:clamp(14px,3vw,40px);')
start = body.index('<div className="v10-nav-links"')
end = body.index("</div>", body.index("{(secs || []).map", start)) + len("</div>")
menu = (
    '<div className="v10-menu" style={css("position:relative")}>'
    '<button type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-controls="v10-menu-list" '
    'style={css("all:unset;box-sizing:border-box;cursor:pointer;min-height:44px;min-width:44px;padding:0 16px;display:flex;align-items:center;'
    "border:1px solid rgba(147,180,255,.4);border-radius:4px;background:rgba(3,9,26,.9);color:#F8FAFF;font-family:'IBM Plex Mono',monospace;"
    'font-size:11px;letter-spacing:.2em;text-transform:uppercase")}>Menu</button>'
    '{menuOpen && (<ul id="v10-menu-list" aria-label="Sections" style={css("position:absolute;right:0;top:calc(100% + 8px);min-width:220px;margin:0;padding:6px;'
    'list-style:none;border:1px solid rgba(147,180,255,.28);border-radius:6px;background:rgba(3,9,26,.96);box-shadow:0 20px 50px rgba(0,0,0,.45)")}>'
    "{secs.map(s => (<li key={s.id}><a href={`#${s.id}`} aria-current={s.current} onClick={closeMenu} "
    "style={css(`display:flex;align-items:center;min-height:44px;padding:0 12px;border-radius:4px;font-family:'Montserrat',sans-serif;"
    "font-weight:500;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${s.color}`)}>{s.name}</a></li>))}"
    "</ul>)}</div>"
)
body = body[:end] + menu + body[end:]

# Entry descriptor comes from the governed content boundary (same V10 text).
body = sub(body, '{"The independent technology laboratory of Paulo Maisog, building AI automation, research systems, and experimental software."}',
           "{entryDescriptor}")

# Systems: project spokes follow the project nodes (8 projects, D-088).
body = sub_re(body, r'<line x1="50" y1="50" x2="77" y2="12\.8".*?style=\{css\(`opacity:\$\{po4 \?\? ""\};transition:opacity \.5s ease`\)\}></line>',
              '{(pnodes || []).map((u, __i) => (<line key={__i} x1="50" y1="50" x2={u.x} y2={u.y} stroke="#3B82F6" strokeDasharray="3 3" '
              'vectorEffect="non-scaling-stroke" style={css(`opacity:${u.spoke};transition:opacity .5s ease`)}></line>))}')

# Projects: counter follows the real project count; no flow figure without a sourced flow.
body = sub(body, '{" / 05"}', '{" / "}{pCount}')
body = sub(body, "<figure", "{hasFlow && (<figure")
body = sub(body, "</figure>", "</figure>)}")

# Research: real Journal entries (D-088); no placeholder imagery (AS119-F003) or category filters (no taxonomy).
body = sub_re(body, r'<div role="group" aria-label="Filter notes".*?</React\.Fragment>\)\)\}\{"\\n +"\}\s*</div>', "")
body = sub_re(body, r'<div style=\{css\("position:relative;aspect-ratio:16/9;overflow:hidden;background:#0A1433"\)\}>.*?</image-slot>\{"\\n +"\}\s*</div>\{"\\n +"\}\s*</div>', "")
body = sub(body, '<a href="#" onFocus={n.enter}', "<a href={n.href} onFocus={n.enter}")
more = body.index('{"More notes →"}')
anchor = body.rindex('<a href="#"', 0, more)
body = body[:anchor] + '<a href="/journal"' + body[anchor + len('<a href="#"'):]
grid = '<div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:20px")}>'
body = sub(body, grid, '{journalStatus && (<p role="status" style={css("margin:0 0 20px;font-size:14px;line-height:1.6;color:#9AA8CC")}>{journalStatus}</p>)}' + grid)

# D-092 / D-088 D2: ring captions collide below 700px; the class hides them there
# (names stay; the selected discipline's caption is in the detail column).
body = sub(body, '<span style={css(`font-size:12px;line-height:1.35;color:${d.capColor ?? ""};transition:color .4s ease`)}>{d.cap}',
           '<span className="v10-dcap" style={css(`font-size:12px;line-height:1.35;color:${d.capColor ?? ""};transition:color .4s ease`)}>{d.cap}')

# Contact: owner-approved address (D-088).
body = sub(body, 'href="mailto:maisog36@gmail.com"', "href={`mailto:${email}`}")
body = sub(body, '{"maisog36@gmail.com"}', "{email}")
assert "maisog36" not in body

# ---------------------------------------------------------------- logic
logic = sub(logic, "class Component extends DCLogic {", "class V10Home extends React.Component {")
logic = sub(logic, "view: 'entry', armed: null };",
            "view: 'entry', armed: null, journal: { status: 'idle', entries: [] }, menu: false };\n"
            "  rootRef = React.createRef();")
logic = sub(logic, "readHash = () => { const h = location.hash.slice(1); this.openView(this.SECS.some(s => s[0] === h) ? h : 'entry'); };",
            "// D-092 / D-088: legacy hash aliases resolve to their V10 panels.\n"
            "  ALIASES = { research: 'journal', process: 'systems', about: 'contact' };\n"
            "  readHash = () => { let h = location.hash.slice(1); if (this.ALIASES[h]) { h = this.ALIASES[h]; try { history.replaceState(null, '', location.pathname + location.search + '#' + h); } catch (e) {} } "
            "this.openView(this.SECS.some(s => s[0] === h) ? h : 'entry'); };")
logic = sub(logic, "    if (v === this.state.view) return;\n",
            "    if (v === this.state.view) return;\n    if (v === 'journal') this.loadJournal();\n")
logic = sub(logic, "onKeyEsc = (e) => { if (e.key === 'Escape' && this.state.view !== 'entry') this.go('entry'); };",
            "onKeyEsc = (e) => { if (e.key !== 'Escape') return; if (this.state.menu) { this.setState({ menu: false }); return; } if (this.state.view !== 'entry') this.go('entry'); };\n"
            "  toggleMenu = () => this.setState(s => ({ menu: !s.menu }));\n"
            "  closeMenu = () => this.setState({ menu: false });\n"
            "  // D-092 / D-088: Research shows real published Journal entries from the\n"
            "  // existing public read-only route, fetched the first time the panel opens.\n"
            "  loadJournal() {\n"
            "    if (this.state.journal.status === 'loading' || this.state.journal.status === 'ready' || this.state.journal.status === 'empty') return;\n"
            "    this.setState({ journal: { status: 'loading', entries: [] } });\n"
            "    fetch('/api/journal').then(r => { if (!r.ok) throw new Error('journal ' + r.status); return r.json(); }).then(body => {\n"
            "      const entries = Array.isArray(body && body.entries) ? body.entries.filter(e => e && typeof e.slug === 'string' && typeof e.title === 'string') : null;\n"
            "      if (!entries) throw new Error('unexpected journal payload');\n"
            "      this.setState({ journal: { status: entries.length ? 'ready' : 'empty', entries } });\n"
            "    }).catch(() => this.setState({ journal: { status: 'error', entries: [] } }));\n"
            "  }")
logic = sub(logic, "const t = 'maisog36@gmail.com';", "const t = this.props.content.email;")
# Content: disciplines and projects from the governed content boundary.
logic = sub_re(logic, r"  DISC = \[\n.*?\n  \];\n", "  DISC = this.props.content.disciplines;\n")
logic = sub_re(logic, r"  PROJ = \[\n.*?\n  \];\n", "  PROJ = this.props.content.projects;\n")
logic = sub_re(logic, r"  FLOW = \[\n.*?\n  \];\n", "  FLOW = this.PROJ.map(p => p.flow);\n")
logic = sub_re(logic, r"  NOTES = \[\n.*?\n  \];\n", "")
logic = sub(logic, "  PSLOTS = [[77,12.8],[93.7,64.2],[50,96],[6.3,64.2],[23,12.8]];",
            "  // D-092: one outer-ring slot per project (V10 placed five at 72°; eight at 45°, same radius 46).\n"
            "  PSLOTS = this.props.content.projects.map((p, j, all) => { const a = (-90 + 180 / all.length + j * 360 / all.length) * Math.PI / 180; return [Math.round((50 + 46 * Math.cos(a)) * 10) / 10, Math.round((50 + 46 * Math.sin(a)) * 10) / 10]; });")
logic = sub(logic, "    this.mt = setTimeout(() => this.measureConn(), 400);\n",
            "    this.mt = setTimeout(() => this.measureConn(), 400);\n    if (this.rootRef.current) this.rootRef.current.setAttribute('data-mounted', '');\n")
logic = sub(logic, "    PS.forEach((p, j) => { sv['po' + j] = uses.includes(j) ? 0.6 : 0; });\n", "")
logic = sub(logic, "return { name: p.name, x, y, op: u ? 1 : 0,", "return { name: p.name, x, y, spoke: u ? 0.6 : 0, op: u ? 1 : 0,")
logic = sub(logic, "const notes = this.NOTES.map((n, i) => { const hv = jh === i; return { ...n, display: jf === 'All' || n.cat === jf ? 'flex' : 'none',",
            "const journal = this.state.journal;\n"
            "    const notes = journal.entries.map((e, i) => ({ id: 'note-' + (i + 1), date: formatNoteDate(e.publishedAt), title: e.title, desc: e.summary, tags: '', href: '/journal?slug=' + encodeURIComponent(e.slug) })).map((n, i) => { const hv = jh === i; return { ...n, display: 'flex',")
logic = sub(logic, "      flow: this.FLOW[project].s.map(",
            "      hasFlow: !!this.FLOW[project], pCount: String(NP).padStart(2, '0'),\n"
            "      email: this.props.content.email, entryDescriptor: this.props.content.entryDescriptor,\n"
            "      journalStatus: JOURNAL_STATUS[journal.status] || '', menuOpen: this.state.menu, toggleMenu: this.toggleMenu, closeMenu: this.closeMenu,\n"
            "      flow: (this.FLOW[project] ? this.FLOW[project].s : []).map(")
logic = sub(logic, "hu = i === this.FLOW[project].h;", "hu = i === this.FLOW[project].h;")
logic = sub(logic, "      humanStage: this.FLOW[project].s[this.FLOW[project].h].toLowerCase(),",
            "      humanStage: this.FLOW[project] ? this.FLOW[project].s[this.FLOW[project].h].toLowerCase() : '',")
logic = sub(logic, "iconBg: 'url(assets/icons/' + d.icon + '.svg)'", "iconBg: 'url(/v10/assets/icons/' + d.icon + '.svg)'")

extra = ["email", "entryDescriptor", "pCount", "journalStatus", "menuOpen", "toggleMenu", "closeMenu", "hasFlow"]
all_names = sorted(set(names) - {"po0", "po1", "po2", "po3", "po4"} | set(extra))
render = (
    "\n  render() {\n"
    "    const rootRef = this.rootRef;\n"
    "    const { " + ", ".join(all_names) + " } = this.renderVals();\n"
    "    return (\n" + body + "\n    );\n  }\n}\n"
)
logic = logic.rstrip()
assert logic.endswith("}")
logic = logic[:-1].rstrip() + "\n" + render

header = '''"use client";

// V10 public homepage (D-092 controlled clean replacement).
//
// Faithful port of design-references/claude-v10/source/Maisog Labs Home v10.dc.html
// (SHA-256 6e47ffca9adb7e31522b046576b8d7800117dd38ee07c88167b8e7b5e3ed6dab).
// The markup in render() is generated from the V10 template and keeps its
// inline styles verbatim; the class is V10's `Component` logic. Every change
// against V10 is marked "D-092" and listed in docs/product/V10_DIVERGENCE_REGISTER.md.
// Facts come from the governed content boundary (D-088): the eight approved
// projects, the approved contact address and real Journal entries. No dc
// runtime, Babel, CDN React, remote font or remote asset is used.
import React from "react";

// dc runtime cssToObj: "a:b;c:d" -> { a: "b", c: "d" }, custom properties kept.
const cssCache = new Map();
function css(text) {
  const hit = cssCache.get(text);
  if (hit) return hit;
  const out = {};
  for (const decl of text.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    out[prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  if (cssCache.size < 2000) cssCache.set(text, out);
  return out;
}

const JOURNAL_STATUS = {
  loading: "Loading journal entries…",
  empty: "No journal entries have been published yet.",
  error: "The journal could not be loaded right now.",
};

function formatNoteDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

'''
open(out, "w", encoding="utf-8").write(header + logic + "\nexport default V10Home;\n")
print("ok", len(header + logic))
