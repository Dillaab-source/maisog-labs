# Sentinel Traceability V1

Authority chain: `ML-DEVOS-RFC-012` (ACCEPTED) → `ML-DEVOS-AS-037` (ARCHITECT_APPROVED) → `D-036` (Paulo: "okay do that").

## What this is

A repository-only, read-only static traceability subsystem. It discovers
governance-ID definitions from surfaces that are already authoritative
(RFC/AS/ADR files, `brain/DECISION_LOG.md`, `brain/RISK_REGISTER.md`,
`brain/TEST_LEDGER.md`, `docs/product/BUILD_PLAN.md`,
`docs/MAISOGLABS_WEBSITE_GOVERNANCE_ADMIN_PLAN_v0.1.txt`,
`devos/governance/rules/core-rules.json`), extracts every textual reference
to those IDs across a bounded set of repository files, and reports
structural-integrity findings.

It implements the universal traceability model already frozen in
`ML-DEVOS-ARCH-001 §8`: `Requirement → Design → Implementation → Test →
Evidence → Status`. It does not define that model; it mechanically checks
that durable-ID cross-references built on it are internally consistent.

## What this is not

- **Not a second source of truth.** Every ID's canonical definition still
  lives exactly where it always did. This subsystem never restates a
  record's content and never overrides it (`nonAuthoritative: true` is
  stamped on every generated output — AS37-F002).
- **Not a manually maintained relationship matrix.** `traceability.config.json`
  names *where* each ID family is canonically defined (a directory, a
  heading pattern, a table-row pattern, a JSON field) — it does not restate
  *what* any individual ID means (AS37-F003).
- **Not S3 Typed Task Contracts, S7 Evidence Store/QA Plane, or S9 Evidence
  Gate.** It does not define task lifecycle, store evidence packets, or
  decide merge/deploy eligibility (AS37-F006/F007/F008).
- **Not an authority to rewrite history.** A discovered gap (a missing
  canonical record, an orphaned decision) is reported, never silently
  patched into an unrelated governed record (AS37-F011).

## How it works

### Canonical-definition discovery (`traceability.config.json`)

Each entry in `idFamilies` names one governance-ID family (e.g.
`ML-DEVOS-RFC`, `D`, `CORE`, `WEB-INC`, `RISK-WEB`, `TEST`) and one
mechanical discovery strategy already in use by the real repository:

| `canonical.type`     | Strategy                                                                 | Example family     |
|-----------------------|---------------------------------------------------------------------------|---------------------|
| `file`                | one file per ID under a directory                                        | `ML-DEVOS-RFC/AS/ADR` |
| `heading`             | a markdown heading regex in one file                                     | `D-*`, `WEB-INC-*`  |
| `table-row`           | a markdown table-row regex in one file                                   | `RISK-WEB-*`, `TEST-*` |
| `line-start`          | a plain-text line beginning with the ID, distinguishing a definition from a bare mid-document reference | `WEB-REQ-*`, `ADM-REQ-*`, `WEB-SEC-*`, `DESIGN-*` |
| `json-array-field`    | a JSON array whose objects carry an ID field                             | `CORE-*` (`rule_id` in `core-rules.json`) |

`historicalExceptions` names IDs that are genuinely referenced as real past
events but predate this repository's later discipline of archiving every
Architect Sync as its own durable file. Each entry carries a `reason`. A
referenced ID in this list is downgraded from a `missing-canonical-target`
ERROR to a visible `historical-exception-missing-canonical-record` WARNING
— never silently dropped (AS37-F005). This applies to *every* site of that
ID, everywhere.

`referenceExceptions` (added `ML-DEVOS-AS-039` / `AS39-F008`) is narrower:
each entry names one exact `family` + `id` + `file` + `linePattern` (a
regex matched against that exact source line's text) + `reason`. It exists
for an *intentional non-reference mention* — a document that explicitly
states an ID must **not** be created (e.g. "Do not create X from these
findings.") — which is not a semantic claim that a canonical record is
required, and must not be treated as one. Unlike `historicalExceptions`,
this is scoped **per site, not per ID**: only occurrences whose file and
exact line text match the entry are downgraded to a WARNING. Any other
occurrence of the same ID — a different file, or a different line in the
same file that doesn't match the pattern — is unaffected and still
produces a `missing-canonical-target` ERROR if no canonical definition
exists. This is the mechanism's core guarantee: a `referenceException`
never globally suppresses an ID.

Because a `referenceException` entry's own `id`/`reason`/`_comment` fields
necessarily restate the exempted ID as literal configuration text,
`traceability.config.json` itself is in `scan.excludePaths` — otherwise the
config file describing the exemption would immediately reintroduce the
exact false positive it exists to fix. For the same reason, this
generator's own source code never spells out a specific exempted ID in a
comment (its own source is part of the scanned surface too).

### Reference extraction

For every scanned file (bounded by `scan.includeDirs` /
`scan.includeRootFiles` / `scan.includeExtensions`, minus
`scan.excludePaths`, which excludes this subsystem's own generated output
and its own configuration file to avoid self-reference), every line is
matched against every family's `pattern` regex. Every match is one
occurrence, with file+line.

### Durable vs. rolling surfaces (`ML-DEVOS-AS-040` / `AS40-F001`)

A plain textual pattern match (AS37-F004's deliberately bounded, mechanical
design — not a semantic or quote-aware parser) cannot by itself distinguish
a genuine durable cross-reference from a living coordination/governance
document *quoting* an ID as an example while discussing a past or open
finding (for instance, an Architect Sync review or a Builder handoff
describing exactly this mechanism). Left unaddressed, that creates a
self-referential feedback loop: a finding is reported → the review/handoff
process discusses that finding by name → the scanner reads that discussion
as a new reference → a new (or persistent) finding results — even though
the underlying durable repository content never changed.

Traceability V1 resolves this by computing occurrence counts, orphan
detection, and hard `missing-canonical-target`/`duplicate-canonical-definition`
findings from a **durable** subset of the scanned files, filtered by
`scan.workingSurfaceExcludePaths` (a list of path prefixes or exact paths).
By default this excludes:

- `coordination/` — the rolling working/turn surface (`IMPLEMENTER_HANDOFF.md`,
  `ARCHITECT_REVIEW.md`, `STATE.md`) that necessarily discusses unresolved,
  proposed, or not-yet-archived IDs while a cycle is open;
- `devos/governance/traceability/` — this subsystem's own
  README/source/config/generated-output, which necessarily discusses the
  IDs and exception mechanisms it analyzes;
- `tests/traceability.test.mjs` — included defensively, since a
  traceability-focused test file will inherently name real IDs in test
  descriptions/comments over time even though its assertions use synthetic
  fixtures.

This is a **file-scope** exclusion, not an ID-scope suppression: an
excluded file's mentions never count toward a hard finding, but a genuine
reference to the *same* ID on any non-excluded (durable) file still
produces a `missing-canonical-target` ERROR exactly as before. Canonical
definition discovery is entirely unaffected, since it always reads its own
configured file/dir directly (`discoverDefinitionsForFamily`), never
through the scanned-file list. `traceability-index.json`'s
`durableReferenceScannedFileCount` and `workingSurfaceExcludePaths` fields
disclose exactly how many of `scannedFileCount`'s files fed hard-finding
detection and which prefixes were excluded, so this is independently
auditable rather than a silent behind-the-scenes filter.

### Findings

- **ERROR `duplicate-canonical-definition`** — an ID has more than one
  canonical definition site.
- **ERROR `missing-canonical-target`** — an ID is referenced somewhere but
  has no canonical definition, and is not a configured historical
  exception or a matched reference exception at that site.
- **WARNING `historical-exception-missing-canonical-record`** — as above,
  but explicitly allowlisted with a stated reason, for every site of the ID.
- **WARNING `intentional-noncanonical-mention`** — the id+file+line-text at
  this exact site matches a configured `referenceException`; other sites of
  the same ID are unaffected.
- **WARNING `orphan-no-inbound-reference`** — an ID is canonically defined
  but never referenced anywhere else in the durable scanned surface.

Per AS37-F004, only the ERROR class is treated as an objective
structural-integrity defect in V1. Orphans and both exception classes
remain warnings; nothing here decides merge/deploy eligibility or promotes
a warning to blocking on its own.

## Determinism

No wall-clock timestamp, process id, or random value is ever written to
generated output. All filesystem iteration and all output arrays are
sorted before serialization. Two consecutive runs against unchanged
repository state produce byte-identical `traceability-index.json` and
`TRACEABILITY_INDEX.md` (verified by SHA-256 comparison as part of every
Builder evidence cycle that touches this subsystem).

## Usage

```
node devos/governance/traceability/generate-traceability.mjs
```

Regenerates `traceability-index.json` (machine-readable) and
`TRACEABILITY_INDEX.md` (human-readable) from the current repository
state. Both files are derived evidence — do not hand-edit them.

```
node devos/governance/traceability/validate-traceability.mjs
```

Regenerates the report in-memory (without writing files) and:
- prints every ERROR/WARNING with its finding kind and locations;
- reports drift if the on-disk generated files do not match what a fresh
  run would produce right now (a stale index masquerading as current
  evidence);
- exits non-zero if any ERROR exists or drift is detected.

The validator never writes or fixes anything. A non-zero exit means
"regenerate and/or investigate the underlying repository content," decided
by a human or a separately authorized change — not by this tool.

## Known limitation

For the `json-array-field` discovery strategy (`CORE-*`), the recorded
"line" is the 1-based index of the object within its JSON array, not a
true source-line number — a full line-accurate JSON parse would require a
dedicated line-mapping parser, which V1 deliberately does not add
(AS37-F010: dependency-light, Node built-ins only). This is disclosed here
rather than silently treated as a real line number.

## Tests

`tests/traceability.test.mjs` exercises the exported pure functions
(`buildTraceabilityReport`, `serializeReportJson`, `renderMarkdown`,
`listScannedFiles`, `listDurableReferenceFiles`) against small synthetic
temp-directory fixtures — never the real repository — covering:
missing-reference detection, duplicate-canonical-definition detection,
deterministic output across two runs, explicit historical-exception
handling, the per-site `referenceExceptions` mechanism (an exempted site
becomes a WARNING while a genuine reference to the same ID elsewhere still
errors, and an unrelated ID is unaffected), orphan detection, the
non-authoritative marking, `scan` config filtering, and the durable/rolling
working-surface split (an ID mentioned only on an excluded surface does not
error, the same ID on a durable surface still errors, and canonical
definition discovery is unaffected either way).
