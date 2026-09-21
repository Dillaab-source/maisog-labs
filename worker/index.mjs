// WEB-INC-001 Worker entrypoint, extended by WEB-INC-002 (ML-DEVOS-RFC-004 /
// ML-DEVOS-AS-015 / D-025) with a post-authentication read-only dashboard
// dispatch, by WEB-INC-006 (WEB-REQ-009 / ML-DEVOS-RFC-009 /
// ML-DEVOS-AS-028 / D-031) with a public, unauthenticated, read-only
// journal API dispatch, and by WEB-INC-007 (ML-DEVOS-RFC-010 /
// ML-DEVOS-AS-030 / D-032) with a public, unauthenticated, read-only design
// API dispatch. Referenced by wrangler.jsonc's "main". Only /admin,
// /admin/*, /api/journal, /api/journal/*, and /api/design are routed here
// (assets.run_worker_first) — every other request never reaches this file
// and is served asset-first by Wrangler.
//
// Required non-secret runtime bindings (configured outside tracked source):
//   ACCESS_TEAM_DOMAIN — e.g. "your-team.cloudflareaccess.com"
//   ACCESS_AUD         — the Access application audience (AUD) tag
//   DB                 — the local-only WEB-INC-005 D1 binding (wrangler.jsonc)
//   MEDIA              — the local-only WEB-INC-004 R2 binding (wrangler.jsonc)
// No secret, private key, or administrator identity is read or stored here.
// If either ACCESS_* value is missing/blank/left as its committed
// placeholder, handleRequest fails closed before this file's getJWKS is ever
// called (AS12-F001) — see worker/auth.mjs's isValidAuthConfig. `env.DB`/
// `env.MEDIA` are never read by this file before handleRequest has already
// verified the Access assertion, since they are only passed into the
// `dispatch` closure invoked after that verification succeeds (AS15-F002).
// `publicDispatch` is the one deliberate exception (AS28-F010, AS30-F008):
// it is invoked for the exact public journal/design paths before any Access
// verification is attempted at all — see worker/auth.mjs's handleRequest.
// It routes to the design dispatch only for the exact `/api/design` path
// (never a wildcard, RFC-010) and to the journal dispatch otherwise, since
// worker/auth.mjs only ever calls `publicDispatch` for one of those two
// path families in the first place.
import { createRemoteJWKSet } from "jose";
import { handleRequest, isPublicDesignApiPath } from "./auth.mjs";
import { handleAdminDispatch } from "./admin/dashboard.mjs";
import { handlePublicJournalDispatch } from "./public/journal.mjs";
import { handlePublicDesignDispatch } from "./public/design.mjs";

let cachedJWKS;
let cachedTeamDomain;

function getJWKS(teamDomain) {
  if (!cachedJWKS || cachedTeamDomain !== teamDomain) {
    cachedJWKS = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    cachedTeamDomain = teamDomain;
  }
  return cachedJWKS;
}

export default {
  async fetch(request, env) {
    return handleRequest(request, {
      assets: env.ASSETS,
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
      getJWKS,
      dispatch: ({ request, url, assets, sub }) => handleAdminDispatch({ request, url, assets, db: env.DB, media: env.MEDIA, sub }),
      publicDispatch: ({ request, url }) =>
        isPublicDesignApiPath(url.pathname)
          ? handlePublicDesignDispatch({ request, url, db: env.DB })
          : handlePublicJournalDispatch({ request, url, db: env.DB }),
    });
  },
};
