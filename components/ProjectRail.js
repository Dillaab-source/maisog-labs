"use client";

import { useRef } from "react";

export default function ProjectRail({ projects }) {
  const railRef = useRef(null);

  const move = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.min(420, rail.clientWidth * 0.72), behavior: "smooth" });
  };

  const onWheel = (event) => {
    const rail = railRef.current;
    if (!rail || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const atStart = rail.scrollLeft <= 0 && event.deltaY < 0;
    const atEnd = Math.ceil(rail.scrollLeft + rail.clientWidth) >= rail.scrollWidth && event.deltaY > 0;
    if (atStart || atEnd) return;
    event.preventDefault();
    rail.scrollLeft += event.deltaY;
  };

  return (
    <div className="project-stage">
      <div className="rail-controls" aria-label="Project carousel controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous projects">←</button>
        <span>DRAG / SWIPE</span>
        <button type="button" onClick={() => move(1)} aria-label="Next projects">→</button>
      </div>

      <div className="project-rail" ref={railRef} onWheel={onWheel}>
        {projects.map((project) => (
          <article className="project-card" key={project.slug}>
            <div
              className="project-image"
              style={{ backgroundImage: `linear-gradient(180deg, transparent 42%, rgba(7,9,11,.5)), url("${project.image}")` }}
            >
              <span className="project-number">{project.number}</span>
            </div>
            <div className="project-copy">
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <div className="project-meta">{project.tags?.join(" · ")}</div>
              <a href={`#${project.slug}`}>View Project <span>→</span></a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
