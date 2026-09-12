# Content editing guide

Most frequently edited portfolio content should live outside page layout code.

## Phase 2 contract (schema 1.0.0)

`data/site.js` exports one `siteContent` document. Do not import it directly into UI components. Use `getPublicContent()` from `lib/content/local.mjs` in the build/server layer.

Editable groups: site identity, SEO, navigation, hero copy/actions, foundation links, project summaries and technology tags, service descriptions, process steps, about copy, contact, footer, and project-section copy. Service records are modeled for a later section and are not currently rendered. Layout, routes, CSS, signature artwork, and background placement remain code-owned.

Records use stable `id` values, numeric `order`, and `draft`, `published`, or `archived` states. Project `slug` values must be unique and cannot collide with section IDs. Only published records reach the rendered page; only featured published projects enter the homepage rail. An empty project list shows the editable empty-state message. The root document must be published for a production build. Navigation targets are limited to existing sections and simple email links; arbitrary HTML and unknown fields are rejected.

`meta.schemaVersion` identifies the data contract, while `meta.contentVersion` and `updatedAt` identify the editorial snapshot. These fields are not an immutable audit log. Use Git history for current rollback; future publishing must generate trusted actor/timestamp/version records server-side.

Run `npm test` and `npm run build` after edits. Invalid content fails the build. Edits do not affect the live site until a new static build is deployed.

### Privacy and deferred work

Drafts in this public repository are NOT private, even when omitted from generated pages. Never add credentials, patients' information, private notes, or admin authorization lists. The requested admin identity must be configured later at the authentication boundary, not here.

Case-study bodies, media references/alt text, uploads, legal-page copy, private previews, revisions, rollback UI, and CMS writes remain future work. No D1/R2 resources or admin accounts are created by this contract. Do not enable uploads or write APIs until validation, authorization, audit history, and rollback are implemented for them.

## Primary content file
Edit `data/site.js` for:
- project names
- project descriptions
- project slugs
- project images
- process-step copy
- site email and tagline

## Images
Production assets should eventually be stored under `public/` rather than depending permanently on remote image URLs.

The V4 cosmic background is stored locally at `public/images/maisog-v4-cosmic-background.webp`. The provisional signature source used by the replaceable header lockup is stored at `public/brand/paulo-signature-source.png`; replace it with an approved vector before the final V4 release.

Recommended structure:

```text
public/
  images/
    brand/
    projects/
      clinicflow/
      eternal-eggs/
      automation-hub/
    profile/
```

Use descriptive lowercase filenames with hyphens, for example:

```text
clinicflow-dashboard.webp
paulo-portrait.webp
maisog-labs-logo.svg
```

## Page copy
If a piece of text appears in more than one place, move it into `data/site.js` rather than duplicating it.

If content becomes much larger later, split `data/site.js` into domain files such as:

```text
data/
  site.js
  projects.js
  navigation.js
```

Do not split prematurely; the current single content module is intentionally simple.
