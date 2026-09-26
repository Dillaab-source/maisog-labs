"use client";

// Website Redesign V1 (D-076 / ML-DEVOS-AS-104, docs/product/WEBSITE_REDESIGN_V1_PLAN.md
// §4, §15-§19): the single persistent spatial environment. Entry is always
// the world; Systems / Projects / Research / Contact open as bounded work
// surfaces over it, addressed by fixed hashes (#systems, #projects,
// #research, #contact; no hash = Entry).
//
// Navigation is ordinary same-document history: route triggers are plain
// hash links, so browser Back/Forward work natively; Escape and the
// wordmark return to Entry by pushing the bare path. Focus moves to the
// opened surface's heading and returns to the closed route's trigger.
//
// WEB-INC-007: a managed route hidden by app/DesignRuntime.js (inline
// `display: none` on its fixed `[data-section]` trigger and surface) is never
// shown -- a direct hash to it fails safe to Entry. Motion follows
// prefers-reduced-motion and the published animation / reduced-motion
// presets; nonessential ambient motion and pointer parallax stop whenever a
// surface is open or the document is hidden.
import { useCallback, useEffect, useRef, useState } from "react";
import ContactSurface from "./ContactSurface";
import EntryStage from "./EntryStage";
import ProjectsSurface from "./ProjectsSurface";
import ResearchSurface from "./ResearchSurface";
import SystemsSurface from "./SystemsSurface";
import { DESIGN_APPLIED_EVENT, ROUTES, ROUTE_IDS, motionMode, resolveHash } from "./routes.mjs";

const routeById = Object.fromEntries(ROUTES.map(route => [route.id, route]));
const visible = element => Boolean(element) && element.getClientRects().length > 0;

// AS105-F002: the skip-link destination follows the current route. Entry ->
// the Entry main landmark; an open surface -> that surface's own heading (the
// Entry landmark is then inert/aria-hidden). Only the fixed route vocabulary
// can produce an id; anything else resolves to Entry.
function skipTargetFor(route) {
  return ROUTE_IDS.includes(route) ? `surface-${route}-title` : "main-content";
}

function sectionAttributes(route) {
  return route.section ? { "data-section": route.section } : {};
}

function RouteLinks({ current, destinations, onNavigate, className, withText = false }) {
  return ROUTES.map(route => {
    const text = destinations.find(item => item.route === route.id)?.text;
    return (
      <a
        key={route.id}
        className={`${className} route-slot-${route.slot}`}
        href={`#${route.id}`}
        data-route-trigger={route.id}
        {...(route.section ? { "data-section-trigger": "" } : {})}
        {...sectionAttributes(route)}
        aria-current={current === route.id ? "page" : undefined}
        onClick={onNavigate}
      >
        <span className="route-index" aria-hidden="true">{route.index}</span>
        <span className="route-label">{route.label}</span>
        {withText && text ? <span className="route-text">{text}</span> : null}
      </a>
    );
  });
}

export default function SpatialShell({ content, graph }) {
  const { site, spatial, contact, about, footer } = content;
  const [route, setRoute] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [motion, setMotion] = useState("full");
  const [docHidden, setDocHidden] = useState(false);
  const [researchRequested, setResearchRequested] = useState(false);
  const previousRoute = useRef(null);
  const menuButton = useRef(null);
  const menuPanel = useRef(null);
  const shell = useRef(null);
  const backdrop = useRef(null);

  // True when WEB-INC-007 has hidden this managed route's surface.
  const isHidden = useCallback(id => {
    const surface = document.getElementById(`surface-${id}`);
    return Boolean(surface) && surface.style.display === "none";
  }, []);

  const goEntry = useCallback(() => {
    if (window.location.hash) window.history.pushState(null, "", window.location.pathname + window.location.search);
    setRoute(null);
  }, []);

  // Hash -> route, re-evaluated on every history move and design application.
  const sync = useCallback(() => {
    const { route: next, canonical } = resolveHash(window.location.hash);
    if (next && isHidden(next)) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setRoute(null);
      return;
    }
    if (canonical) window.history.replaceState(null, "", window.location.pathname + window.location.search + canonical);
    setRoute(next);
  }, [isHidden]);

  useEffect(() => {
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener(DESIGN_APPLIED_EVENT, sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener(DESIGN_APPLIED_EVENT, sync);
    };
  }, [sync]);

  // Motion mode: prefers-reduced-motion + published animation/reduced-motion presets.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const update = () => setMotion(motionMode({
      prefersReduced: query.matches,
      reducedMotionMode: root.getAttribute("data-reduced-motion-mode"),
      animation: root.getAttribute("data-animation"),
    }));
    update();
    query.addEventListener("change", update);
    window.addEventListener(DESIGN_APPLIED_EVENT, update);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener(DESIGN_APPLIED_EVENT, update);
    };
  }, []);

  useEffect(() => {
    const update = () => setDocHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Deterministic focus entry / return.
  useEffect(() => {
    const before = previousRoute.current;
    previousRoute.current = route;
    if (route === "journal") setResearchRequested(true);
    if (route && route !== before) {
      document.getElementById(`surface-${route}-title`)?.focus({ preventScroll: true });
    } else if (!route && before) {
      const trigger = document.querySelector(`.header-nav [data-route-trigger="${before}"]`);
      const target = visible(trigger) ? trigger : visible(menuButton.current) ? menuButton.current : document.getElementById("entry-title");
      target?.focus({ preventScroll: true });
    }
  }, [route]);

  // Escape: close the mobile menu first, otherwise return to Entry.
  useEffect(() => {
    const onKey = event => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      } else if (route) {
        goEntry();
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, route, goEntry]);

  useEffect(() => {
    if (menuOpen) menuPanel.current?.querySelector("a")?.focus();
  }, [menuOpen]);

  // The menu exists only at narrow widths; widening the viewport closes it.
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 760px)");
    const onChange = () => { if (!narrow.matches) setMenuOpen(false); };
    narrow.addEventListener("change", onChange);
    return () => narrow.removeEventListener("change", onChange);
  }, []);

  // Pointer parallax: calm motion, hover-capable fine pointer, Entry visible
  // and document visible only. One rAF per pointer frame; fully torn down
  // (listener removed, frame cancelled, offset reset) otherwise.
  const parallax = motion === "full" && !route && !docHidden;
  useEffect(() => {
    const layer = backdrop.current;
    const host = shell.current;
    if (!layer || !host) return undefined;
    const capable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const active = parallax && capable;
    host.setAttribute("data-parallax", active ? "on" : "off");
    if (!active) {
      layer.style.removeProperty("--parallax-x");
      layer.style.removeProperty("--parallax-y");
      return undefined;
    }
    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = event => {
      x = (event.clientX / window.innerWidth - 0.5) * -8;
      y = (event.clientY / window.innerHeight - 0.5) * -6;
      if (!frame) frame = window.requestAnimationFrame(() => {
        frame = 0;
        layer.style.setProperty("--parallax-x", `${x.toFixed(2)}px`);
        layer.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
      layer.style.removeProperty("--parallax-x");
      layer.style.removeProperty("--parallax-y");
    };
  }, [parallax]);

  const closeMenu = () => setMenuOpen(false);
  // On an open surface the skip link moves focus to that surface's heading
  // without changing the hash (which would otherwise mean Entry). On Entry
  // the native in-page link to #main-content is kept.
  const onSkip = event => {
    if (!route) return;
    const target = document.getElementById(skipTargetFor(route));
    if (!target) return;
    event.preventDefault();
    target.focus();
  };
  const onWordmark = event => {
    event.preventDefault();
    setMenuOpen(false);
    goEntry();
    if (!route) document.getElementById("entry-title")?.focus({ preventScroll: true });
  };

  const surfaceProps = id => ({
    id: `surface-${id}`,
    className: `surface surface-${id}`,
    "aria-labelledby": `surface-${id}-title`,
    hidden: route !== id,
    ...sectionAttributes(routeById[id]),
  });
  const heading = (id, title) => (
    <div className="surface-head">
      <p className="surface-kicker"><span aria-hidden="true">{routeById[id].index} / </span>{routeById[id].label}</p>
      <h2 id={`surface-${id}-title`} className="surface-title" tabIndex={-1}>{title}</h2>
      <button type="button" className="surface-close" onClick={goEntry}>
        <span aria-hidden="true">←</span> Entry <kbd>Esc</kbd>
      </button>
    </div>
  );

  return (
    <div
      ref={shell}
      className="spatial"
      data-motion={motion}
      data-surface-open={route ? "true" : "false"}
      data-doc-hidden={docHidden ? "true" : "false"}
      data-menu-open={menuOpen ? "true" : "false"}
    >
      <a className="skip-link" href={`#${skipTargetFor(route)}`} onClick={onSkip}>Skip to content</a>
      <div className="spatial-backdrop" ref={backdrop} aria-hidden="true">
        <div className="cinematic-background" />
        <svg className="entry-trajectory" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
          <ellipse cx="720" cy="430" rx="620" ry="190" transform="rotate(-9 720 430)" />
          <ellipse cx="720" cy="430" rx="470" ry="138" transform="rotate(-9 720 430)" />
        </svg>
      </div>

      <header className="spatial-header">
        <a className="spatial-wordmark" href="./" onClick={onWordmark} aria-label={`${site.name} — Entry`}>
          <span>MAISOG<em>LABS</em></span>
        </a>
        <nav className="header-nav" aria-label="Primary">
          <RouteLinks current={route} destinations={spatial.destinations} className="header-route" />
        </nav>
        <button
          ref={menuButton}
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="lab-menu"
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      <nav id="lab-menu" className="lab-menu" aria-label="Lab menu" hidden={!menuOpen} ref={menuPanel}>
        <RouteLinks current={route} destinations={spatial.destinations} className="menu-route" onNavigate={closeMenu} withText />
      </nav>

      <main id="main-content" className="entry" aria-hidden={route ? "true" : undefined} inert={route ? true : undefined}>
        <div className="entry-content" data-section="home">
          <p className="entry-meta"><span aria-hidden="true">00 / </span>Entry</p>
          <EntryStage motion={motion} site={site} />
        </div>
        <div className="entry-footer">
          <p className="entry-descriptor">{spatial.entryDescriptor}</p>
          <p className="entry-mantra" aria-hidden="true"><span>Humanity</span><span>Orbits</span><span>Higher</span></p>
        </div>
      </main>

      <section {...surfaceProps("systems")}>
        {heading("systems", "How the lab's disciplines connect")}
        <SystemsSurface graph={graph} projects={content.projects} />
      </section>

      <section {...surfaceProps("projects")}>
        {heading("projects", content.projectSection.title)}
        <ProjectsSurface projects={content.projects} emptyMessage={content.projectSection.emptyMessage} description={content.projectSection.description} />
      </section>

      <section {...surfaceProps("journal")}>
        {heading("journal", "Notes from the lab")}
        <ResearchSurface active={researchRequested} />
      </section>

      <section {...surfaceProps("contact")}>
        {heading("contact", spatial.contactStatement)}
        <ContactSurface contact={contact} identity={about.title} footer={footer} location={site.location} />
      </section>
    </div>
  );
}
