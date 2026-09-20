#!/usr/bin/env node
// ML-DEVOS-RFC-016 / ML-DEVOS-AS-065 -- structural validator for a Task
// Engine State record (devos/state/task-state.schema.json), mirroring S3's
// validate-task-contract.mjs convention: zero third-party dependencies, hand-
// written checks that must never disagree with the declared JSON Schema
// about what is structurally valid.
//
// This validator checks structure only. It never inspects actual evidence
// content and never decides whether a task is complete, accepted, merged, or
// deployed -- see devos/state/lifecycle.mjs for the semantic transition
// rules and devos/state/kernel.mjs for the operations that enforce them.

import { fileURLToPath } from "node:url";
import { AUTHORITY_DISCLAIMER, STATES } from "./lifecycle.mjs";

const TASK_ID_PATTERN = /^[A-Z][A-Z0-9_-]*$/;

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonNegativeInteger(v) {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

/**
 * validate(record, errors) -- pushes a human-readable string onto `errors`
 * for every structural defect found; never throws. Returns true iff no
 * errors were pushed. Mirrors the calling convention of
 * devos/contracts/validate-task-contract.mjs.
 */
export function validate(record, errors) {
  const before = errors.length;

  if (!isPlainObject(record)) {
    errors.push("record must be a JSON object");
    return false;
  }

  const allowedTopLevel = new Set([
    "task_id",
    "contract_ref",
    "state",
    "owner",
    "revision",
    "lease_expires_at",
    "retry_counts",
    "idempotency_ledger",
    "history",
    "authority_disclaimer",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowedTopLevel.has(key)) {
      errors.push(`unknown top-level field '${key}' (Task Engine State is a closed, additionalProperties: false shape -- this is the Run History/Evidence Store boundary check)`);
    }
  }

  for (const required of allowedTopLevel) {
    if (!(required in record)) {
      errors.push(`missing required field '${required}'`);
    }
  }

  if (typeof record.task_id !== "string" || !TASK_ID_PATTERN.test(record.task_id) || record.task_id.length < 3) {
    errors.push("'task_id' must be a string matching ^[A-Z][A-Z0-9_-]*$ with length >= 3");
  }

  if (typeof record.contract_ref !== "string" || record.contract_ref.length < 1) {
    errors.push("'contract_ref' must be a non-empty string");
  }

  if (typeof record.state !== "string" || !STATES.includes(record.state)) {
    errors.push(`'state' must be one of: ${STATES.join(", ")}`);
  }

  if (!(record.owner === null || typeof record.owner === "string")) {
    errors.push("'owner' must be a string or null");
  }

  if (!isNonNegativeInteger(record.revision)) {
    errors.push("'revision' must be a non-negative integer");
  }

  if (!(record.lease_expires_at === null || isNonNegativeInteger(record.lease_expires_at))) {
    errors.push("'lease_expires_at' must be a non-negative integer or null");
  }

  if (!isPlainObject(record.retry_counts)) {
    errors.push("'retry_counts' must be an object");
  } else {
    const allowedRetryKeys = new Set(["build", "qa", "review"]);
    for (const key of Object.keys(record.retry_counts)) {
      if (!allowedRetryKeys.has(key)) {
        errors.push(`unknown field '${key}' inside 'retry_counts'`);
      }
    }
    for (const key of allowedRetryKeys) {
      if (!isNonNegativeInteger(record.retry_counts[key])) {
        errors.push(`'retry_counts.${key}' must be a non-negative integer`);
      }
    }
  }

  if (!isPlainObject(record.idempotency_ledger)) {
    errors.push("'idempotency_ledger' must be an object");
  }

  if (!Array.isArray(record.history)) {
    errors.push("'history' must be an array");
  }

  if (record.authority_disclaimer !== AUTHORITY_DISCLAIMER) {
    errors.push("'authority_disclaimer' must exactly match the fixed non-authority disclaimer text -- it cannot be softened, reworded, or omitted");
  }

  return errors.length === before;
}

const isDirectRun = (() => {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
})();

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.log("Usage: node devos/state/validate-task-state.mjs <record.json>");
    console.log("(No self-check fixtures are bundled -- see tests/state-lifecycle.test.mjs for valid/invalid coverage.)");
    return;
  }
  const fs = await import("node:fs/promises");
  const record = JSON.parse(await fs.readFile(path, "utf8"));
  const errors = [];
  const ok = validate(record, errors);
  if (ok) {
    console.log(`PASS: ${path}`);
  } else {
    console.log(`FAIL: ${path}`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exitCode = 1;
  }
}

if (isDirectRun) {
  main();
}
