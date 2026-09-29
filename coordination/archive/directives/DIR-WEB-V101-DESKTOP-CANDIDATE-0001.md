# Current Directive — V10.1 desktop remediation candidate (D-120)

```yaml
schema_version: 1
directive_id: DIR-WEB-V101-DESKTOP-CANDIDATE-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
issue_parent_commit: e2e6d243b21ad90f81ac5f9db376f2dc4fc8ef83
target_turn: CLAUDE
authority_ref: D-120
applicable_review_id: ML-DEVOS-AS-144
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of live STATE, D-120 and `ML-DEVOS-AS-144`.

## Objective

Produce one reviewable V10.1 desktop candidate, in the repository only, that preserves the approved V10 identity and fixes the bounded desktop launch issues D-120 lists.

## Preconditions

- The Protocol V2 bootstrap passes; STATE selects this directive; `MUTATION_AUTHORIZED` (repository-local) is the only `YES` flag.
- The canonical artifact `public/index.html` has SHA-256 `2417f7e50ff032bf4af8c9f64446550b3695fcf5597c95f4b21901f7093259f9` and stays unchanged and production-authoritative.
- The five D-115 production drafts stay unchanged and unpublished.

## Governing references

- **T0:** Protocol V2; D-120; live STATE; `ML-DEVOS-AS-144`.
- **T1:** `ML-DEVOS-RFC-022` (§5.1 payload seam, §5.2 injection, §5.4 fallback); D-093 (the homepage artifact); D-115 (content); `design-references/claude-v10/`.

## Exact execution scope

Allowed:
- repository-local candidate source, build output and tooling, kept separate from the canonical `public/index.html`;
- local/headless Chromium tests at 1440×900 and 1280×720; screenshots;
- documentation of the artifact/bridge migration needed to promote later;
- implementation commits and one Protocol V2 Builder return on `governance/maisoglabs-v0.1`.

Not allowed:
- replacing `public/index.html` or changing `ARTIFACT_SHA256`/`INSERTION_OFFSET` for production use;
- any production D1/R2/Access/DNS/binding/secret/environment change;
- deploy; Gate C; `main` merge;
- project content edits, publication or activation; contact/`site_settings` changes;
- mobile remediation.

## SENTINEL Sync

- **Authority:** D-120 (Paulo).
- **Context:** AS-144 accepted the desktop preview; V10.1 issues remain before activation.
- **Capability:** repository-only candidate.
- **Execution:** investigate, then fix within the stop rule.
- **Evidence:** diff, candidate SHA, screenshots, tests, compatibility assessment.

Disposition `CLEAR`.

## SU Contradiction Check

`BOUNDED_CONTRADICTION`, `CLEAR_WITH_NOTES`.
- **Hardening vs identity:** runtime hardening can conflict with "preserve V10 exactly". The stop rule governs: if it needs replatforming or a large build system, defer it with the smallest future path.
- **Bridge coupling:** the RFC-022 bridge verifies the exact artifact bytes (SHA-256 plus insertion offset). A candidate artifact therefore cannot be served by the current Worker. Promotion needs a separate, governed constants and test update plus Gate C/D.

## Instructions

1. Bootstrap. Investigate the artifact pipeline and the MLData seam.
2. Implement the bounded fixes in a candidate artifact. Decide runtime hardening as IMPLEMENTED or DEFERRED.
3. Test at both viewports; assess RFC-022 compatibility.
4. Publish the return.

## Validation and evidence

The eleven return items in D-120.

## Stop conditions

- Any fix would need a redesign, a project content change or a production action.
- Hardening crosses the D-120 stop rule: defer that subtask only.

## Next action

Publish `H-WEB-V101-DESKTOP-CANDIDATE-0001`. Archive and deselect this directive, reset every flag to `NO`, and route `TURN: ARCHITECT`.
