import SpatialShell from "../components/site/SpatialShell";
import { disciplineGraph } from "../components/site/routes.mjs";
import { spatialContent } from "../data/site.js";
import { getPublicContent } from "../lib/content/local.mjs";
import { validateSpatialContent } from "../lib/content/schema.mjs";

// Website Redesign V1 (D-076 / ML-DEVOS-AS-104, docs/product/WEBSITE_REDESIGN_V1_PLAN.md):
// one persistent spatial environment -- Entry plus the Systems / Projects /
// Research / Contact work surfaces (components/site/**). This file stays an
// ordinary static server component: it reads the unchanged validated local
// content boundary (data/site.js -> lib/content/local.mjs -> schema ->
// public) plus the separate local-static spatial copy (data/site.js
// `spatialContent`, validated by lib/content/schema.mjs
// validateSpatialContent -- a build fails on invalid copy), and derives the
// Systems relationships from published project content at build time. The
// spatial copy is not part of the legacy/D1 content document. No D1 import.
//
// WEB-INC-007: the four fixed managed ids (home, projects, process, about)
// are carried as `data-section` on the Entry content, the route triggers and
// the route surfaces (see components/site/SpatialShell.js and
// app/DesignRuntime.js applySections).
export default async function Home() {
  const content = await getPublicContent();
  const spatial = structuredClone(validateSpatialContent(spatialContent));
  const projects = content.projects.filter(project => project.featured);
  const graph = disciplineGraph(spatial.disciplines, projects);
  return <SpatialShell content={{ ...content, spatial, projects }} graph={graph} />;
}
