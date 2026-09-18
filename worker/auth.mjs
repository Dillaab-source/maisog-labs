// WEB-INC-001 authentication boundary. Fail-closed only: any missing, malformed,
// expired, wrongly-audienced, or otherwise unverifiable Cloudflare Access
// assertion — AND any missing/blank/placeholder/malformed required auth
// configuration itself — must result in rejection before the protected asset
// is served, and must never trigger a JWKS/network lookup (AS12-F001).
import { jwtVerify } from "jose";

export const ACCESS_ASSERTION_HEADER = "Cf-Access-Jwt-Assertion";

const PROTECTED_PATH_PATTERN = /^\/admin(\/.*)?$/;

export function isProtectedPath(pathname) {
  return PROTECTED_PATH_PATTERN.test(pathname);
}

// The literal placeholder values committed in wrangler.jsonc. If either is
// ever actually deployed unchanged, that is a misconfiguration, not a valid
// team domain/audience, and must fail closed exactly like a missing value.
export const PLACEHOLDER_TEAM_DOMAIN = "REPLACE_WITH_ACCESS_TEAM_DOMAIN";
export const PLACEHOLDER_AUD = "REPLACE_WITH_ACCESS_APPLICATION_AUD";

// Bare-host convention (no scheme, no path): e.g. "my-team.cloudflareaccess.com"
// or a custom Access team domain. The issuer URL is derived from this value
// as `https://${teamDomain}` — see handleRequest below. One convention, applied
// consistently (AS12-F001).
const TEAM_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export function isValidTeamDomain(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    value !== PLACEHOLDER_TEAM_DOMAIN &&
    !value.includes("://") &&
    !value.includes("/") &&
    TEAM_DOMAIN_PATTERN.test(value)
  );
}

export function isValidAudience(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    value !== PLACEHOLDER_AUD
  );
}

// Both team domain and audience must be independently valid before any
// verification is attempted. This check has no network/JWKS dependency and
// must run — and fail closed — before either is constructed (AS12-F001).
export function isValidAuthConfig({ teamDomain, audience }) {
  return isValidTeamDomain(teamDomain) && isValidAudience(audience);
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

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "content-type": "text/plain" },
  });
}

// Pure, Workers-runtime-agnostic request handler. `assets` is anything with a
// `fetch(request)` method (the real env.ASSETS binding in production, a stub in
// tests). `getJWKS(teamDomain)` is only ever invoked after config validation
// passes, so an invalid configuration can never trigger a JWKS/network lookup.
// No content mutation, no database access, no state beyond this check.
export async function handleRequest(request, { assets, teamDomain, audience, getJWKS }) {
  const url = new URL(request.url);

  if (!isProtectedPath(url.pathname)) {
    return assets.fetch(request);
  }

  if (!isValidAuthConfig({ teamDomain, audience })) {
    return unauthorized();
  }

  const token = request.headers.get(ACCESS_ASSERTION_HEADER);
  try {
    const jwks = getJWKS(teamDomain);
    await verifyAccessAssertion(token, { jwks, issuer: `https://${teamDomain}`, audience });
  } catch {
    return unauthorized();
  }

  return assets.fetch(request);
}
