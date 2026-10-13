# Security Scan — 1 Inbox Foundation

Date: 2026-10-12 · Branch: `feat-inbox-foundation` at `5c52e3d`

Surfaces touched:
- the local HTTP spike server (`spike/server.ts`);
- the Tauri webview configuration (CSP, capabilities);
- git hooks and tooling scripts;
- new npm and cargo dependencies;
- captured hook payloads (`fixtures/hooks/`, `spike/payloads.jsonl`).

## Findings

### S1 — Spike server has no body size cap and no content-type check
- **Severity:** low.
- **Where:** `spike/server.ts:62-66` (`readBody`), `spike/server.ts:110-114`.
- **What:** the spike reads the whole request body with no limit and does not require `Content-Type: application/json`. ADR 03 requires both for the real server.
- **How it is exploited:** only something that already holds the token can reach the handler. Unauthenticated requests are also read in full before the `401`. A local process could then send a very large body and exhaust memory, but only while the spike is running, by hand, during a test.
- **OWASP / ASVS:** ASVS 2.4.1 (anti-automation and excessive calls), ASVS 1.x input handling. A04:2021 Insecure Design if the pattern were copied.
- **Fix:**
  - the spike is deleted when the MVP server replaces it (ADR 04);
  - the MVP server must cap the body and check the token before reading the body;
  - it must require JSON (ADR 03).
- **Decision:** accepted risk (2026-10-12). Maintainer's choice: "Aceitar o risco". The reason given with the option: the spike is temporary, run by hand, loopback-only and token-guarded, and the controls are an obligation of the MVP server (ADR 03).

### S2 — Hook payload log stores user prompts in plain text
- **Severity:** low.
- **Where:** `spike/server.ts:76-88` → `spike/payloads.jsonl`.
- **What:** every request is appended in full, including the user's questions, the `cwd` and the transcript paths. The token is excluded. The file is git-ignored and local.
- **How it is exploited:** anyone who can read the user's home directory can read the questions asked during spike runs. The same user already has that access, so the only real risk is accidental sharing, for example attaching the file to an issue.
- **OWASP / ASVS:** ASVS 14.x data protection (data minimisation).
- **Fix:** delete `spike/payloads.jsonl` once the fixtures are extracted (already done). The MVP must not log payload bodies.
- **Decision:** fix now (2026-10-12). Maintainer's choice: "Apagar o arquivo agora". `spike/payloads.jsonl` was deleted. The MVP server must not log payload bodies.

### S3 — Spike test token appeared in terminal output and screenshots
- **Severity:** low.
- **Where:** the startup output of `npm run spike`, and `~/dev/claude-inbox-spike-test/.claude/settings.local.json`.
- **What:** the spike prints the hook config with the token, and that output was pasted into this session. The token only guards a throwaway server that runs by hand. It is not in git (history checked: 0 occurrences).
- **How it is exploited:** while the spike runs, someone holding the token could answer questions on behalf of the user in the test directory only.
- **OWASP / ASVS:** ASVS 13.x secret management.
- **Fix:**
  - delete `~/dev/claude-inbox-spike-test`, or regenerate its token;
  - the MVP installer must never print the token.
- **Decision:** fix now (2026-10-12). Maintainer's choice: "Apagar a pasta de teste". `~/dev/claude-inbox-spike-test` was deleted, which invalidates the token. The MVP installer must never print the token.

No critical, high or medium findings.

## The sweep

| # | Section | Result |
|---|---------|--------|
| 1 | Input and trust boundary | Spike: parsing is total (bad JSON becomes a pass-through `200`), and the tool name and shape are checked. No size cap and no content-type check (S1). Tooling scripts only read paths given by git or lint-staged. The webview takes no external input yet |
| 2 | Object-level authorization | Not present: no resources owned by anyone |
| 3 | Authentication and session | Spike: shared token required on every request. No sessions |
| 4 | Timing and side channels | `timingSafeEqual` after a length check. The token is always 64 hex characters, so the length reveals nothing new. Every rejection is the same empty `401` |
| 5 | Secrets | No secret in the client bundle, the repository or its history. The spike token stays out of logs and fixtures. Terminal exposure: S3 |
| 6 | Cache on shared layers | Not present |
| 7 | Rate limiting | Not present in the spike. The queue cap is an MVP requirement (ADR 03) |
| 8 | Error surfaces and logs | The spike returns an empty `500` and logs the error locally. The UI shows no error surface yet. Payload log: S2 |
| 9 | Dependencies | See below |
| 10 | Cryptography and data at rest | The spike token comes from `randomBytes(32)` (CSPRNG). No hand-rolled crypto. Data at rest: `spike/payloads.jsonl` (S2) and the sanitized fixtures |

**Webview hardening:**
- CSP is `default-src 'self'; connect-src ipc: http://ipc.localhost; img-src 'self' data:`. `script-src` falls back to `'self'`, with no `data:` or `blob:`.
- Capabilities are `core:default` only.
- No `dangerouslySetInnerHTML` or `innerHTML` in `src/`.

## ASVS requirements checked

| Requirement | Verdict | Note |
|---|---|---|
| ASVS 11.5.1 (CSPRNG, ≥ 128 bits) | met | Spike token: 256 bits from `crypto.randomBytes` |
| ASVS 3.2.2 (render text safely) | met | React text nodes only; hook text is never rendered as HTML |
| ASVS 3.4.3 (Content-Security-Policy) | met | Strict CSP in `tauri.conf.json`; Tauri adds hashes and nonces for its own assets |
| ASVS 2.4.1 (anti-automation) | **not yet** | No caps in the spike (S1). Required in the MVP server by ADR 03 |
| V12 (TLS) | not applicable | Loopback only (ADR 03) |
| V3.3 (cookies) | not applicable | No cookies |

## Dependency check

**Audit tools (2026-10-12)**
- `npm audit` (all dependencies, then `--omit=dev`): **0 vulnerabilities**.
- `cargo audit` 0.22.2, installed at the maintainer's request: **0 vulnerabilities** in 407 crates (RustSec database, 1307 advisories). It raised 2 warnings, both on transitive dependencies of Tauri's Linux GTK stack:
  - `proc-macro-error` 1.0.4: unmaintained (RUSTSEC-2024-0370). It is build-time only, a proc-macro.
  - `glib` 0.18.5: unsound `VariantStrIter` iterator impls (RUSTSEC-2024-0429). This project never calls `glib` directly, so the path is unreachable from our code, and only an upstream Tauri/gtk-rs update can move it.

  Both are recorded and need no action. They should be re-checked when Tauri updates its GTK dependencies.

**Web search (2026-10-12)**

| Advisory | Affects us? | Why |
|---|---|---|
| Vite CVE-2026-39363 and CVE-2026-39364 (dev server file read, `fs.deny` bypass; fixed in 8.0.5) | No | We use Vite 8.3.4, and the dev server binds localhost only |
| Tauri GHSA-7gmj-67g7-phm9 / CVE-2026-42184 (origin confusion) | No | Windows and Android only, fixed before 2.12. We use tauri 2.12.3 on Linux |
| Tauri CVE-2026-95626 (CSP nonce bypass with `data:`/`blob:` in `script-src`) | No | Our `script-src` falls back to `'self'` |
| Tauri GHSA-w28w-mhc8-qvjv (IPC fetch command) | No | `tauri-plugin-http` is not used |
| `tauri-plugin-updater` CVE-2026-95624 and CVE-2026-95625 | No | The updater plugin is not used. Re-check if auto-update is added |
| React Server Components CVE-2026-23864 and CVE-2026-44907 | No | No RSC; client-only React 19.3 |
| vitest, oxc-parser, @ast-grep/napi | Nothing found | — |

Sources:
- [Tauri security advisories](https://github.com/tauri-apps/tauri/security/advisories)
- [OpenCVE CVE-2026-95626](https://app.opencve.io/cve/CVE-2026-95626)
- [Strix CVE-2026-95624](https://www.strix.ai/cve/CVE-2026-95624)
- [Strix CVE-2026-95625](https://www.strix.ai/cve/CVE-2026-95625)
- [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583)
- [GHSA-v2wj-q39q-566r](https://github.com/advisories/GHSA-v2wj-q39q-566r)
- [SentinelOne CVE-2026-44907](https://www.sentinelone.com/vulnerability-database/cve-2026-44907/)
- [AhnLab CVE-2026-23864](https://asec.ahnlab.com/en/92377/)

**New dependencies, beyond CVEs**
- All of them are well-maintained, first-party or widely used packages.
- The only install script is in `@ast-grep/lang-rust`. It is denied in `allowScripts`, because the package ships prebuilt binaries.

## Conclusion
All ten sections were swept. The product has no network-facing surface yet beyond a throwaway, token-guarded loopback spike. The webview is locked down: strict CSP and minimal capabilities. No dependency advisory reaches this project's code paths. Three low findings were listed, all tied to the spike. The maintainer accepted S1 and had S2 and S3 resolved by deleting the payload log and the test directory.
