"use client";

// Systems surface (plan §6). The orbit diagram is decorative-informational
// and aria-hidden; everything it shows is also stated in the text panel.
// Relationships come only from components/site/routes.mjs disciplineGraph,
// which derives them from published project categories/stack tags.
import { useState } from "react";
import useListKeys from "./useListKeys";

const CX = 260;
const CY = 190;
const RX = 190;
const RY = 138;

const ICONS = Object.freeze({
  "discipline-ai": "/v10/assets/icons/01-ai.svg",
  "discipline-automation": "/v10/assets/icons/02-automation.svg",
  "discipline-security": "/v10/assets/icons/03-security.svg",
  "discipline-research": "/v10/assets/icons/04-research.svg",
  "discipline-systems": "/v10/assets/icons/05-systems.svg",
  "discipline-architecture": "/v10/assets/icons/08-strategy.svg",
});

function position(index, count) {
  const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
  return { x: CX + RX * Math.cos(angle), y: CY + RY * Math.sin(angle) };
}

export default function SystemsSurface({ graph, projects }) {
  const [selected, setSelected] = useState(0);
  const { onKeyDown, register } = useListKeys(graph.nodes.length, selected, setSelected);
  const node = graph.nodes[selected];
  const byId = Object.fromEntries(graph.nodes.map(item => [item.id, item]));
  const projectTitle = Object.fromEntries(projects.map(project => [project.id, project.title]));
  const orbiting = graph.nodes.filter(item => item.id !== node.id);
  const points = {
    [node.id]: { x: CX, y: CY },
    ...Object.fromEntries(orbiting.map((item, index) => [item.id, position(index, orbiting.length)])),
  };

  return (
    <div className="systems-layout">
      <div className="discipline-list" role="group" aria-label="Disciplines" onKeyDown={onKeyDown}>
        {graph.nodes.map((item, index) => (
          <button
            key={item.id}
            ref={register(index)}
            type="button"
            className="selector"
            aria-pressed={index === selected}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <svg className="systems-diagram" viewBox="0 0 520 380" aria-hidden="true" focusable="false">
        <circle className="diagram-guide diagram-guide-outer" cx={CX} cy={CY} r="170" />
        <circle className="diagram-guide" cx={CX} cy={CY} r="126" />
        <line className="diagram-axis" x1="36" y1={CY} x2="484" y2={CY} />
        <line className="diagram-axis" x1={CX} y1="18" x2={CX} y2="362" />
        <ellipse className="diagram-orbit" cx={CX} cy={CY} rx={RX} ry={RY} />
        {graph.edges.map(edge => {
          const active = edge.a === node.id || edge.b === node.id;
          return <line key={`${edge.a}-${edge.b}`} className={active ? "diagram-edge is-active" : "diagram-edge"} x1={points[edge.a].x} y1={points[edge.a].y} x2={points[edge.b].x} y2={points[edge.b].y} />;
        })}
        {graph.nodes.map(item => (
          <g key={item.id} className={item.id === node.id ? "diagram-node is-selected" : "diagram-node"} transform={`translate(${points[item.id].x} ${points[item.id].y})`}>
            <circle r={item.id === node.id ? 58 : 29} />
            <image href={ICONS[item.id]} x={item.id === node.id ? -28 : -14} y={item.id === node.id ? -34 : -17} width={item.id === node.id ? 56 : 28} height={item.id === node.id ? 56 : 28} />
            <text className="diagram-node-label" y={item.id === node.id ? 28 : 45} textAnchor="middle">{item.label}</text>
          </g>
        ))}
        {node.projects.slice(0, 5).map((id, index) => {
          const point = position(index, Math.min(node.projects.length, 5));
          return (
            <g key={`project-${id}`} className="diagram-project" transform={`translate(${point.x} ${point.y}) rotate(45)`}>
              <rect x="-5" y="-5" width="10" height="10" />
            </g>
          );
        })}
      </svg>

      <div className="discipline-detail" aria-live="polite">
        <h3>{node.label}</h3>
        <p>{node.text}</p>
        <h4>Connected disciplines</h4>
        {node.connections.length ? (
          <ul>
            {node.connections.map(link => (
              <li key={link.id}>{byId[link.id].label} <span>— through {link.via.map(id => projectTitle[id]).join(", ")}</span></li>
            ))}
          </ul>
        ) : <p className="quiet">No published project currently connects this discipline to another.</p>}
        <h4>Related projects</h4>
        {node.projects.length ? (
          <ul>{node.projects.map(id => <li key={id}><a href="#projects">{projectTitle[id]}</a></li>)}</ul>
        ) : <p className="quiet">No published project names this discipline yet.</p>}
        <p className="systems-note">Connections are drawn only where a published project names both disciplines.</p>
      </div>
    </div>
  );
}
