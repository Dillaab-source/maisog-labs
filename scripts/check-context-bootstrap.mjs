#!/usr/bin/env node
// SENTINEL Context Bootstrap V0 mechanical checker.
//
// Authority: ML-DEVOS-RFC-018 (design, ML-DEVOS-AS-078) -> D-062
// (Stage A, ML-DEVOS-AS-079/080; Stage B atomic activation).
// Protocol state is read from coordination/STATE.md: with PROTOCOL_VERSION
// present the V0 checks apply; without it the checker reports the legacy
// protocol and never claims V0 is live.
//
// Dual-version support (ML-DEVOS-RFC-020 Stage A, ML-DEVOS-AS-108 -> D-079):
// the checker also understands Protocol V2 (the CURRENT_DIRECTIVE
// Owner/Architect -> Builder execution packet). V2 is implemented and
// tested here but NOT active: the live repository stays PROTOCOL_VERSION 1
// until a separate owner Stage B decision. Under V1 the directive selector
// fields are refused outright, so CURRENT_DIRECTIVE can never become a live
// V1 selector, and a 1 -> 2 cutover must be declared explicitly.
//
// The checker validates only mechanically knowable facts. It never proves
// authority legitimacy, model identity, semantic review completeness,
// external side-effect atomicity, or S5 capability (see NOT_PROVEN).
// A passing result is evidence, never authority.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SUPPORTED_PROTOCOL_VERSIONS = Object.freeze([1, 2]);
export const SUPPORTED_HANDOFF_SCHEMA_VERSIONS = Object.freeze([1]);
export const SUPPORTED_DIRECTIVE_SCHEMA_VERSIONS = Object.freeze([1]);
export const MAX_PUBLICATION_ATTEMPTS = 3;
export const EXPECTED_REPOSITORY = 'Dillaab-source/maisog-labs';
export const AUTHORITATIVE_BRANCH = 'governance/maisoglabs-v0.1';
// Git blob of coordination/IMPLEMENTER_HANDOFF.md frozen at Stage B
// activation (bytes as of 487af93afa926f85755f0aa7ad9606ad31a92ed4).
export const FROZEN_LEGACY_HANDOFF_BLOB = '43eddba31695a567412c431ae3d1e4c9372cabdd';

export const PATHS = Object.freeze({
  state: 'coordination/STATE.md',
  review: 'coordination/ARCHITECT_REVIEW.md',
  currentHandoff: 'coordination/CURRENT_HANDOFF.md',
  legacyHandoff: 'coordination/IMPLEMENTER_HANDOFF.md',
  obligations: 'coordination/OPERATIVE_OBLIGATIONS.md',
  handoffArchiveDir: 'coordination/archive/handoffs',
  syncArchiveDir: 'devos/changes/architect-syncs',
  // RFC-020 (Protocol V2; inert scaffolding under live V1).
  currentDirective: 'coordination/CURRENT_DIRECTIVE.md',
  directiveArchiveDir: 'coordination/archive/directives',
  directiveArchiveIndex: 'coordination/archive/directives/README.md',
  decisionLog: 'brain/DECISION_LOG.md',
});

export const NOT_PROVEN = Object.freeze([
  'legitimacy of any human/owner authority recorded in the repository',
  'that a committed authorization claim was actually granted by the applicable decision process',
  'model or provider identity of any actor',
  'semantic completeness or correctness of a review or handoff',
  'atomicity of any external side effect (Cloudflare, production, remote resources)',
  'S5 capability authorization',
  'that a participant did not bypass this checker by writing directly',
  'quality, independence or completeness of any recorded SENTINEL sync or SU contradiction check (RFC-020 fields are shape/vocabulary only)',
]);

// Identity tuple: CURRENT_HANDOFF header field -> STATE selector field.
export const IDENTITY_FIELDS = Object.freeze({
  handoff_id: 'HANDOFF_ID',
  cycle_id: 'CYCLE_ID',
  review_target_commit: 'REVIEW_TARGET_COMMIT',
  applicable_review_id: 'APPLICABLE_REVIEW_ID',
});

// Action classes a governed writer may request, and the STATE flag that must
// read exactly YES in addition to holding the turn. Unknown classes are denied.
export const ACTION_FLAGS = Object.freeze({
  coordination: null,
  'repository-scope': null,
  mutation: 'MUTATION_AUTHORIZED',
  'media-mutation': 'MEDIA_MUTATION_AUTHORIZED',
  'audit-append': 'AUDIT_APPEND_AUTHORIZED',
  'remote-r2': 'REMOTE_R2_AUTHORIZED',
  'remote-d1': 'REMOTE_D1_AUTHORIZED',
  deploy: 'DEPLOY_AUTHORIZED',
  'main-merge': 'MAIN_MERGE_AUTHORIZED',
});

const ACTION_REQUIRED_FIELD = Object.freeze({
  CLAUDE: 'IMPLEMENTER_ACTION_REQUIRED',
  ARCHITECT: 'ARCHITECT_ACTION_REQUIRED',
  PAULO: 'PAULO_DECISION_REQUIRED',
});

// STATE fields a forward-recovery rollback must carry over unchanged.
export const AUTHORITY_FIELDS = Object.freeze([
  'CYCLE_ID', 'TURN', 'STATUS', 'AUTHORIZED_SCOPE',
  'ARCHITECT_ACTION_REQUIRED', 'IMPLEMENTER_ACTION_REQUIRED', 'PAULO_DECISION_REQUIRED',
  'CURRENT_REMEDIATION_CYCLE', 'MAX_REMEDIATION_CYCLES',
  ...Object.values(ACTION_FLAGS).filter(Boolean),
]);

export const OBLIGATION_DISPOSITIONS = Object.freeze(['OPEN', 'DEFERRED', 'CLOSED', 'SUPERSEDED']);
const UNRESOLVED = new Set(['OPEN', 'DEFERRED']);

export const REQUIRED_HANDOFF_SECTIONS = Object.freeze([
  'Objective',
  'Changed files',
  'Tests and evidence',
  'Unresolved findings and limitations',
  'Governing references',
  'Evidence locations',
  'Next action',
]);

const SHA_RE = /^[0-9a-f]{40}$/;
const HANDOFF_ID_RE = /^H-[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SYNC_ID_RE = /^ML-DEVOS-AS-\d{3,}$/;

// ------------------------------------------- RFC-020 Protocol V2 vocabulary

// Directive identity tuple: CURRENT_DIRECTIVE header field -> STATE selector
// field (RFC-020 §5, §7). target_turn is checked separately against TURN.
export const DIRECTIVE_IDENTITY_FIELDS = Object.freeze({
  directive_id: 'DIRECTIVE_ID',
  cycle_id: 'CYCLE_ID',
  issue_parent_commit: 'DIRECTIVE_ISSUE_PARENT',
  authority_ref: 'DIRECTIVE_AUTHORITY_REF',
  applicable_review_id: 'DIRECTIVE_APPLICABLE_REVIEW_ID',
});
// STATE selector fields that exist only under Protocol V2.
export const DIRECTIVE_SELECTOR_FIELDS = Object.freeze([
  'CURRENT_DIRECTIVE', 'DIRECTIVE_ID', 'DIRECTIVE_ISSUE_PARENT', 'DIRECTIVE_AUTHORITY_REF', 'DIRECTIVE_APPLICABLE_REVIEW_ID',
]);
// Positive allowlist of directive header keys (RFC-020 §6).
export const DIRECTIVE_HEADER_FIELDS = Object.freeze([
  'schema_version', 'directive_id', 'cycle_id', 'issue_parent_commit', 'target_turn',
  'authority_ref', 'applicable_review_id', 'sentinel_disposition', 'su_mode', 'su_disposition',
]);
// Fixed vocabularies. They record provenance/status only; they grant nothing
// and the checker cannot judge the reasoning behind them (RFC-020 §13).
export const DIRECTIVE_VOCABULARY = Object.freeze({
  target_turn: Object.freeze(['CLAUDE']),
  sentinel_disposition: Object.freeze(['CLEAR', 'BLOCKED']),
  su_mode: Object.freeze(['BOUNDED_CONTRADICTION', 'ESCALATED_RESEARCH']),
  su_disposition: Object.freeze(['CLEAR', 'CLEAR_WITH_NOTES', 'BLOCKED']),
});
export const REQUIRED_DIRECTIVE_SECTIONS = Object.freeze([
  'Objective',
  'Preconditions',
  'Governing references',
  'Exact execution scope',
  'SENTINEL Sync',
  'SU Contradiction Check',
  'Instructions',
  'Validation and evidence',
  'Stop conditions',
  'Next action',
]);
// Guidance for a typical delta-based directive (RFC-020 §9, §19, T12). Not
// enforced: it feeds the startup-read measurement only.
export const DIRECTIVE_BYTE_BUDGET = 8192;
// RFC-020 §19 planning baseline: CLAUDE.md mandatory first reads excluding
// the conditional CURRENT_HANDOFF, at 1ea92e3798dfa2401dfcf95077f4d1fe896bccc8.
export const RFC020_PLANNING_BASELINE_BYTES = 85625;

const DIRECTIVE_ID_RE = /^DIR-[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const DECISION_ID_RE = /^D-\d{3,}$/;

const pass = (code, extra = {}) => ({ ok: true, code, ...extra });
const fail = (code, detail, extra = {}) => ({ ok: false, code, detail, ...extra });

// ---------------------------------------------------------------- parsers

// STATE authority fields are read only from the header block: the lines
// before the first "## " heading. Instruction-shaped text anywhere else
// (bodies, quotes, evidence) is never parsed as a field.
export function parseStateFields(text) {
  const fields = Object.create(null);
  for (const line of String(text).split('\n')) {
    if (line.startsWith('## ')) break;
    const m = /^([A-Z][A-Z0-9_]*):[ \t]*(.*?)[ \t]*$/.exec(line);
    if (!m) continue;
    if (m[1] in fields) {
      throw new Error(`AMBIGUOUS_STATE_FIELD: ${m[1]} appears more than once in the STATE header`);
    }
    fields[m[1]] = m[2];
  }
  return fields;
}

// Rolling-packet header: the first fenced ```yaml block, flat key: value.
// Shared by CURRENT_HANDOFF and (RFC-020) CURRENT_DIRECTIVE.
function parseYamlHeader(text, label) {
  const m = /```yaml\n([\s\S]*?)\n```/.exec(String(text));
  if (!m) return null;
  const header = Object.create(null);
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = /^([a-z_]+):[ \t]*(.*?)[ \t]*$/.exec(line);
    if (!kv) throw new Error(`MALFORMED_${label}_HEADER: ${line}`);
    if (kv[1] in header) throw new Error(`AMBIGUOUS_${label}_HEADER: ${kv[1]} repeated`);
    header[kv[1]] = kv[2];
  }
  return header;
}

export function parseHandoffHeader(text) {
  return parseYamlHeader(text, 'HANDOFF');
}

export function parseDirectiveHeader(text) {
  return parseYamlHeader(text, 'DIRECTIVE');
}

// Level-2 headings of a rolling packet ("## Heading"), for required-section
// checks shared by CURRENT_HANDOFF and CURRENT_DIRECTIVE.
function headingsOf(text) {
  return new Set([...String(text ?? '').matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]));
}

export function parseReviewId(text) {
  const m = /^Architect Sync:[ \t]*(ML-DEVOS-AS-\d{3,})[ \t]*$/m.exec(String(text));
  return m ? m[1] : null;
}

// Rows of the form | OBL-NNN | obligation | source | DISPOSITION | closure |
export function parseObligations(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    if (!/^\|\s*OBL-\d{3,}\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const [id, obligation, source, dispositionCell, closure = ''] = cells;
    const disposition = dispositionCell.replace(/`/g, '').split(/\s/)[0];
    rows.push({ id, obligation, source, disposition, closure });
  }
  return rows;
}

// ------------------------------------------------------- identity checks

export function normalizeRepository(remoteUrl) {
  const s = String(remoteUrl ?? '').trim().replace(/\/+$/, '').replace(/\.git$/, '');
  const m = /[/:]([^/:]+)\/([^/:]+)$/.exec(s);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function checkRepository(remoteUrl, expected = EXPECTED_REPOSITORY) {
  const actual = normalizeRepository(remoteUrl);
  if (!actual) return fail('REPOSITORY_UNRESOLVED', 'cannot resolve owner/repo from remote URL');
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    return fail('WRONG_REPOSITORY', `expected ${expected}, found ${actual}`);
  }
  return pass('REPOSITORY_OK', { repository: actual });
}

export function checkBranch(branch, expected = AUTHORITATIVE_BRANCH) {
  if (branch !== expected) return fail('WRONG_BRANCH', `expected ${expected}, found ${branch || '(none)'}`);
  return pass('BRANCH_OK');
}

export function checkFreshness({ snapshotCommit, remoteTip }) {
  if (!remoteTip) return fail('FRESHNESS_UNAVAILABLE', 'authoritative tip could not be resolved; governed mutation blocked');
  if (!SHA_RE.test(String(snapshotCommit))) return fail('SNAPSHOT_UNIDENTIFIED', 'snapshot is not an exact commit');
  if (snapshotCommit !== remoteTip) {
    return fail('STALE_SNAPSHOT', `snapshot ${snapshotCommit} is not the authoritative tip ${remoteTip}; re-bootstrap`);
  }
  return pass('SNAPSHOT_FRESH');
}

// Every governed input must come from one identified commit.
export function checkSnapshotCoherence(reads) {
  if (!Array.isArray(reads) || reads.length === 0) return fail('SNAPSHOT_EMPTY', 'no governed reads recorded');
  const commits = new Set(reads.map((r) => r.commit));
  for (const c of commits) {
    if (!SHA_RE.test(String(c))) return fail('SNAPSHOT_UNIDENTIFIED', `read from non-exact ref ${c}`);
  }
  if (commits.size !== 1) {
    const detail = reads.map((r) => `${r.path}@${String(r.commit).slice(0, 12)}`).join(', ');
    return fail('MIXED_SNAPSHOT', detail);
  }
  return pass('SNAPSHOT_COHERENT', { commit: reads[0].commit });
}

// Absent marker = legacy protocol still active (pre-cutover). A present
// marker must be supported and must equal what the session bootstrapped on.
export function checkProtocolVersion(stateFields, { sessionProtocolVersion } = {}) {
  const raw = stateFields.PROTOCOL_VERSION;
  if (raw === undefined) {
    return pass('LEGACY_PROTOCOL_ACTIVE', { active: false, detail: 'no PROTOCOL_VERSION marker; Bootstrap V0 is not activated' });
  }
  if (!/^\d+$/.test(raw) || !SUPPORTED_PROTOCOL_VERSIONS.includes(Number(raw))) {
    return fail('UNSUPPORTED_PROTOCOL_VERSION', `PROTOCOL_VERSION ${JSON.stringify(raw)} is not supported by this checker`);
  }
  if (sessionProtocolVersion !== undefined && Number(sessionProtocolVersion) !== Number(raw)) {
    return fail('STALE_SESSION_PROTOCOL', `session bootstrapped on protocol ${sessionProtocolVersion}, STATE is ${raw}; stop and bootstrap fresh`);
  }
  return pass('PROTOCOL_VERSION_SUPPORTED', { active: true, version: Number(raw) });
}

// Mechanical field-for-field turn-packet binding (RFC-018 B018-02).
export function checkIdentityBinding(stateFields, handoffText, { transitionParent, isAncestor, reviewText } = {}) {
  const selector = stateFields.CURRENT_HANDOFF;
  if (selector === 'NONE') {
    const stale = ['HANDOFF_ID', 'APPLICABLE_REVIEW_ID', 'REVIEW_TARGET_COMMIT']
      .filter((k) => stateFields[k] !== undefined && stateFields[k] !== '');
    if (stale.length) return fail('STALE_HANDOFF_SELECTOR', `CURRENT_HANDOFF: NONE but ${stale.join(', ')} still set`);
    return pass('NO_HANDOFF_STATE');
  }
  if (selector !== 'ACTIVE') return fail('HANDOFF_SELECTOR_MISSING', 'STATE must declare CURRENT_HANDOFF: ACTIVE or NONE');
  if (handoffText == null) return fail('HANDOFF_MISSING', `${PATHS.currentHandoff} absent at this snapshot`);

  let header;
  try {
    header = parseHandoffHeader(handoffText);
  } catch (err) {
    return fail('MALFORMED_HANDOFF_HEADER', err.message);
  }
  if (!header) return fail('MALFORMED_HANDOFF_HEADER', 'no ```yaml identity header');
  if (!SUPPORTED_HANDOFF_SCHEMA_VERSIONS.includes(Number(header.schema_version))) {
    return fail('UNSUPPORTED_SCHEMA_VERSION', `schema_version ${JSON.stringify(header.schema_version)}`);
  }
  if (!HANDOFF_ID_RE.test(header.handoff_id ?? '')) return fail('INVALID_HANDOFF_ID', String(header.handoff_id));

  const mismatched = [];
  for (const [hKey, sKey] of Object.entries(IDENTITY_FIELDS)) {
    const h = header[hKey];
    const s = stateFields[sKey];
    if (!h || !s || h !== s) mismatched.push(`${hKey}(handoff=${h ?? '∅'}, state=${s ?? '∅'})`);
  }
  if (mismatched.length) return fail('IDENTITY_MISMATCH', mismatched.join('; '));

  for (const k of ['input_base_commit', 'review_target_commit']) {
    if (!SHA_RE.test(header[k] ?? '')) return fail('IDENTITY_COMMIT_NOT_EXACT', `${k}=${header[k] ?? '∅'}`);
  }
  // AS79-R001: the applicable review is always an immutable published
  // ML-DEVOS-AS-NNN ID, and it must be the live review at this snapshot.
  const reviewId = header.applicable_review_id;
  if (!SYNC_ID_RE.test(reviewId)) {
    return fail('INVALID_APPLICABLE_REVIEW_ID', `${reviewId} is not an immutable ML-DEVOS-AS-NNN review ID`);
  }
  if (reviewText !== undefined && parseReviewId(reviewText) !== reviewId) {
    return fail('APPLICABLE_REVIEW_NOT_LIVE', `applicable_review_id ${reviewId} != live review ${parseReviewId(reviewText) ?? '∅'}`);
  }
  if (transitionParent !== undefined && header.review_target_commit !== transitionParent) {
    return fail('REVIEW_TARGET_NOT_EXACT_TIP',
      `review_target_commit ${header.review_target_commit} != transition parent ${transitionParent}`);
  }
  if (isAncestor && !isAncestor(header.input_base_commit, header.review_target_commit)) {
    return fail('INPUT_BASE_NOT_ANCESTOR', 'input_base_commit is not an ancestor of review_target_commit');
  }
  return pass('IDENTITY_BOUND', { handoffId: header.handoff_id });
}

// Lean packet must point at governing records and the obligation index.
// Presence of references proves nothing about completeness (B018-04); the
// carry-forward check below is what stops obligations disappearing.
export function checkPacketReferences(handoffText) {
  const text = String(handoffText ?? '');
  const headings = headingsOf(text);
  const missing = REQUIRED_HANDOFF_SECTIONS.filter((s) => !headings.has(s));
  if (missing.length) return fail('MISSING_REQUIRED_SECTION', missing.join(', '));
  if (!text.includes(PATHS.obligations)) return fail('MISSING_OBLIGATION_REFERENCE', `packet does not reference ${PATHS.obligations}`);
  return pass('PACKET_REFERENCES_PRESENT');
}

// ------------------------------------ RFC-020 Protocol V2 directive checks

const hasValue = (v) => v !== undefined && v !== '';

// STATE directive-selector legality (RFC-020 §5, §18). Under V1 the selector
// does not exist: any directive selector field in a V1 STATE is refused, so
// CURRENT_DIRECTIVE can never act as a live V1 execution selector.
export function checkDirectiveSelector(stateFields) {
  const version = stateFields.PROTOCOL_VERSION;
  const present = DIRECTIVE_SELECTOR_FIELDS.filter((k) => k in stateFields);
  if (version !== '2') {
    if (present.length) {
      return fail('DIRECTIVE_SELECTOR_UNDER_V1',
        `${present.join(', ')} present but PROTOCOL_VERSION is ${version ?? '∅'}; the directive selector exists only under Protocol V2`);
    }
    return pass('NO_DIRECTIVE_SELECTOR_V1');
  }
  const selector = stateFields.CURRENT_DIRECTIVE;
  if (selector !== 'ACTIVE' && selector !== 'NONE') {
    return fail('DIRECTIVE_SELECTOR_MISSING', 'Protocol V2 STATE must declare CURRENT_DIRECTIVE: ACTIVE or NONE');
  }
  const values = DIRECTIVE_SELECTOR_FIELDS.slice(1);
  const builderTurn = stateFields.TURN === 'CLAUDE' && stateFields.IMPLEMENTER_ACTION_REQUIRED === 'YES';
  if (selector === 'NONE') {
    const stale = values.filter((k) => hasValue(stateFields[k]));
    if (stale.length) return fail('STALE_DIRECTIVE_SELECTOR', `CURRENT_DIRECTIVE: NONE but ${stale.join(', ')} still set`);
    if (builderTurn) {
      return fail('BUILDER_TURN_WITHOUT_DIRECTIVE', 'a V2 Builder execution turn (TURN: CLAUDE, IMPLEMENTER_ACTION_REQUIRED: YES) requires CURRENT_DIRECTIVE: ACTIVE');
    }
    if (stateFields.TURN === 'PAULO' && stateFields.CURRENT_HANDOFF === 'ACTIVE') {
      return fail('HANDOFF_SELECTED_ON_PAULO_TURN', 'a V2 Paulo decision turn requires CURRENT_HANDOFF: NONE');
    }
    return pass('NO_DIRECTIVE_STATE');
  }
  if (stateFields.TURN !== 'CLAUDE') {
    return fail('DIRECTIVE_ON_NON_BUILDER_TURN', `CURRENT_DIRECTIVE: ACTIVE requires TURN: CLAUDE, found ${stateFields.TURN ?? '∅'}`);
  }
  if (stateFields.IMPLEMENTER_ACTION_REQUIRED !== 'YES') {
    return fail('DIRECTIVE_WITHOUT_IMPLEMENTER_ACTION', `CURRENT_DIRECTIVE: ACTIVE requires IMPLEMENTER_ACTION_REQUIRED: YES, found ${stateFields.IMPLEMENTER_ACTION_REQUIRED ?? '∅'}`);
  }
  if (stateFields.CURRENT_HANDOFF === 'ACTIVE') {
    return fail('DIRECTIVE_AND_HANDOFF_BOTH_SELECTED', 'normal V2 operation never selects CURRENT_DIRECTIVE and CURRENT_HANDOFF together');
  }
  const missing = values.filter((k) => !hasValue(stateFields[k]));
  if (missing.length) return fail('DIRECTIVE_SELECTOR_INCOMPLETE', `CURRENT_DIRECTIVE: ACTIVE but ${missing.join(', ')} empty`);
  return pass('DIRECTIVE_SELECTED', { directiveId: stateFields.DIRECTIVE_ID });
}

export function checkDirectiveSections(directiveText) {
  const headings = headingsOf(directiveText);
  const missing = REQUIRED_DIRECTIVE_SECTIONS.filter((s) => !headings.has(s));
  if (missing.length) return fail('MISSING_DIRECTIVE_SECTION', missing.join(', '));
  return pass('DIRECTIVE_SECTIONS_PRESENT');
}

// Mechanical field-for-field STATE <-> CURRENT_DIRECTIVE binding (RFC-020 §6-§9,
// §11-§13). Options, when supplied:
// - publicationParent: sole parent of the commit publishing these directive
//   bytes (issue-parent binding);
// - decisionLogText: decision log at the same snapshot (authority_ref must
//   name an existing D-NNN heading; legitimacy is NOT proven);
// - reviewExists(id): the Sync ID is the live review or an immutable archive.
export function checkDirectiveBinding(stateFields, directiveText, { publicationParent, decisionLogText, reviewExists } = {}) {
  if (stateFields.CURRENT_DIRECTIVE !== 'ACTIVE') return pass('NO_DIRECTIVE_SELECTED');
  if (directiveText == null) return fail('DIRECTIVE_MISSING', `${PATHS.currentDirective} absent at this snapshot`);
  let header;
  try {
    header = parseDirectiveHeader(directiveText);
  } catch (err) {
    return fail('MALFORMED_DIRECTIVE_HEADER', err.message);
  }
  if (!header) return fail('MALFORMED_DIRECTIVE_HEADER', 'no ```yaml directive header');
  const unknown = Object.keys(header).filter((k) => !DIRECTIVE_HEADER_FIELDS.includes(k));
  if (unknown.length) return fail('DIRECTIVE_HEADER_UNKNOWN_FIELD', unknown.join(', '));
  const absent = DIRECTIVE_HEADER_FIELDS.filter((k) => !hasValue(header[k]));
  if (absent.length) return fail('DIRECTIVE_HEADER_FIELD_MISSING', absent.join(', '));
  if (!SUPPORTED_DIRECTIVE_SCHEMA_VERSIONS.includes(Number(header.schema_version))) {
    return fail('UNSUPPORTED_DIRECTIVE_SCHEMA_VERSION', `schema_version ${JSON.stringify(header.schema_version)}`);
  }
  if (!DIRECTIVE_ID_RE.test(header.directive_id)) return fail('INVALID_DIRECTIVE_ID', header.directive_id);
  const vocabCodes = {
    target_turn: 'INVALID_TARGET_TURN',
    sentinel_disposition: 'INVALID_SENTINEL_DISPOSITION',
    su_mode: 'INVALID_SU_MODE',
    su_disposition: 'INVALID_SU_DISPOSITION',
  };
  for (const [field, code] of Object.entries(vocabCodes)) {
    if (!DIRECTIVE_VOCABULARY[field].includes(header[field])) {
      return fail(code, `${field}=${header[field]} not in [${DIRECTIVE_VOCABULARY[field].join(', ')}]`);
    }
  }
  const blocked = ['sentinel_disposition', 'su_disposition'].filter((k) => header[k] === 'BLOCKED');
  if (blocked.length) return fail('DIRECTIVE_BLOCKED', `${blocked.join(', ')} BLOCKED; a blocked directive may not route to the Builder`);

  const mismatched = [];
  for (const [hKey, sKey] of Object.entries(DIRECTIVE_IDENTITY_FIELDS)) {
    if (header[hKey] !== stateFields[sKey]) mismatched.push(`${hKey}(directive=${header[hKey]}, state=${stateFields[sKey] ?? '∅'})`);
  }
  if (mismatched.length) return fail('DIRECTIVE_IDENTITY_MISMATCH', mismatched.join('; '));
  if (header.target_turn !== stateFields.TURN) {
    return fail('DIRECTIVE_TARGET_TURN_MISMATCH', `target_turn ${header.target_turn} != TURN ${stateFields.TURN ?? '∅'}`);
  }
  if (!SHA_RE.test(header.issue_parent_commit)) return fail('DIRECTIVE_ISSUE_PARENT_NOT_EXACT', header.issue_parent_commit);
  if (publicationParent !== undefined && header.issue_parent_commit !== publicationParent) {
    return fail('DIRECTIVE_ISSUE_PARENT_MISMATCH',
      `issue_parent_commit ${header.issue_parent_commit} != parent ${publicationParent} of the commit publishing the directive`);
  }
  if (!DECISION_ID_RE.test(header.authority_ref)) return fail('INVALID_AUTHORITY_REF', header.authority_ref);
  if (decisionLogText !== undefined) {
    const heading = new RegExp(`^### ${header.authority_ref}(?=\\s|$)`, 'm');
    if (!heading.test(String(decisionLogText))) {
      return fail('DIRECTIVE_AUTHORITY_NOT_FOUND', `${header.authority_ref} has no heading in ${PATHS.decisionLog} at this snapshot (existence only; legitimacy is not proven)`);
    }
  }
  if (!SYNC_ID_RE.test(header.applicable_review_id)) return fail('INVALID_DIRECTIVE_REVIEW_ID', header.applicable_review_id);
  if (reviewExists && !reviewExists(header.applicable_review_id)) {
    return fail('DIRECTIVE_REVIEW_NOT_FOUND', `${header.applicable_review_id} is neither the live review nor an immutable archive at this snapshot`);
  }
  const sections = checkDirectiveSections(directiveText);
  if (!sections.ok) return sections;
  return pass('DIRECTIVE_BOUND', { directiveId: header.directive_id });
}

// PROTOCOL_VERSION transitions (RFC-020 §3, §21, §22). A change between two
// defined versions is a protocol cutover: it must be declared explicitly by
// the publisher (`--protocol-cutover <from>-><to>`, under its own owner
// decision; the declaration is a procedural guard, not proof of authority),
// and a 1 -> 2 activation must route to a non-Builder gate with no directive.
export function checkProtocolTransition(before, after, { declaredCutover } = {}) {
  const from = before.PROTOCOL_VERSION;
  const to = after.PROTOCOL_VERSION;
  if (from === undefined || from === to) {
    if (declaredCutover) return fail('PROTOCOL_CUTOVER_NOT_PERFORMED', `declared ${declaredCutover} but PROTOCOL_VERSION is unchanged`);
    return pass('PROTOCOL_UNCHANGED');
  }
  const label = `${from}->${to}`;
  if (declaredCutover !== label) {
    return fail('PROTOCOL_CUTOVER_UNDECLARED',
      `candidate changes PROTOCOL_VERSION ${label}; a cutover requires its own owner decision and an explicit --protocol-cutover ${label}`);
  }
  if (to === '2') {
    if (after.CURRENT_DIRECTIVE !== 'NONE') return fail('V2_ACTIVATION_WITH_DIRECTIVE', 'V2 activation must set CURRENT_DIRECTIVE: NONE');
    if (after.TURN === 'CLAUDE') return fail('V2_ACTIVATION_ROUTES_TO_BUILDER', 'V2 activation must route to a non-Builder gate (TURN: PAULO or ARCHITECT)');
  }
  return pass('PROTOCOL_CUTOVER_DECLARED', { from: Number(from), to: Number(to) });
}

export function directiveArchivePath(directiveId) {
  if (!DIRECTIVE_ID_RE.test(directiveId)) throw new Error(`INVALID_DIRECTIVE_ID: ${directiveId}`);
  return `${PATHS.directiveArchiveDir}/${directiveId}.md`;
}

export function directiveProvenancePath(directiveId) {
  return directiveArchivePath(directiveId).replace(/\.md$/, '.provenance.json');
}

const directiveIndexRow = (id, cycleId, publicationCommit, blob) => `| ${id} | ${cycleId} | ${publicationCommit} | ${blob} |`;

// Deterministic, immutable, provenance-carrying directive archival
// (RFC-020 §16). Writes <id>.md (exact bytes) and <id>.provenance.json, and
// appends one row to the archive index. Identical existing bytes are a no-op;
// different bytes fail closed.
export function archiveDirective({ root, directiveId, bytes, publicationCommit, cycleId, fsImpl = fs }) {
  let rel;
  try {
    rel = directiveArchivePath(directiveId);
  } catch (err) {
    return fail('INVALID_DIRECTIVE_ID', err.message);
  }
  if (!SHA_RE.test(String(publicationCommit))) return fail('PROVENANCE_MISSING', 'publicationCommit must be an exact commit');
  if (!cycleId) return fail('PROVENANCE_MISSING', 'cycleId is required');
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const blob = gitBlobId(buf);
  const target = path.join(root, rel);
  const sidecar = path.join(root, directiveProvenancePath(directiveId));
  const index = path.join(root, PATHS.directiveArchiveIndex);
  const provenance = `${JSON.stringify({
    directive_id: directiveId,
    cycle_id: cycleId,
    source_path: PATHS.currentDirective,
    publication_commit: publicationCommit,
    source_blob: blob,
    archive_blob: blob,
    sha256: createHash('sha256').update(buf).digest('hex'),
  }, null, 2)}\n`;

  let existing = null;
  try {
    existing = fsImpl.readFileSync(target);
  } catch (err) {
    if (err.code !== 'ENOENT') return fail('ARCHIVE_WRITE_FAILED', err.message);
  }
  if (existing) {
    if (Buffer.compare(existing, buf) !== 0) {
      return fail('ARCHIVE_ID_CONFLICT', `${rel} already exists with different bytes; archive entries are immutable`);
    }
    return pass('ALREADY_ARCHIVED', { path: rel, blob });
  }
  const created = [];
  try {
    fsImpl.mkdirSync(path.dirname(target), { recursive: true });
    fsImpl.writeFileSync(target, buf, { flag: 'wx' });
    created.push(target);
    fsImpl.writeFileSync(sidecar, provenance, { flag: 'wx' });
    created.push(sidecar);
    let indexText = '';
    try { indexText = fsImpl.readFileSync(index, 'utf8'); } catch (err) { if (err.code !== 'ENOENT') throw err; }
    if (!indexText.includes(`| ${directiveId} |`)) {
      const sep = indexText === '' || indexText.endsWith('\n') ? '' : '\n';
      fsImpl.writeFileSync(index, `${indexText}${sep}${directiveIndexRow(directiveId, cycleId, publicationCommit, blob)}\n`);
    }
  } catch (err) {
    for (const f of created) {
      try { fsImpl.unlinkSync(f); } catch { /* leave for disclosure */ }
    }
    return fail('ARCHIVE_WRITE_FAILED', `${err.code ?? ''} ${err.message}`.trim());
  }
  return pass('ARCHIVED', { path: rel, blob });
}

// Directive half of a coordination transition (RFC-020 §14, §16, §17). Not
// applicable while both sides are Protocol V1 (CURRENT_DIRECTIVE is inert
// scaffolding). `resolvePublication()` returns the commit that published the
// outgoing directive bytes, for the provenance check.
export function checkDirectiveTransition({ read, changedFiles, resolvePublication }) {
  const changed = new Set(changedFiles);
  const b = parseStateFields(read('before', PATHS.state) ?? '');
  const a = parseStateFields(read('after', PATHS.state) ?? '');
  const bV2 = b.PROTOCOL_VERSION === '2';
  const aV2 = a.PROTOCOL_VERSION === '2';
  if (!bV2 && !aV2) return pass('DIRECTIVE_TRANSITION_NOT_APPLICABLE');

  const directiveChanged = changed.has(PATHS.currentDirective);
  const bActive = bV2 && b.CURRENT_DIRECTIVE === 'ACTIVE';
  const aActive = aV2 && a.CURRENT_DIRECTIVE === 'ACTIVE';
  const idChanged = (b.DIRECTIVE_ID ?? '') !== (a.DIRECTIVE_ID ?? '');
  if (aActive && (idChanged || !bActive) && !directiveChanged) {
    return fail('PARTIAL_DIRECTIVE_TRANSITION', 'STATE selects a new directive but CURRENT_DIRECTIVE is not in the same commit');
  }
  if (aV2 && directiveChanged && !changed.has(PATHS.state)) {
    return fail('PARTIAL_DIRECTIVE_TRANSITION', 'CURRENT_DIRECTIVE changed without the STATE transition that selects it');
  }
  if (aActive && bActive && !idChanged && directiveChanged) {
    return fail('DUPLICATE_ID_DIFFERENT_BYTES', `${a.DIRECTIVE_ID} rewritten in place; mint a new directive_id`);
  }

  const outgoing = read('before', PATHS.currentDirective);
  const deselected = bActive && (!aActive || idChanged);
  if (bActive && outgoing != null && (deselected || directiveChanged)) {
    let outHeader;
    try { outHeader = parseDirectiveHeader(outgoing); } catch { outHeader = null; }
    const outId = outHeader?.directive_id;
    if (!outId || !DIRECTIVE_ID_RE.test(outId)) return fail('OUTGOING_DIRECTIVE_UNIDENTIFIED', 'outgoing directive has no valid directive_id');
    const archived = read('after', directiveArchivePath(outId));
    if (archived == null || Buffer.compare(Buffer.from(archived), Buffer.from(outgoing)) !== 0) {
      return fail('OUTGOING_DIRECTIVE_NOT_PRESERVED', `${directiveArchivePath(outId)} must hold the exact outgoing bytes`);
    }
    const provText = read('after', directiveProvenancePath(outId));
    if (provText == null) return fail('DIRECTIVE_PROVENANCE_MISSING', directiveProvenancePath(outId));
    let prov;
    try { prov = JSON.parse(String(provText)); } catch (err) { return fail('DIRECTIVE_PROVENANCE_MISMATCH', `unparseable provenance: ${err.message}`); }
    const expected = {
      directive_id: outId,
      cycle_id: outHeader.cycle_id,
      source_blob: gitBlobId(Buffer.from(outgoing)),
      archive_blob: gitBlobId(Buffer.from(archived)),
    };
    const publication = resolvePublication ? resolvePublication() : undefined;
    if (publication !== undefined) expected.publication_commit = publication;
    const wrong = Object.entries(expected).filter(([k, v]) => prov[k] !== v).map(([k, v]) => `${k}(provenance=${prov[k] ?? '∅'}, expected=${v ?? '∅'})`);
    if (!SHA_RE.test(String(prov.publication_commit))) wrong.push(`publication_commit(${prov.publication_commit ?? '∅'} not exact)`);
    if (wrong.length) return fail('DIRECTIVE_PROVENANCE_MISMATCH', wrong.join('; '));
    const index = read('after', PATHS.directiveArchiveIndex);
    if (index == null || !String(index).includes(`| ${outId} |`)) {
      return fail('DIRECTIVE_ARCHIVE_INDEX_MISSING', `${PATHS.directiveArchiveIndex} has no row for ${outId}`);
    }
  }

  if (aActive && directiveChanged) {
    const incoming = read('after', PATHS.currentDirective);
    let inHeader;
    try { inHeader = incoming == null ? null : parseDirectiveHeader(incoming); } catch { inHeader = null; }
    const inId = inHeader?.directive_id;
    if (inId && DIRECTIVE_ID_RE.test(inId)) {
      const prior = read('before', directiveArchivePath(inId));
      if (prior != null && Buffer.compare(Buffer.from(prior), Buffer.from(incoming)) !== 0) {
        return fail('DUPLICATE_ID_DIFFERENT_BYTES', `${inId} is already archived with different content; mint a new directive_id`);
      }
    }
  }
  return pass('DIRECTIVE_TRANSITION_COMPLETE');
}

// ------------------------------------------------ obligation carry-forward

export function checkObligationInventory(text) {
  const rows = parseObligations(text);
  if (rows.length === 0) return fail('OBLIGATION_INVENTORY_EMPTY', 'no OBL- rows found');
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.id)) return fail('DUPLICATE_OBLIGATION_ID', r.id);
    seen.add(r.id);
    if (!OBLIGATION_DISPOSITIONS.includes(r.disposition)) return fail('UNKNOWN_DISPOSITION', `${r.id}: ${r.disposition}`);
    if (!r.source) return fail('OBLIGATION_SOURCE_MISSING', r.id);
    if (!UNRESOLVED.has(r.disposition) && !hasReference(r.closure)) {
      return fail('CLOSURE_REFERENCE_MISSING', `${r.id} is ${r.disposition} without a closure/supersession reference`);
    }
  }
  return pass('OBLIGATION_INVENTORY_WELL_FORMED', { count: rows.length });
}

function hasReference(cell) {
  const c = String(cell ?? '').replace(/`/g, '').trim();
  return c !== '' && c !== '—' && c !== '-' && c.toUpperCase() !== 'N/A';
}

// Every unresolved obligation in `before` must survive in `after` (AS79-F002):
// - still OPEN/DEFERRED: obligation and source cells byte-identical (cell
//   padding whitespace is table formatting, not content);
// - CLOSED/SUPERSEDED: a non-empty closure/supersession reference;
// - absent: hard failure.
// Purely mechanical; no semantic inference.
export function checkObligationCarryForward(beforeText, afterText) {
  const shape = checkObligationInventory(afterText);
  if (!shape.ok) return shape;
  const after = new Map(parseObligations(afterText).map((r) => [r.id, r]));
  const dropped = [];
  const rewritten = [];
  const unclosed = [];
  for (const r of parseObligations(beforeText)) {
    if (!UNRESOLVED.has(r.disposition)) continue;
    const next = after.get(r.id);
    if (!next) {
      dropped.push(r.id);
    } else if (UNRESOLVED.has(next.disposition)) {
      if (next.obligation !== r.obligation) rewritten.push(`${r.id} obligation text`);
      if (next.source !== r.source) rewritten.push(`${r.id} authoritative source`);
    } else if (!hasReference(next.closure)) {
      unclosed.push(r.id);
    }
  }
  if (dropped.length) return fail('OBLIGATION_DROPPED', `unresolved obligations removed without closure: ${dropped.join(', ')}`);
  if (rewritten.length) return fail('OBLIGATION_REWRITTEN', `unresolved obligation changed in place: ${rewritten.join(', ')}; close/supersede it with a citation instead`);
  if (unclosed.length) return fail('CLOSURE_REFERENCE_MISSING', `closed/superseded without a reference: ${unclosed.join(', ')}`);
  return pass('OBLIGATIONS_CARRIED_FORWARD');
}

// ------------------------------------------------------ write-path checks

export function checkGovernedWrite(stateFields, { actor, mode = 'governed', action = 'coordination' } = {}) {
  if (mode === 'advisory') return pass('ADVISORY_READ_ONLY', { writes: 'none permitted' });
  if (mode !== 'governed') return fail('UNKNOWN_MODE', String(mode));
  if (!(action in ACTION_FLAGS)) return fail('UNKNOWN_ACTION_CLASS', `${action} is not a recognized action class; denied by default`);
  if (!actor || stateFields.TURN !== actor) {
    return fail('WRONG_TURN', `TURN is ${stateFields.TURN ?? '∅'}; ${actor ?? '∅'} may perform advisory analysis only`);
  }
  const required = ACTION_REQUIRED_FIELD[actor];
  if (required && stateFields[required] !== 'YES') return fail('ACTION_NOT_REQUIRED', `${required} is ${stateFields[required] ?? '∅'}`);
  const flag = ACTION_FLAGS[action];
  if (flag && stateFields[flag] !== 'YES') {
    return fail('ACTION_NOT_AUTHORIZED', `holding the turn does not authorize ${action}; ${flag} is ${stateFields[flag] ?? '∅'}`);
  }
  return pass('GOVERNED_WRITE_PERMITTED_BY_STATE');
}

export function parsePorcelain(output) {
  const entries = [];
  for (const line of String(output).split('\n')) {
    if (!line.trim()) continue;
    const xy = line.slice(0, 2);
    let p = line.slice(3);
    if (p.includes(' -> ')) p = p.split(' -> ')[1];
    entries.push({ xy, path: p.replace(/^"|"$/g, '') });
  }
  return entries;
}

// Unrelated local work is preserved and reported, never discarded.
export function checkWorktree(porcelainOutput, candidatePaths) {
  const allowed = new Set(candidatePaths);
  const unrelated = parsePorcelain(porcelainOutput).filter((e) => !allowed.has(e.path));
  if (unrelated.length) {
    return fail('UNRELATED_LOCAL_WORK',
      `stop and disclose; unrelated work left untouched: ${unrelated.map((e) => `${e.xy.trim() || '??'} ${e.path}`).join(', ')}`);
  }
  return pass('WORKTREE_BOUNDED');
}

export function checkWorktreeStable(fingerprintAtValidation, fingerprintNow) {
  if (fingerprintAtValidation !== fingerprintNow) {
    return fail('LOCAL_WORK_AFTER_VALIDATION', 'working tree changed after validation; revalidate before publication');
  }
  return pass('WORKTREE_UNCHANGED_SINCE_VALIDATION');
}

export function checkLegacyAppend(stateFields, changedFiles) {
  const touches = changedFiles.includes(PATHS.legacyHandoff);
  if (stateFields.PROTOCOL_VERSION === undefined) {
    return pass(touches ? 'LEGACY_APPEND_PERMITTED_PRE_CUTOVER' : 'LEGACY_UNTOUCHED');
  }
  if (touches) return fail('LEGACY_APPEND_AFTER_CUTOVER', `${PATHS.legacyHandoff} is frozen historical evidence`);
  return pass('LEGACY_UNTOUCHED');
}

export function checkLegacyFrozen(blobAtSnapshot, expected = FROZEN_LEGACY_HANDOFF_BLOB) {
  if (blobAtSnapshot !== expected) {
    return fail('LEGACY_HANDOFF_MODIFIED', `${PATHS.legacyHandoff} blob ${blobAtSnapshot ?? '∅'} != frozen ${expected}`);
  }
  return pass('LEGACY_HANDOFF_FROZEN');
}

export function checkExpectedTip({ candidateParent, currentTip }) {
  if (!currentTip) return fail('FRESHNESS_UNAVAILABLE', 'current tip unknown; do not publish');
  if (candidateParent !== currentTip) {
    return fail('BRANCH_ADVANCED', `candidate parent ${candidateParent} != current tip ${currentTip}; build a new candidate from a fresh snapshot`);
  }
  return pass('EXPECTED_TIP_MATCHES');
}

// ------------------------------------------------- rolling-record archive

export function gitBlobId(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

export function handoffArchivePath(handoffId) {
  if (!HANDOFF_ID_RE.test(handoffId)) throw new Error(`INVALID_HANDOFF_ID: ${handoffId}`);
  return `${PATHS.handoffArchiveDir}/${handoffId}.md`;
}

export function syncArchivePath(reviewId) {
  if (!SYNC_ID_RE.test(reviewId)) throw new Error(`INVALID_REVIEW_ID: ${reviewId}`);
  return `${PATHS.syncArchiveDir}/${reviewId}.md`;
}

// Deterministic, immutable, provenance-carrying archival. Exact bytes go to
// <id>.md; provenance goes to <id>.provenance.json. An existing entry with
// identical bytes is a no-op; different bytes fail closed.
export function archiveHandoff({ root, handoffId, bytes, sourceCommit, sourcePath = PATHS.currentHandoff, fsImpl = fs }) {
  let rel;
  try {
    rel = handoffArchivePath(handoffId);
  } catch (err) {
    return fail('INVALID_HANDOFF_ID', err.message);
  }
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (!SHA_RE.test(String(sourceCommit))) return fail('PROVENANCE_MISSING', 'sourceCommit must be an exact commit');
  const blob = gitBlobId(buf);
  const target = path.join(root, rel);
  const sidecar = target.replace(/\.md$/, '.provenance.json');
  const provenance = `${JSON.stringify({
    handoff_id: handoffId,
    source_path: sourcePath,
    source_commit: sourceCommit,
    source_blob: blob,
    sha256: createHash('sha256').update(buf).digest('hex'),
  }, null, 2)}\n`;

  let existing = null;
  try {
    existing = fsImpl.readFileSync(target);
  } catch (err) {
    if (err.code !== 'ENOENT') return fail('ARCHIVE_WRITE_FAILED', err.message);
  }
  if (existing) {
    if (Buffer.compare(existing, buf) !== 0) {
      return fail('ARCHIVE_ID_CONFLICT', `${rel} already exists with different bytes; archive entries are immutable`);
    }
    return pass('ALREADY_ARCHIVED', { path: rel, blob });
  }

  const created = [];
  try {
    fsImpl.mkdirSync(path.dirname(target), { recursive: true });
    fsImpl.writeFileSync(target, buf, { flag: 'wx' });
    created.push(target);
    fsImpl.writeFileSync(sidecar, provenance, { flag: 'wx' });
    created.push(sidecar);
  } catch (err) {
    for (const f of created) {
      try { fsImpl.unlinkSync(f); } catch { /* leave for disclosure */ }
    }
    return fail('ARCHIVE_WRITE_FAILED', `${err.code ?? ''} ${err.message}`.trim());
  }
  return pass('ARCHIVED', { path: rel, blob });
}

// An ID already archived with different bytes can never be reused.
export function checkHandoffIdUnique({ handoffId, bytes, readArchived }) {
  const archived = readArchived(handoffArchivePath(handoffId));
  if (archived == null) return pass('HANDOFF_ID_UNUSED');
  if (Buffer.compare(Buffer.from(archived), Buffer.from(bytes)) !== 0) {
    return fail('DUPLICATE_ID_DIFFERENT_BYTES', `${handoffId} already archived with different content`);
  }
  return pass('HANDOFF_ID_SAME_BYTES');
}

// One coordination transition = one candidate commit. `read(tree, path)`
// returns bytes/string or null for the 'before' (parent) and 'after'
// (candidate) trees.
export function checkTransitionCompleteness({ read, changedFiles }) {
  const changed = new Set(changedFiles);
  const beforeState = read('before', PATHS.state);
  const afterState = read('after', PATHS.state);
  if (afterState == null) return fail('STATE_MISSING', 'candidate has no STATE');
  const b = beforeState == null ? Object.create(null) : parseStateFields(beforeState);
  const a = parseStateFields(afterState);

  const selectorChanged = (b.HANDOFF_ID ?? '') !== (a.HANDOFF_ID ?? '') || (b.CURRENT_HANDOFF ?? '') !== (a.CURRENT_HANDOFF ?? '');
  const handoffChanged = changed.has(PATHS.currentHandoff);
  if (a.CURRENT_HANDOFF === 'ACTIVE' && selectorChanged && !handoffChanged) {
    return fail('PARTIAL_COORDINATION_TRANSITION', 'STATE selects a new handoff but CURRENT_HANDOFF is not in the same commit');
  }
  if (handoffChanged && !changed.has(PATHS.state)) {
    return fail('PARTIAL_COORDINATION_TRANSITION', 'CURRENT_HANDOFF changed without the STATE transition that selects it');
  }

  // A handoff stops being live when its file is replaced/removed, or when
  // STATE stops selecting it (e.g. ACTIVE -> NONE on an Architect routing
  // turn). Either way its exact bytes must be archived in this transition.
  const outgoingHandoff = read('before', PATHS.currentHandoff);
  const deselected = b.CURRENT_HANDOFF === 'ACTIVE'
    && (a.CURRENT_HANDOFF !== 'ACTIVE' || (a.HANDOFF_ID ?? '') !== (b.HANDOFF_ID ?? ''));
  if (outgoingHandoff != null && (handoffChanged || deselected)) {
    let header;
    try { header = parseHandoffHeader(outgoingHandoff); } catch { header = null; }
    const outgoingId = header?.handoff_id;
    if (!outgoingId || !HANDOFF_ID_RE.test(outgoingId)) return fail('OUTGOING_HANDOFF_UNIDENTIFIED', 'outgoing handoff has no valid handoff_id');
    const incoming = handoffChanged ? read('after', PATHS.currentHandoff) : null;
    if (incoming != null) {
      let inHeader;
      try { inHeader = parseHandoffHeader(incoming); } catch { inHeader = null; }
      if (inHeader?.handoff_id === outgoingId) {
        return fail('DUPLICATE_ID_DIFFERENT_BYTES', `${outgoingId} republished with different content; mint a new handoff_id`);
      }
    }
    const archived = read('after', handoffArchivePath(outgoingId));
    if (archived == null || Buffer.compare(Buffer.from(archived), Buffer.from(outgoingHandoff)) !== 0) {
      return fail('OUTGOING_HANDOFF_NOT_PRESERVED', `${handoffArchivePath(outgoingId)} must hold the exact outgoing bytes`);
    }
  }

  // AS79-R001: every published review revision carries a new immutable ID.
  if (changed.has(PATHS.review)) {
    const outgoingReview = read('before', PATHS.review);
    const incomingReview = read('after', PATHS.review);
    const incomingId = incomingReview == null ? null : parseReviewId(incomingReview);
    if (incomingReview != null && !incomingId) {
      return fail('REVIEW_ID_UNPARSEABLE', 'incoming ARCHITECT_REVIEW has no "Architect Sync: ML-DEVOS-AS-NNN" line');
    }
    if (outgoingReview != null) {
      const id = parseReviewId(outgoingReview);
      if (!id) return fail('REVIEW_ID_UNPARSEABLE', 'outgoing ARCHITECT_REVIEW has no "Architect Sync: ML-DEVOS-AS-NNN" line');
      if (incomingId === id) {
        return fail('REVIEW_ID_REUSED', `${id} republished with different bytes; mint a new ML-DEVOS-AS-NNN`);
      }
      const archived = read('after', syncArchivePath(id));
      if (archived == null || Buffer.compare(Buffer.from(archived), Buffer.from(outgoingReview)) !== 0) {
        return fail('OUTGOING_REVIEW_NOT_PRESERVED', `${syncArchivePath(id)} must hold the exact outgoing bytes`);
      }
    }
    if (incomingId) {
      const prior = read('before', syncArchivePath(incomingId));
      if (prior != null && Buffer.compare(Buffer.from(prior), Buffer.from(incomingReview)) !== 0) {
        return fail('REVIEW_ID_REUSED', `${incomingId} is already archived with different bytes; mint a new ML-DEVOS-AS-NNN`);
      }
    }
  }
  return pass('TRANSITION_COMPLETE');
}

// Forward-recovery rollback (RFC-018 B018-07).
export function checkRollbackTransition({ read, changedFiles, candidateParent, freshTip, legacyAppendExplicitlyAuthorized = false }) {
  if (!freshTip || candidateParent !== freshTip) {
    return fail('ROLLBACK_NOT_FORWARD_FROM_FRESH_TIP', `rollback parent ${candidateParent} is not the fresh tip ${freshTip}`);
  }
  const before = parseStateFields(read('before', PATHS.state) ?? '');
  const afterText = read('after', PATHS.state) ?? '';
  const after = parseStateFields(afterText);
  const altered = AUTHORITY_FIELDS.filter((k) => (before[k] ?? '') !== (after[k] ?? ''));
  if (altered.length) return fail('ROLLBACK_ALTERED_AUTHORITY', `rollback changed ${altered.join(', ')}`);

  const live = read('before', PATHS.currentHandoff);
  let liveId = null;
  if (live != null) {
    liveId = parseHandoffHeader(live)?.handoff_id;
    const archived = liveId ? read('after', handoffArchivePath(liveId)) : null;
    if (archived == null || Buffer.compare(Buffer.from(archived), Buffer.from(live)) !== 0) {
      return fail('ROLLBACK_DID_NOT_ARCHIVE_CURRENT_RECORDS', `live handoff ${liveId ?? '(unidentified)'} not archived byte-for-byte`);
    }
  }
  const pointers = [PATHS.obligations, liveId ? handoffArchivePath(liveId) : PATHS.handoffArchiveDir];
  const missing = pointers.filter((p) => !afterText.includes(p));
  if (missing.length) return fail('ROLLBACK_MISSING_EVIDENCE_POINTER', `fallback routing must point to ${missing.join(', ')}`);

  const surface = after.FALLBACK_WRITE_SURFACE;
  if (!surface) return fail('ROLLBACK_WRITE_SURFACE_UNDEFINED', 'STATE must declare FALLBACK_WRITE_SURFACE');
  const resumesLegacy = surface.includes(PATHS.legacyHandoff) || changedFiles.includes(PATHS.legacyHandoff);
  if (resumesLegacy && !legacyAppendExplicitlyAuthorized) {
    return fail('ROLLBACK_SILENT_LEGACY_RESUME', 'legacy append may resume only when the rollback decision says so explicitly');
  }
  return pass('ROLLBACK_FORWARD_RECOVERY_OK');
}

// ---------------------------------------------------------- git adapter

export function makeGit(cwd, { env } = {}) {
  return (args, { input } = {}) => {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', input, env: env ?? process.env, maxBuffer: 64 * 1024 * 1024 });
    if (r.error) return { status: 128, stdout: '', stderr: r.error.message };
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  };
}

// Blob content at an exact commit; null for absent paths and directories.
export function readAtCommit(git, commit, relPath) {
  const r = git(['cat-file', 'blob', `${commit}:${relPath}`]);
  return r.status === 0 ? r.stdout : null;
}

export function blobAtCommit(git, commit, relPath) {
  const r = git(['rev-parse', '--verify', '--quiet', `${commit}:${relPath}`]);
  return r.status === 0 ? r.stdout.trim() : null;
}

export function commitParents(git, commit) {
  const r = git(['rev-list', '--parents', '-n', '1', commit]);
  return r.status === 0 ? r.stdout.trim().split(/\s+/).slice(1) : null;
}

// The live handoff's review_target_commit must be the sole parent of the
// commit that published the current CURRENT_HANDOFF bytes.
export function checkReviewTargetAtSnapshot(git, snapshot, stateFields) {
  if (stateFields.CURRENT_HANDOFF !== 'ACTIVE') return pass('NO_HANDOFF_STATE');
  const r = git(['log', '-1', '--format=%H', snapshot, '--', PATHS.currentHandoff]);
  const publishing = r.status === 0 ? r.stdout.trim() : '';
  if (!SHA_RE.test(publishing)) return fail('HANDOFF_PUBLICATION_UNKNOWN', 'cannot find the commit that published CURRENT_HANDOFF');
  const parents = commitParents(git, publishing) ?? [];
  if (parents.length !== 1 || parents[0] !== stateFields.REVIEW_TARGET_COMMIT) {
    return fail('REVIEW_TARGET_NOT_EXACT_TIP',
      `CURRENT_HANDOFF published by ${publishing} with parents [${parents.join(', ')}]; REVIEW_TARGET_COMMIT is ${stateFields.REVIEW_TARGET_COMMIT}`);
  }
  return pass('REVIEW_TARGET_IS_PUBLICATION_PARENT', { publishing });
}

// RFC-020 §7: the selected directive's issue_parent_commit must be the sole
// parent of the commit that published the current CURRENT_DIRECTIVE bytes.
export function lastPublishingCommit(git, snapshot, relPath) {
  const r = git(['log', '-1', '--format=%H', snapshot, '--', relPath]);
  const sha = r.status === 0 ? r.stdout.trim() : '';
  return SHA_RE.test(sha) ? sha : null;
}

export function checkDirectiveIssueParentAtSnapshot(git, snapshot, stateFields) {
  if (stateFields.PROTOCOL_VERSION !== '2' || stateFields.CURRENT_DIRECTIVE !== 'ACTIVE') return pass('NO_DIRECTIVE_SELECTED');
  const publishing = lastPublishingCommit(git, snapshot, PATHS.currentDirective);
  if (!publishing) return fail('DIRECTIVE_PUBLICATION_UNKNOWN', 'cannot find the commit that published CURRENT_DIRECTIVE');
  const parents = commitParents(git, publishing) ?? [];
  if (parents.length !== 1 || parents[0] !== stateFields.DIRECTIVE_ISSUE_PARENT) {
    return fail('DIRECTIVE_ISSUE_PARENT_MISMATCH',
      `CURRENT_DIRECTIVE published by ${publishing} with parents [${parents.join(', ')}]; DIRECTIVE_ISSUE_PARENT is ${stateFields.DIRECTIVE_ISSUE_PARENT}`);
  }
  return pass('DIRECTIVE_ISSUE_PARENT_IS_PUBLICATION_PARENT', { publishing });
}

// A Sync ID "exists" when it is the live review or an immutable archive.
function reviewExistsIn(read, id) {
  const live = read(PATHS.review);
  if (live != null && parseReviewId(live) === id) return true;
  return read(syncArchivePath(id)) != null;
}

export function resolveRemoteTip(git, remote, branch) {
  const r = git(['ls-remote', '--heads', remote, `refs/heads/${branch}`]);
  if (r.status !== 0) return null;
  const line = r.stdout.split('\n').find((l) => l.endsWith(`\trefs/heads/${branch}`));
  const sha = line ? line.split('\t')[0] : null;
  return sha && SHA_RE.test(sha) ? sha : null;
}

export function worktreeFingerprint(git) {
  const h = createHash('sha256');
  const status = git(['status', '--porcelain=v1', '-uall']);
  h.update(status.stdout);
  h.update(git(['diff', 'HEAD', '--binary']).stdout);
  const top = git(['rev-parse', '--show-toplevel']).stdout.trim();
  for (const e of parsePorcelain(status.stdout)) {
    if (e.xy !== '??') continue;
    try { h.update(fs.readFileSync(path.join(top, e.path))); } catch { h.update(`unreadable:${e.path}`); }
  }
  return h.digest('hex');
}

// ------------------------------------------------ publication transaction

// Attempt counts persist outside the working tree (inside .git) so that a
// resumed or reconnected session cannot silently reset an exhausted budget.
export class AttemptLedger {
  constructor(file) {
    this.file = file;
  }

  #load() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return {};
      throw new Error(`ATTEMPT_LEDGER_UNREADABLE: ${err.message}`);
    }
  }

  attempts(transitionId) {
    return this.#load()[transitionId]?.attempts ?? 0;
  }

  exhausted(transitionId) {
    return this.attempts(transitionId) >= MAX_PUBLICATION_ATTEMPTS;
  }

  record(transitionId, outcome) {
    const data = this.#load();
    const entry = data[transitionId] ?? { attempts: 0, outcomes: [] };
    entry.attempts += 1;
    entry.outcomes.push(outcome);
    data[transitionId] = entry;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.file);
    return entry.attempts;
  }
}

export function defaultLedger(git) {
  const p = git(['rev-parse', '--path-format=absolute', '--git-path', 'sentinel-context-bootstrap/attempts.json']).stdout.trim();
  return new AttemptLedger(p);
}

// A receipt ties a successful prepublication check to one exact candidate
// and parent. It is a procedural guard for compliant writers, not a
// cryptographic control: a hostile caller can construct one (disclosed).
export function makeReceipt({ checks, candidate, expectedParent }) {
  const ok = checks.every((c) => c.ok);
  return Object.freeze({ ok, candidate, expectedParent, checks: checks.map((c) => c.code) });
}

const REJECTION_RE = /\[rejected\]|non-fast-forward|fetch first|stale info|\[remote rejected\]/;

// One publication attempt of one candidate against one exact expected tip.
// The push carries an explicit expected-old-value lease on the exact ref
// (AS79-F001): the remote updates only if the ref still equals
// expectedParent. The lease is a compare-and-swap guard only. The
// single-parent == expectedParent check below guarantees every accepted
// update is a fast-forward child of the expected tip, never a rewrite.
export function publishCandidate({ git, remote, branch, candidate, expectedParent, receipt, ledger, transitionId }) {
  if (ledger.exhausted(transitionId)) {
    return fail('PUBLICATION_ATTEMPTS_EXHAUSTED', `${MAX_PUBLICATION_ATTEMPTS} attempts used for ${transitionId}; explicit fresh bootstrap required`);
  }
  if (!receipt || !receipt.ok || receipt.candidate !== candidate || receipt.expectedParent !== expectedParent) {
    return fail('CHECKER_BYPASS_REFUSED', 'no passing prepublication receipt for this exact candidate/parent');
  }
  const parents = git(['rev-list', '--parents', '-n', '1', candidate]).stdout.trim().split(/\s+/).slice(1);
  if (parents.length !== 1 || parents[0] !== expectedParent) {
    return fail('CANDIDATE_NOT_DIRECTLY_PARENTED', `candidate parents [${parents.join(', ')}] != [${expectedParent}]`);
  }

  const attempt = ledger.record(transitionId, 'started');
  const tip = resolveRemoteTip(git, remote, branch);
  const tipCheck = checkExpectedTip({ candidateParent: expectedParent, currentTip: tip });
  if (!tipCheck.ok) return { ...tipCheck, attempt };

  const push = git([
    'push', '--porcelain',
    `--force-with-lease=refs/heads/${branch}:${expectedParent}`,
    remote, `${candidate}:refs/heads/${branch}`,
  ]);
  const out = `${push.stdout}\n${push.stderr}`;
  if (push.status === 0) {
    const readBack = resolveRemoteTip(git, remote, branch);
    if (readBack === candidate) return pass('PUBLISHED', { attempt, tip: candidate });
    return reconcile(readBack, candidate, expectedParent, attempt);
  }
  if (REJECTION_RE.test(out)) {
    return fail('BRANCH_ADVANCED', 'remote rejected a non-fast-forward update; build a new candidate from a fresh snapshot', { attempt });
  }
  // Ambiguous: read back before any further action.
  return reconcile(resolveRemoteTip(git, remote, branch), candidate, expectedParent, attempt);
}

function reconcile(readBack, candidate, expectedParent, attempt) {
  if (readBack === candidate) return pass('PUBLISHED', { attempt, tip: candidate, reconciled: true });
  if (readBack == null) return fail('UNKNOWN_OUTCOME', 'publication outcome and current tip both unknown; stop, do not retry', { attempt });
  if (readBack === expectedParent) return fail('NOT_PUBLISHED', 'read-back shows the candidate did not land', { attempt, retryable: true });
  return fail('BRANCH_ADVANCED', `read-back tip ${readBack} is neither candidate nor expected parent`, { attempt });
}

// Bounded loop. `prepare(tip)` must re-read a fresh snapshot at `tip`,
// rerun the checks, and return { candidate, receipt } parented on `tip`.
export function publishWithRetries({ git, remote, branch, transitionId, ledger, prepare }) {
  let last = null;
  while (!ledger.exhausted(transitionId)) {
    const tip = resolveRemoteTip(git, remote, branch);
    if (!tip) return fail('FRESHNESS_UNAVAILABLE', 'authoritative tip unavailable');
    const { candidate, receipt } = prepare(tip);
    last = publishCandidate({ git, remote, branch, candidate, expectedParent: tip, receipt, ledger, transitionId });
    if (last.ok || !['BRANCH_ADVANCED', 'NOT_PUBLISHED'].includes(last.code)) return last;
  }
  return fail('PUBLICATION_ATTEMPTS_EXHAUSTED', `stopped after ${MAX_PUBLICATION_ATTEMPTS} attempts; last: ${last?.code ?? 'none'}`);
}

// --------------------------------------------------------------- baseline

function sectionTokens(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return [];
  const rest = text.slice(start + heading.length);
  const end = rest.search(/\n## /);
  const body = end < 0 ? rest : rest.slice(0, end);
  return [...body.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]);
}

// Measured bytes/lines of the declared mandatory startup read sets at one
// commit. Token figures are ESTIMATES (bytes/4), never provider-reported.
export function measureBaseline(git, commit) {
  const read = (p) => readAtCommit(git, commit, p);
  const exists = (p) => read(p) != null;
  const resolve = (p) => (exists(p) ? p : exists(`brain/${p}`) ? `brain/${p}` : null);

  const claude = read('CLAUDE.md') ?? '';
  const home = read('brain/00_HOME.md') ?? '';
  const claudeSet = ['CLAUDE.md', ...sectionTokens(claude, '## Required first read').map(resolve).filter(Boolean)];
  const homeSet = ['brain/00_HOME.md', ...sectionTokens(home, '## Read order for a new agent or reviewer').map(resolve).filter(Boolean)];
  const uniq = (xs) => [...new Set(xs)];

  const measure = (files) => {
    const rows = uniq(files).map((f) => {
      const t = read(f) ?? '';
      return { file: f, bytes: Buffer.byteLength(t), lines: t.split('\n').length - (t.endsWith('\n') ? 1 : 0) };
    });
    const bytes = rows.reduce((s, r) => s + r.bytes, 0);
    return { files: rows.length, bytes, estimated_tokens: Math.ceil(bytes / 4), rows };
  };

  const legacy = read(PATHS.legacyHandoff) ?? '';
  const union = measure([...claudeSet, ...homeSet]);
  const claudeMeasure = measure(claudeSet);
  // RFC-020 §19: the declared future ordinary V2 Builder startup set, and the
  // V1 set excluding the conditional CURRENT_HANDOFF (the RFC's basis).
  const v2Set = ['CLAUDE.md', ...sectionTokens(claude, '## Protocol V2 Builder startup').map(resolve).filter(Boolean)];
  const v1Unconditional = measure(claudeSet.filter((f) => f !== PATHS.currentHandoff));
  let v2 = null;
  if (v2Set.length > 1) {
    const m = measure(v2Set);
    const directiveRow = m.rows.find((r) => r.file === PATHS.currentDirective);
    const atBudget = directiveRow ? m.bytes - directiveRow.bytes + DIRECTIVE_BYTE_BUDGET : null;
    const reduction = (bytes) => +(1 - bytes / RFC020_PLANNING_BASELINE_BYTES).toFixed(3);
    v2 = {
      status: 'DECLARED_NOT_ACTIVE',
      ...m,
      directive_byte_budget: DIRECTIVE_BYTE_BUDGET,
      bytes_with_budget_sized_directive: atBudget,
      rfc020_planning_baseline_bytes: RFC020_PLANNING_BASELINE_BYTES,
      reduction_vs_rfc020_baseline: reduction(m.bytes),
      reduction_vs_rfc020_baseline_with_budget_sized_directive: atBudget == null ? null : reduction(atBudget),
      reduction_vs_v1_unconditional_at_commit: v1Unconditional.bytes ? +(1 - m.bytes / v1Unconditional.bytes).toFixed(3) : null,
    };
  }
  const operativeReaders = [
    'AGENTS.md', 'CLAUDE.md', 'coordination/README.md', 'brain/00_HOME.md', 'brain/PROJECT_GOVERNANCE.md',
    'brain/ARCHITECT_HANDOFF.md', 'brain/protocols/ARCHITECT_SYNC.md',
    '.agents/skills/architect-review-sync/SKILL.md', '.agents/skills/implementation-handoff/SKILL.md',
    '.agents/skills/project-orientation-state-recovery/SKILL.md',
    '.claude/skills/architect-review-sync/SKILL.md', '.claude/skills/implementation-handoff/SKILL.md',
    '.claude/skills/project-orientation-state-recovery/SKILL.md',
  ];
  return {
    baseline_id: 'CBV0-BASELINE-PRE-1',
    commit,
    token_label: 'ESTIMATE = ceil(bytes/4); not provider-reported',
    legacy_handoff: {
      path: PATHS.legacyHandoff,
      bytes: Buffer.byteLength(legacy),
      lines: legacy.split('\n').length - (legacy.endsWith('\n') ? 1 : 0),
      history_sections: (legacy.match(/^## /gm) ?? []).length,
      estimated_tokens: Math.ceil(Buffer.byteLength(legacy) / 4),
      share_of_claude_md_mandatory_bytes: claudeMeasure.bytes ? +(Buffer.byteLength(legacy) / claudeMeasure.bytes).toFixed(3) : null,
      mandatory_in: [claudeSet.includes(PATHS.legacyHandoff) && 'CLAUDE.md', homeSet.includes(PATHS.legacyHandoff) && 'brain/00_HOME.md'].filter(Boolean),
    },
    claude_md_mandatory: claudeMeasure,
    claude_md_mandatory_excluding_conditional_handoff: { files: v1Unconditional.files, bytes: v1Unconditional.bytes, estimated_tokens: v1Unconditional.estimated_tokens },
    v2_builder_startup: v2,
    home_read_order: measure(homeSet),
    union_mandatory: { files: union.files, bytes: union.bytes, estimated_tokens: union.estimated_tokens },
    repeated_reads: claudeSet.filter((f) => homeSet.includes(f)),
    operative_legacy_handoff_references: operativeReaders.filter((f) => (read(f) ?? '').includes('IMPLEMENTER_HANDOFF')),
  };
}

// -------------------------------------------------------------------- CLI

function parseArgs(argv) {
  const opts = { mode: 'status', remote: 'origin', branch: AUTHORITATIVE_BRANCH, repo: EXPECTED_REPOSITORY };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--baseline') opts.mode = 'baseline';
    else if (a === '--status') opts.mode = 'status';
    else if (a === '--commit') opts.commit = next();
    else if (a === '--remote') opts.remote = next();
    else if (a === '--branch') opts.branch = next();
    else if (a === '--expected-repo') opts.repo = next();
    else if (a === '--session-protocol') opts.sessionProtocolVersion = next();
    else if (a === '--publish') opts.mode = 'publish';
    else if (a === '--candidate') opts.candidate = next();
    else if (a === '--transition-id') opts.transitionId = next();
    else if (a === '--check-only') opts.checkOnly = true;
    else if (a === '--frozen-legacy-blob') opts.frozenLegacyBlob = next();
    else if (a === '--protocol-cutover') opts.protocolCutover = next();
    else if (a === '--help' || a === '-h') opts.mode = 'help';
    else throw new Error(`unknown argument ${a}`);
  }
  return opts;
}

// Checks every V0 invariant knowable from one exact snapshot.
function activeSnapshotChecks(git, snapshot, fields, opts) {
  const read = (p) => readAtCommit(git, snapshot, p);
  const handoff = read(PATHS.currentHandoff);
  const review = read(PATHS.review);
  const checks = [
    checkIdentityBinding(fields, handoff, fields.CURRENT_HANDOFF === 'ACTIVE' ? { reviewText: review ?? '' } : {}),
    checkReviewTargetAtSnapshot(git, snapshot, fields),
  ];
  if (fields.CURRENT_HANDOFF === 'ACTIVE') checks.push(checkPacketReferences(handoff));
  // RFC-020: directive selector (refused under V1) and, under V2, binding.
  checks.push(checkDirectiveSelector(fields));
  if (fields.PROTOCOL_VERSION === '2' && fields.CURRENT_DIRECTIVE === 'ACTIVE') {
    checks.push(checkDirectiveBinding(fields, read(PATHS.currentDirective), {
      decisionLogText: read(PATHS.decisionLog) ?? '',
      reviewExists: (id) => reviewExistsIn(read, id),
    }));
    checks.push(checkDirectiveIssueParentAtSnapshot(git, snapshot, fields));
  }
  const obligations = read(PATHS.obligations);
  checks.push(obligations == null ? fail('OBLIGATION_INVENTORY_MISSING', PATHS.obligations) : checkObligationInventory(obligations));
  checks.push(checkLegacyFrozen(blobAtCommit(git, snapshot, PATHS.legacyHandoff), opts.frozenLegacyBlob));
  const liveId = review == null ? null : parseReviewId(review);
  if (!liveId) {
    checks.push(fail('REVIEW_ID_UNPARSEABLE', 'live ARCHITECT_REVIEW has no Sync ID'));
  } else {
    const archived = read(syncArchivePath(liveId));
    checks.push(archived != null && archived !== review
      ? fail('REVIEW_ID_REUSED', `${liveId} archive differs from the live review`)
      : pass('LIVE_REVIEW_ID_IMMUTABLE', { reviewId: liveId, archived: archived != null }));
  }
  return checks;
}

// Governed publication of one already-committed candidate: every transition
// check at (parent -> candidate), then the leased exact-tip push.
function runPublish(git, opts) {
  const candidate = opts.candidate;
  const report = { checker: 'check-context-bootstrap', mode: 'publish', candidate, branch: opts.branch, not_proven: NOT_PROVEN };
  const checks = [checkRepository(git(['remote', 'get-url', opts.remote]).stdout.trim(), opts.repo)];
  const parents = SHA_RE.test(String(candidate)) ? commitParents(git, candidate) : null;
  if (!parents || parents.length !== 1) {
    checks.push(fail('CANDIDATE_NOT_DIRECTLY_PARENTED', `candidate must be one exact commit with one parent; parents: ${JSON.stringify(parents)}`));
    return { ...report, checks, ok: false };
  }
  const [parent] = parents;
  const remoteTip = resolveRemoteTip(git, opts.remote, opts.branch);
  checks.push(checkExpectedTip({ candidateParent: parent, currentTip: remoteTip }));
  checks.push(checkWorktree(git(['status', '--porcelain=v1', '-uall']).stdout, []));

  const read = (w, p) => readAtCommit(git, w === 'before' ? parent : candidate, p);
  const changedFiles = git(['diff', '--name-only', parent, candidate]).stdout.split('\n').filter(Boolean);
  let after;
  let before;
  try {
    after = parseStateFields(read('after', PATHS.state) ?? '');
    before = parseStateFields(read('before', PATHS.state) ?? '');
  } catch (err) {
    checks.push(fail('AMBIGUOUS_STATE', err.message));
    return { ...report, parent, checks, ok: false };
  }
  // A declared cutover is published by a session bootstrapped on the parent's
  // protocol; every other transition keeps before == after.
  const cutover = opts.protocolCutover !== undefined && before.PROTOCOL_VERSION !== undefined;
  const pv = checkProtocolVersion(after, { sessionProtocolVersion: cutover ? undefined : opts.sessionProtocolVersion });
  checks.push(pv.ok && !pv.active ? fail('PROTOCOL_NOT_ACTIVE', 'governed V0 publication requires PROTOCOL_VERSION in the candidate STATE') : pv);
  if (cutover && opts.sessionProtocolVersion !== undefined) {
    checks.push(checkProtocolVersion(before, { sessionProtocolVersion: opts.sessionProtocolVersion }));
  }
  if (pv.ok && pv.active) {
    if (after.CURRENT_HANDOFF === 'ACTIVE' && changedFiles.includes(PATHS.currentHandoff)) {
      const handoff = read('after', PATHS.currentHandoff);
      checks.push(checkIdentityBinding(after, handoff, {
        transitionParent: parent,
        reviewText: read('after', PATHS.review) ?? '',
        isAncestor: (x, y) => git(['merge-base', '--is-ancestor', x, y]).status === 0,
      }));
      checks.push(checkPacketReferences(handoff));
    } else {
      checks.push(checkIdentityBinding(after, read('after', PATHS.currentHandoff), {}));
    }
    checks.push(checkTransitionCompleteness({ read, changedFiles }));
    // RFC-020: protocol cutover guard, directive selector/binding/transition.
    checks.push(checkProtocolTransition(before, after, { declaredCutover: opts.protocolCutover }));
    checks.push(checkDirectiveSelector(after));
    if (after.PROTOCOL_VERSION === '2' && after.CURRENT_DIRECTIVE === 'ACTIVE') {
      const directiveChanged = changedFiles.includes(PATHS.currentDirective);
      checks.push(checkDirectiveBinding(after, read('after', PATHS.currentDirective), {
        publicationParent: directiveChanged ? parent : undefined,
        decisionLogText: read('after', PATHS.decisionLog) ?? '',
        reviewExists: (id) => reviewExistsIn((p) => read('after', p), id),
      }));
      if (!directiveChanged) checks.push(checkDirectiveIssueParentAtSnapshot(git, parent, after));
    }
    checks.push(checkDirectiveTransition({
      read, changedFiles, resolvePublication: () => lastPublishingCommit(git, parent, PATHS.currentDirective) ?? undefined,
    }));
    checks.push(checkLegacyAppend(after, changedFiles));
    checks.push(checkLegacyFrozen(blobAtCommit(git, candidate, PATHS.legacyHandoff), opts.frozenLegacyBlob));
    const beforeInv = read('before', PATHS.obligations);
    const afterInv = read('after', PATHS.obligations);
    checks.push(afterInv == null ? fail('OBLIGATION_INVENTORY_MISSING', PATHS.obligations)
      : beforeInv == null ? checkObligationInventory(afterInv) : checkObligationCarryForward(beforeInv, afterInv));
  }
  const receipt = makeReceipt({ checks, candidate, expectedParent: parent });
  if (!receipt.ok) return { ...report, parent, changed_files: changedFiles, checks, ok: false, publication: 'NOT_ATTEMPTED' };
  if (opts.checkOnly) return { ...report, parent, changed_files: changedFiles, checks, ok: true, publication: 'CHECK_ONLY' };
  const transitionId = opts.transitionId ?? `${after.CYCLE_ID}:${after.HANDOFF_ID || 'NONE'}:${after.TURN}`;
  const result = publishCandidate({
    git, remote: opts.remote, branch: opts.branch, candidate, expectedParent: parent, receipt, ledger: defaultLedger(git), transitionId,
  });
  return { ...report, parent, transition_id: transitionId, changed_files: changedFiles, checks, publication: result, ok: result.ok };
}

function runStatus(git, opts) {
  const remoteUrl = git(['remote', 'get-url', opts.remote]).stdout.trim();
  const remoteTip = resolveRemoteTip(git, opts.remote, opts.branch);
  const snapshot = opts.commit ?? git(['rev-parse', 'HEAD']).stdout.trim();
  const stateText = readAtCommit(git, snapshot, PATHS.state);
  const checks = [
    checkRepository(remoteUrl, opts.repo),
    checkFreshness({ snapshotCommit: snapshot, remoteTip }),
  ];
  if (stateText == null) {
    checks.push(fail('STATE_MISSING', `${PATHS.state} absent at ${snapshot}`));
  } else {
    let fields;
    try {
      fields = parseStateFields(stateText);
    } catch (err) {
      checks.push(fail('AMBIGUOUS_STATE', err.message));
    }
    if (fields) {
      const pv = checkProtocolVersion(fields, { sessionProtocolVersion: opts.sessionProtocolVersion });
      checks.push(pv);
      if (pv.ok && pv.active) checks.push(...activeSnapshotChecks(git, snapshot, fields, opts));
    }
  }
  return {
    checker: 'check-context-bootstrap',
    snapshot,
    authoritative_tip: remoteTip,
    branch: opts.branch,
    checks,
    ok: checks.every((c) => c.ok),
    not_proven: NOT_PROVEN,
  };
}

const HELP = `usage: node scripts/check-context-bootstrap.mjs [--status] [--commit <sha>] [--remote origin]
         [--branch ${AUTHORITATIVE_BRANCH}] [--expected-repo ${EXPECTED_REPOSITORY}] [--session-protocol <n>]
       node scripts/check-context-bootstrap.mjs --baseline [--commit <sha>]
       node scripts/check-context-bootstrap.mjs --publish --candidate <sha> [--check-only] [--transition-id <id>] [--remote origin] [--branch ...]
         [--session-protocol <n>] [--protocol-cutover <from>-><to>  (only under an owner cutover decision)]
Exit: 0 all checks pass; 1 a check failed (fail closed); 2 usage error.`;

export function main(argv = process.argv.slice(2), { cwd = process.cwd(), stdout = process.stdout } = {}) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    stdout.write(`${err.message}\n${HELP}\n`);
    return 2;
  }
  if (opts.mode === 'help') {
    stdout.write(`${HELP}\n`);
    return 0;
  }
  const git = makeGit(cwd);
  if (opts.mode === 'baseline') {
    const commit = opts.commit ?? git(['rev-parse', 'HEAD']).stdout.trim();
    stdout.write(`${JSON.stringify(measureBaseline(git, commit), null, 2)}\n`);
    return 0;
  }
  if (opts.mode === 'publish') {
    if (!opts.candidate) {
      stdout.write(`--publish requires --candidate <sha>\n${HELP}\n`);
      return 2;
    }
    const pub = runPublish(git, opts);
    stdout.write(`${JSON.stringify(pub, null, 2)}\n`);
    return pub.ok ? 0 : 1;
  }
  const report = runStatus(git, opts);
  stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
