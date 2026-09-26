// S5 V1 trusted-context brand and the ONLY place minters exist
// (ML-DEVOS-RFC-017 §3, §9 -- corrects AS75-F001, AS76-F001, AS76-F002;
// ML-DEVOS-AS-082 AS82-F001).
//
// Mechanism: a module-private WeakMap records every subjectContext /
// evaluationContext minted by a registered adapter wrapper. A plain object
// literal -- however perfectly shaped -- is never in that map, so evaluate()
// mechanically rejects it (UNTRUSTED_SUBJECT_CONTEXT / UNTRUSTED_EVALUATION_
// CONTEXT).
//
// AS82-F001: minters are created ONLY inside createGateway() below and are
// passed ONLY to the five statically imported adapter factories. No export
// of this module (or of any other module) returns, accepts-a-callback-for,
// or otherwise releases a minter: there is no "register"/"claim" surface an
// early or foreign caller could use, so there is nothing to acquire and then
// combine with the raw evaluate() core. The adapter factories keep their
// minter inside a closure and expose only request(); branded values never
// leave the adapter (callers receive unbranded snapshots).
//
// Intrinsics used on branded values (WeakMap get/set, Object.freeze,
// Object.keys, Reflect.apply) are captured when this module loads, so code
// that patches them LATER cannot intercept a genuine context.
//
// Trust assumptions and bypass limits (non-cryptographic, in-process V1, as
// RFC-017 §3 permits; unchanged by AS82-F001):
// - Code that patches intrinsics or installs module loader hooks BEFORE this
//   module loads, or edits these source files, is not stopped.
// - A registered adapter that lies, or a gateway constructed with a lying
//   host, is not stopped: whoever calls createGateway() is the trusted
//   embedder (RFC-017 §9 residual risk).
// The brand closes the arbitrary-external-caller forgery vector only.

import { createBrowserAdapter } from "./adapters/browser.mjs";
import { createCloudflareAdapter } from "./adapters/cloudflare.mjs";
import { createGithubAdapter } from "./adapters/github.mjs";
import { createMcpAdapter } from "./adapters/mcp.mjs";
import { createShellAdapter } from "./adapters/shell.mjs";
import { loadCapabilityPolicy } from "./validate-capability-policy.mjs";
import { OPAQUE_REF_PATTERN, PROVIDERS, parseInstant } from "./vocabulary.mjs";

// Captured at module load (see header).
const apply = Reflect.apply;
const freeze = Object.freeze;
const ownKeys = Object.keys;
const wmGet = WeakMap.prototype.get;
const wmSet = WeakMap.prototype.set;

const SUBJECT = "subject";
const EVALUATION = "evaluation";
const minted = new WeakMap(); // branded object -> { kind, adapter }

const lookup = (value) => (value !== null && typeof value === "object" ? apply(wmGet, minted, [value]) : undefined);

export class TrustedContextError extends Error {
  constructor(message) {
    super(message);
    this.name = "TrustedContextError";
  }
}

export class GatewayConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "GatewayConfigurationError";
  }
}

function isWellFormedSubject(v) {
  return typeof v.actor_role === "string" && v.actor_role.length > 0
    && typeof v.actor_id === "string" && v.actor_id.length > 0
    && (v.credential_class === null || (typeof v.credential_class === "string" && /^[a-z][a-z0-9_]*$/.test(v.credential_class)))
    && typeof v.credential_available === "boolean"
    && PROVIDERS.includes(v.attested_by)
    && typeof v.attestation_ref === "string" && OPAQUE_REF_PATTERN.test(v.attestation_ref);
}

// Not exported. Called only from createGateway() for the static adapter set.
function makeMinter(adapter) {
  return freeze({
    adapter,
    subject({ actor_role, actor_id, credential_class, credential_available, attestation_ref }) {
      const value = freeze({
        actor_role,
        actor_id,
        credential_class: credential_class ?? null,
        credential_available,
        attested_by: adapter,
        attestation_ref,
      });
      if (!isWellFormedSubject(value)) throw new TrustedContextError(`adapter ${adapter} produced a malformed subjectContext`);
      apply(wmSet, minted, [value, freeze({ kind: SUBJECT, adapter })]);
      return value;
    },
    evaluation({ time }) {
      if (parseInstant(time) === null) throw new TrustedContextError(`adapter ${adapter} produced a malformed evaluation time`);
      const value = freeze({ time }); // RFC-017 §3: exactly one field
      apply(wmSet, minted, [value, freeze({ kind: EVALUATION, adapter })]);
      return value;
    },
  });
}

// Structural + source validation used by evaluate() step (a).
export function isTrustedSubjectContext(value) {
  const rec = lookup(value);
  return rec !== undefined && rec.kind === SUBJECT && rec.adapter === value.attested_by && isWellFormedSubject(value);
}

export function isTrustedEvaluationContext(value) {
  const rec = lookup(value);
  return rec !== undefined && rec.kind === EVALUATION && ownKeys(value).length === 1 && parseInstant(value.time) !== null;
}

// Plain, unbranded, frozen copy for audit/reporting; never re-accepted by evaluate().
export function snapshot(value) {
  return freeze({ ...value });
}

// The static V1 adapter set (RFC-017 §9): exactly five, no plugin discovery.
function factories() {
  return {
    shell: createShellAdapter,
    github: createGithubAdapter,
    cloudflare: createCloudflareAdapter,
    mcp: createMcpAdapter,
    browser: createBrowserAdapter,
  };
}

function checkHost(provider, host) {
  for (const fn of ["subject", "now", "revocations"]) {
    if (typeof host?.[fn] !== "function") throw new GatewayConfigurationError(`host for ${provider} must provide ${fn}()`);
  }
}

// Constructed by the trusted embedding host, never by a request caller.
// `policies`: repository-local policy documents; every one is validated and
// frozen here, and any invalid document fails the whole construction.
// `hosts`: provider -> trusted host environment ({ subject(), now(),
// revocations() } plus shellRoots / cloudflareReferences where applicable).
// Only providers given a host get an adapter. Each adapter receives a fresh
// minter for its own provider name only; the minter never leaves it.
export function createGateway({ policies, hosts } = {}) {
  if (!Array.isArray(policies) || policies.length === 0) throw new GatewayConfigurationError("at least one policy document is required");
  const byVersion = new Map();
  for (const doc of policies) {
    const loaded = loadCapabilityPolicy(doc);
    if (byVersion.has(loaded.policy_version)) throw new GatewayConfigurationError(`duplicate policy_version ${loaded.policy_version}`);
    byVersion.set(loaded.policy_version, loaded);
  }
  const make = factories();
  const adapters = {};
  for (const [provider, host] of Object.entries(hosts ?? {})) {
    if (!PROVIDERS.includes(provider)) throw new GatewayConfigurationError(`no registered adapter for provider ${provider}`);
    checkHost(provider, host);
    adapters[provider] = make[provider]({ minter: makeMinter(provider), host, policies: byVersion });
  }
  return freeze(adapters);
}
