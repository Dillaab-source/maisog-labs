# Current Directive — WEB-REL-002 Gate B: Release PR Review Only

```yaml
schema_version: 1
directive_id: DIR-WEB-REL-002-GATE-B-0001
cycle_id: MAISOGLABS_WEB_REL_002_GATE_B
issue_parent_commit: 7e2bbe2148e2112b58979401308216cceb631091
target_turn: CLAUDE
authority_ref: D-084
applicable_review_id: ML-DEVOS-AS-113
sentinel_disposition: CLEAR
su_mode: ESCALATED_RESEARCH
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective scope is the intersection of:
- live STATE;
- `D-084`;
- `ML-DEVOS-AS-113`;
- this directive.

Anything outside that intersection is a stop condition. The Builder published this directive as mechanical publisher of Paulo's `D-084`.

## Objective

Execute WEB-REL-002 Gate B:
- open exactly one fresh PR from `governance/maisoglabs-v0.1` to `main`;
- collect the D-084 evidence;
- return to the Architect.

There is no merge.

## Preconditions

- A fresh Protocol V2 bootstrap of the tip that publishes this directive.
- `main` still equals `882ad253b5dbec06b209d1ee1a2a54b21b392e2e`.
- No other open governance→main PR exists.
- D-068 stays untouched.

## Governing references

- **Authority:** `D-084`.
- **Release shape:** `ML-DEVOS-AS-113`, `docs/release/WEB_REL_002_RELEASE_SCOPE_REVIEW.md`.
- **Precedent:** `D-054`–`D-057`, `ML-DEVOS-AS-070`–`ML-DEVOS-AS-074`.
- **Obligations:** `coordination/OPERATIVE_OBLIGATIONS.md`, specifically OBL-017 and OBL-018.

## Exact execution scope

**Allowed:**
- one GitHub PR create call (head `governance/maisoglabs-v0.1`, base `main`);
- read-only GitHub reads (PR, files, checks, reviews, workflow runs);
- the Protocol V2 return commit on the governance branch (`CURRENT_HANDOFF`, STATE, directive archive).

**Not allowed:**
- no merge, auto-merge, update-branch, close/reopen or PR edit beyond creation;
- no push to `main`;
- no Cloudflare, D1, R2, Access or DNS action;
- no product/runtime/test/config change;
- no action on PR #7 or PR #10.

## SENTINEL Sync

Snapshot `7e2bbe2148e2112b58979401308216cceb631091`, from a fresh `--session-protocol 2` bootstrap (exit 0).

**Live state:**
- `TURN: PAULO`;
- scope `AS113_WEB_REL_002_RELEASE_SHAPE_ACCEPTED_PAULO_GATE_B_DECISION_ONLY`;
- `CURRENT_DIRECTIVE: NONE`, `CURRENT_HANDOFF: NONE`;
- all flags NO.

**Repository checks:**
- `origin/main` = `882ad253…` (unchanged since AS-113).
- The delta since the AS-113-reviewed Builder return `613fc8f` is governance records only: AS-113, the handoff archive and STATE.
- Open PRs into `main` are legacy #1, #2, #6 and #7. PR #10 targets `sentinel-handoff-base`.

Disposition `CLEAR`.

## SU Contradiction Check

Mode `ESCALATED_RESEARCH`, because the action touches the production-release path. Disposition `CLEAR_WITH_NOTES`.

**Notes:**
1. Opening the PR triggers D-055-permitted Cloudflare preview builds. That is not production.
2. Every governance commit, including this directive and the return, advances the PR head. CI must therefore be green on the final head. The return handoff cannot contain CI for its own commit, so the Architect must confirm the final-head run.
3. The PR is opened as a draft, following the WEB-REL-001 precedent (D-054 "draft/review pull request"), so it cannot be merged by accident.
4. The ruleset configuration may not be readable with the available tools. If so, it is recorded as a limitation, not inferred.

## Instructions

1. Verify the preconditions.
2. Open one draft PR, titled `WEB-REL-002: governance/maisoglabs-v0.1 → main (Gate B review only — DO NOT MERGE without Gate C)`, with a body summarizing AS-113 scope, D-084 and the gates.
3. Record:
   - the PR number;
   - the base SHA;
   - the head SHA;
   - the changed-file count and classification against the AS-113 inventory, with only governance-record additions allowed since `2cdbf44`;
   - mergeability and mergeable state;
   - review threads;
   - the check runs;
   - the protection evidence available.
4. Wait for `test-and-build` on the PR head and record its result.
5. Publish the Protocol V2 return, then confirm CI on the new final head in the session report.

## Validation and evidence

- The GitHub API responses (`ACTOR_REPORTED` via the Builder's GitHub connector).
- The git diff against the AS-113 inventory.
- A Context Bootstrap check-only run before each publish.

## Stop conditions

Stop if any of these occurs:
- `main` moved;
- another governance→main PR exists;
- the PR diff includes non-governance changes beyond the AS-113 inventory;
- CI is red and not attributable to infrastructure. In that case report it; do not fix it under this directive.
- Any merge, deploy, Cloudflare, or PR #7/#10 action would be needed.
- A stale tip or protocol mismatch.

## Next action

The Builder executes Gate B, then publishes one Protocol V2 return commit containing:
- `CURRENT_HANDOFF`;
- the directive archived;
- `CURRENT_DIRECTIVE: NONE`;
- `TURN: ARCHITECT`.

Then it stops.
