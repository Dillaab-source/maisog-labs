// S5 V1 AuditEnvelope (ML-DEVOS-RFC-017 §12 -- corrects AS75-F005).
//
// An envelope wraps a CapabilityDecision AFTER the fact and is never produced
// by evaluate(). The constructing caller supplies event_id, timestamp (its own
// clock read when it wraps the decision -- distinct from, and never a
// substitute for, evaluationContext.time) and evidence_provenance, chosen from
// its own actual observation. Nothing is generated, defaulted, or inferred
// here: a missing field is an error, not a default. Envelopes are in-process
// values; S5 provides no durable or tamper-evident audit store (S7/S11).

import { looksLikeSecret } from "./validate-capability-policy.mjs";
import { CONSEQUENCE_TIERS, DENIAL_REASONS, EVIDENCE_CLASSES, NON_AUTHORITY_DISCLAIMER, parseInstant } from "./vocabulary.mjs";

export class AuditEnvelopeError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuditEnvelopeError";
  }
}

function plainCopy(value, where) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new AuditEnvelopeError(`${where} must be an object`);
  for (const [k, v] of Object.entries(value)) {
    if (looksLikeSecret(v)) throw new AuditEnvelopeError(`${where}.${k} looks like a secret value`);
  }
  return Object.freeze({ ...value });
}

function isDecision(d) {
  return d !== null && typeof d === "object"
    && (d.outcome === "ALLOW" || d.outcome === "DENY")
    && d.non_authority_disclaimer === NON_AUTHORITY_DISCLAIMER
    && (d.outcome === "ALLOW" ? d.denial_reason === null && typeof d.descriptor_id === "string" : DENIAL_REASONS.includes(d.denial_reason));
}

export function createAuditEnvelope({
  eventId, timestamp, evidenceProvenance, decision,
  subjectContext, requestIntent, evaluationContext, consequenceTier,
} = {}) {
  if (typeof eventId !== "string" || eventId.length === 0 || eventId.length > 128) {
    throw new AuditEnvelopeError("event_id must be supplied by the constructing caller");
  }
  if (parseInstant(timestamp) === null) throw new AuditEnvelopeError("timestamp must be the constructing caller's own UTC instant");
  if (!EVIDENCE_CLASSES.includes(evidenceProvenance)) {
    throw new AuditEnvelopeError(`evidence_provenance must be explicitly chosen from ${EVIDENCE_CLASSES.join(", ")}`);
  }
  if (!isDecision(decision)) throw new AuditEnvelopeError("decision must be an unmodified CapabilityDecision");
  if (consequenceTier !== null && !CONSEQUENCE_TIERS.includes(consequenceTier)) {
    throw new AuditEnvelopeError("consequence_tier must be null or a policy tier (descriptive metadata only)");
  }
  return Object.freeze({
    event_id: eventId,
    timestamp,
    evidence_provenance: evidenceProvenance,
    decision,
    subject_context: plainCopy(subjectContext, "subject_context"),
    request_intent: plainCopy(requestIntent, "request_intent"),
    evaluation_context: plainCopy(evaluationContext, "evaluation_context"),
    consequence_tier: consequenceTier,
  });
}
