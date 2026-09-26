// S5 V1 `cloudflare` adapter (ML-DEVOS-RFC-017 §9). Canonical resource: the
// provider's opaque zone/resource identifier, byte-for-byte, with no
// percent-decoding or normalization. The adapter accepts only identifiers it
// holds as genuine Cloudflare references (the host's trusted reference set,
// e.g. IDs taken from a Cloudflare API response or the committed wrangler
// configuration); an arbitrary caller-supplied string -> MALFORMED_REQUEST.
// V1 performs no network call and no Cloudflare mutation of any kind.

import { canonicalize } from "../canonical.mjs";
import { makeAdapter } from "./common.mjs";

export function createCloudflareAdapter({ minter, host, policies }) {
  const references = new Set(host.cloudflareReferences ?? []);
  return makeAdapter({
    provider: "cloudflare",
    minter,
    host,
    policies,
    canonicalizeResource(raw) {
      const r = canonicalize("cloudflare", raw);
      if (!r.ok) return r;
      return references.has(r.value) ? r : { ok: false, reason: "identifier not obtained from a genuine Cloudflare reference" };
    },
  });
}
