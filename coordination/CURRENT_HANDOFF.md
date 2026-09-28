# Current Handoff — RFC-022 CB-R Access identity alignment (D-113)

```yaml
schema_version: 1
handoff_id: H-WEB-RFC022-CBR-ACCESS-0001
cycle_id: MAISOGLABS_WEB_RFC022_CBR
input_base_commit: d6a9480fbf491ed3d2cf7441534e332056172da2
review_target_commit: d6a9480fbf491ed3d2cf7441534e332056172da2
applicable_review_id: ML-DEVOS-AS-139
```

This handoff is evidence, not authority. Routing, turn, scope and flags live only in `coordination/STATE.md`. The Builder does not self-approve. Evidence class: `ACTOR_REPORTED`, from live Cloudflare API calls made in this session through the Cloudflare MCP/API connector. Two calls were writes: one policy create and one application update. Every other call was a GET.

## Objective

Execute `DIR-WEB-RFC022-CBR-ACCESS-0001` (D-113): make the `maisoglabs.com/admin` Access application allow exactly the D-106 identity `paulo.maisog@maisoglabs.com`, with the minimal policy mutation, and change nothing else.

## Result

**AS138-F001 remediated. The application now allows exactly `paulo.maisog@maisoglabs.com`. The shared policy and every other application are unchanged. Worker traffic is unchanged.**

| Item | Value |
|---|---|
| D-113 publication | `d6a9480fbf491ed3d2cf7441534e332056172da2` (parent `7555f48…`, the AS-139 tip) |
| Application | `b80acca4-ecff-4d9a-ba1b-cedff87cb25b` ("maisoglabs.com", self-hosted) |
| Branch taken | **Shared.** Policy `460d0315-1e4b-414a-8845-c656f1f04c79` had `app_count: 3` and was referenced by `b80acca4…` (`maisoglabs.com/admin`), `697320d0…` (`admin.maisoglabs.com`) and `cb6a1bce…` (`staging-admin.maisoglabs.com`). It was not edited. |
| Operation 1 | `POST /access/policies`: created the dedicated reusable policy `62653faa-4c3c-4b96-a53f-7545f79dbd43`, "maisoglabs.com/admin — D-106 Canonical Administrator". `decision: allow`; `include` is only `email: paulo.maisog@maisoglabs.com`; `exclude`/`require` empty; `session_duration: 30m` (copied from the shared policy). |
| Operation 2 | `PUT /access/apps/b80acca4…`: resent every field exactly as read, with only `policies` changed from `[460d0315…]` to `[{ id: 62653faa…, precedence: 1 }]`. |
| Application `updated_at` | `2026-09-12T17:48:19Z` → `2026-09-28T20:47:05Z` |
| Active Worker before / after | `53137101-afb8-456c-ab83-d8b7b934df01` @ 100%, deployment `3bf053d6…`, unchanged |

Reusable and inline policies are mutually exclusive on an application (Cloudflare API schema), so the dedicated policy is a reusable policy attached only to this application (`app_count: 1`).

## Tests and evidence

### Pre-change (read 2026-09-28T20:45:36Z, and again immediately before the write)

- **Application `b80acca4…`:**
  - AUD `ef44d36e676be36eedb87d5378b8f3fd1ed40cc34505b7261a990c166a0cea22`;
  - domain `maisoglabs.com/admin`; `self_hosted_domains` and `destinations` both `maisoglabs.com/admin` and `maisoglabs.com/admin/*`;
  - `allowed_idps` `[169c0391-1a42-474c-bbe2-ff3474f66053]`;
  - `session_duration: 24h`; `auto_redirect_to_identity: true`; `app_launcher_visible: true`; `enable_binding_cookie: false`; `http_only_cookie_attribute: false`; `options_preflight_bypass: false`; `eager_redirect_cookie_setting: true`; `tags: []`;
  - policies `[460d0315…]` (precedence 1).
- **Policy `460d0315…`:** allow; `include` a single personal `gmail.com` address (the AS138-F001 mismatch; the address is intentionally not committed here); `session_duration: 30m`; `updated_at 2026-09-12T17:48:05Z`; `app_count: 3`.
- **Team domain (organization `auth_domain`):** `jolly-disk-0469.cloudflareaccess.com`.
- **Other reusable policies:** `e8712ebf…` "Paul Admin Only", `82aae8a7…` and `4205934f…` "Paulo Admin Only", each `app_count: 0`. Not used and not modified.

### Post-change (read 2026-09-28T20:47:44Z)

- **Protected paths:** still exactly `maisoglabs.com/admin` and `maisoglabs.com/admin/*` (domain, `self_hosted_domains` and `destinations` identical). **PASS**
- **Team domain and AUD:** unchanged. **PASS**
- **IdP, session and cookie/redirect/launcher/tag settings:** all identical to pre-change. **PASS**
- **Allowed identity:** this application's only policy is `62653faa…`, allowing exactly `paulo.maisog@maisoglabs.com`. **PASS**
- **Other applications:**
  - `697320d0…` (`admin.maisoglabs.com`, `updated_at 2026-09-12T17:55:14Z`) and `cb6a1bce…` (`staging-admin.maisoglabs.com`, `updated_at 2026-09-13T00:22:48Z`) still reference only `460d0315…`;
  - their `updated_at` values are unchanged.

  **PASS**
- **Shared policy `460d0315…`:** `include` and `updated_at` are unchanged. `app_count` went from 3 to 2 only because `b80acca4…` no longer references it. **PASS**
- **Other reusable policies:** unchanged (`app_count` 0, `updated_at` as before). **PASS**
- **Worker:** the latest deployment is still `3bf053d6…` (created 07:21:06Z) with `53137101…` @ 100%; the deployments list still has 10 entries. **PASS**

### No other production change

The Builder ran:
- no Worker deploy, upload, promotion or traffic change; no Gate D;
- no D1, R2, content, `site_settings` or email change;
- no DNS, binding, secret or environment change;
- no change to any other Access application or policy;
- no `main` merge.

## Changed files

- **Coordination:**
  - `coordination/STATE.md`; this file;
  - `coordination/archive/directives/DIR-WEB-RFC022-CBR-ACCESS-0001.{md,provenance.json}` (byte-for-byte, blob `4b8c649…`) and the index row;
  - `coordination/OPERATIVE_OBLIGATIONS.md` is unchanged.
- **Outside this commit:** the Cloudflare Access change above. No product, test or configuration file change.

## Unresolved findings and limitations

- **Login not proven end to end:**
  - This cycle proves the configuration only. No interactive login as `paulo.maisog@maisoglabs.com` was performed.
  - The application's IdP `169c0391…` (the OTP IdP per D-113) must deliver the one-time code to that mailbox.
  - The active production Worker still carries the placeholder `ACCESS_*` values (fail-closed). A real admin login through the Worker is only testable after Gate D.
- **Current admin session behavior:** a browser session issued under the previous policy may remain valid until the application session (24h) or policy session (30m) expires. That is normal Access behavior. With the Worker fail-closed, it gives no Worker access.
- **Other applications unchanged by design:** `admin.maisoglabs.com` and `staging-admin.maisoglabs.com` still allow only the previous identity through the shared policy. Aligning them, and cleaning up the three unused reusable policies, is outside D-113.
- **Publication attempt keys:**
  - The D-113 issue transition was published with the explicit `--transition-id MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE:D-113`.
  - The checker's default key for directive issues in this cycle (`MAISOGLABS_WEB_RFC022_CBR:NONE:CLAUDE`) had reached its local limit of 3 after three distinct successful issues (D-110, D-111, D-112), none of them a retry.
  - The local ledger was not edited.
- **Remaining before activation:**
  - Gate D (with a pre-promotion re-check of the Access application and AUD);
  - then, each separately authorized: approved project copy (including Eternal Eggs), initial activation, and the contact email with confirmed deliverability.
- **Carried forward:** AS132-F003 remains open; the traceability validator's pre-existing 3 ERRORs and DRIFT are unchanged.
- **Obligations.** `OBL-006/007/010/011/012/013/014/015/017/018/019/020/021` are carried forward unchanged.

## Evidence locations

- Access application `b80acca4-ecff-4d9a-ba1b-cedff87cb25b`.
- Dedicated policy `62653faa-4c3c-4b96-a53f-7545f79dbd43`.
- Shared policy `460d0315-1e4b-414a-8845-c656f1f04c79`.
- Account `fb7234ae9117baf1481ab3b169a9824a`.
- Worker `maisog-labs`, deployment `3bf053d6-56b8-4412-a96a-a587588f8521`.

## Governing references

- **T0:** Protocol V2; D-113; `ML-DEVOS-AS-139`.
- **T1:** AS138-F001 (`ML-DEVOS-AS-138`); D-106; D-103 (precedent).
- **Directive archive:** `coordination/archive/directives/DIR-WEB-RFC022-CBR-ACCESS-0001.md`.

## Next action

The Architect reviews the Access alignment. Gate D, production content, initial activation and email publication each need separate Paulo authorization.
