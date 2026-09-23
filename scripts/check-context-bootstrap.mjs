#!/usr/bin/env node
// SENTINEL Context Bootstrap V0 mechanical checker.
//
// Authority: ML-DEVOS-RFC-018 (design, ML-DEVOS-AS-078) -> D-062 Stage A.
// Status: PRE-CUTOVER / INACTIVE. The legacy coordination protocol stays
// active until a separately routed Stage B activation adds PROTOCOL_VERSION
// to coordination/STATE.md. Until then this checker reports the protocol as
// inactive and never claims the reader/writer migration is live.
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

export const SUPPORTED_PROTOCOL_VERSIONS = Object.freeze([1]);
export const SUPPORTED_HANDOFF_SCHEMA_VERSIONS = Object.freeze([1]);
export const MAX_PUBLICATION_ATTEMPTS = 3;
export const EXPECTED_REPOSITORY = 'Dillaab-source/maisog-labs';
export const AUTHORITATIVE_BRANCH = 'governance/maisoglabs-v0.1';

export const PATHS = Object.freeze({
  state: 'coordination/STATE.md',
  review: 'coordination/ARCHITECT_REVIEW.md',
  currentHandoff: 'coordination/CURRENT_HANDOFF.md',
  legacyHandoff: 'coordination/IMPLEMENTER_HANDOFF.md',
  obligations: 'coordination/OPERATIVE_OBLIGATIONS.md',
  handoffArchiveDir: 'coordination/archive/handoffs',
  syncArchiveDir: 'devos/changes/architect-syncs',
});

export const NOT_PROVEN = Object.freeze([
  'legitimacy of any human/owner authority recorded in the repository',
  'that a committed authorization claim was actually granted by the applicable decision process',
  'model or provider identity of any actor',
  'semantic completeness or correctness of a review or handoff',
  'atomicity of any external side effect (Cloudflare, production, remote resources)',
  'S5 capability authorization',
  'that a participant did not bypass this checker by writing directly',
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

// CURRENT_HANDOFF header: the first fenced ```yaml block, flat key: value.
export function parseHandoffHeader(text) {
  const m = /```yaml\n([\s\S]*?)\n```/.exec(String(text));
  if (!m) return null;
  const header = Object.create(null);
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = /^([a-z_]+):[ \t]*(.*?)[ \t]*$/.exec(line);
    if (!kv) throw new Error(`MALFORMED_HANDOFF_HEADER: ${line}`);
    if (kv[1] in header) throw new Error(`AMBIGUOUS_HANDOFF_HEADER: ${kv[1]} repeated`);
    header[kv[1]] = kv[2];
  }
  return header;
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
  const headings = new Set([...text.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]));
  const missing = REQUIRED_HANDOFF_SECTIONS.filter((s) => !headings.has(s));
  if (missing.length) return fail('MISSING_REQUIRED_SECTION', missing.join(', '));
  if (!text.includes(PATHS.obligations)) return fail('MISSING_OBLIGATION_REFERENCE', `packet does not reference ${PATHS.obligations}`);
  return pass('PACKET_REFERENCES_PRESENT');
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

  const outgoingHandoff = read('before', PATHS.currentHandoff);
  if (outgoingHandoff != null && handoffChanged) {
    let header;
    try { header = parseHandoffHeader(outgoingHandoff); } catch { header = null; }
    const outgoingId = header?.handoff_id;
    if (!outgoingId || !HANDOFF_ID_RE.test(outgoingId)) return fail('OUTGOING_HANDOFF_UNIDENTIFIED', 'outgoing handoff has no valid handoff_id');
    const incoming = read('after', PATHS.currentHandoff);
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
    else if (a === '--help' || a === '-h') opts.mode = 'help';
    else throw new Error(`unknown argument ${a}`);
  }
  return opts;
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
      if (pv.ok && pv.active) {
        checks.push(checkIdentityBinding(fields, readAtCommit(git, snapshot, PATHS.currentHandoff)));
        const obligations = readAtCommit(git, snapshot, PATHS.obligations);
        checks.push(obligations == null ? fail('OBLIGATION_INVENTORY_MISSING', PATHS.obligations) : checkObligationInventory(obligations));
      }
    }
  }
  return {
    checker: 'check-context-bootstrap',
    stage: 'D-062 Stage A (pre-cutover, inactive)',
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
  const report = runStatus(git, opts);
  stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
