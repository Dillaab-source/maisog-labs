// Case-study destinations are source controlled. Never accept a caller URL.
export const CASE_STUDY_SLUGS = Object.freeze(["clinicflow"]);

export function hasCaseStudy(slug) {
  const valid = typeof slug === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(slug) && !["home", "projects", "process", "about", "main-content"].includes(slug);
  return valid && CASE_STUDY_SLUGS.includes(slug);
}

export function caseStudyHref(slug) {
  return hasCaseStudy(slug) ? `/projects/${slug}` : null;
}

export function validateCaseStudyEnabled(slug, enabled) {
  if (typeof enabled !== "boolean") throw new Error("caseStudyEnabled: invalid value");
  if (enabled && !hasCaseStudy(slug)) throw new Error("caseStudyEnabled: project has no registered case study");
  return enabled;
}
