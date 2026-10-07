# Builder Handoff — D-143 blocked: admin discipline order preservation

```yaml
schema_version: 1
handoff_id: H-WEB-D143-CTA-ORDER-BLOCKED-0001
cycle_id: MAISOGLABS_PROJECT_CASE_STUDY_CTA
input_base_commit: a59f6ec67d393a23c899931d378b4db5cfd59406
review_target_commit: a59f6ec67d393a23c899931d378b4db5cfd59406
applicable_review_id: ML-DEVOS-AS-170
```

This packet returns the blocked D-143 attempt for independent Architect review. It records evidence and grants no additional authority. D-143 remains unpublished; production draft revision 12 must not be published.

## Objective

Return the exact-scope failure evidence for D-143. The existing supported Projects admin save path reorders ClinicFlow disciplines, so the saved draft differs from published revision 7 in an additional field. Stop without publishing and await Architect routing before any separately authorized D-144 implementation.

## Changed files

This governance return changes only:

- `coordination/CURRENT_HANDOFF.md`
- `coordination/STATE.md`
- `coordination/archive/directives/DIR-WEB-D143-CLINICFLOW-CTA-ACTIVATION-0001.md`
- `coordination/archive/directives/DIR-WEB-D143-CLINICFLOW-CTA-ACTIVATION-0001.provenance.json`
- `coordination/archive/directives/README.md`

No application source, tests, production content, D1 row, Worker, deployment, migration, R2 object, Cloudflare setting, Access policy, DNS record, PR, or `main` ref was changed in this return.

## Tests and evidence

Evidence class: Builder-observed through the GitHub connector, local Protocol V2 checker, Cloudflare D1 read-only query, and the previously observed protected admin UI. No production write was performed during this blocked return.

### Governance bootstrap

- Fresh GitHub branch read resolved `governance/maisoglabs-v0.1` to `a59f6ec67d393a23c899931d378b4db5cfd59406`; direct `git ls-remote` read the same tip.
- STATE at that exact tip selected D-143 directive `DIR-WEB-D143-CLINICFLOW-CTA-ACTIVATION-0001`, with D-143-only mutation authority active and no handoff selected.
- Live Architect review is `ML-DEVOS-AS-170`, accepting and closing D-142 while returning content activation to Paulo.
- `node scripts/check-context-bootstrap.mjs --commit a59f6ec67d393a23c899931d378b4db5cfd59406 --session-protocol 2` passed after local network access was enabled. Protocol version, exact snapshot freshness, D-143 directive binding and issue parent, 26-row obligations inventory, frozen legacy handoff, and AS-170 archive identity all passed.

### Production revision evidence

A read-only query against production D1 database `45b87574-e573-4e0f-9bb6-fbba2df29523` returned:

- ClinicFlow published revision pointer: `7`; CTA value `0`; disciplines JSON `[0,1,4,3]`.
- ClinicFlow draft revision pointer: `12`; draft revision number `4`; CTA value `1`; disciplines JSON `[0,1,3,4]`.
- Query metadata: `changes: 0`, `changed_db: false`, `rows_written: 0`.

Revision 12 remains unpublished. It was not edited or republished during this return.

### Serializer cause

- Accepted production source baseline: `main` commit `d7d30e7c1d0a894e628fab82dbd8ed380cc878af`.
- In `app/admin/ContentClient.js`, `projectFormFrom` copies the existing disciplines array into form state, but `body()` serializes it using `disciplines: [...form.v10.disciplines].sort((a, b) => a - b)` (line 117 at the inspected source). This forces ascending numeric order on every admin save, including saves that change only another field.
- The existing checkbox UI has no supported control for reordering discipline indexes. Therefore the supported workflow cannot retain `[0,1,4,3]` while saving the CTA field; the observed draft reflects the serializer's normalization.
- D-143 requires the complete draft to differ from published revision 7 only by `caseStudyEnabled: false -> true`. The disciplines-order difference violates that exact scope. Publishing draft 12 is prohibited.

The UI control inspection was observed earlier in the same task. No new browser Save or Publish action was performed after the order discrepancy was identified.

## Unresolved findings and limitations

- D-143 is blocked on the serializer behavior. No corrected draft can be produced through the existing supported workflow while preserving the published discipline order.
- No full-field export comparison was run in this return; the live read confirms the requested CTA and discipline fields and pointers. The previously observed save result and inspected serializer establish the extra discipline-order delta.
- A source correction requires separate governed implementation authority. Paulo has supplied a new D-144 authorization in conversation, but it is not yet a published governance directive. Per the requested sequence, implementation waits for this Architect review and routing.
- No Architect disposition is fabricated here. The Architect must independently review this handoff and publish its own routing disposition.

## Governing references

- D-143 Owner Decision and active directive `DIR-WEB-D143-CLINICFLOW-CTA-ACTIVATION-0001` at the starting governance tip.
- `ML-DEVOS-AS-170`, which accepted D-142 Gate D and explicitly left content activation for separate Owner authority.
- Protocol V2: `brain/protocols/CONTEXT_BOOTSTRAP.md`; routing rules: `brain/protocols/ARCHITECT_SYNC.md`.
- Carry-forward inventory: `coordination/OPERATIVE_OBLIGATIONS.md`, including `OBL-017`.

## Evidence locations

- Starting STATE and D-143 directive: governance commit `a59f6ec67d393a23c899931d378b4db5cfd59406`.
- Checker output: exact-tip Protocol V2 read-only checker run recorded above.
- Serializer: `app/admin/ContentClient.js` at accepted main `d7d30e7c1d0a894e628fab82dbd8ed380cc878af`.
- Live revision evidence: production D1 database UUID `45b87574-e573-4e0f-9bb6-fbba2df29523`, read-only revision-pointer query.
- Directive source blob: `a895aa1cb5f6962eeb8e1f6a46c34fccd4b89248`; archived byte-identically in this governance transition with provenance and index entry.

## Next action

Architect: independently review the D-143 blocked return and publish routing. After that routing, Paulo's separate D-144 authorization may be recorded as a new Owner Decision and bounded implementation directive. Do not publish revision 12, edit ClinicFlow content, or treat D-144 chat text as a published directive.
