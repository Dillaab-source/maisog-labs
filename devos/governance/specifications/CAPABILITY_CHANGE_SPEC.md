# Sentinel Capability-Change Specification

Status: `CANDIDATE — PENDING ARCHITECT APPROVAL` (S1 Governance Kernel). Formalizes `ML-DEVOS-AS-003` "Capability changes" and `D-012`'s capability rule. Template: `../../templates/CAPABILITY_CHANGE_TEMPLATE.md`.

## Constitutional anchor

`CAPABILITY != AUTHORITY` (`../rules/core-rules.json` `CORE-002`, `CORE-008`). Installing or connecting a tool, MCP server, API, or credential never by itself grants any role authority to use it for a governance-significant action. This specification exists so that granting a capability and granting authority to use it are always two separately recorded decisions, never one.

## Required fields for a capability-change proposal

| Field | Meaning |
|---|---|
| `capability_id` | Stable identifier for this capability. |
| `provider` / `tool` | What the capability actually is (e.g. "GitHub MCP server," "Cloudflare Wrangler API," "n8n webhook"). |
| `roles_allowed` | Which Sentinel actors (Paulo, Architect, Builder, QA, Independent Reviewer) may invoke it, and under what conditions. |
| `projects_scopes` | Which projects/repositories this capability applies to — a capability is never globally granted by default. |
| `permission_level` | `read` / `write` / `admin`, per operation the capability exposes. |
| `credentials_secrets` | What credentials/secrets the capability requires, and where they are held (never in this repository's tracked files — see `AGENTS.md`'s pre-existing "never commit secrets" rule, unchanged by Sentinel). |
| `sensitive_operations` | Which specific operations this capability exposes require a Decision Packet (`DECISION_PACKET_SPEC.md`) before use — e.g. "repository creation," "protected-branch push," "production deploy." |
| `human_approval_requirements` | Who must approve granting this capability, and at what risk tier (`../change-policy/CHANGE_GOVERNANCE_POLICY.md` §1, `CAPABILITY` row). |
| `audit_requirements` | What evidence must be recorded each time the capability is actually used for a sensitive operation. |
| `evidence_requirements` | What evidence class (`EVIDENCE_PROVENANCE_MODEL.md`) is required to confirm the capability behaves as documented. |
| `revocation_procedure` | How this capability is withdrawn — who can revoke it and how quickly it takes effect. |

## Real precedent this session already lived through

This repository's own history already demonstrates why this specification matters: this session's Builder was granted GitHub API write capability (via the pre-configured GitHub MCP server) sufficient to *attempt* creating a new repository — a capability that succeeded technically at the request level but was denied by the provider (`403 Resource not accessible by integration`, recorded in the Phase-1/S0 history). Had that capability succeeded, it would **not** have constituted authority to actually stand up a permanent new repository as Sentinel's home — that authority came only from the separate, explicit `D-010`/`D-011` decision chain. This specification generalizes that lesson: capability grants and authority grants must never be conflated, and this repository's own history is direct evidence of why.

## S1 scope

This is a specification and template only. No capability registry file exists yet (that is a Governance Bundle / rule-registry concern for a later cycle), and no capability is being proposed, granted, or revoked by this commit.
