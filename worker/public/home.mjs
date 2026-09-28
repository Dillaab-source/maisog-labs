// RFC-022 (ML-DEVOS-AS-132, D-105/D-106): exact `GET /` published-content
// bridge.
//
// Fail-safe (RFC-022 §5.4): the untouched `assets.fetch(request)` response is
// returned when there is no published content, on a D1 error or timeout, on
// validation failure, on a splice precondition failure, and on any caught
// exception. D1 failure therefore never affects homepage availability.
// Residual risk (accepted by D-105 Q2, AS-131): `/` is Worker-first, so a
// Worker/platform failure before this code runs is not equivalent to
// asset-first service.
//
// Only published pointers are read; drafts never reach public `/`.
import { readBridgeSnapshot } from "../bridge/snapshot.mjs";
import { buildBridgePayload } from "../bridge/payload.mjs";
import { isApprovedArtifact, spliceArtifact, buildTransformedResponse } from "../bridge/inject.mjs";

export const HOME_PATH = "/";
export const SNAPSHOT_TIMEOUT_MS = 250;

export function isHomePath(pathname) {
  return pathname === HOME_PATH;
}

const CONDITIONAL_HEADERS = ["if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "if-range", "range"];

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("snapshot timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Fetches the artifact for transformation without conditional/range headers,
// so the Worker always receives the full body to verify and never answers a
// transformed request with an artifact-validator 304 (AS132-F001).
function unconditionalAssetRequest(request) {
  const headers = new Headers(request.headers);
  for (const name of CONDITIONAL_HEADERS) headers.delete(name);
  return new Request(request.url, { method: "GET", headers });
}

// Per-isolate memo of the last asset ETag whose bytes passed the full SHA-256
// verification. SHA-256 over the 2 MB artifact is the dominant CPU cost of the
// bridged path (local measurement in the D-106 return). Workers static-asset
// ETags are derived from content, so a repeat ETag skips only the digest;
// length and the insertion marker are still checked on every request, and a
// missing or unseen ETag always gets the full digest.
let verifiedArtifactEtag = null;

async function verifyArtifact(original, bytes) {
  const etag = original.headers.get("ETag");
  if (etag !== null && etag === verifiedArtifactEtag) return isApprovedArtifact(bytes, { skipDigest: true });
  const approved = await isApprovedArtifact(bytes);
  if (approved && etag !== null) verifiedArtifactEtag = etag;
  return approved;
}

export async function handlePublicHome({ request, assets, db, timeoutMs = SNAPSHOT_TIMEOUT_MS }) {
  const fallback = () => assets.fetch(request);
  try {
    if (request.method !== "GET") return fallback();

    let snapshot;
    try {
      snapshot = await withTimeout(readBridgeSnapshot(db, { mode: "published" }), timeoutMs);
    } catch {
      return fallback();
    }

    const payload = buildBridgePayload({ projects: snapshot.projects, email: snapshot.email, applyActivationGate: true });
    if (!payload) return fallback();

    const original = await assets.fetch(unconditionalAssetRequest(request));
    if (original.status !== 200) return fallback();
    const bytes = new Uint8Array(await original.clone().arrayBuffer());
    if (!(await verifyArtifact(original, bytes))) return fallback();

    return buildTransformedResponse(original, spliceArtifact(bytes, payload));
  } catch {
    return fallback();
  }
}
