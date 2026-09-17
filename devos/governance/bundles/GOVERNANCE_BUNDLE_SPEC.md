# Sentinel Governance Bundle Manifest Specification

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Defines the **shape** of a future Governance Bundle manifest. Per `brain/DECISION_LOG.md` `D-012`, S1 defines this specification only — **signing, distribution, activation, runtime fetching, and Policy Engine execution are explicitly not S1 work** and are not implemented anywhere in this commit.

## Purpose

A Governance Bundle is the future unit of packaging for a versioned, coherent snapshot of Sentinel's rule set, schemas, and their supporting decision trail — so that a (much later) Policy Engine or Task Engine can load "the rules as of version X" as one atomic, integrity-checked artifact rather than reading loose files whose consistency isn't guaranteed at any given moment.

## Manifest fields

| Field | Type | Meaning |
|---|---|---|
| `bundle_id` | string | Stable identifier for this bundle lineage. |
| `version` | string (semver) | Overall Sentinel governance version this bundle represents (see `../specifications/VERSIONING_POLICY.md`). |
| `revision` | integer | Monotonically increasing revision within the same `version`, for non-semantic republishing (e.g. metadata correction). |
| `effective_from` | date | When this bundle becomes the active governance snapshot — a future-facing field; nothing "activates" a bundle in S1. |
| `rule_set` | array of `rule_id` | Every rule record (`../rules/*.yaml`) included in this bundle snapshot. |
| `schemas` | array of file references | Which schema versions (e.g. `rule-record.schema.json`) this bundle's records conform to. |
| `source_rfcs` | array of RFC IDs | Every RFC whose acceptance contributed to this bundle's rule set. |
| `source_adrs` | array of ADR IDs | Every ADR recorded as part of reaching this bundle. |
| `superseded_rules` | array of `rule_id` | Rules this bundle marks `SUPERSEDED` relative to the prior bundle. |
| `approval_evidence` | array of evidence references | Citations (decision IDs, Architect Sync IDs, commit SHAs) proving this bundle was actually approved through the change-governance path, not merely assembled. |
| `integrity_metadata` | object | Reserved for a future content hash / manifest digest. **Not computed or populated in S1.** |
| `signature_metadata` | object | Reserved for a future cryptographic signature over the bundle. **Not computed, not implemented, no signing key exists.** |

## What S1 does and does not do with this spec

**Does:** define the fields above, so a future bundle-producing tool (S2+ "DevOS Repository Foundation" or later) has a target shape to build toward, and so this repository's own rule registry can eventually be described as "bundle version 1.2.0, revision 0" without inventing the concept ad hoc at that time.

**Does not:** compute an `integrity_metadata` hash, generate or apply any `signature_metadata`, publish or distribute anything, or make any code read this manifest at runtime. No bundle file has been produced as an artifact in S1 — only this specification.

## Illustrative shape (not an active bundle — for readability only)

```jsonc
{
  "bundle_id": "sentinel-core",
  "version": "1.2.0",
  "revision": 0,
  "effective_from": "2026-09-17",
  "rule_set": ["CORE-001", "CORE-002", "CORE-003" /* ... */],
  "schemas": ["rule-record.schema.json@1"],
  "source_rfcs": [],
  "source_adrs": [],
  "superseded_rules": [],
  "approval_evidence": ["D-010", "D-011", "D-012", "AS0-002", "AS-003"],
  "integrity_metadata": null,
  "signature_metadata": null
}
```

This example is illustrative documentation, not a filed artifact — no `.json` bundle instance is committed anywhere by this cycle, deliberately, to avoid implying an activation mechanism exists.
