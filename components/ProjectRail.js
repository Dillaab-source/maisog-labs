"use client";

import { useRef } from "react";
import BlueprintIcon from "./BlueprintIcon";

export default function ProjectRail({ projects }) {
  const rail = useRef(null);

  function move(direction) {
    rail.current?.scrollBy({
      left: direction * Math.min(rail.current.clientWidth * 0.82, 520),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <div className="project-rail-wrap">
      <div className="rail-controls" aria-label="Project carousel controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous project">←</button>
        <button type="button" onClick={() => move(1)} aria-label="Next project">→</button>
      </div>
      <div className="project-rail" ref={rail}>
        {projects.map((project, index) => (
          <article className={`project-panel tone-${project.accent}`} id={project.slug} key={project.id}>
            <span className="panel-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="panel-icon"><BlueprintIcon name={project.icon} size={28} /></span>
            <div className="panel-copy">
              <span>{project.category}</span>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
            </div>
            <div className="panel-stack">
              {project.stack.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>
        ))}
      </div>
      <p className="swipe-note">Drag or swipe to explore <span aria-hidden="true">⟷</span></p>
    </div>
  );
}
