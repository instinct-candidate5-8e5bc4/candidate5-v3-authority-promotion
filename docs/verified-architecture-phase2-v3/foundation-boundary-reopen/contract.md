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
(`ALLOWLIST_POLICY_MISMATCH`).

Module-load verification (audit 1.6.0) is parsing-based on a real JavaScript
parser: acorn 8.18.0 vendored at tests/clean-runtime/vendor/acorn.js (npm
registry integrity sha512-lGq+9yr1/GuAWaVYIHRjvvySG5/4VfKIvC8EWxStPdcDh/Ka7FG3twP6v4d5BkravUilhIAsG4Qj83t02LWUPQ==,
file sha256 fc3ed7b81e58464715d0291402892f22c3d86ea75302645a330390f85d8015c9)
with the full Acorn LICENSE at tests/clean-runtime/vendor/acorn.LICENSE
(file sha256 76a876cf886ff9be2a8b5e2e86514fed06223c8c9f0c1e9ee9606e93841e00b7).
Both vendor files are hash-locked in the audit and verified before the parser
is loaded; a missing or modified vendor artifact fails the audit closed
(VENDOR_INTEGRITY_MISMATCH).
Ambient CommonJS wrapper capabilities are closed: every CJS module receives
(exports, require, module, __filename, __dirname) as wrapper arguments, so
any `arguments` reference that resolves to the module wrapper scope (top
level, including through arrow functions, which do not rebind it) fails
closed; `arguments` inside an ordinary nested function refers to that
function's own arguments and remains legal. The V8 stack-trace capability
API (Error.prepareStackTrace / Error.captureStackTrace) is treated as a
capability root.
The import graph itself is built from parsed ASTs, so comments, escapes, and
formatting cannot hide an edge. Every production source file is parsed
(unparseable = UNPARSEABLE_PRODUCTION_FILE) and held to a closed loader
policy: the ONLY permitted module load is a direct require call with exactly
one static string-literal argument whose specifier is relative or one of
node:crypto / node:fs / node:path (the exact builtin set used at baseline).
The capability roots require, module, process, globalThis, global, eval,
Function, Reflect, constructor, __proto__, createRequire, getBuiltinModule,
_load, and binding fail closed as: identifier value/alias/shadow uses
(`const R=require`, `const {createRequire}=...`, shadowed parameters),
member access (`module.require`, `X.constructor`, `globalThis.eval`),
computed member access to capability names (`module['require']`), computed
member keys CONSTRUCTED from strings (`module['re'+'quire']`, template keys;
literal-selection keys like the baseline `profiles[cond?'a':b]` remain
allowed), capability names as string literals anywhere, dynamic import(),
`with` statements, and any unresolved/unknown binding state. Unicode-escaped
identifier tricks (`requ\u0069re`) are normalized by the parser and fail.
Baseline-legitimate forms stay allowed: typeof require/module/globalThis
capability probes, ...require('./x') spreads, module.exports, class
constructor definitions, globalThis in UMD wrapper positions (argument,
ternary branch, parameter default, non-capability member such as
globalThis.fetch), and method definitions named import.
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
