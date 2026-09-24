// S5 V1 `mcp` adapter (ML-DEVOS-RFC-017 §9). Canonical resource: the resource
// URI in the RFC 3986 form the MCP specification uses, with only RFC 3986's
// own normalizations (lowercase scheme, uppercase percent-hex). Nothing is
// percent-decoded. A non-conforming URI -> MALFORMED_REQUEST.

import { canonicalize } from "../canonical.mjs";
import { makeAdapter } from "./common.mjs";

export function createMcpAdapter({ minter, host, policies }) {
  return makeAdapter({ provider: "mcp", minter, host, policies, canonicalizeResource: (raw) => canonicalize("mcp", raw) });
}
