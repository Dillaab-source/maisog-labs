# Generated Claude Code exposure bridge — do not hand-edit

Every `SKILL.md` under this directory is a **deterministic, byte-for-byte copy** of the canonical Skill payload at the matching path under `.agents/skills/<name>/SKILL.md`. Nothing here is independently authored.

- Regenerate: `node scripts/generate-claude-skills-bridge.mjs`
- Detect drift (missing/stale/hand-edited bridge files): `node scripts/validate-claude-skills-bridge.mjs`

Each `SKILL.md` in this directory begins at byte 0 with its canonical YAML frontmatter — no banner or notice is added inside any `SKILL.md` file, because Claude Code requires frontmatter at the top of the file. This README carries the generated-status notice instead.

Authority: `ML-DEVOS-RFC-014` / `ML-DEVOS-AS-050` / `ML-DEVOS-AS-051` (`AS51-F005`) / `D-042`.
