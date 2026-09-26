#!/usr/bin/env python3
"""One-off converter: V10 dc template -> JSX body + CSS (scratch tooling).

Semantics mirrored from the dc runtime (support.js):
- attribute "{{ expr }}" (whole) -> raw value; mixed text -> string join with undefined -> "".
- style strings -> cssToObj at render time (helper css()).
- style-hover="css" -> class with :hover { css !important } (emitted as CSS).
- sc-for list/as -> map; sc-if value -> truthy guard.
- whitespace-only text without a space is dropped; other text is kept verbatim.
"""
import json
import re
import sys

src = open(sys.argv[1], encoding="utf-8").read()
out_jsx, out_css, out_names = sys.argv[2], sys.argv[3], sys.argv[4]

helmet = src[src.index("<helmet>"):src.index("</helmet>")]
style = helmet[helmet.index("<style>") + 7:helmet.index("</style>")]
tpl = src[src.index("</helmet>") + len("</helmet>"):src.index("</x-dc>")]

SVG_ATTR = {
    "vector-effect": "vectorEffect", "stroke-dasharray": "strokeDasharray", "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin", "fill-opacity": "fillOpacity",
    "stroke-opacity": "strokeOpacity", "stroke-dashoffset": "strokeDashoffset", "text-anchor": "textAnchor",
    "font-size": "fontSize", "font-family": "fontFamily", "letter-spacing": "letterSpacing",
    "dominant-baseline": "dominantBaseline",
}
VOID = {"br", "img", "input", "link", "meta", "hr", "source"}
EXPR = re.compile(r"\{\{([\s\S]+?)\}\}")
TOKEN = re.compile(r'<!--[\s\S]*?-->|</([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(/?)>|[^<]+', re.M)
ATTR = re.compile(r'([^\s=>/]+)(?:="([^"]*)")?')

hover_rules = {}
roots = set()
loop_vars = set()


def js_expr(e, scope):
    e = e.strip()
    if e in ("true", "false", "null", "undefined") or re.fullmatch(r"-?\d+(\.\d+)?", e):
        return e
    assert re.fullmatch(r"[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*", e), e
    head = e.split(".")[0]
    if head not in scope:
        roots.add(head)
    return e


def interp_string(raw, scope):
    parts = EXPR.split(raw)
    if len(parts) == 1:
        return json.dumps(raw, ensure_ascii=False)
    out = "`"
    for i, p in enumerate(parts):
        if i % 2:
            out += "${" + js_expr(p, scope) + ' ?? ""}'
        else:
            out += p.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    return out + "`"


def attr_value(raw, scope):
    whole = re.fullmatch(r"\s*\{\{([\s\S]+?)\}\}\s*", raw)
    if whole:
        return "{" + js_expr(whole.group(1), scope) + "}"
    if "{{" in raw:
        return "{" + interp_string(raw, scope) + "}"
    return json.dumps(raw, ensure_ascii=False) if ('"' in raw or "\\" in raw) else '"' + raw + '"'


def text_node(t, scope):
    if "{{" not in t:
        if not t.strip() and " " not in t:
            return ""
        lit = "{" + json.dumps(t, ensure_ascii=False) + "}"
        if not t.strip() and "\n" in t:
            # A source newline after the literal is dropped by JSX, so the
            # rendered whitespace stays exactly the V10 text node.
            return lit + "\n" + " " * (len(t) - t.rfind("\n") - 1 + 6)
        return lit
    parts = EXPR.split(t)
    out = ""
    for i, p in enumerate(parts):
        if i % 2:
            out += "{" + js_expr(p, scope) + "}"
        elif p:
            out += "{" + json.dumps(p, ensure_ascii=False) + "}"
    return out


stack = []  # (tag, scope)
scope = set()
out = []
for m in TOKEN.finditer(tpl):
    tok = m.group(0)
    if tok.startswith("<!--"):
        continue
    if m.group(1):  # close tag
        tag = m.group(1)
        opened, scope = stack.pop()
        assert opened == tag, (opened, tag)
        if tag == "sc-for":
            out.append("</React.Fragment>))}")
        elif tag == "sc-if":
            out.append("</>)}")
        else:
            out.append(f"</{tag}>")
        continue
    if m.group(2):  # open tag
        tag, rawattrs, selfclose = m.group(2), m.group(3) or "", m.group(4)
        attrs = [(a.group(1), a.group(2)) for a in ATTR.finditer(rawattrs)]
        ad = dict(attrs)
        if tag == "sc-for":
            lst = re.fullmatch(r"\{\{\s*(.+?)\s*\}\}", ad["list"]).group(1)
            var = ad["as"]
            loop_vars.add(var)
            out.append("{(" + js_expr(lst, scope) + " || []).map((" + var + ", __i) => (<React.Fragment key={__i}>")
            stack.append((tag, scope))
            scope = scope | {var}
            continue
        if tag == "sc-if":
            val = re.fullmatch(r"\{\{\s*(.+?)\s*\}\}", ad["value"]).group(1)
            out.append("{" + js_expr(val, scope) + " && (<>")
            stack.append((tag, scope))
            continue
        props = []
        classes = []
        for name, value in attrs:
            if name.startswith("hint-"):
                continue
            if name.startswith("style-"):
                pseudo = name[6:]
                key = (pseudo, value)
                if key not in hover_rules:
                    hover_rules[key] = f"v10-{pseudo}-{len(hover_rules)}"
                classes.append(hover_rules[key])
                continue
            if value is None:
                props.append(name)
                continue
            if name == "style":
                if "{{" in value:
                    props.append("style={css(" + interp_string(value, scope) + ")}")
                else:
                    props.append("style={css(" + json.dumps(value, ensure_ascii=False) + ")}")
                continue
            if name == "class":
                classes.append(value)
                continue
            if name == "for":
                name = "htmlFor"
            name = SVG_ATTR.get(name, name)
            props.append(f"{name}={attr_value(value, scope)}")
        if classes:
            props.insert(0, 'className="' + " ".join(classes) + '"')
        head = f"<{tag}" + ("" if not props else " " + " ".join(props))
        if tag in VOID or selfclose:
            out.append(head + " />")
        else:
            out.append(head + ">")
            stack.append((tag, scope))
        continue
    out.append(text_node(tok, scope))

assert not stack, stack
open(out_jsx, "w", encoding="utf-8").write("".join(out))
rules = "\n".join(
    f".{cls}:{pseudo}{{" + ";".join(d.strip() + " !important" for d in css.split(";") if d.strip()) + "}"
    for (pseudo, css), cls in hover_rules.items()
)
open(out_css, "w", encoding="utf-8").write(style.strip() + "\n\n/* style-hover rules (dc runtime pseudo classes) */\n" + rules + "\n")
open(out_names, "w").write(json.dumps(sorted(roots)))
print("roots", len(roots), "loop vars", sorted(loop_vars), "hover classes", len(hover_rules))
