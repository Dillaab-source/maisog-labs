# Current Directive — D-134 ClinicFlow Meta compliance pages

```yaml
schema_version: 1
directive_id: DIR-CLINICFLOW-META-COMPLIANCE-0001
cycle_id: MAISOGLABS_CLINICFLOW_META_COMPLIANCE
issue_parent_commit: 7f28573d0e8cf2333ab4786e39a0070972a64814
target_turn: CLAUDE
authority_ref: D-134
applicable_review_id: ML-DEVOS-AS-161
sentinel_disposition: CLEAR
su_mode: BOUNDED_CONTRADICTION
su_disposition: CLEAR_WITH_NOTES
```

This directive is transport, not authority. Effective authority is the intersection of live STATE, D-134, and ML-DEVOS-AS-161. For this cycle, the CLAUDE turn token represents Codex/Work acting as the temporary Builder assigned by D-134.

## Objective

Implement and locally validate exactly three public ClinicFlow
compliance pages in the MaisogLabs website:

/clinicflow/privacy

/clinicflow/data-deletion

/clinicflow/terms

Return a repository-local candidate for Architect review.

Do not merge to main.

Do not deploy.

==================================================
## Preconditions

- Protocol V2 bootstrap passes at the exact live tip.
- STATE selects this directive.
- D-134 is durably recorded.
- ML-DEVOS-AS-161 is durably recorded.
- Codex/Work is acting only as the temporary Builder.
- No deployment/main/remote flags are enabled.
- Inspect the real current site/request architecture before deciding
  how these routes are implemented.

Do not assume WordPress.

Do not assume an App Router route will automatically be served by the
current V10.1 production architecture.

==================================================
## Governing references

T0:

- D-134
- live STATE
- ML-DEVOS-AS-161

T1:

- current MaisogLabs routing/build architecture
- OBL-017 production-release separation
- OBL-023 candidate-state/changed-file inspection
- Context Bootstrap Protocol V2
- current public ClinicFlow factual copy where relevant

D-133 is historical/recovery evidence only and must not override D-134
product facts.

==================================================
## Exact execution scope

ALLOWED:

A. Add exactly these public content surfaces:

- ClinicFlow Privacy Policy
- ClinicFlow Data Deletion Instructions
- ClinicFlow Terms of Service

B. Modify only website files directly necessary to serve those exact
public GET paths.

Prefer the smallest mechanism compatible with the CURRENT deployed site
architecture.

Examples may include:

- existing app/page routing;
- existing static/public asset routing;
- directly necessary route tests.

If extensionless route support requires a bounded Worker routing change,
the Builder may make only the smallest GET-routing change necessary for
these three paths, provided it:

- performs no authentication change;
- touches no D1/R2;
- touches no admin route;
- touches no API mutation route;
- changes no unrelated request behavior.

If a broader Worker/backend change is needed:

STOP and return the blocker.

C. Add directly necessary tests for the three routes.

D. Use/update the previously drafted compliance text when available,
subject to D-134 factual requirements.

E. Builder return/governance evidence required by Protocol V2.

NOT ALLOWED:

- ClinicFlow n8n workflow changes;
- Messenger webhook changes;
- Meta App configuration changes;
- Google Calendar/Sheets mutation;
- OpenAI configuration;
- credential changes;
- remote Cloudflare changes;
- D1/R2 writes;
- DNS or Access changes;
- deployment;
- main merge;
- unrelated homepage redesign;
- unrelated project copy;
- general legal-site framework;
- new dependency unless strictly required and returned as a blocker
  before adding it.

==================================================
## Public-content requirements

Public contact:

maisoglabsclinicflow@gmail.com

PRIVACY POLICY

Accurately describe, where applicable:

- Meta / Messenger identifiers used for conversation handling;
- patient message content needed to interpret requests;
- patient name;
- patient contact number;
- requested service;
- appointment date/time;
- booking/reschedule/cancellation state;
- Google Calendar event information;
- local ClinicFlow operational appointment records;
- Google Sheets appointment records.

Relevant service providers may include:

- Meta / Messenger;
- Google Calendar;
- Google Sheets;
- n8n;
- OpenAI.

State that OpenAI may process conversation content for AI
interpretation where applicable.

Do not claim ClinicFlow:

- diagnoses patients;
- gives medical advice;
- stores full medical records;
- processes credit-card payments;
- verifies HMO eligibility;
- replaces clinic staff.

Do not invent retention periods.

DATA DELETION

Provide a clear deletion-request process using:

maisoglabsclinicflow@gmail.com

Explain enough information for a requester to identify the relevant
ClinicFlow data.

Do not invent retention durations.

Cautious language about retention for legitimate operational,
security, or legal purposes is acceptable without inventing specific
periods.

TERMS

Plain-English terms suitable for a pilot/demo appointment automation
service.

Cover:

- appointment automation purpose;
- no medical diagnosis/advice;
- clinic/provider responsibility;
- booking/reschedule/cancellation limitations;
- third-party service dependencies;
- acceptable use;
- service availability/outages;
- reasonable limitations;
- contact information.

==================================================
## Repository safety gate

Before commit, inspect the exact diff.

The diff must contain PUBLIC WEBSITE CONTENT ONLY plus directly
necessary route/test/governance files.

Never commit:

- .env files;
- API keys;
- OpenAI keys;
- Meta App Secret;
- Meta Page Access Token;
- webhook verification tokens;
- OAuth secrets;
- Google refresh/access tokens;
- n8n credential values;
- n8n encryption keys;
- credential exports;
- patient names;
- real patient phone numbers;
- Messenger user IDs;
- booking IDs;
- Calendar event IDs;
- Google Sheet records/data;
- production execution payloads;
- database dumps;
- private screenshots.

Do not place ClinicFlow operational data in GitHub.

Run existing repository secret/security checks where available.

If any credential, secret or real personal data appears:

STOP BEFORE COMMIT.

==================================================
## SENTINEL Sync

Authority:
D-134, issued by Paulo.

Context:
The current task is public compliance content required for Meta
publishing. ClinicFlow runtime development is outside scope.

Capability:
Repository/local implementation, local tests/build and governed Git
publication only.

No remote production action is authorized.

Evidence:
Exact diff, tests, build, route checks, secret scan, personal-data scan,
and Builder handoff.

Disposition:
CLEAR.

==================================================
## SU Contradiction Check

Mode:
BOUNDED_CONTRADICTION

Disposition:
CLEAR_WITH_NOTES

Notes:

1. D-133 could not access the actual ClinicFlow implementation.
   D-134 supplies later owner-approved facts for compliance copy.
   Use D-134 for those facts.

2. A static V10.1 site may not automatically serve framework routes.
   Inspect actual routing first.

3. Legal/compliance pages must not require authentication.

4. OpenAI can be named as a service provider without publishing any API
   key, project id or credential metadata.

5. "Public policy page" does not authorize production deployment.
   Public reachability is verified only at a later release/deploy gate.

==================================================
## Instructions

1. Bootstrap from the exact governance tip.

2. Inspect current website request/build routing.

3. Determine the smallest valid implementation for the three exact
   paths.

4. Prepare/update the three compliance pages.

5. Keep design consistent with MaisogLabs while prioritizing readable,
   mobile-friendly legal text.

6. Add directly necessary tests.

7. Run repository safety scans.

8. Run required validation.

9. Inspect the exact changed-file set manually.

10. Publish one Protocol V2 Builder return.

Do not open a deployment gate automatically.

==================================================
## Validation and evidence

At minimum run and report:

- npm test
- npm run build
- git diff --check
- applicable Context Bootstrap/repository validators
- targeted tests for all three compliance routes

Also verify locally:

- privacy route returns/render successfully;
- deletion route returns/render successfully;
- terms route returns/render successfully;
- no authentication required;
- mobile/readable layout;
- correct ClinicFlow email;
- OpenAI disclosure appears where required;
- no placeholder content;
- no secret values;
- no real personal/patient data.

Security report must include:

SECRET SCAN: PASS / FAIL
PERSONAL DATA SCAN: PASS / FAIL
PUBLIC CONTENT ONLY: YES / NO

Evidence from Builder tests remains ACTOR_REPORTED until Architect
review.

==================================================
## Stop conditions

STOP and return without widening scope if:

- serving the routes requires a broad Worker/backend redesign;
- a new database/schema is required;
- remote D1/R2 is required;
- authentication changes are required;
- a new dependency is materially required;
- factual ClinicFlow behavior is unclear and would require invention;
- legal copy would require an unsupported product claim;
- a secret or personal record appears in the candidate diff;
- the governance branch moves during publication;
- the Context Bootstrap checker refuses the transition.

==================================================
## Next action

On successful bounded implementation, publish:

H-CLINICFLOW-META-COMPLIANCE-0001

unless an unused deterministic handoff ID is mechanically required.

Return STATE to:

TURN: ARCHITECT
STATUS: READY_FOR_ARCHITECT

ARCHITECT_ACTION_REQUIRED: YES
IMPLEMENTER_ACTION_REQUIRED: NO
PAULO_DECISION_REQUIRED: NO

Set CURRENT_HANDOFF ACTIVE with the matching identity tuple.

Set CURRENT_DIRECTIVE NONE and archive this directive byte-for-byte
with provenance/index according to Protocol V2.

All remote/deploy/main flags must be NO on return.

No merge or deploy follows automatically.
