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
