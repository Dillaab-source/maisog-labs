import V10Home from "../components/v10/V10Home";
import { v10Content } from "../data/site.js";
import { getPublicContent } from "../lib/content/local.mjs";
import { validateV10Content } from "../lib/content/schema.mjs";

// V10 homepage (D-092 controlled clean replacement). An ordinary static
// server component: it reads the unchanged governed content boundary
// (data/site.js -> lib/content/local.mjs -> schema -> public) plus the V10
// presentation copy (data/site.js `v10Content`, validated fail-closed -- a
// build fails on invalid copy) and hands V10Home plain props. No D1 import;
// the only runtime request the page makes is GET /api/journal when the
// Research panel is first opened.
export default async function Home() {
  const content = await getPublicContent();
  const published = content.projects.filter(project => project.featured);
  const v10 = structuredClone(validateV10Content(v10Content, published));
  const disciplineIndex = new Map(v10.disciplines.map((discipline, index) => [discipline.id, index]));
  const profiles = new Map(v10.projectProfiles.map(profile => [profile.slug, profile]));
  const projects = published.map(project => {
    const profile = profiles.get(project.slug);
    return {
      name: project.title,
      key: project.slug,
      kind: profile.kind,
      status: profile.status,
      url: "",
      tags: profile.disciplines.map(id => disciplineIndex.get(id)),
      tag: profile.tagline,
      desc: profile.description,
      flow: profile.flowSteps.length ? { s: profile.flowSteps, h: profile.humanStep } : null,
    };
  });
  const disciplines = v10.disciplines.map(discipline => ({
    name: discipline.name,
    icon: discipline.icon,
    cap: discipline.caption,
    desc: discipline.description,
    links: discipline.links.map(id => disciplineIndex.get(id)),
  }));
  return <V10Home content={{ projects, disciplines, email: content.contact.email, entryDescriptor: v10.entryDescriptor }} />;
}
