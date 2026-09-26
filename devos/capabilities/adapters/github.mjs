// S5 V1 `github` adapter (ML-DEVOS-RFC-017 §9). Canonical resource: GitHub's
// own owner/repo identifier (owner/repo lowercased, as GitHub treats them
// case-insensitively), optionally ":<ref-or-path>" kept verbatim under git
// ref-format rules. No generic decoding. Anything else -> MALFORMED_REQUEST.

import { canonicalize } from "../canonical.mjs";
import { makeAdapter } from "./common.mjs";

export function createGithubAdapter({ minter, host, policies }) {
  return makeAdapter({ provider: "github", minter, host, policies, canonicalizeResource: (raw) => canonicalize("github", raw) });
}
