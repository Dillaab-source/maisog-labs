import LogoMark from "./LogoMark";

export default function EntryStage({ motion, site }) {
  return (
    <div className="entry-stage">
      <div className="entry-stage-glow" aria-hidden="true" />
      <svg className="entry-stage-orbit" viewBox="0 0 600 160" aria-hidden="true" focusable="false">
        <g transform="rotate(-8 300 80)">
          <ellipse cx="300" cy="80" rx="280" ry="48" />
          <circle className="entry-orbit-halo" cx="300" cy="80" r="16" />
          <circle className="entry-orbit-node" cx="300" cy="80" r="4.5" />
        </g>
      </svg>
      <LogoMark motion={motion} />
      <h1 id="entry-title" className="entry-mark" tabIndex={-1}>
        MAISOG<span>LABS</span>
      </h1>
      <p className="entry-tagline"><i aria-hidden="true" />{site.tagline}<i aria-hidden="true" /></p>
    </div>
  );
}
