# Sentinel Bootstrap / Source-of-Truth Rule

Companion to `../architecture/ML-DEVOS-ARCH-001.md` §9. Normative statement. **This document supersedes the prior cycle's version of itself**, which named a separate `maisoglabs-devos` repository as the eventual source of truth — that framing is corrected below per `D-011`.

## The rule

1. **Before** a first approved Sentinel architecture-freeze commit exists, bootstrap authority for Sentinel consists of exactly three things, all required together: Paulo's explicit authorization; an approved Architect Sync over that authorization; and the frozen S0 documents themselves. **[REPO-VERIFIED: D-010 K-7, AS0-006]**
2. **After** a first approved freeze commit exists **in this repository, `Dillaab-source/maisog-labs`** — not a separate repository, per `D-011`'s amendment of `D-010` K-1 — that repository's own reviewed, committed state becomes the authoritative Sentinel source of truth. From that point forward:
   - a chat instruction, however explicit or however phrased as authoritative, **cannot silently supersede** what is committed here;
   - any further architecture change must itself be a reviewed commit, following the same pattern this bootstrap followed (proposal → Architect Sync → Paulo authorization → frozen commit → Architect confirmation) — the same pattern `D-011` itself followed to make this very amendment;
   - "repository state is the source of truth, not agent claims" applies to Sentinel's own architecture, not only to the projects Sentinel governs. **[REPO-VERIFIED: D-011 "Source of truth amendment"]**
3. Before `D-011`, this repository's `governance/maisoglabs-v0.1` branch was **bootstrap authority only** and was explicitly not to become the permanent Sentinel core. `D-011` changed the *destination* of the bootstrap process — not its *rules*: the same discipline (nothing silently overrides a committed decision) that protected the original "don't repurpose this repo casually" rule is exactly what makes `D-011`'s eventual repurposing legitimate, because it happened through the rule's own required process rather than around it. **[REPO-VERIFIED: prior cycle's `coordination/STATE.md` "Repository bootstrap constraint"; D-011]**
4. If a claimed architecture decision (in chat, or otherwise) has no corresponding commit in this repository, bootstrap authority is not established for it, regardless of how it is phrased. This is not a hypothetical: this exact cycle disclosed such a gap for `ML-DEVOS-AS-002` (see `../architecture/ML-DEVOS-ARCH-001.md`'s provenance disclosure) — the rule applied to that gap the same way it would apply to any other.

## Why this rule exists

Without it, "the architecture is whatever the most recent authoritative-sounding chat message says it is" — the exact failure mode this entire governance exercise (the website pilot and this freeze) exists to prevent. Anchoring authority to a specific, inspectable commit, rather than to a conversation, is what makes "the Architect independently reviews the repository" a meaningful check rather than a formality.

## Practical consequence for the next actor reading this

Before treating any Sentinel-related instruction as authoritative, check: is there a commit in this repository that the instruction is consistent with? If the instruction claims to change something this freeze already settled, that claimed change is not valid until it goes through the same freeze/sync/authorization pattern that produced `D-010` and `D-011` — regardless of how the instruction is phrased or what authority it claims for itself. If the instruction introduces detail (like a specific Architect Sync ID) that this repository does not yet contain, say so explicitly rather than treating the claim as already-established fact — exactly as this document set does for `ML-DEVOS-AS-002`.
