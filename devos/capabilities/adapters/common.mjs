// S5 V1 adapter wrapper core (ML-DEVOS-RFC-017 §3, §9). Shared by the five
// bounded adapters. An adapter's request(requestIntent) is the ONLY surface
// an external caller uses:
//
//   1. the untrusted requestIntent is shape-checked and its provider must be
//      this adapter's own;
//   2. the provider-native resource is canonicalized by this adapter's own
//      contract (plus any host-dependent step); failure -> MALFORMED_REQUEST at
//      the boundary, before the core matcher;
//   3. subjectContext and evaluationContext are minted from the trusted HOST
//      environment bound at gateway construction -- never from request fields;
//   4. the live revocation list is fetched fresh from the host on every call;
//   5. the pinned policy is the loaded document whose version the attempt
//      pinned (absent -> the core returns POLICY_VERSION_MISMATCH);
//   6. the pure internal evaluate() decides.
//
// Trusted-source failures (host subject, clock, revocation source) throw a
// distinct error: no placeholder time, no empty revocation list, no decision
// is fabricated (RFC-017 Failure modes).
//
// The adapter never decides ALLOW/DENY itself beyond boundary denials using
// the canonical vocabulary, and never embeds provider authority semantics.

import { denyDecision, evaluate, isWellFormedRequestIntent } from "../evaluate.mjs";
import { snapshot } from "../trusted-context.mjs";

export class TrustedSourceUnavailableError extends Error {
  constructor(source, cause) {
    super(`trusted ${source} unavailable; request cannot proceed (fail closed)`);
    this.name = "TrustedSourceUnavailableError";
    this.source = source;
    this.cause = cause;
  }
}

function fromHost(source, fn) {
  let value;
  try {
    value = fn();
  } catch (err) {
    throw new TrustedSourceUnavailableError(source, err);
  }
  if (value === undefined || value === null) throw new TrustedSourceUnavailableError(source);
  return value;
}

export function makeAdapter({ provider, minter, host, policies, canonicalizeResource }) {
  if (minter?.adapter !== provider) throw new Error(`adapter ${provider} requires its own registered minter`);

  function request(requestIntent) {
    const pinned = requestIntent && typeof requestIntent.policy_version === "string" ? requestIntent.policy_version : null;
    const boundaryDeny = (reason) => Object.freeze({ decision: denyDecision(reason, pinned), presented: null, consequence_tier: null });

    if (!isWellFormedRequestIntent(requestIntent) || requestIntent.provider !== provider) return boundaryDeny("MALFORMED_REQUEST");
    const canonical = canonicalizeResource(requestIntent.resource, host);
    if (!canonical.ok) return boundaryDeny("MALFORMED_REQUEST");
    const intent = Object.freeze({ ...requestIntent, resource: canonical.value });

    const subjectContext = minter.subject(fromHost("subject identity", () => host.subject()));
    const evaluationContext = minter.evaluation({ time: fromHost("clock", () => host.now()) });
    const revocations = fromHost("revocation list", () => host.revocations());
    if (!Array.isArray(revocations)) throw new TrustedSourceUnavailableError("revocation list");

    const policy = policies.get(intent.policy_version) ?? null;
    const decision = evaluate(subjectContext, intent, policy, Object.freeze([...revocations]), evaluationContext);
    const matched = decision.descriptor_id && policy
      ? policy.descriptors.find((d) => d.descriptor_id === decision.descriptor_id)
      : null;
    return Object.freeze({
      decision,
      // Plain unbranded snapshots for the caller's own AuditEnvelope; never
      // re-accepted by evaluate(), so they cannot be replayed.
      presented: Object.freeze({
        subject_context: snapshot(subjectContext),
        request_intent: intent,
        evaluation_context: snapshot(evaluationContext),
      }),
      consequence_tier: matched ? matched.consequence_tier : null,
    });
  }

  return Object.freeze({ provider, request });
}
