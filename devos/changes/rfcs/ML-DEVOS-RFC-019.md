# ML-DEVOS-RFC-019: Sentinel S6 Isolated Execution

Status: `DRAFT` — proposal only; submitted for independent Architect review.

Proposed change class: `ARCHITECTURE`

Sentinel phase:
- `S6 — Isolated Execution` (`ML-DEVOS-SIP-001`: "Implement task-scoped branch/worktree/sandbox isolation for Builder/QA work.")

Authority chain: `D-066` (Paulo) authorizes S6 discovery, architecture proposal, and audit only, following S5's D.2 closure at Sentinel `v1.8.0` (`ML-DEVOS-ADR-015`, `D-065`, `ML-DEVOS-AS-085`). This RFC is the input to the S6 Architect Sync. It grants no authority and authorizes no implementation. No executable S6 file, directory, reserved root, manifest change, closure ADR, or version change is created by, or implied by, this RFC. Every artifact named below is a planned deliverable of a future, separately authorized implementation cycle.

Reading convention: **MUST / MUST NOT** are requirements a future implementation would be reviewed against. "V1" means the first implementation this RFC proposes, not anything that exists today.

## Problem

Today every Builder and QA action runs in whatever checkout the acting session happens to have. Nothing ties a governed task to one repository, one exact base commit, one branch, and one working directory. The consequences are not hypothetical — this repository's own history records them:

- **Stale snapshot work.** A Builder session worked from an out-of-date snapshot (`1ec5299`) and committed a duplicate onto a stale branch. That branch still exists and must never be merged. Context Bootstrap V0 (`ML-DEVOS-RFC-018`, `D-062`) now catches this at *publication* time for coordination files. Nothing catches it at *execution* time for task work.
- **Evidence from an unknown environment.** A later session was asked to publish evidence from a worktree and test run that did not exist in that session. The protocol correctly refused, but only because a human-readable rule said so, not because the execution environment carried provable identity.
- **QA inside the Builder's tree.** TB-4 requires QA to *re-run* checks independently. If QA runs in the Builder's mutable working tree, it inherits the Builder's uncommitted files, ignored build output, installed dependencies, caches and environment. Its "reproduction" is then not independent in any meaningful sense.
- **Cross-task contamination.** Two tasks, or a Builder and a QA run, that share a working directory, `HOME`, temp directory, package cache, or Git hooks can silently change each other's results.

S3 says *what* a task may touch. S4 says *who* owns the task and fences stale owners. S5 says whether an action is *technically possible* under a pinned policy. None of them says *where* the work physically runs, or proves that place is the right, clean, unshared one.

## Motivation

S7 (Evidence Store/QA), S8 (Orchestrator) and S9 (Evidence Gate) all assume that a piece of evidence can be tied to a specific, reconstructable execution environment. Without S6, an Evidence Gate could only check that a test *report* says PASS. It could not check that the report came from the reviewed commit, in a clean environment, run by an actor other than the Builder. If S6 is not designed now, S7–S9 would each invent their own partial notion of "the environment," or they would silently trust whatever directory a session happened to be in.

## Proposed change

### 1. Isolation levels — what each one actually contains

The roadmap phrase "branch/worktree/sandbox isolation" covers four mechanisms of very different strength. This RFC names them separately so that no document can later claim one while delivering another.

| Level | Mechanism | Prevents | Does **not** prevent |
|---|---|---|---|
| **L1 — Git branch isolation** | A task-scoped branch name. | Commits for task A landing on task B's branch or on the base branch *through normal Git use*. | Anything in the working directory. Two tasks on different branches in one checkout still share every uncommitted, untracked and ignored file. Branch names are refs, so any process with repository write access can move them. |
| **L2 — Git working-tree isolation** | A separate working directory per execution instance. The instance is either a *linked worktree* (`git worktree add`) or a *dedicated clone*. | Uncommitted, untracked and ignored-file contamination between cooperating processes that stay in their own directory. | A linked worktree shares the repository's common directory: **refs, config, hooks, packed objects, and worktree metadata**. A process in worktree A can rewrite task B's branch, install a hook that runs in B, or change `core.hooksPath`/`core.fsmonitor` for every worktree. A dedicated clone removes that sharing. Neither form limits what else on the machine the process can read or write. |
| **L3 — Filesystem / process / environment boundary** | A constructed environment per instance: allowlisted variables; instance-private `HOME`, temp, tool-config and caches; path-confined host operations; a supervised process tree; no inherited credentials. | *Accidental* inheritance and leakage: stray env credentials, a shared `~/.npmrc`, a shared temp directory, a global Git config or hook, a leftover process writing into another instance. | A process running **as the same OS user** that *deliberately* reads or writes outside its instance: `~/.ssh`, a credential helper's store, another instance's directory, the S6 host's own journal. At L3, "read-only" means policy plus after-the-fact detection, not kernel prevention. |
| **L4 — OS / container / VM sandbox** | Kernel-enforced confinement: namespaces/cgroups/seccomp or Landlock, macOS sandbox profiles, Windows AppContainer / Job Objects / a separate low-privilege user, a container runtime, or a hypervisor-backed VM. | Deliberate escape attempts, up to the strength of the specific mechanism. A VM is strongest; containers share the host kernel. | Kernel or hypervisor vulnerabilities; host misconfiguration (bind-mounted sockets, credentials mounted in); network egress unless separately restricted. |

**V1 proposal: L1 + L2 (dedicated clone) + L3.** V1 does **not** provide L4 and MUST NOT be described as a sandbox, as security isolation, or as containment of a hostile process. V1's guarantee is precise:

- An honest but fallible agent, a stale session, or a crashed run cannot *silently* contaminate another task's working state.
- It cannot publish work under stale ownership.
- It cannot present evidence from an environment whose identity and cleanliness were not proven.

Anything that needs containment of *untrusted code* is outside V1 and fails closed (§14, `ISOLATION_PROFILE_INSUFFICIENT`). That includes executing unreviewed third-party code with access to secrets, and running dependency install scripts on a host that holds credentials. An L4 profile is a future, separately authorized extension (§20).

### 2. Isolation threat model

**Assets:**
- the authoritative branches and the base commit;
- other tasks' working state;
- the S4 task record and its fencing revision;
- host credentials: Git and GitHub, the package registry, Cloudflare, SSH agents, OS keychains;
- shared dependency caches;
- the integrity of evidence and provenance;
- the independence of QA.

**Actors:**
- **Builder instance process** — trusted but fallible, and may be stale.
- **QA instance process** — must be independent of the Builder.
- **S6 host** — the trusted local component that creates, validates and tears down instances.
- **Third-party code** that runs inside an instance: dependency install scripts, test code, build tools. It is *not* trusted in principle, and at V1 strength it runs with the host user's privileges (disclosed in §21).
- **A concurrent or stale S6 host.**

| # | Threat | V1 treatment |
|---|---|---|
| T1 | Work starts from the wrong repository or wrong base commit. | Prevented: identity binding and exact-SHA verification (§3, §4). |
| T2 | A stale instance, whose owner lost the S4 lease or whose revision advanced, publishes results. | Prevented at the governed commit point: S4 `transition` with `expectedRevision` is the only publication (§8, §13). |
| T3 | Uncommitted, untracked or ignored files leak from a previous run or task. | Prevented: fresh clone per instance; clean-tree proof at create, attach and complete (§5). |
| T4 | Shared Git hooks, config or refs (linked worktrees) let one task affect another. | Prevented by choosing a dedicated clone with hooks disabled and config audited (§6). |
| T5 | Symlink, junction or `..` traversal makes an S6 host write or delete outside the instance. | Prevented for S6 host operations: canonicalize, confine, never follow links (§9). Not prevented for the task process itself (L3 limit). |
| T6 | Inherited environment carries credentials or redirects tools: `GITHUB_TOKEN`, `NPM_TOKEN`, `GIT_ASKPASS`, `SSH_AUTH_SOCK`, `PATH` hijack, `NODE_OPTIONS`. | Prevented for inheritance: allowlist-constructed environment plus verification (§10). |
| T7 | Credential files are copied into the instance: `.npmrc`, `.git-credentials`, `.env`, SSH keys. | Prevented by the non-copy rule plus a pre-use scan (§12). |
| T8 | Deliberate same-user reads of host credential stores. | **Not prevented at L3.** Disclosed (§21). Requires an L4 profile or a dedicated OS user. |
| T9 | Shared cache poisoning, where task A writes a tampered package that task B consumes. | Mitigated: private caches by default; shared caches read-only-by-policy with integrity verification against the lockfile, plus before/after digest detection (§11). Not prevented at L3. |
| T10 | Two instances for one task race, or two tasks collide on a branch or directory name. | Prevented: S4 single-owner fencing plus exclusive-create naming (§13). |
| T11 | A crash leaves an orphaned directory, process, lock or pushed branch that is later adopted as valid. | Prevented: orphans are quarantined, never adopted (§15). |
| T12 | QA "reproduces" inside the Builder's tree, or from Builder-supplied files. | Prevented: QA reconstructs from the S4-recorded commit SHA fetched from the remote, in its own instance, as a different actor (§7). |
| T13 | S6 provenance is quoted as authority, or as stronger evidence than it is. | Prevented by the fixed non-authority disclaimer and `ACTOR_REPORTED` classification (§17). |
| T14 | S6 infers an isolation property it cannot actually verify on this platform. | Prevented: every property is either proven by a named check or the operation fails `ISOLATION_UNPROVABLE` (§14). |

### 3. Identity: task → repository → base → branch → workspace → instance

Every execution instance carries one immutable **Execution Identity**, fixed at creation. No field may change for the life of the instance. A changed field means a *new* instance.

| Field | Source (by reference only) | Verified how |
|---|---|---|
| `project` | S3 contract `project` | Must equal the configured repository identity (below). |
| `repository` | S6 host configuration: canonical remote identity, e.g. `github.com/Dillaab-source/maisog-labs`. Never taken from the task process. | Clone `remote.origin.url` must normalize to it and contain no credentials or userinfo. |
| `task_id` | S4 record `task_id` | Must equal the S3 contract `task_id`. |
| `contract_ref`, `contract_digest` | S4 record `contract_ref` → S3 contract bytes | SHA-256 of the exact contract bytes, recorded at create and re-checked at attach and complete. |
| `role` | `BUILDER` or `QA` | Must match the S4 state: `BUILDING` for Builder, `QA` for QA. |
| `owner`, `owner_revision` | S4 `claim`/`renew` result (`owner`, `revision`) | `owner_revision` is the S4 fencing token. S6 never allocates its own. |
| `base_ref`, `base_sha` | Builder: authoritative base branch resolved once at create (§4). QA: the result commit S4 recorded (§7). | 40-hex exact SHA. `HEAD` must equal it after checkout. |
| `task_branch` | Deterministic: `sentinel/s6/<task_id>/<role-lowercase>/<instance_id>` | Must not exist locally or remotely at create (§13). |
| `instance_id` | Generated by the S6 host. 128-bit random, lowercase hex. **Never caller-supplied.** | Exclusive-create of the instance directory proves uniqueness. |
| `workspace_path` | `<workspace_root>/<project-slug>/<task_id>/<instance_id>/` | Canonical real path, strictly inside the canonical `workspace_root` (§9). |
| `platform_profile` | Detected: OS family, filesystem case sensitivity, Git version, symlink/junction support, process-group support | Must be a supported profile (§16). |
| `isolation_level` | `L3` in V1 | Never inferred upward. |
| `capability_decisions` | S5 `CapabilityDecision`s consumed (§8) | Recorded as `outcome`, `denial_reason`, `descriptor_id` and `policy_version` exactly as S5 returned them. |

The identity is serialized in canonical form (sorted keys, no insignificant whitespace), and its SHA-256 is the **identity digest**. Every later lifecycle step recomputes the digest from live facts and compares. Any difference is `ISOLATION_UNPROVABLE`, or the more specific code listed in §14.

### 4. Exact-base and freshness rules

1. **Resolve once, pin forever.** At Builder create, the S6 host fetches the configured base ref from the configured remote, resolves it to one exact SHA, and pins it as `base_sha`. The clone is checked out at that SHA; the task branch is created from it. A symbolic ref (`main`, `HEAD`, a tag) is never stored as the base — only the SHA.
2. **No local-checkout trust.** The base is never taken from a pre-existing local checkout of unknown freshness. This is the execution-time equivalent of Context Bootstrap V0's "read STATE from one exact commit" rule.
3. **Freshness at publication.** Before publication (§8 *complete*), the S6 host re-resolves the base ref.
   - If it still equals `base_sha`, freshness passes.
   - If it has advanced, V1 fails closed with `BASE_ADVANCED`. It does not rebase, merge, or "update" automatically. The caller decides, under governance, whether to start a new instance on the new base. This mirrors the Context Bootstrap V0 exact-tip rule (`D-062`).
   - A future policy MAY permit "advanced but still an ancestor-compatible fast-forward". That is a separately reviewed relaxation, not a V1 default.
4. **Result ancestry.** The result commit MUST have `base_sha` as an ancestor, via `git merge-base --is-ancestor`. Otherwise the result fails with `BASE_SHA_MISMATCH`.
5. **Base unavailable.** If the remote cannot be reached, or the SHA cannot be fetched or verified, the result is `BASE_UNAVAILABLE`. There is no fallback to a cached or local value.

S3 contracts carry no base-commit field today. S6 does not add one (it may not redefine S3). Whether a future *additive* S3 field should pin the base at contract level is §22 Q1.

### 5. Dirty, untracked and ignored working-tree handling

- **At create:** a fresh clone is clean by construction. The host still proves it. `git status --porcelain=v2 --untracked-files=all --ignored` must be empty, and `git diff --quiet HEAD` must succeed. A non-empty result means something wrote into a brand-new clone, and fails with `DIRTY_WORKTREE`.
- **At attach / resume:** the instance journal records the last observed tree state: HEAD, index tree hash, and a sorted listing of modified and untracked paths with content hashes. The live state must equal the journal, except for changes the attaching owner made itself in this session. Anything else is `DIRTY_WORKTREE` or `UNEXPECTED_UNTRACKED`.
- **Ignored files** (for example `node_modules/`, `.next/`, `out/`, `.wrangler/`) are permitted only under a declared per-project *ignored-output allowlist*. They are never published and never carried to another instance. An ignored path outside that allowlist is `UNEXPECTED_UNTRACKED`.
- **At complete:** every intended change must be committed. The committed diff's paths must fall within the S3 contract's `scope.allowed_paths` and outside `scope.prohibited_paths`, compared **by reference to the contract, not a copy**. A mismatch is `SCOPE_VIOLATION`. Uncommitted or untracked residue at complete is `DIRTY_WORKTREE`. This checks the *declared* scope mechanically. It does not grant write access (S3's own disclaimer).
- **Never auto-discard.** S6 never runs `git clean`, `git reset --hard`, `git checkout -- .` or `git stash` to *make* a tree pass. A tree that fails validation is quarantined as evidence (§15), not cleaned into compliance.

### 6. Branch / worktree isolation — the V1 choice

V1 uses **one dedicated clone per execution instance**, not a linked worktree of a shared repository:

- **Clone command:** `git clone --no-hardlinks --no-checkout` from the configured remote, or from a host-managed *verified read-only mirror* whose ref and object integrity is checked (`git fsck --connectivity-only` on update). Then check out `base_sha` and create `task_branch`.
- **No hardlinks:** `--no-hardlinks` avoids sharing object inodes with the source, which a writable process could otherwise corrupt.
- **No object alternates:** `--reference`/alternates are **not** used in V1. They reintroduce a shared object store whose garbage collection or corruption would break every dependent instance.
- **Hooks off:** hooks are disabled by setting `core.hooksPath` to an empty, instance-owned directory. The template `.git/hooks` sample files are removed.
- **Config checked on every validation:** instance repository config is limited to an allowlist (remote URL, user identity for commits, `core.autocrlf`/`core.symlinks` per platform profile, `core.hooksPath`). Any other key present at validation, such as `core.fsmonitor`, `core.sshCommand`, `credential.helper`, `include.path`, `url.*.insteadOf`, or `filter.*`, is `ENV_POLICY_VIOLATION`.
- **Why not linked worktrees:** they share refs, config, hooks and packed objects through the common directory (§1, L2). Any fencing or contamination guarantee would then depend on every process sharing that directory behaving correctly. That is exactly the assumption S6 exists to remove. The disk and time saving is real but is not worth losing the property.
- **Why not branches alone:** they give no working-tree separation at all.

### 7. Builder versus independent QA isolation (TB-4)

QA MUST NOT test inside the Builder's working tree, reuse the Builder's clone, caches, `node_modules`, build output or environment, or accept files the Builder hands over. QA reconstructs its environment independently:

1. **Source of truth is S4, not the Builder.** The Builder's governed completion is an S4 `transition` from `BUILDING` to `READY_FOR_QA`. Its `evidenceRef` carries `{ result_commit_sha, base_sha, identity_digest, provenance_digest }`. QA reads `result_commit_sha` from the S4 record via S4's public `getState`, never from the Builder's instance, handoff prose, or a path.
2. **Fresh QA instance.** QA claims the task through S4's own claim operation, as an actor different from the Builder's `owner`; S6 checks `qa_actor != builder_actor`, otherwise `QA_INDEPENDENCE_VIOLATION`. S6 then creates a new instance with `role: QA` and `base_sha = result_commit_sha`, fetched from the **remote**. If the commit is not on the remote, the result is `BASE_UNAVAILABLE`: QA does not fall back to the Builder's local objects.
3. **Content verification.** QA verifies the fetched commit's tree hash equals the tree hash in the Builder's provenance. It also verifies `base_sha` is an ancestor. The QA working tree is therefore bit-identical to what was recorded, and nothing else.
4. **Independent dependency materialization.** QA installs dependencies from the committed lockfile into its own private cache (§11). It never mounts or links the Builder's `node_modules` or cache.
5. **Path denial.** The QA instance's path policy denies the Builder instance's directory and every other instance directory. At L3 this is policy plus detection, not prevention (§21).
6. **What this does and does not prove.**
   - S6 proves QA *executed from an independently reconstructed environment of the recorded commit*. That is necessary for QA output to be `INDEPENDENTLY_REPRODUCED`.
   - It does not prove the QA actor's *reasoning* was independent (TB-5 concerns conversational context), nor that QA ran the right checks.
   - S6 provenance is necessary, not sufficient, for the evidence class. The evidence-class judgment stays with S7/S9 and the Architect.

### 8. Composition with S3, S4 and S5

**Three separate conditions, never merged:**

| Condition | Meaning | Owner | S6's relationship |
|---|---|---|---|
| **MAY** | Governance authority: the task is authorized. | Paulo / Decisions / Architect Sync; S3 contract `authorization_references` *describe* it. | S6 consumes by reference and never infers it. |
| **CAN** | Technical capability under a pinned policy. | S5 `CapabilityDecision`. | S6 consumes decisions and never re-evaluates or mints S5 contexts. |
| **ISOLATED** | The execution environment is proven to be the right, clean, unshared one. | S6. | S6's own result. |

An action proceeds only if all three hold **and** S4 fencing holds. Any single failure blocks. None of them implies another:
- an S5 `ALLOW` does not make an action authorized;
- a proven S6 isolation does not make it authorized or capable;
- a governance authorization does not make an unproven environment acceptable.

**S3 — Task Contract (consumed by reference):**
- S6 reads `task_id`, `project`, `scope.allowed_paths`, `scope.prohibited_paths` and the five consequence flags from the contract identified by the S4 record's `contract_ref`, and records the contract digest.
- It never copies, rewrites, extends or re-validates the contract's semantics beyond S3's own validator. It never creates contracts.
- V1 supports only contracts whose five consequence flags are all `false`. Any `true` flag is `ISOLATION_PROFILE_INSUFFICIENT` (§14), because each would require credentials, remote/production writes, or destructive actions inside the instance, which L3 cannot contain. §22 Q2 asks whether `remote_resources_involved` could be relaxed.

**S4 — ownership, lease, fencing (reused, not duplicated):**
- S6 has **no task state machine**. It never decides task progress, retries, or failure. Those are S4 transitions performed by the caller through S4's public API.
- The S6 instance *environment* lifecycle (§13) is subordinate to S4. Every mutating S6 step first checks, through S4 `getState`, that:
  - `owner == instance.owner`;
  - `revision == instance.owner_revision`;
  - `lease_expires_at` is later than trusted time;
  - `state` matches `role`.
  
  Failure is `OWNER_MISMATCH`, `FENCING_REVISION_MISMATCH`, `LEASE_EXPIRED` or `INSTANCE_STALE`, in that order.
- **Lease renewal is S4's.** The owner calls S4 `renew` and hands the new revision to the instance. The instance accepts a revision only if it is exactly the one returned by a renew or claim that this owner performed, which the journal records. An unexplained revision advance marks the instance stale.
- **Expired-but-unclaimed leases** (which S4 still lets the owner `renew`) are treated as stale until a renew succeeds. S6 never proceeds on an expired lease.
- **The publication linearization point is S4 `transition`,** which re-checks owner and revision under S4's exclusive lock. A pushed Git branch is *not* publication.
  - A stale instance can at most leave an unrecorded branch behind (§15). It cannot get its result recorded, because its `expectedRevision` no longer matches.
  - This closes the check-then-push time-of-check/time-of-use (TOCTOU) window that a Git-only fence would leave open.
- S6 uses S4's public operations only (`getState`, and the caller's `claim`/`renew`/`transition`). It never writes S4 records or imports S4-internal modules.

**S5 — CapabilityDecision (consumed, S5 unchanged):**
- Every real-world action an S6 host or instance performs goes through the corresponding public S5 adapter `request(requestIntent)`:
  - `github` for fetch/push;
  - `shell` for process execution in the instance, with `cwd` canonicalized by S5's own platform-aware shell contract.
- S6 records each returned decision verbatim.
- `DENY` is blocking: `CAPABILITY_DENIED`, carrying S5's `denial_reason` unchanged.
- `ALLOW` is necessary, never sufficient.
- S6 never constructs `subjectContext`/`evaluationContext` (it cannot — minters exist only inside `createGateway()`, `AS82-F001`), never calls the raw core, and never caches an `ALLOW` across actions.
- **Wiring disclosure:** implementing this composition *is* runtime use of S5. A future S6 implementation decision must therefore authorize S5 consumption explicitly. D-066 does not, and this RFC does not assume it.

### 9. Filesystem boundaries; symlink, junction and path escape

**Workspace root.**
- The host configures `workspace_root` as an absolute path. S6 canonicalizes it, following links once at configuration, and then stores and compares only the canonical form.
- It MUST NOT be inside any Git working tree, including the Sentinel repository itself. It MUST NOT be inside another instance, or inside a known sync or backup folder the host declares.
- Violations are `WORKSPACE_ROOT_INVALID`.
- Runtime workspaces never live under `devos/` (§19).

**Instance layout:**
```
<workspace_root>/<project-slug>/<task_id>/<instance_id>/
  repo/      writable — the dedicated clone (the task's working tree)
  home/      writable — synthetic HOME / USERPROFILE
  tmp/       writable — TMPDIR / TMP / TEMP
  cache/     writable — instance-private package/tool caches
  config/    host-written — generated git/npm config; checked by digest
<host_state_dir>/journal/<instance_id>/   host-only — identity, journal, provenance
```
The journal lives **outside** the instance root, so deleting or corrupting the instance cannot erase its own evidence. At L3 a same-user process could still reach it (§21). Tampering is detected by journal hash chaining, not prevented.

**Read-only inputs:** toolchain directories and optional shared verified caches (§11). At L3 read-only is enforced only where the platform lets the host set it without elevated privilege (file modes/ACLs). Otherwise it is policy plus digest detection before and after use. Where neither is possible, the result is `ISOLATION_UNPROVABLE`.

**Path rules for every S6 host filesystem operation** (create, write, verify, delete):
1. Resolve to a canonical real path: fully resolve symlinks, junctions and reparse points using host-OS semantics, and normalize to S5's canonical shell form (`/…`, `C:/…`, `//server/share/…`).
2. The canonical path must be strictly inside the instance root. That is a prefix comparison on canonical path *segments*, never on strings, so `/ws/a` does not match `/ws/ab`. It must be case-folded on case-insensitive filesystems and Unicode-normalized (NFC) where the filesystem normalizes (macOS). Otherwise the result is `PATH_ESCAPE`.
3. Reject: `..` segments remaining after normalization; drive-relative paths (`C:foo`); rooted-without-drive paths (`\foo`); NT namespace prefixes (`\\?\`, `\\.\`); reserved Windows device names (`CON`, `NUL`, `COM1`…); alternate data streams (`name:stream`); trailing dots or spaces on Windows; and 8.3 short-name forms that expand outside the root.
4. A link inside the instance root whose target cannot be resolved (dangling, a loop, or permission denied) is `UNRESOLVED_LINK`. A link resolving outside the root is `PATH_ESCAPE`.
5. **Deletion never follows links.** Walk with `lstat`. Unlink the link itself. Remove a Windows junction as a directory entry without recursing into its target. Re-verify after each directory removal that the parent is still the expected canonical path.
6. **TOCTOU disclosure.** Node's `fs` has no `openat`/`O_NOFOLLOW`-relative traversal on every platform. Between a check and a use, a concurrent same-user process could swap a directory for a link. V1 reduces the window: it re-verifies immediately before each destructive step and refuses to operate while any instance process is alive (quiesce first). It does not eliminate the window (§21).

**Tracked symlinks in the repository** are legitimate Git content. S6 does not reject them, but S6 host operations never follow them, and the checkout respects the platform profile's `core.symlinks` setting.

### 10. Process and environment boundaries

**Environment built from empty.** It is never inherited-then-filtered.

**Allowlist:**
- `PATH`: an explicit, ordered list of canonical toolchain directories. No empty entries, no `.`, no relative entries, and no instance-writable directory ahead of a toolchain directory.
- `HOME` / `USERPROFILE` → `home/`.
- `TMPDIR` / `TMP` / `TEMP` → `tmp/`.
- `XDG_CONFIG_HOME` / `XDG_CACHE_HOME` / `XDG_DATA_HOME` → under `home/`.
- `GIT_CONFIG_GLOBAL` → `config/gitconfig`.
- `GIT_CONFIG_NOSYSTEM=1`, `GIT_TERMINAL_PROMPT=0`.
- `npm_config_cache` → `cache/npm`; `npm_config_userconfig` → `config/npmrc` (credential-free).
- `LANG`/`LC_ALL`/`TZ` fixed, for determinism.
- `CI=true`.

**Windows additionally:** `SystemRoot`, `ComSpec`, `PATHEXT`, `WINDIR`. Environment names are compared case-insensitively. Two allowlisted names that differ only by case are `ENV_POLICY_VIOLATION`.

**Deny verification (backstop).** Before any process starts, the constructed environment is checked against a deny pattern set:
- credential-shaped names (`*TOKEN*`, `*SECRET*`, `*PASSWORD*`, `*_KEY`, `AWS_*`, `CLOUDFLARE_*`, `GH_*`, `GITHUB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`);
- credential and agent channels (`SSH_AUTH_SOCK`, `GIT_ASKPASS`, `SSH_ASKPASS`, `GIT_SSH_COMMAND`, `GCM_*`);
- code-injection vectors (`NODE_OPTIONS`, `LD_PRELOAD`, `DYLD_*`, `BASH_ENV`, `ENV`, `PYTHONSTARTUP`);
- proxy variables whose value contains userinfo.

Any hit is `ENV_POLICY_VIOLATION`. The allowlist is the control; the deny set proves the allowlist did not regress.

**Process tree.**
- Every instance process starts with `cwd` inside `repo/`, through the S5 shell adapter decision, in a new process group on POSIX or a Job Object with kill-on-close on Windows.
- *Quiesce* terminates the group or job and then verifies no member remains. Where the platform cannot prove this, the result is `QUIESCE_UNPROVEN`, and publication is blocked.
- V1 has no network-egress control (an L4 concern). This is disclosed in §21.

**Recorded per command:** argv, canonical cwd, environment *digest* (names and value hashes, never values), start and end trusted time, exit code, and the S5 decision.

### 11. Dependency and cache isolation / reuse

- **Default:** instance-private caches under `cache/`. Dependencies are installed from the committed lockfile only (`npm ci`-style), never from a lockfile-less resolve. `node_modules`, build outputs (`.next/`, `out/`) and tool state (`.wrangler/`) are instance-local and never shared, linked, or copied between instances.
- **Optional shared cache, off by default.** A host MAY provide a shared, content-addressed package cache as a *read-only input*. Reuse is allowed only where the package manager verifies each artifact's integrity against the lockfile's integrity hashes; npm's integrity check is that mechanism.
  - The instance process must not be able to write to it. Where the host cannot make it read-only, S6 records its manifest digest before and after use. A change is `CLEANUP_CONTAMINATION_RISK`, and the shared cache is withdrawn for all instances until re-verified.
- **Install scripts run third-party code** with the host user's privileges at L3. V1 discloses this (§21). A project policy MAY require `--ignore-scripts` where the build tolerates it; that is outside S6's decision.
- **Registry network access is not an S5 V1 provider.** V1 treats the install as a `shell` action under S5, which governs the *command*, not the network destinations it reaches. This is a disclosed gap (§22 Q4).

### 12. Credentials and secrets — the non-copy policy

1. No credential value is ever copied into an instance: not into files, environment, Git config, remote URLs, npm config, or command lines.
2. **Remote operations are host-side only.** Fetch and push are performed by the S6 host process, using host-held credentials through S5-governed `github` actions, *outside* the instance process tree. The instance process never receives a credential. The instance clone's `remote.origin.url` is verified to be credential-free.
3. **Pre-use scan.** After checkout and before any instance process starts, the host scans the instance root, excluding the ignored-output allowlist, for credential-bearing file *names*: `.git-credentials`, `.npmrc` containing `_authToken`, `id_*`/`*.pem`/`*.key`, and `.env*` files not tracked by Git. It also scans host-generated config for credential keys. A hit is `SECRET_MATERIAL_DETECTED`.
   - Tracked repository files are the repository's own content. Secret scanning of committed content belongs to other gates, not S6.
4. **No secret values in S6 output.** Journals and provenance record digests, names and classes, never values. This mirrors S5's class-only credential model.
5. **Disclosed limit:** at L3, a same-user instance process can still read host credential stores directly (T8). Contracts that need credentials inside the instance are refused (§8, S3 flags). Protection against deliberate reads needs a dedicated OS user or L4 (§20).

### 13. Lifecycle, concurrency and collisions

**Instance lifecycle:**

`CREATING → READY → ATTACHED ⇄ QUIESCED → COMPLETED → CLEANED`

Any state can go to `QUARANTINED` (terminal until an explicit, audited cleanup).

These are *environment* states, not task states. None of them is an S4 state or implies task progress.

| Step | Preconditions (all fail closed) | Effect |
|---|---|---|
| **create** | Platform supported; workspace root valid; S4 record exists; S4 checks pass (owner, revision, lease, state↔role); S3 contract resolves, `task_id`/`project` match, and consequence flags are within the V1 profile; S5 `ALLOW` for fetch; base resolved (§4). | Exclusive-create the instance directory (`O_EXCL`/`wx` on a marker file). Clone, check out `base_sha`, create `task_branch`. Construct environment and config. Pre-use scan. Write identity and journal. → `READY`. |
| **validate** | — (pure verification, repeatable at any time) | Recompute every identity field from live facts; tree, config and environment checks; S4 checks. Returns `PROVEN` or the first failing reason (§14). |
| **attach** | `validate` → `PROVEN`; caller is `owner` presenting `owner_revision`. | → `ATTACHED`. |
| **use** | `ATTACHED`; S5 `ALLOW` per command; S4 checks per mutating command. | Run the command; journal it. |
| **renew** | Caller performed S4 `renew`. | Instance adopts the returned revision (journaled). |
| **quiesce** | — | Terminate the process group or job; prove it empty (`QUIESCE_UNPROVEN` otherwise); snapshot tree state. → `QUIESCED`. |
| **complete** | `QUIESCED`; `validate` → `PROVEN`; freshness (§4.3); scope (§5); S5 `ALLOW` for push. | (1) Push `task_branch` with an explicit lease: remote ref absent, or equal to this instance's last pushed SHA. (2) Caller performs S4 `transition` with `expectedRevision = owner_revision` and `evidenceRef` = result commit plus digests. Only a successful S4 transition means *published*. → `COMPLETED`. |
| **cleanup** | `COMPLETED` or `QUARANTINED`; quiesced; path rules (§9). | No-follow deletion of the instance root; verify absence; the journal is retained. → `CLEANED`. Any failure → `QUARANTINED` + `CLEANUP_CONTAMINATION_RISK` when the residue could be reused or reached. |

**Concurrency.**
- *Same task, same role:* S4 single ownership means at most one instance can hold the current `(owner, revision)`. A second instance created under an older revision fails every S4 check and is `INSTANCE_STALE`.
- *Name collisions:*
  - Instance directories are created with exclusive-create. `EEXIST` is `WORKTREE_COLLISION`, never reuse.
  - `task_branch` must not exist locally or on the remote at create; otherwise `BRANCH_COLLISION`.
  - The push lease makes a racing push fail rather than overwrite.
- *Refs on case-insensitive filesystems:* branch components are lowercase or fixed-case by construction (`task_id` is `^[A-Z][A-Z0-9_-]*$`; `role` and `instance_id` are lowercase), so two distinct names cannot fold to one.
- *Instance records:* the S6 host's own instance registry uses the same patterns S4 already proved (exclusive-create lock, write-temp-then-atomic-rename, no age-based lock stealing). It uses them in S6's own root, without importing or modifying S4's store.

### 14. Deterministic fail-closed reason model

Every S6 operation returns either `PROVEN`/success, or exactly **one** reason code: the first failing check in this fixed order. The same inputs and the same observed facts always give the same code. Codes are data. They grant nothing and carry the fixed disclaimer (§17).

| # | Code | Required case covered |
|---|---|---|
| 1 | `MALFORMED_REQUEST` | Structurally invalid input. |
| 2 | `ISOLATION_PLATFORM_UNSUPPORTED` | Unsupported platform state (§16). |
| 3 | `ISOLATION_CAPABILITY_MISSING` | Missing isolation capability (Git too old; no process-group/Job Object support; cannot canonicalize paths; required L4 profile absent). |
| 4 | `WORKSPACE_ROOT_INVALID` | Root missing, relative, inside a Git tree, or not canonical. |
| 5 | `TASK_CONTRACT_MISMATCH` | Task/contract mismatch (`task_id`, `contract_ref`, digest, `project`). |
| 6 | `ISOLATION_PROFILE_INSUFFICIENT` | Contract consequence flags exceed what V1 (L3) can contain. |
| 7 | `REPOSITORY_MISMATCH` | Wrong repository; credential-bearing remote URL. |
| 8 | `OWNER_MISMATCH` | Owner mismatch (S4). |
| 9 | `FENCING_REVISION_MISMATCH` | Fencing mismatch (S4 revision). |
| 10 | `LEASE_EXPIRED` | S4 lease expired, even if not yet reclaimed. |
| 11 | `INSTANCE_STALE` | Stale execution instance: unexplained revision advance, S4 state no longer matches role, or superseded instance. |
| 12 | `QA_INDEPENDENCE_VIOLATION` | QA actor equals Builder actor; QA source is not the S4-recorded commit; QA path overlaps a Builder instance. |
| 13 | `CAPABILITY_DENIED` | S5 `DENY`; carries S5's `denial_reason` verbatim. |
| 14 | `BASE_UNAVAILABLE` | Base or result commit cannot be fetched or verified. |
| 15 | `BASE_SHA_MISMATCH` | Wrong base SHA; `HEAD` ≠ `base_sha`; result not a descendant. |
| 16 | `BASE_ADVANCED` | Freshness failed at publication. |
| 17 | `WORKTREE_COLLISION` | Instance directory already exists. |
| 18 | `BRANCH_COLLISION` | `task_branch` exists locally or remotely; push lease rejected. |
| 19 | `PATH_ESCAPE` | Canonical path outside the instance root. |
| 20 | `UNRESOLVED_LINK` | Unresolved symlink or junction (dangling, loop, or denied). |
| 21 | `ENV_POLICY_VIOLATION` | Environment or config policy violation (deny-set hit, case-duplicate name, disallowed Git config key). |
| 22 | `SECRET_MATERIAL_DETECTED` | Secret/credential material in the instance. |
| 23 | `DIRTY_WORKTREE` | Dirty or unexpected worktree state. |
| 24 | `UNEXPECTED_UNTRACKED` | Untracked or ignored path outside the allowlist. |
| 25 | `SCOPE_VIOLATION` | Committed diff outside the S3 declared scope. |
| 26 | `QUIESCE_UNPROVEN` | Cannot prove the instance process tree is empty. |
| 27 | `CLEANUP_CONTAMINATION_RISK` | Cleanup failure that risks contamination; shared-cache digest changed. |
| 28 | `ISOLATION_UNPROVABLE` | Inability to prove the expected isolation state (identity-digest mismatch; journal hash-chain break; read-only not enforceable and not detectable). |

The order puts input validity and platform first, then identity and authority-adjacent checks (contract, repository, S4, QA independence, S5), then Git state, then filesystem and environment, then completion checks. An S4 or S5 failure is therefore never masked by a later tree or path finding. The catch-all `ISOLATION_UNPROVABLE` is last: it applies only when no specific code does. It is never used to hide a specific failure.

### 15. Retries, idempotency, crash/orphan recovery, stale leases

- **Idempotency key:** `create` is keyed by `(task_id, role, owner, owner_revision, caller idempotency key)`. A replay whose instance exists and is `READY`/`ATTACHED` *and* re-validates returns the same `instance_id`. A replay with different bindings is `MALFORMED_REQUEST`.
- **Push idempotency:** the explicit-lease push is idempotent. The remote already holding the same SHA is success.
- **S4 idempotency:** `transition` idempotency is S4's own ledger. S6 passes the caller's key through and never re-implements it.
- **Retries are environment retries, not task retries.** At most **2** creation attempts per `(task_id, role, owner_revision)`. Each failed attempt's directory is quarantined, never reused. After that, S6 returns the last reason code. It never consumes or changes S4 retry counters, and never transitions the task. Whether the task fails or retries is the caller's S4 decision.
- **Crash recovery.** On host start, S6 scans the registry, the journals and `workspace_root`:
  - *Registry record in `CREATING`/`READY`/`ATTACHED`/`QUIESCED`:* re-check S4. If not current, the instance is `INSTANCE_STALE`: quiesce, then quarantine. If current, it stays as recorded. It resumes only through an explicit `attach` by the same owner that re-validates.
  - *Directory with no registry record, or registry record with no directory:* **orphan** → `QUARANTINED`, reported. It is never adopted, even if its contents look correct, because it cannot be proven.
  - *Stale S6 registry lock:* fail closed, exactly as S4's store does. Removal is an explicit, authorized operator action. There is no age-based stealing.
- **Orphaned remote branches.** A branch pushed by an instance whose S4 transition then failed stays on the remote, unrecorded. S4 never references it, so it can never be consumed as a result. S6 does not delete remote branches automatically: remote deletion is destructive and needs its own authorization. The provenance lists it as `STALE_UNPUBLISHED`.
- **Stale lease behavior.** §8: an expired lease halts every mutating step until an S4 `renew` succeeds. If another actor has claimed, the instance is permanently stale.

### 16. Windows / POSIX portability

**Supported V1 profiles:**
- Linux and macOS: POSIX filesystems; process groups; symlinks.
- Windows 10/11 on NTFS: Job Objects; junctions; symlinks where the privilege is available.
- Each with Git ≥ 2.40, the minimum a future implementation would pin and test.

Anything else is `ISOLATION_PLATFORM_UNSUPPORTED`. This includes: FAT/exFAT or network filesystems as `workspace_root` where locking or rename atomicity is not guaranteed; WSL paths crossing into `/mnt/c`; and a case-sensitivity setting that differs between `workspace_root` and the repository.

**Platform-specific handling:**
- **Case sensitivity:** Windows and macOS default to case-insensitive, and path comparisons fold accordingly (§9). A repository containing paths that collide under folding is `ISOLATION_UNPROVABLE` on such platforms, not silently checked out.
- **Symlinks on Windows:** creating a symlink may require a privilege (`EPERM` without Developer Mode). V1 sets `core.symlinks` per profile and records it. Tests MUST cover the non-privileged case; the S5 shell-platform tests already met this limit.
- **Long paths:** Windows paths over 260 characters require `core.longpaths` and OS support. If they are unavailable and the checkout would exceed the limit, the result is `ISOLATION_CAPABILITY_MISSING`.
- **Line endings:** `core.autocrlf` is fixed per profile and recorded. A result's tree hash is compared, not the working-file bytes.
- **Process teardown:** POSIX uses a process-group signal followed by a verification sweep. Windows uses Job Object termination. If neither is available, the result is `QUIESCE_UNPROVEN`.
- **Path canonical form:** S5's platform-aware form (`/…`, `C:/…`, `//server/share/…`), so S6 and S5 agree on what `cwd` is.

### 17. Evidence and provenance outputs

Each instance produces one **Isolation Provenance** record, written by the host to the journal. A future S7 would consume it. It contains:

- the Execution Identity and its digest;
- `platform_profile`; `isolation_level` (`L3`);
- the environment digest; the config digest;
- the lockfile digest; shared-cache manifest digests before and after, if used;
- the ordered lifecycle journal with trusted timestamps, hash-chained;
- every consumed S5 decision (verbatim fields);
- every S4 observation (owner, revision, state, lease) at each check;
- the result `commit_sha` and `tree_sha`;
- the pushed ref and lease outcome;
- the S4 transition outcome;
- the final `outcome` and reason code;
- `evidence_class: ACTOR_REPORTED`;
- a fixed `non_authority_disclaimer`:

> This isolation record describes the execution environment an S6 host observed. It is not authority, not a capability grant, and not acceptance of any result. Isolation level L3 does not contain a deliberately hostile process.

**Classification.**
- The S6 host's own observations are `ACTOR_REPORTED`.
- Some fields can be independently reproduced by another party without trusting the host: commit and tree hashes, lockfile digest, base ancestry. When a reviewer or QA actually re-derives them, *that reviewer's* result is `INDEPENDENTLY_INSPECTED`/`INDEPENDENTLY_REPRODUCED`.
- S6 never labels its own output with a stronger class, and never `RUNTIME_OBSERVED` (that class is reserved for production runtime evidence).

### 18. Failure-injection and mutation test strategy

A future implementation's tests MUST:

1. **Cover every reason code.** At least one fixture per code in §14 produces exactly that code, and precedence tests prove that when two conditions fail together, the lower-numbered code wins, deterministically.
2. **Use real Git, real filesystems, real processes.** Temporary bare repositories act as the "remote". Concurrency tests use separate OS processes, as S4's concurrency tests already do, not simulated interleavings.
3. **Inject failures:**
   - kill the host at each create, complete and cleanup step, then verify the recovery classification;
   - make `unlink`/`rmdir` fail midway, which must quarantine and report `CLEANUP_CONTAMINATION_RISK`;
   - advance the remote base between create and complete (`BASE_ADVANCED`);
   - pre-create the branch remotely (`BRANCH_COLLISION`) and the instance directory (`WORKTREE_COLLISION`);
   - corrupt or reorder a journal entry (`ISOLATION_UNPROVABLE`);
   - leave a child process running after quiesce (`QUIESCE_UNPROVEN`).
4. **Fencing:** A claims → instance created → lease expires → B claims → A's instance attempts use, complete and S4 transition. Every step fails, S4 records nothing from A, and A's pushed branch (if any) is reported `STALE_UNPUBLISHED`.
5. **Path escape:**
   - symlink to an absolute outside path; relative symlink with `..`; symlink chain; loop; dangling link;
   - on Windows: a junction to a drive root, an 8.3 short name, an alternate data stream, and a device name;
   - a TOCTOU swap test (replace a directory with a link between check and delete), asserting S6 either refuses or deletes only the link, never the target. A sentinel file outside the root must survive every test.
6. **Environment and secrets:**
   - Canary variables set in the *host* environment must not appear in any instance process. Canaries are clearly fake, non-secret-shaped markers, avoiding the secret-shaped-fixture problem S5 hit.
   - Credential files planted in a checkout are detected.
   - A disallowed Git config key causes rejection.
   - A case-duplicate environment name on Windows causes rejection.
7. **QA independence:**
   - QA with the Builder's actor ID;
   - QA pointed at the Builder's directory;
   - QA given a commit not on the remote;
   - QA given a tree hash that differs from provenance.
   
   Each fails with its specific code.
8. **Mutation testing:** removing or weakening each guard (every row of §14, the no-follow deletion, the S4 pre-check, the lease on push, the allowlist) MUST make at least one test fail. Surviving mutants are findings.
9. **Platform matrix:** POSIX and Windows runs, including non-privileged Windows. Results are recorded per platform. A platform not actually run is reported as not run, never as passing.

### 19. Canonical home

The current manifest has no S6 reserved root. `devos/schemas/` lists S6 only as a *consumer*.

| Option | Assessment |
|---|---|
| **`devos/execution/`** | **Recommended.** Names what S6 owns: the *execution-environment lifecycle* (identity, create/validate/attach/complete/cleanup, provenance), of which isolation is a verified property. Consistent with the phase name "Isolated Execution" and with sibling roots named for their subsystem (`contracts`, `state`, `capabilities`, `evidence`, `orchestration`, `memory`). |
| `devos/isolation/` | Rejected. Names a *property* and invites reading as a containment guarantee. V1 explicitly does not give one (§1). It would also sit oddly once an L4 profile exists, since the root would still own lifecycle, not only isolation. |
| `devos/sandbox/` | Rejected. Overclaims: V1 is not a sandbox. |
| `devos/orchestration/` (S8) | Rejected. S8 owns *when and what* runs (dispatch, scheduling). S6 owns *where and in what verified environment*. Folding S6 into S8's root would redefine S8's ownership and couple environment proof to scheduling policy. |
| `devos/state/` (S4) | Rejected. S4 is the single task state machine. Adding environment lifecycle there would create exactly the second state machine D-066 forbids, and would widen a closed interface. |
| `devos/capabilities/` (S5) | Rejected. S5 is a pure decision library answering CAN. Environment creation is effectful and would break S5's no-I/O core and its closed scope. |
| `devos/contracts/` (S3) | Rejected. S3 describes scope. It must not own how scope is executed. |
| Top-level `.sentinel/` or a runtime directory in the repo | Rejected for code. For *runtime workspaces*, any location inside a repository checkout is rejected outright (§9): workspaces live under a host-configured `workspace_root` outside every Git tree. |

**Why the chosen root owns S6.** S6's artifacts would be: the Execution Identity and Isolation Provenance schemas; the reason vocabulary; the path/environment/config policy modules; the lifecycle host library; the platform profile detection; and the focused tests' fixtures. They are one cohesive subsystem with one owning phase. No existing root's owner could hold them without redefining that root.

**Why S3/S4/S5 must not absorb it.** Each is closed (`ML-DEVOS-ADR-013`/`ADR-014`/`ADR-015`) with a narrow, accepted interface. Absorbing S6 into any of them would:
- widen a closed interface;
- mix effectful environment management into pure libraries (S4 `lifecycle`, S5 `evaluate`);
- blur the MAY / CAN / ISOLATED separation §8 depends on.

**Future manifest consequence (not performed here).** A future, separately authorized step would add one `reserved_subsystem_roots` entry:

`{ "path": "devos/execution/", "owning_phase": "S6", "consuming_phases": ["S7", "S8"], "status": "NOT_IMPLEMENTED", "executable_runtime_present": false }`

- It needs no manifest *schema* or validator change, because the existing entry shape suffices.
- `tests/devos-manifest.test.mjs`'s "only closed phases are IMPLEMENTED" expectation is unaffected by a new `NOT_IMPLEMENTED` root.
- At S6 closure the entry would follow the `ML-DEVOS-RFC-015` lifecycle (`IMPLEMENTED` + `closure_ref`) exactly as S3/S4/S5 did.

**Change class for adding the root.** `ARCHITECTURE`. It creates a new subsystem boundary and ownership claim under the manifest's `reserved_root_invariant`. It should be authorized explicitly, either as part of the S6 implementation decision or as a separate bounded root-reservation step before implementation. It must not be performed as a side effect of design acceptance.

**Frozen-architecture amendment.** None is expected:
- `ML-DEVOS-ARCH-001` does not enumerate reserved roots.
- S6 adds no actor, changes no authority, and leaves TB-1…TB-8 as written. TB-4 stays a procedural requirement. S6 supplies an execution mechanism that *supports* it, but must not be described as technically enforcing TB-4 until evidence of that exists (TB-7's disclosure pattern).
- If the Architect judges that "S6 proven environment" should become a *required* condition in the frozen QA definition, that would be a separate `CONSTITUTIONAL`/`ARCHITECTURE` amendment. This RFC does not propose it.

### 20. Alternatives considered (mechanism comparison)

| Mechanism | Correctness | Isolation strength | Concurrency | Cleanup | Portability | Cost | Testability | Verdict |
|---|---|---|---|---|---|---|---|---|
| Branches only (shared checkout) | Poor: shared working-tree state | L1 only | None: one checkout, serialized | Trivial, but residue persists | Excellent | Lowest | Easy but proves little | Rejected |
| Linked `git worktree` per task | Good for files. Refs, hooks and config are shared. | L2 minus common-dir sharing | Good. `worktree` metadata locking needed. | `git worktree remove`/`prune`. Stale metadata in the shared repository. | Good (Git ≥ 2.5; Windows long paths) | Low: shared objects | Good | Rejected for V1 (§6); possible future optimization only with a separately reviewed common-dir hardening |
| **Dedicated clone per instance** | **Good: independent refs, hooks, config, index** | **L2 full** | **Good: no shared Git state** | **Delete one directory tree (no-follow)** | **Excellent** | Medium: disk and fetch per instance (this repository is small) | **Good** | **Recommended (with L3)** |
| Copied temp directory (`cp -r` of a checkout) | Poor: copies dirty and ignored state, hooks and config; no clean-base proof | L2 at best, contaminated at birth | Fine | Easy | Good (but link semantics differ per platform) | Medium | Hard to prove clean | Rejected |
| Clone/worktree + process/env boundary | Good | **L3** | Good | Adds process teardown | Good with per-OS process handling (§16) | Medium | Good; needs a platform matrix | **Recommended (this is V1)** |
| Containers | Good | L4 (shared kernel) | Good | Good (ephemeral) | Weak on Windows/macOS hosts (needs a VM layer); needs a daemon | Medium–high | Good in CI; harder locally | Future opt-in L4 profile |
| VM isolation | Good | Strongest L4 | Good, at higher cost | Good (discard VM) | Needs hypervisor availability | High | Slow | Future opt-in L4 profile for untrusted code |
| Platform-native sandboxing (Landlock/seccomp, macOS sandbox profiles, AppContainer) | Good where available | L4 (per mechanism) | Good | Good | **Poor**: a different mechanism and semantics per OS; macOS `sandbox-exec` is deprecated | Low runtime, high engineering | Hard: per-OS test matrix | Future, per-platform, only with its own RFC |

## Required design decisions (summary)

1. V1 isolation level is **L3 on a dedicated clone**. L4 is not provided and must not be claimed.
2. Publication is linearized at **S4 `transition`**, not at Git push.
3. QA reconstructs from the **S4-recorded result commit fetched from the remote**, as a different actor, in its own instance.
4. MAY / CAN / ISOLATED are separate, conjunctive conditions. S5 `ALLOW` is never sufficient; S5 `DENY` is always blocking.
5. S6 has no task state machine. Its environment lifecycle is subordinate to S4 fencing.
6. V1 refuses contracts with any consequence flag `true`.
7. The canonical home is `devos/execution/`, to be reserved only by a separate `ARCHITECTURE`-class authorization.
8. There are 28 deterministic, ordered reason codes. Nothing is auto-cleaned into compliance, and nothing orphaned is adopted.

## Scope

In scope: the design above, for the `Dillaab-source/maisog-labs` repository and any future Sentinel-governed project repository.

Out of scope: every executable artifact. This RFC creates only itself and an RFC index entry.

## Non-goals

- Implementing any part of S6, creating `devos/execution/`, or modifying `devos/devos-manifest.json`.
- L4 sandboxing (containers, VMs, platform sandboxes) in V1; network-egress control; containment of a hostile process; protection against a same-user process deliberately reading host credentials.
- Executing untrusted third-party code safely.
- Credential brokering or short-lived credential issuance (a CORE-019 / future-phase concern).
- Evidence storage (S7), orchestration/dispatch (S8), Evidence Gate decisions (S9), CI or GitHub rulesets (S10).
- Any change to S3/S4/S5 implementation, schemas or interfaces; any S5 runtime wiring; automatic remote-branch deletion.
- Secret scanning of committed repository content.
- Context Plane CP-4+, Model Router, S7+.

## Affected components

None today. A future implementation would add `devos/execution/` (schemas, reason vocabulary, policy modules, lifecycle host library, platform detection), its focused tests under `tests/execution-*.test.mjs`, and one manifest root entry, each separately authorized. S3/S4/S5 are consumed through public interfaces only and are not modified.

## Affected rules

No `rule_id` is added, modified or superseded. `CORE-001` (human authority cannot be invented by an agent or mechanism), `CORE-002` (Capability != Authority) and `CORE-008` (installed capability does not grant authority) are relied on, not changed. `CORE-020` governs how S6-backed QA evidence may later be classified. No `CONSTITUTIONAL` or `CORE_POLICY` rule is touched.

## Risks

- **Overclaiming containment.** The most serious risk is that "isolated" is read as "sandboxed". Mitigated by the four-level vocabulary (§1), the fixed disclaimer (§17), and `ISOLATION_PROFILE_INSUFFICIENT`.
- **Scope creep into S8.** Lifecycle hosting could drift into scheduling. §19 draws the line: S6 never decides *when* or *whether* to run.
- **False negatives from strict freshness.** `BASE_ADVANCED` will force re-runs on busy branches. That is accepted as the safe default; §4.3 names the reviewable relaxation.
- **Platform gaps.** Windows symlink privilege, long paths, and process teardown may make some hosts `UNSUPPORTED`. Failing closed is the intended outcome, not a defect.
- **Cost.** A clone plus a dependency install per instance is slower than a shared checkout. The optional verified shared cache (§11) is the bounded mitigation.
- **Second state machine by accident.** The environment lifecycle must stay environment-only. The review should confirm no S6 state is ever read as task progress.

## Migration impact

None. No existing file, record or workflow changes. Current Builder/QA practice continues under procedural rules until an implementation is separately authorized and adopted.

## Security / trust impact

No trust boundary changes.
- TB-2: S6 constrains *where* a Builder writes. It does not change what the Builder is authorized to write.
- TB-4: supported by independent QA reconstruction. It remains procedurally enforced until evidenced otherwise.
- TB-7: S6, like S5, is a capability-side mechanism and never an authority.

`Capability != Authority` is preserved and extended to `Isolation != Authority`.

## Evidence requirements

For a future implementation:
- `INDEPENDENTLY_INSPECTED` review of the source and diff;
- `INDEPENDENTLY_REPRODUCED` or `CI_ATTESTED` runs of the focused tests on both POSIX and Windows, where feasible (CORE-020: this is executable, security-adjacent behavior);
- mutation-test results.

Builder test runs are `ACTOR_REPORTED`. No `RUNTIME_OBSERVED` claim applies.

## Rollout

1. Architect review of this RFC.
2. Paulo decision on design acceptance.
3. A separate Paulo decision authorizing implementation (and the `devos/execution/` root reservation and S5 consumption).
4. Implementation with the §18 test plan.
5. Architect implementation review.
6. The RFC-015 D.1/D.2 closure.

Adoption by actual Builder/QA workflows is a further, separate integration step (S8 or explicit decision).

## Rollback

This RFC changes nothing executable. Rejecting it leaves the repository unchanged. A future implementation is a self-contained root with no callers until integration is authorized. Rollback would be removal of that root and its manifest entry under the same authority class.

## Compatibility

Compatible with:
- the frozen `ML-DEVOS-ARCH-001`, with no amendment proposed;
- S3/S4/S5 as closed: consumed only through public interfaces;
- Context Bootstrap V0 (`ML-DEVOS-RFC-018`): the exact-tip rule is mirrored at execution time and not altered.

## Version impact

A future S6 implementation closure would plausibly be `MINOR`: a new backwards-compatible subsystem, with no rule or authority change. This is the reasoning already applied to S3/S4/S5. **This RFC claims and applies no version change.** Sentinel remains `v1.8.0`.

## Architect Sync requirement

Yes. `ARCHITECTURE` class (`CHANGE_GOVERNANCE_POLICY.md` §1). This RFC is the input to the next unused immutable Architect Sync after `ML-DEVOS-AS-085`.

## Paulo decision requirement

Yes. Design acceptance and implementation authorization are separate Paulo gates. The implementation gate must also explicitly cover the `devos/execution/` root reservation and S6's consumption of S5 adapters.

## Residual risks (V1, disclosed)

1. **A same-user process is not contained.** At L3, an instance process can deliberately read host credential stores, other instances, and the S6 journal. Mitigation is refusal of credential-bearing contracts plus detection. Real prevention needs a dedicated OS user or L4.
2. **Third-party install and test code** runs with host-user privileges.
3. **No network-egress control.** Registry and other network access is not an S5 V1 provider.
4. **The filesystem TOCTOU window** between check and use is narrowed but not eliminated without `openat`-style primitives.
5. **The journal** is tamper-*evident* (hash chain), not tamper-*proof*.
6. **Actor independence ≠ reasoning independence.** S6 proves QA used a different actor and environment, not a different chain of reasoning (TB-5).
7. **Orphaned remote branches** accumulate until separately authorized deletion.
8. **The S6 host itself is trusted.** A lying host defeats S6, just as a lying adapter defeats S5.

## Unresolved questions

1. Should the Task Contract pin `base_sha` at contract level? That would need an additive, separately governed S3 change, or should the base stay an S6 create-time resolution (V1)?
2. Can `remote_resources_involved: true` contracts be admitted to V1 when the only remote action is the host-side push of the task branch? Or should that flag remain a hard refusal until L4 or credential brokering exists?
3. Should linked worktrees be allowed later as an optimization, given a separately reviewed hardening of the shared common directory (per-worktree config, ref namespace protection)?
4. Should package-registry egress become an S5 provider, or be governed by an L4 network policy, before S6 is used for tasks whose dependencies change?
5. Is a dedicated low-privilege OS user per instance an acceptable "L3+" profile for V1 hosts that support it? Or is that already an L4 decision needing its own review?
6. Where does the Isolation Provenance durably live before S7 exists: the host journal only, or a repository-committed digest referenced from S4's `evidenceRef`?
