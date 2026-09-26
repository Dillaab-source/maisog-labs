"use client";

// Projects surface (plan §7): a typography-led explorer over the published,
// featured repository projects only. Shows only approved fields (category,
// title, summary, stack). No status, URL or system-flow figure is shown
// because the published content carries none (plan §7, §20).
import { useState } from "react";
import useListKeys from "./useListKeys";

export default function ProjectsSurface({ projects, emptyMessage, description }) {
  const [selected, setSelected] = useState(0);
  const { onKeyDown, register } = useListKeys(Math.max(projects.length, 1), selected, setSelected);
  if (!projects.length) return <p className="quiet">{emptyMessage}</p>;
  const project = projects[selected];
  const count = String(projects.length).padStart(2, "0");
  const step = delta => setSelected((selected + delta + projects.length) % projects.length);

  return (
    <div className="projects-layout">
      <p className="surface-lead">{description}</p>
      <div className="project-list" role="group" aria-label="Projects" onKeyDown={onKeyDown}>
        {projects.map((item, index) => (
          <button
            key={item.id}
            ref={register(index)}
            type="button"
            className="project-selector"
            aria-pressed={index === selected}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            <span className="route-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <article className={`project-detail tone-${project.accent}`} aria-live="polite">
        <p className="project-count"><span className="visually-hidden">Project </span>{String(selected + 1).padStart(2, "0")} / {count}</p>
        <p className="project-category">{project.category}</p>
        <h3>{project.title}</h3>
        <p className="project-summary">{project.summary}</p>
        <ul className="project-stack" aria-label="Tags">
          {project.stack.map(item => <li key={item}>{item}</li>)}
        </ul>
        <div className="project-step">
          <button type="button" onClick={() => step(-1)}><span aria-hidden="true">←</span> Previous</button>
          <button type="button" onClick={() => step(1)}>Next <span aria-hidden="true">→</span></button>
        </div>
      </article>
    </div>
  );
}
