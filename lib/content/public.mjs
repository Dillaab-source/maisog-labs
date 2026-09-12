import { validateContent } from "./schema.mjs";

export function projectPublishedContent(source) {
  validateContent(source);
  if (source.meta.state !== "published") throw new Error("Public build requires a published content document");
  const result = structuredClone(source);
  const published = records => records.filter(item => item.state === "published")
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map(({ state, ...item }) => item);
  for (const key of ["navigation", "foundations", "projects", "services"]) result[key] = published(result[key]);
  result.process.steps = published(result.process.steps);
  delete result.meta.state;
  return result;
}
