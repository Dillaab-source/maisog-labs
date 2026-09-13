# Maisog Labs Admin Portal V1

## Status
Implementation branch: `admin-v1`.

This document is the approved implementation contract for the first admin portal. Do not expand scope without a new planning review.

## Goal
Provide a secure `/admin` experience where Paulo can update website content without editing code.

## V1 scope
- Edit hero eyebrow, tagline, description, and CTA labels.
- Edit About content and public contact information.
- Create, edit, delete, reorder, draft, and publish projects.
- Upload/replace project images.
- Preview changes before publishing.
- Publish content atomically so the public site never shows half-written content.

## Intentionally deferred
- Multiple admin roles.
- Team accounts.
- Scheduled publishing.
- Full revision history / restore UI.
- Analytics dashboard.
- AI content generation.
- Visual page builder.

## Architecture

```text
paulo@maisoglabs.com
        |
Cloudflare Access
        |
/admin + /api/admin/*
        |
Admin UI (Next static export)
        |
Cloudflare Worker API
      /              \
Cloudflare D1       Cloudflare R2
content/drafts      uploaded media
        |
Public website reads published content
```

## Security model
1. Cloudflare Access protects `/admin*` and `/api/admin*`.
2. Access policy allows only `paulo@maisoglabs.com`.
3. Worker API fails closed unless the authenticated Access identity matches the configured admin email.
4. State-changing operations use POST/PATCH/DELETE only.
5. Uploaded files are validated for MIME type, extension, and size.
6. Public website never exposes admin-only fields or credentials.
7. No frontend-only password gate is acceptable.

## Data model

### `site_content`
- `key` TEXT PRIMARY KEY
- `draft_value` TEXT
- `published_value` TEXT
- `updated_at` TEXT
- `published_at` TEXT

### `projects`
- `id` TEXT PRIMARY KEY
- `slug` TEXT UNIQUE NOT NULL
- `title` TEXT NOT NULL
- `category` TEXT
- `summary` TEXT
- `body` TEXT
- `stack_json` TEXT
- `image_key` TEXT
- `sort_order` INTEGER
- `status` TEXT CHECK(status IN ('draft','published'))
- `created_at` TEXT
- `updated_at` TEXT
- `published_at` TEXT

### `media`
- `id` TEXT PRIMARY KEY
- `object_key` TEXT UNIQUE NOT NULL
- `filename` TEXT
- `mime_type` TEXT
- `size_bytes` INTEGER
- `created_at` TEXT

## Publish behavior
- Saving edits changes draft data only.
- Preview renders draft data.
- Publish copies draft values to published values in one transaction.
- Public visitors only read published values.

## Release strategy
1. Build admin UI locally.
2. Create D1 database and R2 bucket.
3. Configure Worker bindings.
4. Protect routes with Cloudflare Access.
5. Test unauthorized and authorized access.
6. Test draft/save/preview/publish.
7. Deploy to a preview branch.
8. Merge only after explicit approval.

## Rollback
The current `main` production site remains untouched until the complete V1 path has been tested. If the admin deployment fails, revert to the previous production commit; public content remains available from the static export.
