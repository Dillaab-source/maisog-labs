// RFC-022 (ML-DEVOS-AS-132, D-105/D-106) V10 published-content bridge:
// payload contract.
//
// The D-093 homepage artifact (public/index.html) keeps its project, flow and
// email data in one embedded `window.MLData` assignment. This module defines
// the only data the bridge may carry into that seam (RFC-022 §5.1): typed,
// allowlisted Tier 1 fields, validated against the artifact's structural
// invariants so that no published content can blank the homepage
// (SystemsPanel destructures PSLOTS[j] for every project -> max 5 projects;
// ProjectsPanel reads FLOW[i][3] -> exactly 4 stages; tags index DISC -> 0..5).
//
// Code owns the V10 design; admin owns approved content fields. Nothing here
// accepts HTML, CSS, JS, URLs (other than the validated email), selectors,
// asset paths or layout values.

export const BRIDGE_SCHEMA_VERSION = 1;
export const MAX_HOMEPAGE_PROJECTS = 5;
export const FLOW_STAGE_COUNT = 4;
export const DISCIPLINE_COUNT = 6;
export const PROJECT_STATUS_VALUES = ["", "Active"];

export const PROJECT_LIMITS = Object.freeze({ name: 40, kind: 40, tagline: 160, description: 400, flowStage: 60 });

// AS132-F002 (mandatory release condition): the project bridge is first
// enabled only when exactly the D-105 initial set is published, featured and
// complete, in this order. Until then public `/` keeps the artifact's own
// project data. Lifting this gate after initial activation is a separate,
// governed code change; it is not a runtime switch.
export const INITIAL_ACTIVATION_GATE = true;
export const INITIAL_ACTIVATION_PROJECT_NAMES = Object.freeze(["ClinicFlow", "Eternal Eggs", "Sentinel / DevOS", "SU", "Maisog Kilat"]);

const CONTROL_OR_ANGLE = /[\u0000-\u001f\u007f<>]/;

function boundedText(value, max) {
  return typeof value === "string" && value === value.trim() && value.length >= 1 && value.length <= max && !CONTROL_OR_ANGLE.test(value);
}

// Same rule as worker/d1/validate.mjs `email`, bounded to 254.
export function isValidBridgeEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
}

function hasExactKeys(value, keys) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

// Validates the V10 homepage fields of one project (the `v10` group stored on
// project_revisions by migration 0006). Returns the normalized value or throws.
export function validateV10ProjectFields(value) {
  if (!hasExactKeys(value, ["tagline", "status", "disciplines", "flow"])) throw new Error("v10: invalid shape");
  if (!boundedText(value.tagline, PROJECT_LIMITS.tagline)) throw new Error("v10.tagline: invalid value");
  if (!PROJECT_STATUS_VALUES.includes(value.status)) throw new Error("v10.status: invalid value");
  const { disciplines, flow } = value;
  if (
    !Array.isArray(disciplines) ||
    disciplines.length < 1 ||
    disciplines.length > DISCIPLINE_COUNT ||
    !disciplines.every(d => Number.isInteger(d) && d >= 0 && d < DISCIPLINE_COUNT) ||
    new Set(disciplines).size !== disciplines.length
  ) {
    throw new Error("v10.disciplines: invalid value");
  }
  if (!Array.isArray(flow) || flow.length !== FLOW_STAGE_COUNT || !flow.every(stage => boundedText(stage, PROJECT_LIMITS.flowStage))) {
    throw new Error("v10.flow: invalid value");
  }
  return { tagline: value.tagline, status: value.status, disciplines: [...disciplines], flow: [...flow] };
}

function validateBridgeProject(value) {
  if (!hasExactKeys(value, ["name", "kind", "status", "tagline", "description", "disciplines", "flow"])) {
    throw new Error("project: invalid shape");
  }
  if (!boundedText(value.name, PROJECT_LIMITS.name)) throw new Error("project.name: invalid value");
  if (!boundedText(value.kind, PROJECT_LIMITS.kind)) throw new Error("project.kind: invalid value");
  if (!boundedText(value.description, PROJECT_LIMITS.description)) throw new Error("project.description: invalid value");
  const v10 = validateV10ProjectFields({ tagline: value.tagline, status: value.status, disciplines: value.disciplines, flow: value.flow });
  return { name: value.name, kind: value.kind, description: value.description, ...v10 };
}

// Projects group (all-or-nothing): 1..5 projects, unique names
// (case-insensitive), each fully valid.
export function validateProjectsGroup(projects) {
  if (!Array.isArray(projects) || projects.length < 1 || projects.length > MAX_HOMEPAGE_PROJECTS) {
    throw new Error("projects: invalid count");
  }
  const normalized = projects.map(validateBridgeProject);
  const names = new Set(normalized.map(p => p.name.toLowerCase()));
  if (names.size !== normalized.length) throw new Error("projects: duplicate name");
  return normalized;
}

export function passesInitialActivationGate(projects) {
  if (!INITIAL_ACTIVATION_GATE) return true;
  return (
    projects.length === INITIAL_ACTIVATION_PROJECT_NAMES.length &&
    projects.every((project, i) => project.name === INITIAL_ACTIVATION_PROJECT_NAMES[i])
  );
}

// Builds the bridge payload from candidate groups. Each group is validated
// independently; an invalid group is dropped, never partially applied.
// Returns null when nothing valid remains (=> no injection at all).
export function buildBridgePayload({ projects = null, email = null, applyActivationGate = true } = {}) {
  const payload = { schemaVersion: BRIDGE_SCHEMA_VERSION };
  if (projects !== null) {
    try {
      const valid = validateProjectsGroup(projects);
      if (!applyActivationGate || passesInitialActivationGate(valid)) payload.projects = valid;
    } catch {
      // group dropped: the artifact's own project data stays in place
    }
  }
  if (email !== null && isValidBridgeEmail(email)) payload.contact = { email };
  return payload.projects || payload.contact ? payload : null;
}

// JSON for a <script type="application/json"> island. `<`, `>`, `&`, U+2028
// and U+2029 are escaped as \uXXXX so the island can never terminate its
// script element or be reinterpreted, even if validation regressed.
export function serializeBridgePayload(payload) {
  return JSON.stringify(payload).replace(/[<>&\u2028\u2029]/g, ch => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}
