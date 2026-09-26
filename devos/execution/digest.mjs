// S6 digests (ML-DEVOS-RFC-019 §3, §7.1.2, §13.1). SHA-256, lowercase hex.
import { createHash } from "node:crypto";

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

// Canonical JSON for digests over records whose member order is not itself a
// contract (sorted keys, no insignificant whitespace). Payloads whose byte
// order IS a contract (RFC-019 §7.1.1) are built in fixed order and serialized
// with plain JSON.stringify instead.
export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
}
