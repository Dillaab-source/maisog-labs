import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CASE_STUDY_SLUGS, caseStudyHref, hasCaseStudy } from "../worker/projects/case-studies.mjs";
import { validateProjectRevisionContent } from "../worker/d1/validate.mjs";
import { validateProjectsGroup, validateV10ProjectFields } from "../worker/bridge/payload.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function bridgeProject(overrides = {}) {
  return {
    name: "ClinicFlow",
    kind: "Platform",
    slug: "clinicflow",
    status: "Active",
    tagline: "Appointment engine",
    description: "Verified clinic appointments.",
    disciplines: [0, 1],
    flow: ["Request", "Understand", "Verify", "Human confirms"],
    caseStudyEnabled: false,
    ...overrides,
  };
}

test("case-study registry has only ClinicFlow and derives a safe route", () => {
  assert.deepEqual(CASE_STUDY_SLUGS, ["clinicflow"]);
  assert.equal(hasCaseStudy("clinicflow"), true);
  assert.equal(caseStudyHref("clinicflow"), "/projects/clinicflow");
  for (const invalid of ["https://example.com", "javascript:alert(1)", "../clinicflow", "ClinicFlow", "bad_slug"]) {
    assert.equal(hasCaseStudy(invalid), false, invalid);
    assert.equal(caseStudyHref(invalid), null, invalid);
  }
});

test("each registered slug has a case-study route", () => {
  for (const slug of CASE_STUDY_SLUGS) {
    assert.ok(fs.existsSync(path.join(root, "app", "projects", slug, "page.js")), slug);
  }
});

test("V10 legacy data defaults the revision toggle off and requires a boolean when supplied", () => {
  const legacy = { tagline: "Appointment engine", status: "Active", disciplines: [0], flow: ["a", "b", "c", "d"] };
  assert.equal(validateV10ProjectFields(legacy).caseStudyEnabled, false);
  assert.throws(() => validateV10ProjectFields({ ...legacy, caseStudyEnabled: null }));
  assert.throws(() => validateV10ProjectFields({ ...legacy, caseStudyEnabled: "true" }));
});

test("bridge accepts registered enabled identity and rejects malformed or unregistered identity as a whole group", () => {
  assert.equal(validateProjectsGroup([bridgeProject({ caseStudyEnabled: true })])[0].slug, "clinicflow");
  for (const bad of [
    { ...bridgeProject(), slug: "../clinicflow" },
    { ...bridgeProject(), caseStudyEnabled: 1 },
    { ...bridgeProject({ caseStudyEnabled: true }), slug: "other-project" },
    { ...bridgeProject(), href: "https://example.com" },
  ]) assert.throws(() => validateProjectsGroup([bad]));
});

test("project revision domain retains an explicit boolean and rejects unknown fields", () => {
  const value = validateProjectRevisionContent({
    order: 1, category: "Platform", title: "ClinicFlow", summary: "Appointments", stack: [], accent: "blue", icon: "lab", featured: true,
    v10: { tagline: "Appointment engine", status: "Active", disciplines: [0], flow: ["a", "b", "c", "d"], caseStudyEnabled: true },
  });
  assert.equal(value.v10.caseStudyEnabled, true);
  assert.throws(() => validateProjectRevisionContent({ ...value, href: "/other" }));
});
