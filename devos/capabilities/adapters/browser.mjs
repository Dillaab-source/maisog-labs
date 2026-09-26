// S5 V1 `browser` adapter (ML-DEVOS-RFC-017 §9). Canonical resource: a WHATWG
// URL Standard normalized http(s) URL (scheme, host, default port stripped,
// path, query; fragment excluded). URLs with embedded credentials or that do
// not parse -> MALFORMED_REQUEST.

import { canonicalize } from "../canonical.mjs";
import { makeAdapter } from "./common.mjs";

export function createBrowserAdapter({ minter, host, policies }) {
  return makeAdapter({ provider: "browser", minter, host, policies, canonicalizeResource: (raw) => canonicalize("browser", raw) });
}
