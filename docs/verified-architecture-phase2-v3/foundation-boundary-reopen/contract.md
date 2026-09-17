# Foundation Boundary Policy Reopen - Contract

Baseline: `127f284d78b83f358f076b3ee8f8b56044bcc691` (immutable; never amended,
rebased, squashed, overwritten, or reinterpreted). Owner-approved reopen
(Yael, 2026-09-18 01:48 IDT; Yoni Option A) authorizing exactly three inbound
Foundation edges for the Authority Routing Gate.

## Scope

Modified (minimum certified boundary-policy artifacts):

- `tests/clean-runtime/foundation-allowed-paths.json` - schema 1.0.0 -> 1.1.0;
  `files` section byte-identical; adds `allowedInboundFoundationImports` with
  exactly one entry naming three exact edges.
- `tests/clean-runtime/v3-promotion-authority-audit.js` - audit 1.2.0 -> 1.3.0;
  the zero-tolerance inbound check becomes pair-exact against the certified
  policy, with policy validation and dynamic-load detection on the allowlisted
  importer. Every other check unchanged.
- `tests/verified-architecture-phase2/static-boundaries.test.js` - test 4
  asserts the manifest policy equals exactly the certified three-edge set and
  exempts only those exact pairs.

Added: `tests/clean-runtime/foundation-boundary-reopen.test.js` (18 hostile
tests), this documentation, branch CI, evidence package.

Nothing under `src/` changes. The six certified Foundation production modules
remain byte-identical (CI asserts their blob SHAs). The Authority Routing Gate
remains non-promoted on this branch: no routing module exists here and the
audit proves `legalityPromoted=false`, `gatewayRouted=false`,
`schoolConnected=false`, `runtimeConnected=false` (hostile test 18).

## Certified boundary policy (exact positive allowlist)

Importer: `src/clean-runtime/v3-routing/promoted-legality-port.js`

Targets (exactly these three, nothing else):

1. `src/clean-runtime/mutation/physical-proof-planner.js`
2. `src/clean-runtime/mutation/v3-promotion-foundation.js`
3. `src/clean-runtime/v3-authority/authority-envelope-builder.js`

No wildcard, directory-level permission, prefix matching, regex broadening,
transitive permission, caller-selected module, dynamic require/import,
alternate loader, reflection-based loading, generated import indirection,
audit bypass, fallback, or default-to-V1. The audit canonicalizes every import
specifier with `path.resolve` before comparison, and validates that policy
paths contain no `.`/`..` segments, backslashes, or glob/regex metacharacters,
so normalization cannot expand permission. The manifest policy must equal the
certified three-edge set exactly: a missing edge, an additional edge, a
duplicate, or a malformed entry each fail certification
(`ALLOWLIST_POLICY_MISMATCH`). An allowlisted importer using dynamic
`require`/`import()` fails certification (`ALLOWLIST_IMPORTER_DYNAMIC_LOAD`).
Every edge outside the exact allowlist fails closed
(`FORBIDDEN_INBOUND_FOUNDATION_IMPORT`), as do School/runtime/gateway
connections (`SCHOOL_CONNECTED`, `RUNTIME_CONNECTED`, `GATEWAY_ROUTED`) -
hostile test 16 proves the pre-reopen fail-closed behavior is unchanged.

## Owner decision record

The certified 1.2.0 audit enforced zero inbound Foundation imports with no
exception mechanism, while the manifest prose scoped the prohibition "until
Authority Routing Gate". The Gate's mandatory path requires the three edges
above; every alternative wiring (dependency injection, inversion, extension
point, dynamic require) still produces a forbidden edge or defeats the audit.
Reported as FOUNDATION_REOPEN_REQUIRED; owner approved this certified reopen
of the boundary policy only. If Gate implementation later requires changing
any of the six production modules or expanding beyond these three edges:
HARD STOP, owner review required.
