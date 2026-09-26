import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { siteContent, spatialContent } from "../data/site.js";
import { resolveHash } from "../components/site/routes.mjs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(new URL(`../${file}`, import.meta.url))).digest("hex");

test("V10 publishes the exact eight unique owner-approved project names", () => {
  assert.deepEqual(siteContent.projects.map(project => project.title), [
    "Sentinel/DevOS", "SU", "ClinicFlow", "Maisog Kilat", "Maisog Guild",
    "Automation Hub", "Cybersecurity Lab", "Experimental Projects",
  ]);
  assert.equal(new Set(siteContent.projects.map(project => project.title)).size, 8);
  assert.equal(siteContent.projects.filter(project => project.title === "ClinicFlow").length, 1);
  assert.equal(siteContent.contact.email, "paulo.maisog@maisoglabs.com");
  assert.deepEqual(spatialContent.destinations.map(item => item.route), ["systems", "projects", "journal", "contact"]);
  assert.deepEqual(resolveHash("#research"), { route: "journal", canonical: "#journal" });
});

test("V10 runtime source has no remote font, script, image or prototype runtime dependency", () => {
  const runtime = ["app/layout.js", "app/page.js", "app/globals.css", "app/DesignRuntime.js", ...fs.readdirSync(new URL("../components/site/", import.meta.url)).map(name => `components/site/${name}`)]
    .map(read).join("\n");
  assert.ok(!/https?:\/\//.test(runtime.replace(/^\s*\/\/.*$/gm, "")));
  assert.ok(!/support\.js|image-slot\.js|unpkg\.com|babel/i.test(runtime));
});

test("V10 copied reference assets preserve their approved hashes", () => {
  const expected = {
    "public/v10/assets/plate-hero-v4.png": "afb05bc4ccb5cfd00577e20c236670cb4769faca8e046816822ba341ba5c4ec4",
    "public/v10/assets/logo-mark.mp4": "ac6124585dc489d88f38ac57a2b8729863486c78b51e59a64ec8ab0734225ed4",
    "public/v10/assets/logo-mark-poster.png": "931e2fc037832c27b084bcca0df5a683c9c28376ac78b77cbbe24db8ecd9c851",
    "public/v10/assets/plate-aqueduct-v4.png": "285ac4b3b2f4be7033bfc3e3b32f7d6b0397aca9f197702c780f071f2fe21928",
    "public/v10/assets/favicon.svg": "b34acfe1395e080c2d551982d6e5c550171b6b877ec535de4f4dc60ae3676d04",
  };
  for (const [file, digest] of Object.entries(expected)) assert.equal(hash(file), digest, file);
});
