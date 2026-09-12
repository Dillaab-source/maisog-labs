# Content editing guide

Most frequently edited portfolio content should live outside page layout code.

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
