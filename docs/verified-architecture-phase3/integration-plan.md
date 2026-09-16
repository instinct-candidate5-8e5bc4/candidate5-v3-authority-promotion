# Separate Integration Plan - approval required

## Blocker

The pinned simulator imports Three.js inside an inline ES module and keeps both `THREE` and `scene` as lexical module bindings. An external observer installed after page load cannot observe boot mutations or access that lexical scene. Installing wrappers before execution would require one prohibited touchpoint: editing the archived inline module/imports, dynamically rewriting the HTML/module response, or injecting code into the runtime path.

Phase 3 Gate 0 therefore HARD STOPPED before capture. No workaround was attempted.

## Exact proposed touchpoint for a separately approved integration

Preferred minimal option: add one explicit test-only preload import immediately before the current inline module in `index.html`, guarded by a build-time test harness artifact that is absent from production. The preload would wrap Three.js prototype calls before scene construction and write only to an append-only observation sink. This changes an existing runtime file and is not authorized now.

Alternatives, not recommended without proof:
- rewrite the isolated HTTP response to insert a preload script. This violates the locked no-response-rewrite rule and no longer executes exact archived bytes;
- browser/CDP preload hooks. Current lexical ESM imports may still escape or initialize before wrappers, and boot coverage is unproven.

## Affected files

Potentially `index.html` only, plus new test-only observer/harness files. No Phase 1/2 files, assets, service worker or production deployment should change.

## Risks

Changed script ordering, module loading or timing; observer-induced behavior divergence; accidentally shipping the test hook; incomplete direct scalar-write coverage; performance/memory overhead; new CSP/module-fetch failures.

## Rollback

One revert removing the single preload touchpoint and test-only files. Hash-gate production build artifacts to prove the hook is absent. Never deploy before separate approval and full differential review.

## Required tests before any runtime use

Exact source diff review; observer OFF/ON state and exception equivalence; boot and heavy-mutation performance diagnostics; source/assets before=after; complete L-01..L-17 plus AST reconciliation; no write/control capability; direct-assignment unmatched-delta reporting; deterministic captures/replay; Phase 1 13/13 and Phase 2 38/38; production bundle/deployment negative proof; detached-HEAD verification and Review Package.
