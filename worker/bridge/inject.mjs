// RFC-022 §5.2–§5.3 (ML-DEVOS-AS-132, D-105/D-106): the bridge span and its
// fixed-offset insertion into the unmodified homepage artifact: since D-121
// (ML-DEVOS-AS-145) the V10.1 artifact promoted byte-for-byte from
// candidates/v10.1/site/index.html (derived from the D-093 artifact).
//
// The artifact file (public/index.html) is never edited. When — and only
// when — a valid published payload exists, the served response is the
// artifact with exactly one span inserted immediately before the outer
// document's `</head>`:
//
//   <script type="application/json" id="ml-published">JSON</script><script>HOOK</script>
//
// The head contains no <script>; every script (the MLData data script
// included) is at the end of the body, so this position precedes every
// script and the hook runs before MLData is assigned. Removing the span
// yields the artifact bytes exactly.
//
// HOOK is a code constant — never derived from data. It captures the island
// at parse time, defines a `window.MLData` accessor, and when the artifact
// assigns MLData it returns a shallow copy in which PROJ/FLOW (projects
// group) and EMAIL (contact group) are replaced only if they re-validate. It
// never throws, never adds keys and never evaluates data.
import { serializeBridgePayload } from "./payload.mjs";

// Promoted V10.1 artifact identity (D-121; tests/homepage-artifact.test.mjs pins the same SHA).
export const ARTIFACT_SHA256 = "220ce809e7a64104dbce954d2b30a56aa753c70b64646a99cffdeee5017f3dcc";
export const ARTIFACT_LENGTH = 20857;
export const INSERTION_OFFSET = 20116; // byte offset of "</head>"
const INSERTION_MARKER = "</head>";

export const HOOK_SOURCE =
  "(function(){" +
  "var P=null;" +
  "try{var el=document.getElementById('ml-published');if(el){var d=JSON.parse(el.textContent);if(d&&d.schemaVersion===1)P=d;}}catch(e){P=null;}" +
  "if(!P)return;" +
  "function txt(v,m){return typeof v==='string'&&v.length>=1&&v.length<=m&&v===v.trim()&&!/[\\u0000-\\u001f\\u007f<>]/.test(v);}" +
  "function okProjects(a,disc){if(!Array.isArray(a)||a.length<1||a.length>5)return false;var seen={};" +
  "for(var i=0;i<a.length;i++){var p=a[i];if(!p||typeof p!=='object')return false;" +
  "if(!txt(p.name,40)||!txt(p.kind,40)||!txt(p.tagline,160)||!txt(p.description,400))return false;" +
  "if(p.status!==''&&p.status!=='Active')return false;var k=p.name.toLowerCase();if(seen[k])return false;seen[k]=1;" +
  "if(!Array.isArray(p.disciplines)||p.disciplines.length<1||p.disciplines.length>6)return false;var ds={};" +
  "for(var j=0;j<p.disciplines.length;j++){var x=p.disciplines[j];if(typeof x!=='number'||x%1!==0||x<0||x>=disc||ds[x])return false;ds[x]=1;}" +
  "if(!Array.isArray(p.flow)||p.flow.length!==4)return false;for(var s=0;s<4;s++){if(!txt(p.flow[s],60))return false;}}" +
  "return true;}" +
  "function okEmail(v){return typeof v==='string'&&v.length<=254&&/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(v);}" +
  "function merge(b){try{if(!b||typeof b!=='object')return b;var o={};for(var key in b){if(Object.prototype.hasOwnProperty.call(b,key))o[key]=b[key];}" +
  "var disc=Array.isArray(b.DISC)?b.DISC.length:0;" +
  "if(P.projects&&disc===6&&Array.isArray(b.PROJ)&&Array.isArray(b.FLOW)&&Array.isArray(b.PSLOTS)&&P.projects.length<=b.PSLOTS.length&&okProjects(P.projects,disc)){" +
  "o.PROJ=P.projects.map(function(p){return{name:p.name,kind:p.kind,status:p.status,tags:p.disciplines.slice(),tag:p.tagline,desc:p.description};});" +
  "o.FLOW=P.projects.map(function(p){return p.flow.slice();});}" +
  "if(P.contact&&okEmail(P.contact.email)&&typeof b.EMAIL==='string')o.EMAIL=P.contact.email;" +
  "return o;}catch(e){return b;}}" +
  "try{var V;Object.defineProperty(window,'MLData',{configurable:true,enumerable:true," +
  "get:function(){return V;},set:function(v){V=merge(v);}});}catch(e){}" +
  "})();";

export function buildBridgeSpan(payload) {
  return `<script type="application/json" id="ml-published">${serializeBridgePayload(payload)}</script><script>${HOOK_SOURCE}</script>`;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Returns true only if `bytes` is exactly the approved artifact and the
// insertion marker sits at the pinned offset. Any mismatch => no splice.
// `skipDigest` is used only by worker/public/home.mjs for a response whose
// content-derived ETag already passed the full digest in this isolate.
export async function isApprovedArtifact(bytes, { skipDigest = false } = {}) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== ARTIFACT_LENGTH) return false;
  const marker = new TextDecoder().decode(bytes.subarray(INSERTION_OFFSET, INSERTION_OFFSET + INSERTION_MARKER.length));
  if (marker !== INSERTION_MARKER) return false;
  if (skipDigest) return true;
  return (await sha256Hex(bytes)) === ARTIFACT_SHA256;
}

// Splices the span into verified artifact bytes. Callers must verify with
// isApprovedArtifact first.
export function spliceArtifact(bytes, payload) {
  const span = new TextEncoder().encode(buildBridgeSpan(payload));
  const out = new Uint8Array(bytes.length + span.length);
  out.set(bytes.subarray(0, INSERTION_OFFSET), 0);
  out.set(span, INSERTION_OFFSET);
  out.set(bytes.subarray(INSERTION_OFFSET), INSERTION_OFFSET + span.length);
  return out;
}

// Body-identity headers of the original artifact that must not survive a
// transformation (AS132-F001).
const BODY_IDENTITY_HEADERS = ["content-length", "content-encoding", "etag", "last-modified", "content-md5", "digest"];

// AS132-F001: builds the transformed response. Keeps the original
// content/security headers, drops every body-identity validator, and sets a
// conservative no-store policy so an injected body is never reused as the
// immutable artifact nor survives a publication change under an
// artifact-only validator.
export function buildTransformedResponse(original, body) {
  const headers = new Headers(original.headers);
  for (const name of BODY_IDENTITY_HEADERS) headers.delete(name);
  headers.set("Cache-Control", "no-store");
  if (!headers.has("Content-Type")) headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { status: 200, headers });
}
