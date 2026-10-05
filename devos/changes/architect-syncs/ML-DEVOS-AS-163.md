# Architect Review — D-135 deployment incident and ClinicFlow case-study routing

Architect Sync: ML-DEVOS-AS-163
Status: D-135 CLOSED; CASE-STUDY S1 ROUTED TO BUILDER
Cycle: MAISOGLABS_CLINICFLOW_D135_INCIDENT_AND_CASE_STUDY
Authority: D-136 (retain disposition); D-137 S1 of 1 (case-study implementation)
Reviewed handoff: H-CLINICFLOW-D135-GATE-C-0001
Review target: 55b7de2a2427c5198aae432c24e83447b08833ec
Protocol: PROTOCOL_VERSION 2

## Verdict

D-135 Gate C protected merge: ACCEPTED. The D-135 incident is recorded and the cycle is CLOSED. The deployment remains classified as an unauthorized production promotion; Paulo's subsequent decision retains the resulting state and does not retroactively authorize the Oct 4 action.

READY FOR BUILDER: YES — D-137 S1 of 1, bounded ClinicFlow case study only.

## Independent evidence

- **Repository / CI (Architect-reproduced):** Governance tip was `55b7de2a2427c5198aae432c24e83447b08833ec`; `main` contains merge commit `b5db67416ed56928826181d546ce0f0d55c19e7d`, whose exact PR head was `9d01b53038419f75550fa2996a47343fba1d220a`. D-135 and the handoff record fresh successful protected `test-and-build` on that exact head.
- **Cloudflare production (production/runtime evidence):** Read-only deployment query returned deployment `71e7bc54-a5bb-453d-81d2-44eb8e08a6bc`, version `5d315120-2647-46c0-a146-64d2a86eaec1`, allocation 100%, latest in the deployment list. Version metadata carries the `governance-maisoglabs-v0-1` upload annotation. The D-135 handoff ties the version to the exact Gate C source head.
- **Live site (production/runtime evidence):** MaisogLabs homepage rendered. `/clinicflow/privacy`, `/clinicflow/data-deletion`, and `/clinicflow/terms` each rendered with the expected page title/content and internal links. No authentication barrier, visible runtime error, or evidence of a technically necessary rollback was observed.
- **CAS capability check (Architect-reproduced):** The required stale expected-old-value lease was rejected against a controlled local bare Git remote after the ref was moved to an ancestor; the ref remained unchanged. Live GitHub tip resolution and the repository checker also passed. The existing full `context-bootstrap.test.mjs` fixture suite could not complete on this Windows host because its Git fixtures fail on Windows with a null-device redirection error (`Invalid argument`); this limitation is disclosed and the manual stale-lease proof passed.

## Incident determination

Cloudflare audit evidence from the prior read-only triage and the current deployment record establish that the version was promoted through the dashboard to 100% by an authenticated user. D-135 allowed Gate C merge only and recorded `DEPLOY_AUTHORIZED: NO`. Classification: **C — unauthorized human/API promotion**, more specifically a dashboard user promotion. This is an authorization/process violation. No inference about intent is made.

D-136 is a new present-tense Owner decision to retain the current deployment. The artifact passed protected CI and the runtime verification above found no evidence of defect. Rollback is not required and was not performed. D-136 does not amend D-135 or authorize the historical action retroactively.

## SENTINEL Sync

Disposition: CLEAR for D-135 closure and D-137 S1 routing.

Evidence supports closure of the completed Gate C cycle while retaining the unauthorized historical promotion as an incident record. The live production state is retained under D-136. No production mutation, deploy, rollback, traffic change, ClinicFlow runtime action, or n8n workflow action is in scope.

## SU Contradiction Check

Mode: BOUNDED_CONTRADICTION
Disposition: CLEAR_WITH_NOTES

1. D-136 retention is prospective and does not retroactively authorize the Oct 4 promotion.
2. D-137 allows only a local, bounded portfolio page and sanitized evidence; it does not authorize deployment, merge, or ClinicFlow runtime changes.
3. Public evidence must omit patient data, credentials, identifiers, private URLs, and control-plane screens.
4. The full Protocol V2 test fixture run has a Windows null-device redirection limitation; the checker passed at the exact live tip and a controlled stale-lease proof passed. The fixture limitation remains disclosed.

## D-135 disposition

- Gate C protected merge: ACCEPTED.
- Historical unauthorized production promotion: RECORDED under D-136; malicious intent: NO CONCLUSION.
- Active artifact: RETAINED by Paulo's present-tense Owner decision.
- Rollback: NOT REQUIRED; none performed.
- D-135 cycle: CLOSED. D-135 did not authorize deployment.

## D-137 routing

Route `TURN: CLAUDE` (temporary Codex/Work Builder assignment for this cycle) to execute D-137 S1 of 1. Scope is exactly the Owner-authorized `/projects/clinicflow` case study, sanitized evidence and local preview. Required validation: `npm test`, `npm run build`, mobile/desktop preview, privacy/security scan, exact changed-file inspection, and Builder handoff. All production, merge, Cloudflare traffic, remote D1/R2, credential, Calendar/Sheets mutation and ClinicFlow runtime flags remain `NO`.

## Next action

Builder implements D-137 S1 and returns a reviewable local commit/preview with evidence. No merge or deployment follows automatically.
