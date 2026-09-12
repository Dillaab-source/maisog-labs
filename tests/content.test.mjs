import test from "node:test";
import assert from "node:assert/strict";
import { siteContent } from "../data/site.js";
import { validateContent } from "../lib/content/schema.mjs";
import { projectPublishedContent } from "../lib/content/public.mjs";
import { getPublicContent } from "../lib/content/local.mjs";

test("local source validates and adapter returns independent data", async () => {
  assert.equal(validateContent(siteContent), siteContent);
  const result = await getPublicContent();
  result.site.name = "Changed";
  assert.equal((await getPublicContent()).site.name, "Maisog Labs");
});

test("all record collections filter drafts and archives before serialization", () => {
  const source = structuredClone(siteContent);
  for (const records of [source.projects, source.services, source.navigation, source.foundations, source.process.steps]) {
    records[0].state = "draft";
    records[1].state = "archived";
  }
  const result = projectPublishedContent(source);
  for (const [raw, filtered] of [[source.projects,result.projects], [source.services,result.services], [source.navigation,result.navigation], [source.foundations,result.foundations], [source.process.steps,result.process.steps]]) {
    assert.equal(filtered.length, raw.length - 2);
    assert.ok(!JSON.stringify(result).includes(`"id":"${raw[0].id}"`));
    assert.ok(!JSON.stringify(result).includes(`"id":"${raw[1].id}"`));
    assert.ok(filtered.every(item => !Object.hasOwn(item, "state")));
  }
  assert.equal(source.projects[0].state, "draft");
});

test("stable ordering and empty collections", () => {
  const source = structuredClone(siteContent);
  source.projects.reverse();
  source.navigation = [];
  const result = projectPublishedContent(source);
  assert.deepEqual(result.projects.map(item => item.order), [1,2,3,4]);
  assert.deepEqual(result.navigation, []);
});

for (const [name, mutate] of [
  ["missing required field", c => delete c.hero.description],
  ["unknown admin field", c => c.site.adminEmail = "admin@example.com"],
  ["unsupported schema", c => c.meta.schemaVersion = "2.0.0"],
  ["invalid state", c => c.projects[0].state = "public"],
  ["duplicate ID", c => c.projects[1].id = c.projects[0].id],
  ["duplicate slug", c => c.projects[1].slug = c.projects[0].slug],
  ["reserved slug", c => c.projects[0].slug = "home"],
  ["unsupported icon", c => c.projects[0].icon = "injected"],
  ["unsupported accent", c => c.projects[0].accent = "red other-class"],
  ["HTML", c => c.about.body = "<script>alert(1)</script>"],
  ["oversized title", c => c.seo.title = "a".repeat(161)],
  ["javascript link", c => c.hero.primaryAction.href = "javascript:alert(1)"],
  ["protocol-relative link", c => c.navigation[0].href = "//example.com"],
  ["missing anchor", c => c.navigation[0].href = "#missing"],
  ["email header injection", c => c.hero.secondaryAction.href = "mailto:a@example.com?bcc=b@example.com"],
  ["malformed email", c => c.contact.email = "not-an-email"],
  ["insecure canonical", c => c.seo.canonicalUrl = "http://example.com"],
  ["credential URL", c => c.seo.canonicalUrl = "https://user:pass@example.com"],
  ["invalid date", c => c.meta.updatedAt = "2026-02-30"],
  ["negative order", c => c.projects[0].order = -1],
  ["wrong boolean", c => c.projects[0].featured = "true"],
  ["wrong title lines", c => c.hero.title = ["one"]],
  ["null record", c => c.projects[0] = null],
]) {
  test(`rejects ${name}`, () => {
    const source = structuredClone(siteContent);
    mutate(source);
    assert.throws(() => projectPublishedContent(source), /Invalid content/);
  });
}

test("unpublished root cannot produce a public build", () => {
  for (const state of ["draft", "archived"]) {
    const source = structuredClone(siteContent);
    source.meta.state = state;
    assert.throws(() => projectPublishedContent(source), /requires a published/);
  }
});
