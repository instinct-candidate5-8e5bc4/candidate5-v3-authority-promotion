# Foundation Boundary Policy Reopen - Certification Evidence

- Original baseline SHA: `127f284d78b83f358f076b3ee8f8b56044bcc691` (immutable)
- Reopen candidate SHA + exact parent: this branch head and `127f284` (CI review
  metadata `commit.txt`, `parent.txt`, `remote-tip.txt` verify at push time)
- Branch: `candidate5-foundation-boundary-reopen`
- Exact changed-file list (vs baseline, asserted in CI scope guard):
  - M `tests/clean-runtime/foundation-allowed-paths.json` (boundary policy artifact)
  - M `tests/clean-runtime/v3-promotion-authority-audit.js` (boundary policy artifact)
  - M `tests/verified-architecture-phase2/static-boundaries.test.js` (boundary policy artifact)
  - A `tests/clean-runtime/foundation-boundary-reopen.test.js` (18 hostile tests)
  - A `docs/verified-architecture-phase2-v3/foundation-boundary-reopen/*` (docs)
  - A `.github/workflows/v3-foundation-boundary-reopen.yml` (branch CI)
  - A `evidence/clean-runtime/v3-foundation-boundary-reopen/*` (this package)
  - A `tests/clean-runtime/vendor/acorn.js` (vendored parser, integrity-pinned)
  - Nothing under `src/`; inherited Foundation evidence untouched
    (CI asserts `foundation-matrix-evidence.json` stays blob `aea5d721...`).
- Byte comparison of all six Foundation production modules: CI step prints
  `git hash-object` per module and asserts equality with the pinned SHAs in the
  manifest `files` section (itself byte-identical to baseline).
- Old policy vs new policy: baseline manifest policy forbade ANY inbound
  Foundation import with no exception mechanism (audit 1.2.0, static test 4
  fail-on-any). New policy: exact positive allowlist of the three certified
  edges below; everything else still fails closed. Full text in
  `docs/.../foundation-boundary-reopen/contract.md`.
- Exact three-edge allowlist:
  `src/clean-runtime/v3-routing/promoted-legality-port.js` ->
  `src/clean-runtime/mutation/physical-proof-planner.js`,
  `src/clean-runtime/mutation/v3-promotion-foundation.js`,
  `src/clean-runtime/v3-authority/authority-envelope-builder.js`.
- Edge-4 rejection proof: hostile test 5 (port -> v3-authority-adapter.js)
  fails with FORBIDDEN_INBOUND_FOUNDATION_IMPORT; hostile tests 3,4,6,7,8
  reject wrong target, wrong source, sibling module, path alias, and
  normalization bypass.
- Gate results (this package): focused Foundation suite twice (120/120 each),
  broad suite (600/600), static boundaries (4/4), hostile boundary suite
  (40/40: 18 mandatory + 22 independent-certification regressions, incl. the
  six CommonJS wrapper `arguments[1]` reproductions from round-3 review, arrow
  and alias variants, V8 stack-trace API closure, and a nested-function
  positive control), reopened audit 1.6.0 (acorn 8.18.0 AST-based loader
  policy, vendored with npm registry integrity; vendor file and full Acorn
  LICENSE hash-locked and verified at audit startup, fail closed on mismatch;
  CommonJS wrapper `arguments` capability closed: any use resolving to the
  module wrapper scope fails closed, nested-function arguments still legal;
  Error.prepareStackTrace/captureStackTrace treated as capability roots)
  (0 findings, boundaryPolicyValid=true, exactly 3
  allowed pairs), Foundation detached determinism byte-identical across two
  runs, closure determinism byte-identical, closure performance captured,
  matrix coverage 69/69 with clean audit gate.
- Fixture integrity: hostile fixtures build from `git archive HEAD src`
  (immutable committed content) after a CI race where the parallel matrix
  suite's in-place tamper probe was copied mid-write; audit itself always
  runs on the real tree.
- Manifest verification: reopened audit validates the manifest allowlist
  equals exactly the certified three-edge set (`ALLOWLIST_POLICY_MISMATCH`
  otherwise) - hostile tests 11-13.
- Clean worktree: CI asserts no tracked modifications remain after the gates.
- Remote branch/head verification, candidate5-tip==127f284 control, and
  upstream-main pinned control: CI review metadata step.
- SHA-256 evidence package: `SHA256SUMS` in this directory plus the CI
  `candidate.sha256` archive digest.
- Gate status during reopen: non-promoted (hostile test 18; no routing module
  exists on this branch).
