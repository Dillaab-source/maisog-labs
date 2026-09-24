// S5 V1 trusted-context brand (ML-DEVOS-RFC-017 §3, §9 -- corrects AS75-F001,
// AS76-F001, AS76-F002; answers RFC-017 unresolved question 3 for V1).
//
// Mechanism: a module-private WeakMap records every subjectContext /
// evaluationContext minted through a registered adapter's minter. A plain
// object literal -- however perfectly shaped -- is never in that map, so
// evaluate() mechanically rejects it (UNTRUSTED_SUBJECT_CONTEXT /
// UNTRUSTED_EVALUATION_CONTEXT). Minters are released exactly once, to the
// static registered adapter set, and the registry is then sealed: a later
// registerAdapters() call throws, and a hostile early call makes the real
// registration throw at import, so the gateway fails closed instead of
// running with foreign minters.
//
// Trust assumptions and bypass limits (stated plainly, as RFC-017 §3 requires):
// - This is in-process, not cryptographic. Code running in the same process
//   with the ability to monkeypatch modules, or a registered adapter that lies
//   about the content it attests, is NOT stopped by the brand (RFC-017 §9
//   residual risk). The brand closes the arbitrary-external-caller forgery
//   vector only.
// - Branded values are frozen and never handed back to request callers
//   (adapters return plain unbranded snapshots), so a caller cannot replay an
//   earlier branded evaluationContext into a later raw evaluate() call.

import { OPAQUE_REF_PATTERN, PROVIDERS, parseInstant } from "./vocabulary.mjs";

const SUBJECT = "subject";
const EVALUATION = "evaluation";
const minted = new WeakMap(); // object -> { kind, adapter }
let sealed = false;

export class RegistrySealedError extends Error {
  constructor() {
    super("S5 adapter registry is sealed; minters are released only once, to the registered adapter set");
    this.name = "RegistrySealedError";
  }
}

export class TrustedContextError extends Error {
  constructor(message) {
    super(message);
    this.name = "TrustedContextError";
  }
}

function makeMinter(adapter) {
  return Object.freeze({
    adapter,
    // Called only by the adapter wrapper, with facts from its own trusted
    // host environment -- never with request-caller fields.
    subject({ actor_role, actor_id, credential_class, credential_available, attestation_ref }) {
      const value = Object.freeze({
        actor_role,
        actor_id,
        credential_class: credential_class ?? null,
        credential_available,
        attested_by: adapter,
        attestation_ref,
      });
      if (!isWellFormedSubject(value)) throw new TrustedContextError(`adapter ${adapter} produced a malformed subjectContext`);
      minted.set(value, { kind: SUBJECT, adapter });
      return value;
    },
    evaluation({ time }) {
      const value = Object.freeze({ time }); // RFC-017 §3: exactly one field
      if (parseInstant(time) === null) throw new TrustedContextError(`adapter ${adapter} produced a malformed evaluation time`);
      minted.set(value, { kind: EVALUATION, adapter });
      return value;
    },
  });
}

// Release one minter per registered provider, exactly once, then seal.
export function registerAdapters(factory) {
  if (sealed) throw new RegistrySealedError();
  sealed = true;
  const minters = Object.freeze(Object.fromEntries(PROVIDERS.map((p) => [p, makeMinter(p)])));
  return factory(minters);
}

export function isRegistrySealed() {
  return sealed;
}

function isWellFormedSubject(v) {
  return typeof v.actor_role === "string" && v.actor_role.length > 0
    && typeof v.actor_id === "string" && v.actor_id.length > 0
    && (v.credential_class === null || (typeof v.credential_class === "string" && /^[a-z][a-z0-9_]*$/.test(v.credential_class)))
    && typeof v.credential_available === "boolean"
    && PROVIDERS.includes(v.attested_by)
    && typeof v.attestation_ref === "string" && OPAQUE_REF_PATTERN.test(v.attestation_ref);
}

// Structural + source validation used by evaluate() step (a).
export function isTrustedSubjectContext(value) {
  const rec = value !== null && typeof value === "object" ? minted.get(value) : undefined;
  return rec !== undefined && rec.kind === SUBJECT && rec.adapter === value.attested_by && isWellFormedSubject(value);
}

export function isTrustedEvaluationContext(value) {
  const rec = value !== null && typeof value === "object" ? minted.get(value) : undefined;
  return rec !== undefined && rec.kind === EVALUATION && Object.keys(value).length === 1 && parseInstant(value.time) !== null;
}

// Plain, unbranded, frozen copy for audit/reporting; never re-accepted by evaluate().
export function snapshot(value) {
  return Object.freeze({ ...value });
}
