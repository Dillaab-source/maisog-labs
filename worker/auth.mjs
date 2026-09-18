// WEB-INC-001 authentication boundary. Fail-closed only: any missing, malformed,
// expired, wrongly-audienced, or otherwise unverifiable Cloudflare Access
// assertion must result in rejection before the protected asset is served.
import { jwtVerify } from "jose";

export const ACCESS_ASSERTION_HEADER = "Cf-Access-Jwt-Assertion";

const PROTECTED_PATH_PATTERN = /^\/admin(\/.*)?$/;

export function isProtectedPath(pathname) {
  return PROTECTED_PATH_PATTERN.test(pathname);
}

// Throws on any invalid assertion (missing, malformed, expired, wrong
// issuer/audience, untrusted signing key). Never returns a "sort of valid" result.
export async function verifyAccessAssertion(token, { jwks, issuer, audience }) {
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("Missing Cloudflare Access assertion");
  }
  const { payload } = await jwtVerify(token, jwks, { issuer, audience });
  return payload;
}

// Pure, Workers-runtime-agnostic request handler. `assets` is anything with a
// `fetch(request)` method (the real env.ASSETS binding in production, a stub in
// tests). No content mutation, no database access, no state beyond this check.
export async function handleRequest(request, { assets, jwks, issuer, audience }) {
  const url = new URL(request.url);

  if (!isProtectedPath(url.pathname)) {
    return assets.fetch(request);
  }

  const token = request.headers.get(ACCESS_ASSERTION_HEADER);
  try {
    await verifyAccessAssertion(token, { jwks, issuer, audience });
  } catch {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "content-type": "text/plain" },
    });
  }

  return assets.fetch(request);
}
