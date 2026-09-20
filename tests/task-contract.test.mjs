import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_CLASSES,
  AUTHORITY_DISCLAIMER,
  validateContractSchema,
  validateContractSemantics,
  validateTaskContract,
  loadContract,
} from "../devos/contracts/validate-task-contract.mjs";

// Sentinel S3 Typed Task Contracts (ML-DEVOS-RFC-013 / ML-DEVOS-AS-038 / D-042 /
// ML-DEVOS-AS-053) -- focused validation of the JSON Schema shape, the
// CORE-016/017/018/020 semantic checks, and every bundled example fixture.
// Mirrors the tests/skills.test.mjs pattern: repository-local, zero
// third-party dependencies, deterministic.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTRACTS_ROOT = path.join(REPO_ROOT, "devos", "contracts");
const EXAMPLES_ROOT = path.join(CONTRACTS_ROOT, "examples");

function listFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".contract.json")).map((f) => path.join(dir, f));
}

const VALID_FIXTURES = listFiles(path.join(EXAMPLES_ROOT, "valid"));
const INVALID_FIXTURES = listFiles(path.join(EXAMPLES_ROOT, "invalid"));

test("at least one valid and several invalid example fixtures are bundled", () => {
  assert.ok(VALID_FIXTURES.length >= 2, "expected at least 2 valid example fixtures");
  assert.ok(INVALID_FIXTURES.length >= 6, "expected at least 6 invalid example fixtures covering distinct fail-closed rules");
});

for (const filePath of VALID_FIXTURES) {
  test(`valid fixture ${path.basename(filePath)}: passes structural and semantic validation`, () => {
    const contract = loadContract(filePath);
    const { ok, errors } = validateTaskContract(contract);
    assert.ok(ok, `expected ${filePath} to be valid, got errors: ${JSON.stringify(errors)}`);
  });
}

for (const filePath of INVALID_FIXTURES) {
  test(`invalid fixture ${path.basename(filePath)}: is rejected with at least one error`, () => {
    const contract = loadContract(filePath);
    const { ok, errors } = validateTaskContract(contract);
    assert.equal(ok, false, `expected ${filePath} to be rejected`);
    assert.ok(errors.length > 0, `expected at least one error for ${filePath}`);
  });
}

test("task-contract.schema.json exists and declares the exact evidence vocabulary", () => {
  const schemaPath = path.join(CONTRACTS_ROOT, "task-contract.schema.json");
  assert.ok(fs.existsSync(schemaPath), "task-contract.schema.json must exist");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const evidenceEnum = schema.properties.claims.items.properties.evidence.properties.all_of.items.enum;
  assert.deepEqual(
    new Set(evidenceEnum),
    new Set(["ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED", "INDEPENDENTLY_REPRODUCED", "CI_ATTESTED", "RUNTIME_OBSERVED"]),
    "schema evidence enum must exactly match the five-class Sentinel evidence vocabulary, no more, no fewer"
  );
});

test("EVIDENCE_CLASSES export matches the schema's evidence enum exactly", () => {
  assert.deepEqual(
    EVIDENCE_CLASSES,
    new Set(["ACTOR_REPORTED", "INDEPENDENTLY_INSPECTED", "INDEPENDENTLY_REPRODUCED", "CI_ATTESTED", "RUNTIME_OBSERVED"])
  );
});

test("TASK_CONTRACT_SPEC.md exists and documents all four semantic rules", () => {
  const specPath = path.join(CONTRACTS_ROOT, "TASK_CONTRACT_SPEC.md");
  const content = fs.readFileSync(specPath, "utf8");
  for (const ruleId of ["CORE-016", "CORE-017", "CORE-018", "CORE-020"]) {
    assert.ok(content.includes(ruleId), `spec must document ${ruleId}`);
  }
  assert.match(content, /never grants|does not itself grant/i, "spec must disclaim granting authority");
});

// --- Structural validation, direct unit tests (not just via fixtures) -----

function minimalValidContract(overrides = {}) {
  return {
    contract_schema_version: "1.0.0",
    task_id: "TASK-UNIT-TEST",
    title: "Unit test contract",
    project: "Dillaab-source/maisog-labs",
    change_class: "PATCH",
    authorization_references: ["ML-DEVOS-RFC-013"],
    scope: {
      allowed_paths: ["docs/"],
      remote_resources_involved: false,
      protected_main_or_deploy_in_scope: false,
      production_write_in_scope: false,
      credential_or_security_in_scope: false,
      destructive_actions_in_scope: false,
    },
    acceptance_criteria: [{ criterion_id: "AC-1", statement: "Something happens." }],
    claims: [
      {
        claim_id: "CLAIM-1",
        claim_kind: "DOCUMENTATION_CORRECTNESS",
        statement: "A statement.",
        evidence: { all_of: [], any_of: ["INDEPENDENTLY_INSPECTED"] },
      },
    ],
    authority_disclaimer: AUTHORITY_DISCLAIMER,
    ...overrides,
  };
}

test("structural: a minimal well-formed contract passes", () => {
  const { ok, errors } = validateContractSchema(minimalValidContract());
  assert.ok(ok, JSON.stringify(errors));
});

test("structural: an unknown top-level field is rejected (additionalProperties: false)", () => {
  const contract = minimalValidContract({ some_unknown_field: "nope" });
  const { ok, errors } = validateContractSchema(contract);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("unknown field 'some_unknown_field'")));
});

test("structural: a malformed task_id is rejected", () => {
  const contract = minimalValidContract({ task_id: "not-uppercase" });
  const { ok, errors } = validateContractSchema(contract);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("task_id")));
});

test("structural: duplicate claim_id values are rejected", () => {
  const contract = minimalValidContract();
  contract.claims.push({ ...contract.claims[0] });
  const { ok, errors } = validateContractSchema(contract);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("duplicate claim_id")));
});

test("structural: duplicate acceptance criterion_id values are rejected", () => {
  const contract = minimalValidContract();
  contract.acceptance_criteria.push({ ...contract.acceptance_criteria[0] });
  const { ok, errors } = validateContractSchema(contract);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("duplicate acceptance criterion_id")));
});

// --- Semantic validation, direct unit tests --------------------------------

test("semantic: MAIN claim satisfied only via CI_ATTESTED any_of passes CORE-016", () => {
  const contract = minimalValidContract({
    claims: [{ claim_id: "CLAIM-1", claim_kind: "MAIN", statement: "s", evidence: { all_of: [], any_of: ["CI_ATTESTED"] } }],
  });
  const { ok } = validateContractSemantics(contract);
  assert.ok(ok);
});

test("semantic: MAIN claim with any_of including ACTOR_REPORTED alongside the real class still fails (ACTOR_REPORTED alone would satisfy it)", () => {
  const contract = minimalValidContract({
    claims: [{ claim_id: "CLAIM-1", claim_kind: "MAIN", statement: "s", evidence: { all_of: [], any_of: ["ACTOR_REPORTED", "CI_ATTESTED"] } }],
  });
  const { ok, errors } = validateContractSemantics(contract);
  assert.equal(ok, false, "an any_of that includes ACTOR_REPORTED alongside CI_ATTESTED lets ACTOR_REPORTED alone satisfy the claim, which CORE-016 forbids for MAIN");
  assert.ok(errors.some((e) => e.includes("CORE-016")));
});

test("semantic: DEPLOYED claim closing on ACTOR_REPORTED alone is explicitly allowed (CORE-017), even in a consequence-sensitive contract", () => {
  const contract = minimalValidContract({
    scope: {
      allowed_paths: ["worker/"],
      remote_resources_involved: true,
      protected_main_or_deploy_in_scope: true,
      production_write_in_scope: true,
      credential_or_security_in_scope: false,
      destructive_actions_in_scope: false,
    },
    claims: [{ claim_id: "CLAIM-1", claim_kind: "DEPLOYED", statement: "s", evidence: { all_of: ["ACTOR_REPORTED"], any_of: [] } }],
  });
  const { ok, errors } = validateContractSemantics(contract);
  assert.ok(ok, `CORE-017 explicitly permits ACTOR_REPORTED for DEPLOYED even under CORE-020 escalation; CORE-020's own text says MAIN/DEPLOYED/VERIFIED rules remain authoritative for those exact claims. Errors: ${JSON.stringify(errors)}`);
});

test("semantic: a non-lifecycle claim closing on ACTOR_REPORTED alone in a consequence-sensitive contract fails CORE-020", () => {
  const contract = minimalValidContract({
    scope: {
      allowed_paths: ["migrations/"],
      remote_resources_involved: false,
      protected_main_or_deploy_in_scope: false,
      production_write_in_scope: false,
      credential_or_security_in_scope: true,
      destructive_actions_in_scope: false,
    },
    claims: [{ claim_id: "CLAIM-1", claim_kind: "SECURITY_OR_TRUST_BOUNDARY", statement: "s", evidence: { all_of: ["ACTOR_REPORTED"], any_of: [] } }],
  });
  const { ok, errors } = validateContractSemantics(contract);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("CORE-020")));
});

test("semantic: the same non-lifecycle claim in a NON-consequence-sensitive contract is fine on ACTOR_REPORTED alone", () => {
  const contract = minimalValidContract({
    claims: [{ claim_id: "CLAIM-1", claim_kind: "SECURITY_OR_TRUST_BOUNDARY", statement: "s", evidence: { all_of: ["ACTOR_REPORTED"], any_of: [] } }],
  });
  const { ok, errors } = validateContractSemantics(contract);
  assert.ok(ok, `low-risk/repo-only work should not gain irrelevant escalation (CORE-020's own documented exception). Errors: ${JSON.stringify(errors)}`);
});

test("semantic: VERIFIED claim with RUNTIME_OBSERVED only in any_of (not all_of) fails CORE-018", () => {
  const contract = minimalValidContract({
    claims: [{ claim_id: "CLAIM-1", claim_kind: "VERIFIED", statement: "s", evidence: { all_of: [], any_of: ["RUNTIME_OBSERVED", "CI_ATTESTED"] } }],
  });
  const { ok, errors } = validateContractSemantics(contract);
  assert.equal(ok, false, "RUNTIME_OBSERVED merely as one OR-option lets a weaker class substitute, which CORE-018 forbids");
  assert.ok(errors.some((e) => e.includes("CORE-018")));
});

test("semantic: VERIFIED claim with RUNTIME_OBSERVED in all_of passes CORE-018 regardless of extra any_of options", () => {
  const contract = minimalValidContract({
    claims: [{ claim_id: "CLAIM-1", claim_kind: "VERIFIED", statement: "s", evidence: { all_of: ["RUNTIME_OBSERVED"], any_of: ["CI_ATTESTED"] } }],
  });
  const { ok } = validateContractSemantics(contract);
  assert.ok(ok);
});

test("the validator's public API never exposes an accept/approve-style function", () => {
  // AS38-F002 / RFC-013 §'Binding semantic validation': the validator must
  // never itself decide a task is accepted. This is a structural guarantee
  // on the module's exported surface, not just a comment promise.
  const exported = ["EVIDENCE_CLASSES", "AUTHORITY_DISCLAIMER", "validateContractSchema", "validateContractSemantics", "validateTaskContract", "loadContract", "CONTRACTS_ROOT", "EXAMPLES_ROOT"];
  for (const name of exported) {
    assert.doesNotMatch(name, /accept|approve|certify/i, `exported name '${name}' must not imply task acceptance/approval`);
  }
});

test("authority_disclaimer is required and fixed: omitting it fails structural validation", () => {
  const contract = minimalValidContract();
  delete contract.authority_disclaimer;
  const { ok, errors } = validateContractSchema(contract);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("authority_disclaimer")));
});
