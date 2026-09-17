# V3 Structural Enforcement Preflight

Status: design-only preflight. No runtime promotion is authorized by this document.

Certified Foundation baseline: `127f284d78b83f358f076b3ee8f8b56044bcc691`.

## Decision

Proceed to an implementation gate only with a trusted, hermetic graph compiler and a locked-down SES compartment in a dedicated worker. Do not continue the JavaScript spelling/identifier blacklist approach.

The enforcement chain is:

```
trusted build/compiler
  -> canonical closed dependency graph + module digests
  -> exact Authority Routing Gate edge policy
  -> signed graph root + deterministic bundle
  -> trusted worker bootstrap verifies both
  -> lockdown before application evaluation
  -> SES Compartment with graph-only module hooks and minimal endowments
  -> byte-identical Foundation source inputs
```

The graph compiler and signing step are outside unrestricted application JavaScript. The runtime application receives neither the compiler, graph mutation authority, host import hooks, Node's loader, nor host globals.

Implementation MUST HARD STOP if it requires a source change to any certified Foundation production module. The build may parse and bundle those source bytes without changing the repository blobs or their semantics.

## Scope and invariants

This preflight covers the future Authority Routing Gate and the isolated V3 Foundation. It does not connect School, a production runtime, a writer, a store, or an event log.

The following baseline production blobs are immutable:

| Path | Baseline git blob |
| --- | --- |
| `src/clean-runtime/mutation/physical-capability-router.js` | `4acc0ea42557c226b4c4ea0d162f787f46fb753e` |
| `src/clean-runtime/mutation/physical-proof-planner.js` | `f2bacae79bbb476222f683fa74bda85daeef1629` |
| `src/clean-runtime/mutation/v3-authority-adapter.js` | `4ef9f013fa1cc15ea2898fd39ca00dafa4c17879` |
| `src/clean-runtime/mutation/v3-promotion-foundation.js` | `c09f5e2c6dac357b1a0b3d660dcc1b73c9dc04bc` |
| `src/clean-runtime/v3-authority/authority-envelope-builder.js` | `19f5f180b2253dbda45401542153471ab3ce5c45` |
| `src/clean-runtime/v3-authority/authority-envelope.js` | `5766c26d5deacd2b92a231c9a341e636ff97e392` |

All existing fail-closed Foundation meanings remain normative. Packaging failure, graph failure, compartment failure, and loader denial add rejection paths. They cannot produce `COMMIT_ALLOWED` or turn Foundation `FAIL`, `UNKNOWN`, or invalid evidence into `PASS`.

## Exact trust boundaries

### Trusted build boundary

Trusted:

- a pinned Rust graph compiler, built from a locked toolchain and dependency lockfile;
- the clean source checkout at the certified baseline plus explicitly reviewed Authority Routing Gate additions;
- the exact-edge policy file;
- deterministic bundling and canonicalization;
- the release signing key, held only by CI/release infrastructure;
- CI that records compiler, policy, graph, bundle, and source identities.

The compiler parses every production module with a real ECMAScript parser. It resolves imports using a fixed, repository-relative resolver. It never executes application code to discover dependencies. Parse ambiguity, unsupported syntax, resolver ambiguity, symlink escape, case collision, package export ambiguity, dynamic dependency expression, native add-on, or generated-at-runtime module is a build failure.

Untrusted inside this boundary: source text, package metadata supplied by the application, code-generation directives, and dependency names. They are inputs, not instructions to the compiler.

### Graph authority boundary

The canonical graph is the sole module authority for the compartment. Each node records normalized module ID, source SHA-256, format, ordered dependency specifiers, resolved target IDs, transform identity, and output record SHA-256. The graph header records schema version, policy digest, compiler digest/version, target (`node` or `web`), Foundation baseline, and bundle root.

Canonical encoding uses UTF-8, normalized `/` paths, sorted nodes and edges, explicit lengths, and no timestamps or host paths. The graph root is a domain-separated SHA-256 Merkle root. Release CI signs the canonical graph root and bundle root. Runtime verifies the signature and every referenced digest before evaluation.

The graph object visible to application code is a deep-frozen data projection without loader hooks. The authoritative runtime graph and resolver tables stay in the trusted bootstrap closure. No application reference points to them.

### Exact three-edge policy

For the Authority Routing Gate module `promoted-legality-port.js`, the only permitted direct edges into the certified Foundation set are exactly:

1. `promoted-legality-port.js -> physical-proof-planner.js`
2. `promoted-legality-port.js -> v3-promotion-foundation.js`
3. `promoted-legality-port.js -> authority-envelope-builder.js`

All three MUST be present once after canonical resolution. Any missing edge, duplicate, alias, alternate path spelling, substituted target, or fourth Gate-to-Foundation edge fails the build. The policy compares resolved canonical node IDs and expected source digests, not source spellings.

Foundation's own closed transitive graph is recorded in full. Every production module that can execute in the compartment, including compiler-injected runtime records, MUST be a graph node. Every resolvable import MUST be an edge. Graph closure is checked from the entry point in both directions: no reachable unmanifested dependency and no executable bundle record absent from the graph.

### Restricted execution boundary

Each evaluation occurs in a dedicated Node Worker or Web Worker. Trusted bootstrap code runs first, verifies the signed graph/bundle, applies SES `lockdown`, creates one new `Compartment`, installs only graph-backed static module records, and then evaluates the fixed entry module.

Endowments are an explicit frozen record of value capabilities needed by the Foundation, such as deterministic data primitives. They exclude `process`, `global`, host `globalThis`, `require`, `module`, `exports`, `Buffer`, filesystem/network APIs, worker constructors, `fetch`, `WebSocket`, timers unless proven necessary, DOM objects, and all host loader or reflection handles. No host object with a prototype or callback path into the bootstrap is endowed.

The import hooks close over an immutable verified resolver table. They accept only the requesting module's canonical ID plus an exact statically declared specifier. A missing pair rejects before target evaluation. Application code cannot obtain either hook. Dynamic import is disabled; if a future gate requires it, it may resolve only a predeclared `(referrer, specifier, target, digest)` edge and must not discover modules.

CommonJS inputs are compiled by the trusted graph compiler to static module records. Static literal `require` sites become per-edge lexical imports. There is no CommonJS host wrapper and no loader argument. If compatibility needs a local `module` value, it is a null-prototype, module-local export cell with no `require`, constructor, filename, parent, children, or cache fields.

## Threat model

### Assets

- byte identity and semantics of the certified Foundation;
- exact three-edge Authority Routing Gate policy;
- completeness and integrity of the executable dependency graph;
- absence of ambient capabilities beyond the graph;
- fail-closed transaction decisions and reproducible evidence.

### Adversary

Treat every application/runtime module in the compartment as hostile. It may use arbitrary valid JavaScript, Unicode escapes, computed properties, prototype traversal, aliases, call/apply/bind, spread, rest parameters, `arguments`, getters, proxies, exceptions, promise scheduling, and constructed strings. It may try graph substitution or tamper with files between build and execution.

The adversary may not compromise the pinned compiler/toolchain, signing key, trusted worker bootstrap, SES implementation, JavaScript engine, OS, browser origin/bootstrap delivery, or Node package/install root of trust. A compromise there is outside this compartment claim and requires release rollback/key revocation, not an application-level fallback.

### Allowed capabilities

- execute the verified entry and its complete declared transitive graph;
- access only explicit immutable endowments;
- call only exports reachable through declared graph edges;
- return structured-cloneable decision/evidence values through a narrow worker protocol.

### Denied capabilities

- discover, name, load, substitute, or evaluate any graph-external module;
- access host Node, browser, DOM, network, filesystem, worker, or loader authority;
- mutate the graph, resolver, policy, verified code records, primordials, or Foundation source;
- pass functions, accessors, proxies, module objects, or host references across the worker boundary;
- treat an audit pass as authority.

### Escape and fail-closed behavior

A build-side violation produces no releasable artifact. A runtime signature, root, digest, graph, policy, target, or bundle mismatch terminates the worker before entry evaluation. A denied import rejects the compartment and yields a fixed host-side `STRUCTURAL_AUTHORITY_REJECTED` result with no transaction mutation. A compartment exception, timeout, resource limit, malformed result, or worker termination has the same rejection effect. No recovery path reruns the code with a host loader or less restrictive evaluator.

The host validates returned data against the existing Foundation decision schema and recomputes required digests. Only an authenticated, schema-valid Foundation `COMMIT_ALLOWED` result can proceed to any later gate. This preflight does not authorize that later connection.

## Implementation choice

Use:

1. A small Rust graph compiler using a pinned ECMAScript parser and a locked resolver implementation. The compiler performs static resolution, exact-edge checking, source hashing, graph closure, deterministic CommonJS-to-static-record lowering, bundle assembly, and evidence emission.
2. SES `lockdown` plus `Compartment` in an isolated worker for both Node and Web. Pin the exact SES source and digest. Run SES's own supported-engine tests for each target engine before accepting a release.
3. Static module records only. No Node `vm` context as a security boundary, no unrestricted `require`, no `import()` discovery, and no `createRequire`.
4. Ed25519 signatures over the domain-separated canonical graph root and bundle root. Node trusts a public key pinned by the installed bootstrap. Web trusts a public key pinned by an integrity-protected bootstrap delivered under the release origin's CSP/SRI policy.

Rejected choices:

- Node's `vm` alone: it is not a capability-security boundary.
- Node Permission Model alone: it limits selected resources but does not define the module graph or remove all ambient recovery paths.
- a source token/identifier blacklist: equivalent spellings and capability reconstruction defeat the claim.
- ordinary bundling alone: a bundle proves packaging, not confinement or exact runtime authority.
- runtime graph generation by application JavaScript: hostile code could influence discovery or mutate authority.

The implementation gate must pin actual compiler, SES, Node, and browser versions only after the hostile proof suite passes. This preflight does not claim an untested version combination.

## Mandatory hostile proof strategy

Each hostile fixture is a real graph module compiled and run in the same artifact format and compartment as production. Tests assert structural unavailability: the attempt cannot obtain a callable loader/host capability, no graph-external module executes, the worker emits the fixed rejection result when appropriate, and a control export proves the fixture itself ran. Tests must not pass because a spelling scanner rejected source text.

Required fixtures include:

- Unicode escapes and concatenated/computed construction of loader names;
- `createRequire` variants, including constructed specifiers and access through aliases;
- computed `module.require`;
- `module.constructor._load` and constructor-chain variants;
- direct and aliased `eval`/`Function`, including constructor reconstruction;
- CommonJS `arguments[1]`;
- `call`, `apply`, and bound aliases;
- `Object.values(arguments)`;
- spread/rest copies of wrapper arguments;
- constructed strings for `constructor`, `process`, `getBuiltinModule`, and `createRequire`;
- direct Node built-in imports and an indirect helper-module escape;
- Web host recovery attempts through `globalThis`, worker construction, `fetch`, DOM prototypes, and exception/prototype chains.

Expected reason: there is no host CommonJS wrapper, loader parameter, host global, import hook reference, or endowed object leading to one. Compartment `eval`/`Function`, if available after SES taming, evaluate in the same powerless compartment. Constructing a denied name produces only a string or `undefined`; it cannot create authority.

The suite must include positive controls showing ordinary computation and every declared Foundation edge still work. A test that merely throws during parsing is insufficient unless unsupported syntax is the documented build rejection under test.

## Required proof matrix

| Proof | Required observation |
| --- | --- |
| Exact three edges | build succeeds; graph contains the three canonical edges once each |
| Fourth edge | build fails with no bundle/signature |
| Graph mutation | frozen public projection rejects; authoritative closure remains unreachable; modified serialized graph fails root/signature verification |
| Unmanifested dependency | build closure check or runtime resolver rejects before module evaluation |
| Dependency substitution | expected node/source digest mismatch rejects |
| Artifact tampering | changed byte fails record and bundle-root verification before evaluation |
| Build/runtime graph mismatch | target/policy/graph/bundle root mismatch terminates worker |
| Direct escape | every hostile direct fixture obtains no capability and loads nothing external |
| Indirect escape | helper/alias/prototype chain obtains no capability and loads nothing external |
| Determinism | two clean builds on separate workers produce byte-identical graph, bundle, roots, and evidence |
| Foundation regression | focused suites twice, broad suite, static boundaries, and existing authority audit remain green |
| Foundation immutability | all six git blob IDs equal baseline; diff from `127f284` is empty for those paths |

Negative tests must fail for the intended structural reason and record stage (`BUILD_GRAPH`, `VERIFY_ARTIFACT`, `CREATE_COMPARTMENT`, `RESOLVE_EDGE`, or `VALIDATE_RESULT`). Mutation and escape fixtures also assert zero host effects and zero transaction mutation.

## Node and Web compatibility

The same canonical source graph and policy feed two target bundles because host bootstraps differ. Target identity is part of the signed graph header, so a Node artifact cannot run as a Web artifact or vice versa.

Node target:

- dedicated `worker_threads` worker;
- ESM bootstrap launched without inheriting application preload hooks;
- no `process`, CommonJS wrapper, builtin-module access, filesystem, network, inspector, or native add-on in the compartment;
- parent sends immutable input bytes and accepts data-only output;
- worker resource and time limits convert exhaustion into rejection.

Web target:

- dedicated module Worker from a release URL pinned by the trusted bootstrap;
- CSP denies unexpected script, worker, connection, and object sources;
- no DOM in the worker and no `fetch`, nested worker, storage, or messaging endpoint except the single data-only parent channel endowed to the trusted bootstrap;
- graph and bundle signatures are verified with Web Crypto before SES/application evaluation.

Compatibility acceptance requires current supported Node LTS and the project's declared Chromium, Firefox, and WebKit versions. Cross-target fixture outputs and canonical decision digests must match. Browser feature absence is a release failure, never permission to use unrestricted script execution.

## Deterministic build strategy

- locked Rust toolchain, dependency lockfile, SES version/digest, container image digest, and build flags;
- clean checkout with no network during graph compilation or bundling;
- repository-relative normalized paths; reject symlinks and case-fold collisions;
- parser and resolver versions included in evidence;
- sorted canonical nodes/edges and deterministic module IDs derived from normalized path plus source digest;
- fixed compression settings or no compression in the authority artifact;
- no timestamps, random IDs, locale, environment paths, filesystem iteration order, or source-map host paths;
- separate clean builders run the complete build; `cmp` graph, bundle, policy result, roots, and evidence before signing;
- signature envelope is separate from deterministic unsigned artifacts because signature implementations may add non-authority metadata.

Rebuilding from the same commit, toolchain, policy, and target must produce identical unsigned bytes. A target change intentionally changes target-bound roots.

## Evidence plan

The implementation gate must publish, for each target:

- source commit, certified baseline, clean-worktree proof, and immutable Foundation blob report;
- compiler source digest, binary digest, toolchain/lock/container identities;
- canonical graph, node/edge inventory, closure report, exact-three-edge policy report, and graph root;
- deterministic bundle, per-record digests, bundle root, signature, and verification transcript;
- endowment inventory and worker/bootstrap/SES digests;
- positive and negative proof-matrix results with stage/reason and zero-effects assertions;
- hostile fixture source digests and behavioral result records;
- two-build byte comparison from independent clean builders;
- Node and Web engine/version matrix plus cross-target decision digest comparison;
- focused Foundation tests twice, broad tests, static boundaries, existing JS audit, and their exact commands/exit codes;
- a machine-readable gate result that is `PASS` only when every required artifact and test is present and green.

The existing JavaScript authority audit remains defense-in-depth. Its success is not used to establish graph closure or compartment security.

## Gate sequence and stop conditions

1. Review and approve this architecture and its trust assumptions.
2. Pin candidate compiler, SES, Node, and browser versions.
3. Implement only the graph compiler, artifact verifier, isolated worker compartment, fixtures, and evidence generator on a new implementation branch.
4. Run independent security review and the complete proof matrix.
5. Only after independent certification may a separate Authority Routing Gate review consider runtime promotion.

HARD STOP and request owner review if any step requires changing a certified Foundation production module, weakening Foundation fail-closed behavior, adding a fourth Gate-to-Foundation edge, exposing a loader/host object, accepting an undeclared dependency, relaxing a failed target, or replacing behavioral proof with a source blacklist.
