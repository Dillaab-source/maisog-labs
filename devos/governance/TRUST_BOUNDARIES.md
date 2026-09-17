# Sentinel Trust-Boundary Specification

Companion to `../architecture/ML-DEVOS-ARCH-001.md` §5. Normative statement; that section is a summary.

## TB-1 — Human authority boundary

Only Paulo authorizes: scope changes, phase transitions, deployment (any project), merges to any protected branch, and acceptance of a documented risk. No actor or mechanism crosses this boundary regardless of technical capability. **[REPO-VERIFIED: D-010, established throughout this session]**

## TB-2 — Builder execution boundary

A Builder may read broadly within its granted access, but writes only within the currently authorized phase's explicit allowlist. A Builder must never: self-approve its own work at a status stronger than the evidence class it produced; silently change governance authority, security rules, or phase boundaries; or treat a plan/design as implemented without repository/test/runtime evidence. **[REPO-VERIFIED]**

## TB-3 — Architect review boundary

The Architect reviews independently, against repository/runtime evidence rather than the Builder's narrative. No execution capability, no deployment/merge authority, no unilateral phase-transition authority — only a recommendation to Paulo. **[REPO-VERIFIED: AS0-007]**

## TB-4 — QA boundary

QA's defining property is independent execution, not re-reading a report of execution. A QA process that only reads the Builder's own test output has not satisfied this boundary — it must re-run the check itself to produce `INDEPENDENTLY_REPRODUCED` evidence. **[REPO-VERIFIED: D-010 K-4]**

## TB-5 — Independent Reviewer boundary

Defined by an absence: no prior conversational or contextual memory of how the change under review was built, and a focus on the post-implementation integration result rather than re-litigating design. If the reviewing context has seen the Builder's own explanation for the change, it is performing the Architect's role again, not the Independent Reviewer's. **[REPO-VERIFIED: AS0-007]**

## TB-6 — Evidence Gate boundary

Mechanical and fail-closed only. May withhold progress on failing evidence; must never grant, waive, reinterpret, or downgrade a requirement. Has no authority to accept risk — an override requires a Paulo decision, recorded as such, not a gate configuration change made unilaterally. **[REPO-VERIFIED: AS0-002]**

## TB-7 — Capability ≠ authority (the load-bearing invariant)

A tool, credential, or API access granted to any actor or mechanism is a capability fact, not an authorization fact. Concretely, in the current, actual state of this repository:

- Claude (Builder) currently has `git push` access to `maisog-labs` branches and demonstrated GitHub API write capability in a prior cycle (a repository-creation attempt). **Neither implies authority** to push to a protected branch, merge to `main`, or restructure the repository without the explicit authorization chain this document and its siblings describe.
- **This boundary is currently enforced procedurally only.** There is no Capability Gateway, no confirmed branch protection, no CI gate anywhere in this repository. This is the single largest disclosed gap in the whole specification (`ML-DEVOS-ARCH-001` §12.1) and must not be described as "enforced" in any future status report until a technical mechanism exists and is evidenced (`INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED`) to actually block a violation. **[REPO-VERIFIED: AS0-011]**

## TB-8 — Scope-of-authorization boundary (bootstrap-specific, AMENDED)

During the S0 bootstrap window, the authorization chain ran through this repository's own coordination files (`D-010`, `D-011`, `coordination/STATE.md`) because, at the time `D-010` was recorded, no Sentinel-owned repository existed to hold it. Following `D-011`, this exception has resolved differently than originally planned: rather than a separate repository eventually taking over as source of truth, **this repository itself becomes that source of truth**, once this freeze commit is independently Architect-approved (`ML-DEVOS-ARCH-001` §9). The bootstrap window's *procedure* (chat authorization → decision log entry → state-file update → frozen documents → Architect review) remains the model for any future architecture change, even though its *destination* changed from "hand off to a new repository" to "this repository graduates from bootstrap surface to authoritative source." **[REPO-VERIFIED: D-011 "Source of truth amendment"]**
