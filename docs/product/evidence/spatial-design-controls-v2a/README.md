# Spatial Design Controls V2A — implementation evidence

Evidence class: **`ACTOR_REPORTED`** (Builder-generated). It stays that way until independent Architect review. It is UI evidence against fixture API responses, not runtime or production evidence.

- **Authority:** `D-082`
- **Architecture review:** `ML-DEVOS-AS-107`
- **Plan:** `docs/product/SPATIAL_DESIGN_CONTROLS_V2_PLAN.md`
- **Directive:** `DIR-SPATIAL-DESIGN-V2A-0001`

## How it was captured

- **Build:** `npm run build` (Next.js static export `out/`), served by a local static file server.
- **Browser:** Chromium (`/opt/pw-browsers`), driven by the environment's globally installed Playwright 1.56.1 through a Builder-local harness. No repository dependency was added. The harness and its raw result JSON are not committed, following the `AS105-F001` precedent.
- **Admin API:** `/admin` is served only behind Cloudflare Access and the Worker, which a static export does not include. The harness therefore intercepted the endpoints with a labelled local fixture:
  - `GET /admin/api/design` returned a fixture status whose `allowedValues`/`allowedRanges` equal the server constants in `worker/admin/design.mjs` and `worker/d1/validate.mjs`;
  - `GET /admin/api/design/preview` returned a fixture preview;
  - `PUT`/`POST` mutations were recorded and answered `{ ok: true }`.
- **Public API:** `/api/design` returned 404, which is the WEB-INC-007 fail-safe baseline. `/api/journal` returned an empty list.
- **Fixture state:** theme Published + Draft; Entry (`home`) Published with stored order 7; Systems (`process`) Draft; Projects Published; Contact (`about`) with no row.
- **Viewports:** desktop 1440×900 at DPR 1; mobile 390×844 at DPR 2, with touch.

## Screenshots (`screenshots/`)

| Viewport | View | File |
|---|---|---|
| Desktop | Spatial Design Controls (admin section) | `desktop-01-spatial-design-controls.jpg` |
| Desktop | Spatial Preview → Entry | `desktop-02-preview-entry.jpg` |
| Desktop | Spatial Preview → Systems | `desktop-03-preview-systems.jpg` |
| Desktop | Spatial Preview → Projects | `desktop-04-preview-projects.jpg` |
| Desktop | Spatial Preview → Research (preview only) | `desktop-05-preview-research.jpg` |
| Desktop | Spatial Preview → Contact | `desktop-06-preview-contact.jpg` |
| Desktop | Spatial Preview → Journal | `desktop-07-preview-journal.jpg` |
| Mobile | Spatial Design Controls (admin section) | `mobile-01-spatial-design-controls.jpg` |

## Harness results (`ACTOR_REPORTED`)

**Admin layout, both viewports:**
- **Fieldset legends:** Atmosphere, Surfaces, Typography, Motion, Collections, Entry content, Systems, Projects, Contact.
- **Control kinds:** only `select`, `input[type=range]`, `input[type=checkbox]` and `input[type=number]`. There is no text, URL, colour or file input, no textarea and no contenteditable.
- **Labels:** zero unlabelled inputs or selects.
- **Navigation-order inputs:** only Systems, Projects and Contact have one. Entry has none.
- **Buttons:**
  - `Save Theme Draft` / `Publish Theme`;
  - `Save Entry Draft` / `Publish Entry`, and likewise for Systems, Projects and Contact;
  - `Refresh raw preview data`, inside a collapsed `Technical preview data` disclosure (closed by default).
- **Mobile width:** the document scroll width equals the client width (390 = 390), so there is no horizontal overflow.

**Submitted payloads (desktop):**
- **`PUT /admin/api/design/sections/home/draft`:** `{ order: 7, visible: true, … }`. The backend id is used, and Entry's stored order is passed through unchanged.
- **`PUT /admin/api/design/sections/process/draft`:** the backend id `process` is used, not "Systems".
- **`PUT /admin/api/design/theme/draft`:** exactly the 15 existing theme keys plus the two expected-pointer keys, with raw enum values (for example `accentPreset: "teal"`).
- **Option values:** each option's `value` is the server enum, and its text is the friendly label (for example `teal` → "Teal").

**Spatial Preview shortcuts (both viewports):**

| Shortcut | Target | Surface opened | Authenticated preview fetched |
|---|---|---|---|
| Entry | `/?design-preview=1` | none (Entry) | yes |
| Systems | `#systems` | Systems (`aria-current`, heading focused) | yes |
| Projects | `#projects` | Projects | yes |
| Research | `#research` | Research, labelled "preview only; fixed destination" | yes |
| Contact | `#contact` | Contact | yes |
| Journal | `/journal?design-preview=1` | Journal page | yes |

"Authenticated preview fetched" means `GET /admin/api/design/preview` was requested; that request is made by the existing `app/DesignRuntime.js` mechanism, which V2A leaves unchanged.
