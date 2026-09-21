# Capability Change: <Title>

See `../governance/specifications/CAPABILITY_CHANGE_SPEC.md` for the full specification this template implements.

```yaml
capability_id: <stable id>
provider: <tool/service name>
tool: <specific tool/API/MCP server>
roles_allowed: [<Paulo | Architect | Builder | QA | Independent Reviewer, ...>]
projects_scopes: [<project_id, ...>]
permission_level: read | write | admin
credentials_secrets:
  - name: <credential name>
    held_where: <never in this repo's tracked files>
sensitive_operations:
  - operation: <e.g. "protected-branch push">
    requires_decision_packet: true
human_approval_requirements: <who must approve granting this, at what risk tier>
audit_requirements: <what must be recorded each time this capability performs a sensitive operation>
evidence_requirements: [<ACTOR_REPORTED | INDEPENDENTLY_INSPECTED | INDEPENDENTLY_REPRODUCED | CI_ATTESTED | RUNTIME_OBSERVED>]
revocation_procedure: <who can revoke, how, how fast it takes effect>
```

## Justification

Why is this capability needed. What can't be done without it.

## Explicit non-grant of authority

State plainly: granting this capability does **not** grant any of the `roles_allowed` authority to use it for a governance-significant action beyond what is separately authorized. `CAPABILITY != AUTHORITY` (`CORE-002`, `CORE-008`). If this capability could plausibly be used for a `CONSTITUTIONAL`- or `ARCHITECTURE`-class action, that action still requires its own RFC/Decision path — this capability grant does not shortcut it.

## Real precedent

See `../governance/specifications/CAPABILITY_CHANGE_SPEC.md`'s "Real precedent this session already lived through" section for a worked example from this repository's own history.
