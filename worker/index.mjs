// WEB-INC-001 Worker entrypoint, extended by WEB-INC-002 (ML-DEVOS-RFC-004 /
// ML-DEVOS-AS-015 / D-025) with a post-authentication read-only dashboard
// dispatch. Referenced by wrangler.jsonc's "main". Only /admin and /admin/*
// are routed here (assets.run_worker_first) — every other request never
// reaches this file and is served asset-first by Wrangler.
//
// Required non-secret runtime bindings (configured outside tracked source):
//   ACCESS_TEAM_DOMAIN — e.g. "your-team.cloudflareaccess.com"
//   ACCESS_AUD         — the Access application audience (AUD) tag
//   DB                 — the local-only WEB-INC-005 D1 binding (wrangler.jsonc)
// No secret, private key, or administrator identity is read or stored here.
// If either ACCESS_* value is missing/blank/left as its committed
// placeholder, handleRequest fails closed before this file's getJWKS is ever
// called (AS12-F001) — see worker/auth.mjs's isValidAuthConfig. `env.DB` is
// never read by this file before handleRequest has already verified the
// Access assertion, since it is only passed into the `dispatch` closure
// invoked after that verification succeeds (AS15-F002).
import { createRemoteJWKSet } from "jose";
import { handleRequest } from "./auth.mjs";
import { handleAdminDispatch } from "./admin/dashboard.mjs";

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
      dispatch: ({ request, url, assets }) => handleAdminDispatch({ request, url, assets, db: env.DB }),
    });
  },
};
