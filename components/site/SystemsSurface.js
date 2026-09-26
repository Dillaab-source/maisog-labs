"use client";

// Systems surface (plan §6). The orbit diagram is decorative-informational
// and aria-hidden; everything it shows is also stated in the text panel.
// Relationships come only from components/site/routes.mjs disciplineGraph,
// which derives them from published project categories/stack tags.
import { useState } from "react";
import useListKeys from "./useListKeys";

const CX = 260;
const CY = 190;
const RX = 200;
const RY = 130;

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
  const points = Object.fromEntries(graph.nodes.map((item, index) => [item.id, position(index, graph.nodes.length)]));

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
        <ellipse className="diagram-orbit" cx={CX} cy={CY} rx={RX} ry={RY} />
        {graph.edges.map(edge => {
          const active = edge.a === node.id || edge.b === node.id;
          return <line key={`${edge.a}-${edge.b}`} className={active ? "diagram-edge is-active" : "diagram-edge"} x1={points[edge.a].x} y1={points[edge.a].y} x2={points[edge.b].x} y2={points[edge.b].y} />;
        })}
        {graph.nodes.map(item => (
          <g key={item.id} className={item.id === node.id ? "diagram-node is-selected" : "diagram-node"} transform={`translate(${points[item.id].x} ${points[item.id].y})`}>
            <circle r={item.id === node.id ? 9 : 6} />
            <text y={-16} textAnchor="middle">{item.label}</text>
          </g>
        ))}
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
