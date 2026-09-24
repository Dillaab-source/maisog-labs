// S5 V1 static adapter registry (ML-DEVOS-RFC-017 §9). Exactly five adapters,
// a fixed list -- no dynamic plugin discovery. Importing this module claims
// the brand minters once and seals the registry (trusted-context.mjs); if any
// other code claimed them first, this import throws and the gateway is
// unusable (fail closed).

import { loadCapabilityPolicy } from "../validate-capability-policy.mjs";
import { registerAdapters } from "../trusted-context.mjs";
import { PROVIDERS } from "../vocabulary.mjs";
import { createBrowserAdapter } from "./browser.mjs";
import { createCloudflareAdapter } from "./cloudflare.mjs";
import { createGithubAdapter } from "./github.mjs";
import { createMcpAdapter } from "./mcp.mjs";
import { createShellAdapter } from "./shell.mjs";

const FACTORIES = Object.freeze({
  shell: createShellAdapter,
  github: createGithubAdapter,
  cloudflare: createCloudflareAdapter,
  mcp: createMcpAdapter,
  browser: createBrowserAdapter,
});

const minters = registerAdapters((m) => m);

export class GatewayConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "GatewayConfigurationError";
  }
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
// Only providers given a host get an adapter.
export function createGateway({ policies, hosts } = {}) {
  if (!Array.isArray(policies) || policies.length === 0) throw new GatewayConfigurationError("at least one policy document is required");
  const byVersion = new Map();
  for (const doc of policies) {
    const loaded = loadCapabilityPolicy(doc);
    if (byVersion.has(loaded.policy_version)) throw new GatewayConfigurationError(`duplicate policy_version ${loaded.policy_version}`);
    byVersion.set(loaded.policy_version, loaded);
  }
  const adapters = {};
  for (const [provider, host] of Object.entries(hosts ?? {})) {
    if (!PROVIDERS.includes(provider)) throw new GatewayConfigurationError(`no registered adapter for provider ${provider}`);
    checkHost(provider, host);
    adapters[provider] = FACTORIES[provider]({ minter: minters[provider], host, policies: byVersion });
  }
  return Object.freeze(adapters);
}
