```yaml
schema_version: 1
handoff_id: H-CLINICFLOW-CASE-STUDY-S1-0001
cycle_id: MAISOGLABS_CLINICFLOW_CASE_STUDY
input_base_commit: e98a6cda2fd6b3a95786eee1f532f1890979c7b9
review_target_commit: e98a6cda2fd6b3a95786eee1f532f1890979c7b9
applicable_review_id: ML-DEVOS-AS-163
```

## Objective

Complete the evidence-focused update to the existing `/projects/clinicflow` case study under D-137 S1. Preserve its approved structure, verify the benchmark source, and return the local static page for Architect review.

## Changed files

- `app/projects/clinicflow/page.js` — reprioritized the existing evidence cards and added the measured benchmark, real-provider, same-slot, restart, and negative-control results. The initial benchmark FAIL and later offline replay are stated separately.
- `app/projects/clinicflow/clinicflow.css` — emphasizes the benchmark evidence card and makes the architecture diagram horizontally readable on narrow screens while retaining the accessible ordered flow below it.
- `public/projects/clinicflow/clinicflow-architecture.svg` — existing page-specific architecture visual, included in the route output.
- `coordination/CURRENT_HANDOFF.md` — this return packet.
- `coordination/STATE.md` — routes to Architect, selects this handoff, and clears the Builder directive and action flags.
- `coordination/archive/directives/DIR-CLINICFLOW-PORTFOLIO-CASE-STUDY-0001.md` — byte-exact outgoing directive archive.
- `coordination/archive/directives/DIR-CLINICFLOW-PORTFOLIO-CASE-STUDY-0001.provenance.json` and `coordination/archive/directives/README.md` — archive provenance and index.

No route/support file outside the ClinicFlow page scope was needed. No ClinicFlow runtime, workflow, credential, calendar, webhook, production, or homepage behavior was changed.

## Tests and evidence

- `node --test tests/clinicflow-pages.test.mjs` — **PASS**, 5/5. This existing focused suite checks the ClinicFlow legal pages; the `/projects/clinicflow` route itself is additionally confirmed in the static build.
- `npm run build` — **PASS**. Static export includes `/projects/clinicflow`.
- `npm test` — **FAIL**. The repository-wide run returned non-zero with multiple unrelated failures, including Windows shell/symlink assumptions, governed-publication fixture cases, and Worker content fixture/hash expectations. The ClinicFlow-focused 5-test suite passed; no new test file was added.
- `git diff --check` — **PASS** for the staged implementation; rerun on the complete handoff candidate before publication.
- Static content review — exported HTML contains the benchmark cost/status, provider and concurrency evidence, restart and negative-control cards, and the honest capture note. A scoped secret/identifier search found no credentials, tokens, OAuth data, private URLs, or patient identifiers in the public page assets; the SVG namespace was the only URL-pattern match.
- Desktop/mobile rendered review — **NOT COMPLETED**. The browser policy rejected the local `file:` preview, and the sandbox denied a loopback-only HTTP bind. Static CSS/build checks confirm the desktop grid, single-column mobile cards, narrow-screen architecture scroll, and ordered text flow, but do not substitute for a rendered visual inspection.

### Benchmark evidence — Builder-reported

Source: ClinicFlow `tests/evidence/su-burn/report.json` and `docs/clinicflow/SU-BURN-1.md`.

- **Status B — EXECUTED WITH FAILURES.** Frozen initial verdict: **FAIL**.
- Calls: **3,000** real model calls; **0** skipped; **0** HTTP/API errors.
- Exact reported total model cost: **$0.34080639999999895**. Input tokens **6,680,657** (of which **5,305,231** cached); output tokens **300,363**.
- Latency: p50 **2,143 ms**, p95 **2,868 ms**, p99 **3,636 ms**.
- Schema validity **100%**; service accuracy **97.45425616547335%**, below the frozen **98%** gate; booking-vs-question accuracy **100%**; exact decision **98.72093023255814%**; reschedule recognition **100%**.
- Initial emergency recall **39/40 (97.5%)**, precision **100%**; one genuine emergency miss. Frozen system diagnosis flags **20** were adjudicated scorer false positives (20 → 0 adjudicated); they remain in the original frozen FAIL record. Consent accuracy measured **79.80769230769231%**.
- Duplicate, wrong, unconfirmed, false-confirmation, fabricated-availability, false-success, cross-user leakage, stale acceptance, and silently lost-turn counts were **0**. There were **33** duplicate deliveries with **0** extra model calls; **270** button turns with **0** model calls.
- Scheduling simulation: **120 conversations**, **5 waves**, **571 turns**; each contested slot had one winner. Of **28** reschedule confirmations, **10** moved the same event and **18** correctly stayed/reverted under contention.
- All **7/7** benchmark negative controls failed on their targeted invariant. These were deliberate broken-build controls, not booking failures in the normal run.
- A targeted no-call safety fix then passed **9/9** acceptance checks. Offline replay of the same 3,000 outputs reached **40/40** emergency recall; it added **0** paid calls. Service accuracy remained **97.45425616547335%**, so the quality gate debt remains. The page distinguishes this replay from new calls and real provider bookings.
- The benchmark exercised real model interpretation plus offline replay against in-memory state/mock calendar for its scheduling waves. It was **not** 3,000 real Calendar bookings.

### Other selected evidence — Builder-reported

- Real Google test-calendar provider suite: **15/15** cases passed, covering availability, exact-slot revalidation, create, retry/idempotency, conflicts, uncertain outcomes, read-back, and overlap checks. Wrong/duplicate/unconfirmed/false-success metrics were **0/0/0/0**.
- EG-03-L local exclusion test: **18** contested pairs over **3/3** runs; **0** double bookings, loser provider creates, or false-success results. Scope is one n8n instance + SQLite + mock Calendar; it does not establish distributed/multi-writer exclusion.
- F2 state-kernel run after server-process restart: **12/12** checks passed; fault-injection controls also demonstrated load-bearing CAS, deduplication, and provenance checks.
- Messenger simulator: **12/12** checks passed using mock services. A separate Development-mode tester window completed **one** booking and was then closed; that interaction has no sanitized screenshot in the approved evidence set.

## Unresolved findings and limitations

- Sanitized real Messenger conversation and Google Calendar event screenshots are still missing. No product screenshots were added; no n8n editor/control-plane screen or synthetic substitute is shown. The page retains its honest capture note.
- No demo video was created because there are no approved, sanitized real UI captures to assemble.
- The desktop/mobile page has not received rendered visual review because the local browser preview could not be opened under the current security policy. The static build and source-level responsive checks pass; Architect review should include a rendered preview when an approved preview path is available.
- The full repository suite remains red as described above. Benchmark service-mapping quality remains below its frozen 98% target.
- This is local case-study work only; no production deployment or main merge is part of this return.

## Governing references

- D-137 S1 and `ML-DEVOS-AS-163` in `coordination/ARCHITECT_REVIEW.md` and `coordination/CURRENT_DIRECTIVE.md`.
- Original ClinicFlow case-study brief and evidence-only resume directive.
- `coordination/OPERATIVE_OBLIGATIONS.md` — all unresolved rows remain in force.
- Protocol V2 (`brain/protocols/CONTEXT_BOOTSTRAP.md`, RFC-020); implementation handoff requirements (`.agents/skills/implementation-handoff/SKILL.md`).

## Evidence locations

- MaisogLabs route: `app/projects/clinicflow/page.js`; styles: `app/projects/clinicflow/clinicflow.css`; diagram: `public/projects/clinicflow/clinicflow-architecture.svg`.
- ClinicFlow source evidence: `tests/evidence/su-burn/report.json`, `tests/evidence/su-burn/report-1.1-replay.json`, `docs/clinicflow/SU-BURN-1.md`, `docs/clinicflow/F3-REAL-checkpoint.md`, `docs/clinicflow/EG-03-L-checkpoint.md`, `docs/clinicflow/F2-checkpoint.md`, and `docs/clinicflow/MSG-ADAPTER-checkpoint.md` in the ClinicFlow working tree.
- Built route output: `out/projects/clinicflow.html` in the MaisogLabs worktree.

## Next action

Architect performs **CHANGE REVIEW** of the exact handoff commit, checks that the evidence wording preserves the benchmark FAIL and scope limits, and arranges an approved rendered preview if visual sign-off is required. Stop at Architect review. Any main merge or deployment requires a later, separate authorization.
