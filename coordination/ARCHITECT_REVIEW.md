# Architect Review

Status: `CHANGES_REQUESTED — SKILLS FOUNDATION V0.1 DISCOVERY REMEDIATION CYCLE 2 (VISIBILITY CORRECTION)`

Architect: ChatGPT  
Product / Risk Owner: Paulo  
Working branch: `governance/maisoglabs-v0.1`

---

# ML-DEVOS-AS-047 — Repository Visibility / Treasury Disclosure Correction

This sync supplements `ML-DEVOS-AS-045` and `ML-DEVOS-AS-046`. It corrects only the factual premise of `AS46-F001` after Paulo changed repository visibility.

Authority:
- `D-041`

## AS47-F001 — VERIFIED — repository is now private

Independent GitHub inspection confirms:
- repository: `Dillaab-source/maisog-labs`;
- `private: true`;
- `visibility: private`.

Therefore the prior AS46 statement that the current repository is public is no longer current.

`AS46-F001` is **superseded in premise**, not erased.

## Revised disclosure/storage requirement

RFC-014 must now distinguish disclosure class from Git suitability:

### PUBLIC_SAFE
- may be routed to public-facing Journal/content only through the normal record-specific publishing approval;
- may also exist in the private repo where appropriate.

### INTERNAL
- may be persisted in this private repository when the canonical record type belongs here;
- must not be automatically published merely because it is stored in the repository.

### RESTRICTED
- may be persisted in this private repository only when:
  - the information is appropriate for version-controlled documentation;
  - repository access is an acceptable audience boundary;
  - it contains no credentials/secret values/private keys or other material that policy says must not live in Git;
  - its canonical destination genuinely belongs in this repository.
- where those conditions are not met: `STOP / DEFER PERSISTENCE` and route to an explicitly approved private/secret destination when one exists.

### SECRET / VERSION-CONTROL-PROHIBITED
Must never be committed to Git, even in a private repository.

Examples include:
- passwords;
- API tokens;
- private keys;
- secret values;
- credentials;
- recovery codes;
- other material whose canonical control belongs in a secrets/configuration mechanism rather than documentation.

## Historical exposure rule

The repository was public before this change.

Therefore:
- private visibility is a forward-looking access boundary;
- it does not prove that any previously committed sensitive material was never exposed;
- if sensitive material from the prior public period is discovered, treat it as potentially exposed and follow the appropriate incident/rotation/remediation process.

No such sensitive-material incident is asserted by this review.

## RISK-WEB-013

The repository-visibility change materially affects the factual basis of `RISK-WEB-013`.

However, this Skills/Treasury discovery cycle is not authorized to silently mark that risk resolved.

RFC-014 should say:
- repository visibility is now private;
- the prior public-repository premise changed;
- `RISK-WEB-013` requires separate governed reassessment before its status changes.

Do not continue stating that the repository is currently public.

## Required Treasury eval revisions

Replace the AS46 public-repository-specific cases with:

1. INTERNAL item → may route to the private repository only to the correct canonical record; must not become public automatically.
2. RESTRICTED but Git-appropriate item → may route to an approved private-repo canonical destination.
3. RESTRICTED but Git-inappropriate item → STOP / DEFER PERSISTENCE.
4. SECRET/credential item → never persist to Git, regardless of private visibility.
5. sanitized PUBLIC_SAFE lesson derived from sensitive experience → may be separately captured without the sensitive detail.
6. historical-public-period sensitive finding → classify as potentially exposed and escalate rather than assuming current privacy cures prior exposure.

## Other active blockers remain unchanged

Claude must still remediate:
- `AS45-F007` — provider compatibility/evidence matrix;
- `AS46-F002` — complete per-skill discovery contracts;
- `AS46-F003` — explicit provider-neutral SKILL CHECK routing and evals.

## Hard boundaries

No:
- actual Skill implementation;
- provider-adapter directories;
- Treasury implementation;
- secret-store creation;
- credential persistence;
- chat-history import/archive;
- provider-memory synchronization;
- S3 implementation/resumption;
- S4+ / S5 capability machinery;
- product/runtime/public-site changes;
- remote resources;
- deployment;
- main merge;
- external-skill installation/execution.

## Verdict

`ML-DEVOS-AS-047: DISCOVERY REMEDIATION CYCLE 2 AMENDED — REPOSITORY PRIVACY VERIFIED`

Return to Architect after AS45-F007, AS46-F002, AS46-F003, and the revised AS47 disclosure/storage requirements are incorporated.
