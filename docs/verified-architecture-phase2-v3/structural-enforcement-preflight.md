# V3 Structural Enforcement Preflight

Status: design-only preflight. No runtime promotion is authorized by this document.

Certified Foundation baseline: `127f284d78b83f358f076b3ee8f8b56044bcc691`.

## Decision

Do not proceed to implementation. A prerequisite boundary-policy reopen has not been approved or certified, so its immutable baseline commit is currently `UNASSIGNED`. This is an explicit blocker, not a value an implementer may fill. After owner approval and independent certification name a 40-hex `BOUNDARY_POLICY_BASELINE_COMMIT`; only then may reviewers consider a separate implementation gate using a trusted, hermetic graph compiler and a locked-down SES compartment in a dedicated worker. Do not continue the JavaScript spelling/identifier blacklist approach.

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

All security claims in this document are conditional on the integrity of the certified boundary-policy baseline, compiler and reproducible toolchain, signer and key controls, trusted bootstrap and verifier, pinned SES/Endo packages, JavaScript engine, OS, Node install root, browser origin and external Web trust root. Compromise of any one of these invalidates the claim.

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

## Prerequisite certified boundary-policy baseline

The certified Foundation baseline's current immutable policy forbids every production import into the six Foundation modules. On that baseline, adding the proposed three edges correctly makes `tests/clean-runtime/v3-promotion-authority-audit.js` report `FORBIDDEN_INBOUND_FOUNDATION_IMPORT` three times and makes static-boundaries test 4 fail. SES, a bundle, or a compiler cannot override this repository-level rule. Therefore the three edges MUST NOT be implemented on `127f284` and this preflight is not implementation-ready.

Before implementation, a separate owner-approved boundary-policy reopen must be independently delivered and certified. Certification must assign the baseline and all six immutable artifacts below:

- `BOUNDARY_POLICY_BASELINE_COMMIT`: a full 40-hex commit. Current value: `UNASSIGNED`.
- `boundary-policy/baseline.env`: exactly one canonical assignment of the full baseline commit and no other keys.
- `boundary-policy/exact-three-edges.json`: canonical resolved source/target IDs, all three required edges, no wildcard, and expected source blob/digest for each endpoint.
- `boundary-policy/foundation-files.json`: the six certified Foundation paths and their unchanged `127f284` blob IDs.
- `boundary-policy/inbound-import-policy.json`: default-deny policy whose sole production exception is the exact three-edge artifact.
- `boundary-policy/audit-contract.json`: exact commands, expected rule IDs, schema versions, and tool blob/digests for the replacement audit and static suite.
- `boundary-policy/certification.json`: canonical certification envelope, defined below.

`certification.json` MUST contain, in canonical field order: schema version; baseline commit; Foundation baseline; exact SHA-256 of the other five artifacts (`baseline.env` plus four non-certification JSON artifacts); audit-contract root; certification result exactly `PASS`; trusted owner-observation service, conversation ID, message ID, observed timestamp, owner handle, and SHA-256 of the exact UTF-8 owner words; reviewer verified identity/connection ID, reviewer key ID, verdict exactly `PASS`, review timestamp, reviewed baseline/artifact root; and an Ed25519 signature over the domain-separated canonical certification bytes. CI independently retrieves the owner observation from the trusted owner channel, verifies identifier/handle/body digest and that its scoped words approve this boundary reopen, then verifies reviewer identity binding, signature, verdict, and reviewed roots. A reference string, peer claim, copied owner text, unknown signer, or unbound reviewer fails.

`audit-contract.json` MUST contain, in canonical field order: schema version, baseline commit, policy-root digest, ordered audit/static command records, and contract root. Each command record contains command ID, exact argv array (no shell string), working directory, tool path, tool git blob, tool SHA-256, expected exit code, expected result schema, and expected rule IDs/counts. Its root uses the policy canonical/Merkle rules below with domain `V3AUDIT`; `certification.json` signs that root. The baseline commit MUST contain the byte-identical audit contract and all named tools at their declared blobs. CI executes only these argv records from that baseline and hashes results into the certification result.

Those names describe required artifacts, not artifacts present in this branch. `UNASSIGNED`, a missing artifact, a non-ancestor baseline, a changed Foundation blob, or a policy/audit mismatch is a hard stop. The implementation branch must start from the named certified boundary-policy commit, not from this preflight head and not directly from `127f284`. Its CI must run the boundary baseline's audit/static commands. The old `127f284` audit/static suite remains a regression witness for this design-only branch but is not an implementation acceptance suite after the approved policy reopen.

### Executable implementation guard contract

Every future workflow whose changed paths intersect `src/`, implementation `tools/`, runtime tests, structural evidence, bundle/compiler/bootstrap/verifier/policy code, or any Authority Routing branch MUST invoke one versioned guard from the certified baseline before build or test. Required check name: `structural-boundary-policy-guard`; repository branch protection must require it for every structural/routing implementation branch and merge target. A workflow that omits the reusable guard is itself rejected by an organization-level required workflow. This design-only workflow may stay green and MUST be labeled non-authorizing.

The guard reads `boundary-policy/baseline.env`, whose only accepted assignment is `BOUNDARY_POLICY_BASELINE_COMMIT=<40 lowercase hex>`; `UNASSIGNED`, missing, extra keys, or malformed values exit 1. While it is `UNASSIGNED`, any implementation-scope diff or implementation branch exits 1 before other jobs. After assignment the guard MUST:

1. fetch the named commit by object ID from the pinned delivery repository and require it to be an ancestor of `HEAD`;
2. read all six artifacts from that commit, reject worktree overrides, and verify their exact SHA-256 values from a guard-owned digest manifest committed at the same baseline;
3. verify unchanged Foundation blobs against `foundation-files.json` and `127f284`;
4. canonicalize and verify the exact-edge, inbound-policy, audit-contract, certification and digest-manifest chains;
5. independently retrieve and validate owner approval evidence and reviewer identity/signature as specified above;
6. require certification `PASS`, exact baseline/root binding, and no revocation;
7. execute the audit/static argv records from the named baseline and compare exit codes, schema, rule IDs/counts and result digests;
8. emit a signed machine-readable guard result bound to `HEAD`, then allow downstream jobs only through `needs: structural-boundary-policy-guard`.

Future implementation workflows must include the reusable workflow by immutable commit SHA, expose no `continue-on-error`, and make build/sign/release jobs depend on its success. Organization rules must reject edits that narrow its path classifier. The implementation delivery must include a negative CI fixture proving `UNASSIGNED`, absent artifacts, wrong ancestry, artifact substitution, stale owner evidence, bad reviewer signature, command drift, or an uncovered implementation path blocks all downstream jobs. This preflight does not install that future cross-workflow/organization control; therefore it cannot be cited as mechanical implementation authorization.

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

Canonical encoding has one normative primitive set. `u8` is one byte. `u32` is unsigned big-endian. `sha256` is exactly 32 raw bytes. `git20` is exactly 20 raw bytes decoded from a 40-lowercase-hex commit. `text` is `u32(byteLength) || UTF8`; UTF-8 must be shortest-form, valid scalar values, no BOM, and input is not normalized. Canonical identifiers/specifiers are ASCII and reject `NUL`, `\`, empty/dot segments, duplicate separators, absolute paths, percent encoding and traversal. `blob` is `u32(byteLength) || raw bytes`. Target is `text` constrained to exactly `node` or `web`. Other enums are `u8`: format `1=esm, 2=cjs-lowered, 3=synthetic`; policy action `1=allow, 2=deny`. Arrays encode `u32(count)` followed by records. Every count/length is bounded before allocation. Fixed-width values are never wrapped in `text`/`blob`.

### Normative graph schema

| Record | Exact fields, in byte order |
| --- | --- |
| graph header | `text("V3GRAPH:HEADER:v1")`, `text(schemaVersion)`, `text(target)`, `git20(boundaryBaseline)`, `git20(sourceCommit)`, `sha256(policyRoot)`, `sha256(compilerBinary)`, `sha256(transformSet)`, `u32(nodeCount)`, `u32(edgeCount)` |
| dependency | `text(specifier)`, `text(targetModuleId)`, `sha256(targetSource)`, `u8(importKind)` where `1=static-esm, 2=lowered-cjs` |
| node | `text("V3GRAPH:NODE:v1")`, `text(moduleId)`, `sha256(source)`, `u8(format)`, `sha256(transform)`, `sha256(outputRecord)`, `u32(dependencyCount)`, dependencies, `u32(exportNameCount)`, sorted `text(exportName)` values |
| edge | `text("V3GRAPH:EDGE:v1")`, `text(referrerId)`, `text(specifier)`, `text(targetId)`, `sha256(referrerSource)`, `sha256(targetSource)`, `u8(importKind)` |
| graph artifact | `text("V3GRAPH:ARTIFACT:v1")`, `blob(header)`, nodes sorted by raw module-ID bytes as `blob(node)`, edges sorted by `(referrer,specifier,target)` raw bytes as `blob(edge)` |

A dependency appears exactly once in its node table and exactly once as an equal top-level edge. Duplicate node IDs, dependency specifiers per node, export names, or edge triples are invalid. Counts in the header must equal encoded records. Graph Merkle input records are `[header, ...sorted nodes, ...sorted edges]`.

### Normative policy schema

| Record | Exact fields, in byte order |
| --- | --- |
| policy header | `text("V3POLICY:HEADER:v1")`, `text(schemaVersion)`, `git20(boundaryBaseline)`, `sha256(foundationFilesArtifact)`, `sha256(auditContractRoot)`, `u32(ruleCount)` |
| policy rule | `text("V3POLICY:RULE:v1")`, `u8(action)`, `text(referrerId)`, `text(targetId)`, `sha256(referrerSource)`, `sha256(targetSource)` |
| policy artifact | `text("V3POLICY:ARTIFACT:v1")`, `blob(header)`, rules sorted by `(action,referrer,target,referrerSource,targetSource)` raw bytes as `blob(rule)` |

No wildcard or omitted digest exists. Duplicate rules and allow/deny conflicts are invalid. Policy Merkle input records are `[header, ...sorted rules]`. The exact-three artifact has three `allow` records; the inbound policy has a default-deny semantic fixed by schema and those same three exceptions.

### Normative bundle schema

| Record | Exact fields, in byte order |
| --- | --- |
| bundle header | `text("V3BUNDLE:HEADER:v1")`, `text(schemaVersion)`, `text(target)`, `sha256(graphRoot)`, `u32(recordCount)` |
| bundle record | `text("V3BUNDLE:RECORD:v1")`, `text(moduleId)`, `u8(format)`, `blob(recordBytes)`, `sha256(recordBytes)` |
| bundle artifact | `text("V3BUNDLE:ARTIFACT:v1")`, `blob(header)`, records sorted by raw module-ID bytes as `blob(record)` |

Duplicate module IDs, a count mismatch, digest mismatch, or graph/bundle node-set mismatch is invalid. Bundle Merkle input records are `[header, ...sorted records]`.

For each domain `D` in `V3GRAPH`, `V3POLICY`, `V3BUNDLE`, or `V3AUDIT`: leaf `i` is `SHA-256(text(D+":LEAF:v1") || u32(i) || blob(record))`; parent is `SHA-256(text(D+":NODE:v1") || left32 || right32)`. Odd levels duplicate the final hash. Empty roots are `SHA-256(text(D+":EMPTY:v1"))` only where the schema permits an empty record array; graph, policy and bundle reject empty trees. Domains are never interchangeable.

### Normative release schema and vector

Release bytes are exactly: `text("V3RELEASE:v1")`, `sha256(graphRoot)`, `sha256(policyRoot)`, `sha256(bundleRoot)`, `sha256(verifier)`, `text(target)`, `git20(boundaryBaseline)`, `git20(sourceCommit)`, `u32(releaseSequence)`. Signature input is these bytes without another wrapper.

A required machine-readable `boundary-policy/canonical-vectors.json` must carry complete field values, canonical artifact bytes and roots for empty/single/odd/multi-level trees and every rejection case. Minimum concrete zero vector (`target=node`, both commits and all fixed hashes zero, one ESM node `a` with no dependencies/exports, one allow rule `a -> b`, bundle record `a` with byte `0x78`, sequence 1) has:

- graph root `690e769a1fea8c2fd5f374869c50136b2523568059fd5bb794d96a17786e9895`
- policy root `44bc96c81ee4a220fc73dbbc8411bcb9ae382e9422faf86d29e67a041077e207`
- bundle root `474f4629b3d03fe2eceb34c205c2340e598aedcf7e5a8f70521a4a4035d58645`
- release SHA-256 `1a58d516fd384b853a61301e4b54a641de54c1227428ddb0dfaf5141ae6f815f`

The named vector artifact must include the full canonical hex, not only these roots, and must be generated identically by independent Rust and non-Rust reference implementations. Any discrepancy blocks certification.

Release CI signs only the normative release bytes. Runtime reconstructs all canonical bytes from parsed bounded values, verifies roots/signature and then verifies every referenced digest before evaluation.

The graph object visible to application code is a deep-frozen data projection without loader hooks. The authoritative runtime graph and resolver tables stay in the trusted bootstrap closure. No application reference points to them.

### Exact three-edge policy

For the Authority Routing Gate module `promoted-legality-port.js`, the only permitted direct edges into the certified Foundation set are exactly:

1. `promoted-legality-port.js -> physical-proof-planner.js`
2. `promoted-legality-port.js -> v3-promotion-foundation.js`
3. `promoted-legality-port.js -> authority-envelope-builder.js`

All three MUST be present once after canonical resolution. Any missing edge, duplicate, alias, alternate path spelling, substituted target, or fourth Gate-to-Foundation edge fails the build. The policy compares resolved canonical node IDs and expected source digests, not source spellings.

Foundation's own closed transitive graph is recorded in full. Every production module that can execute in the compartment, including compiler-injected runtime records, MUST be a graph node. Every resolvable import MUST be an edge. Graph closure is checked from the entry point in both directions: no reachable unmanifested dependency and no executable bundle record absent from the graph.

### Restricted execution boundary

Each evaluation occurs in a dedicated Node Worker or Web Worker. The record ABI is pinned to Endo `ModuleSource` as exported by `@endo/module-source@1.5.0` and the archive/module descriptor ABI consumed by `@endo/compartment-mapper@2.4.0`; no ad-hoc `ModuleSource` shim is permitted. The compiler emits canonical graph records plus an Endo archive whose parser/record type and import/export tables are compared byte-for-byte with the canonical graph before use. A package API or record-shape change is a build failure requiring a new preflight.

Verified load order is strict: (1) start a minimal trusted worker from pinned bootstrap bytes; (2) clear/reject forbidden launch state; (3) load pinned SES and Endo bytes only from the bootstrap's content-addressed local store; (4) call `lockdown` before parsing or evaluating any application record; (5) verify external trust root, release signature, boundary baseline, target, graph, policy, verifier, archive and every module digest; (6) instantiate the graph-only compartment; (7) install minimal frozen endowments; (8) evaluate the fixed entry; (9) validate and bind the data-only result; (10) return one terminal decision. Any inversion terminates the worker.

Trusted bootstrap code never imports an application-selected path. After verification it never rereads source files, package metadata, environment options, URLs, or mutable archives. It evaluates only the verified in-memory bytes.

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
2. SES `ses@2.3.0` (npm integrity `sha512-qd3iWzDqGKllI2FmExKsWLrJwt+6COWb8jUdzaCn8Cq5OTeoXdQ62Gn/xLy0GWLORC3du6yBAVe/V0B0dLVKew==`, tar SHA-256 `3bf2f4ef5c8e7c725c9acc817dbd70b1fc519e1ef5782402157f3436fb0db5c9`), `@endo/compartment-mapper@2.4.0` (`sha512-tlJH9nbQqHMF6hJ5rYZ8CS9FXEJwufEpVHbhI05vAA/h7Csq3l4QEJZNGiOUSegcQF7HJosljjZXatJ8Ch3dmQ==`, tar SHA-256 `2c2b94f723f8e034c09bfd23f3c5f4dbbeb9eb830a6dc48653fee5b39a7c4070`), and `@endo/module-source@1.5.0` (`sha512-AwoxpkqYlF4jkr8ET8kCp6+Yro0of+rxYwcyeO3Vz+slMB0cnCjk6a/cch48kSvT7xvgIZZCCtVXlaaf6trOrA==`, tar SHA-256 `7788bbf9d92f093a2b267354e320ac906d6c3c48e52a7794ef9136b628e486f3`). Resolve and vendor their complete locked transitive graph. Run SES/Endo self-tests and project hostile probes on every exact engine build; no package declares an npm engine range, so compatibility is established only by these probes.
3. Static module records only. No Node `vm` context as a security boundary, no unrestricted `require`, no `import()` discovery, and no `createRequire`.
4. Ed25519 signatures over the canonical release statement. Production keys are generated inside a non-exportable HSM by a release-security custodian, with signer identity and approved boundary baseline bound into an auditable release authorization. Build operators cannot use the key; security custodians cannot alter artifacts. The HSM policy refuses signing unless two independently built unsigned release statements, every gate result, and source/reviewer authorization match exactly. Dev/test keys live in separate accounts/HSM partitions, have distinct key IDs and trust roots, and cannot verify in production.

The signature envelope records key ID, algorithm, release sequence, source/boundary commits, all roots, signer authorization reference, and transparency-log inclusion proof. Rotation requires an old-key-signed plus offline-recovery-root-approved key transition; emergency revocation comes from an independently hosted signed revocation log. Runtime rejects revoked keys, sequence rollback, unknown successors, expired policy epochs, or a release not bound to the requested target. Rollback is an explicit, separately signed authorization to a named prior release sequence, never acceptance of any older valid signature.

Node pins the production trust root in the separately installed bootstrap package. Web MUST obtain the trust root, minimum release sequence, and revocation state from an independently controlled channel, such as an enterprise-managed browser policy/extension or native shell; origin-hosted bootstrap, artifact, and key alone are insufficient. Until that external Web pin/update mechanism is selected and certified, Web production is blocked.

Rejected choices:

- Node's `vm` alone: it is not a capability-security boundary.
- Node Permission Model alone: it limits selected resources but does not define the module graph or remove all ambient recovery paths.
- a source token/identifier blacklist: equivalent spellings and capability reconstruction defeat the claim.
- ordinary bundling alone: a bundle proves packaging, not confinement or exact runtime authority.
- runtime graph generation by application JavaScript: hostile code could influence discovery or mutate authority.

SES/Endo package versions are pinned above. Exact Node, Chromium, Firefox, WebKit, OS and architecture build IDs remain `UNASSIGNED`; implementation is blocked until the boundary-policy certification names them and engine probes pass. Version changes require re-certification, not a fallback.

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
| Foundation regression | focused suites twice and broad suite remain green; implementation runs the named certified boundary-policy baseline's audit/static suite, while the old baseline suite is retained only as a design-branch witness |
| Foundation immutability | all six git blob IDs equal baseline; diff from `127f284` is empty for those paths |

Negative tests must fail for the intended structural reason and record stage (`BUILD_GRAPH`, `VERIFY_ARTIFACT`, `CREATE_COMPARTMENT`, `RESOLVE_EDGE`, or `VALIDATE_RESULT`). Mutation and escape fixtures also assert zero host effects and zero transaction mutation.

## Node and Web compatibility

The same canonical source graph and policy feed two target bundles because host bootstraps differ. Target identity is part of the signed graph header, so a Node artifact cannot run as a Web artifact or vice versa.

Node target:

- dedicated `worker_threads` worker;
- ESM bootstrap launched by a fixed native/service entry with an explicit empty `execArgv`; reject inherited `--require`, `--import`, `--loader`, policy, permission, inspector/debug and experimental-loader flags, `NODE_OPTIONS`, SES/environment option variables, preload hooks, inspector ports, IPC handles, and application-controlled environment;
- parent supplies no transferable function, port other than the one authenticated protocol port, shared memory, file descriptor, host object, loader object, or callback;
- no `process`, CommonJS wrapper, builtin-module access, filesystem, network, inspector, or native add-on in the compartment;
- parent sends immutable input bytes and accepts data-only output;
- worker resource and time limits convert exhaustion into rejection.

Web target:

- dedicated module Worker whose bootstrap and complete transitive SES/Endo/application bytes are preloaded, content-addressed, signature-verified, and then started with network disabled; no runtime module fetch is permitted;
- CSP denies unexpected script, worker, connection, and object sources; `blob:` and `data:` are denied unless a separately reviewed bootstrap uses a verified, single-use blob URL and revokes it immediately; classic workers and `importScripts` are forbidden;
- no DOM in the worker and no `fetch`, nested worker, storage, or messaging endpoint except the single data-only parent channel endowed to the trusted bootstrap;
- graph and bundle signatures are verified with Web Crypto before SES/application evaluation; the external Web trust root is checked before trusting any origin-delivered verifier or artifact.

Compatibility acceptance requires exact, recorded builds of Node LTS and the project's declared Chromium, Firefox, and WebKit versions. Probes cover lockdown, ModuleSource/archive ABI, strict-mode/evaluator behavior, Unicode parsing, structured clone, worker launch constraints, Web Crypto Ed25519, termination, and all hostile fixtures. Cross-target fixture outputs and canonical decision digests must match. Browser feature absence is a release failure, never permission to use unrestricted script execution.

The parent/worker protocol uses a fresh 256-bit session nonce created by the trusted parent and included in the signed input envelope, monotonically increasing sequence numbers, exactly one request and one terminal response, graph/release/input digests in every frame, and replay rejection. Frames are plain null-prototype data, schema-validated after structured clone, with fixed byte, nesting-depth, collection-count, string-length, and numeric limits; accessors, proxies, shared memory and transferable capabilities are forbidden. The host owns transaction mutation and remains in a non-committing staged state until it validates the single terminal response. Timeout or termination atomically discards the stage; late/duplicate responses cannot race or revive commit.

## Deterministic build strategy

- a dedicated compiler repository and full source commit, Rust channel manifest, `Cargo.lock`, vendored-crate tree digest, compiler flags, target triple, linker binary/digest, sysroot, container/Dockerfile source and image digest. All are currently `UNASSIGNED`; implementation is blocked until an owner-approved compiler preflight assigns them;
- pin parser, resolver and CommonJS lowering crates by source commit and crate digest. Differential fixtures must prove Node CommonJS semantics needed by every frozen Foundation module: resolution, cycles, export aliasing/reassignment, evaluation order, strictness, top-level `this`, error timing and cache identity. Unsupported behavior fails build; no compatibility shim may add loader authority;
- locked SES/Endo package tarballs and complete transitive dependency lock/vendor digests, exact engine build IDs, and build flags;
- clean checkout with no network during graph compilation or bundling;
- repository-relative normalized paths; reject symlinks and case-fold collisions;
- parser and resolver versions included in evidence;
- sorted canonical nodes/edges and deterministic module IDs derived from normalized path plus source digest;
- fixed compression settings or no compression in the authority artifact;
- no timestamps, random IDs, locale, environment paths, filesystem iteration order, or source-map host paths;
- two administratively independent builders start from separately reproduced compiler binaries built from the pinned compiler source, lockfile, vendored crates and toolchain. They run in separate accounts/runners and independently fetch content-addressed frozen inputs. Using the same prebuilt compiler binary is not independent. `cmp` must match compiler binary, graph, bundle, policy result, roots, vectors and evidence before the signing request can exist;
- every source input, compiler source/binary, policy artifact, graph, bundle, bootstrap, verifier, SES/Endo archive and unsigned/signed release statement is stored under its digest with retention lock. Runtime consumes verified in-memory bytes and never rereads mutable sources;
- signature envelope is separate from deterministic unsigned artifacts because signature implementations may add non-authority metadata.

Rebuilding from the same commit, toolchain, policy, and target must produce identical unsigned bytes. A target change intentionally changes target-bound roots.

## Evidence plan

The implementation gate must publish, for each target:

- source commit, certified baseline, clean-worktree proof, and immutable Foundation blob report;
- compiler repository/commit, two independently reproduced binary digests, parser/resolver/lowering pins, Rust manifest, `Cargo.lock`, vendor tree, linker/sysroot/target, container source/image, and CommonJS semantic differential results;
- canonical graph, node/edge inventory, closure report, exact-three-edge policy report, and graph root;
- exact canonical grammar vectors, deterministic bundle, per-record digests, graph/policy/bundle roots, release statement, HSM signature, signer authorization and transparency proof, key lifecycle state, and verification transcript;
- endowment inventory; worker/bootstrap/verifier/SES/Endo and transitive package digests; exact ABI and Node/browser/OS build probes; Node launch-state and Web external-root/no-network evidence; parent-channel protocol tests;
- positive and negative proof-matrix results with stage/reason and zero-effects assertions;
- hostile fixture source digests and behavioral result records;
- two-build byte comparison from independent clean builders;
- Node and Web engine/version matrix plus cross-target decision digest comparison;
- focused Foundation tests twice, broad tests, static boundaries, existing JS audit, and their exact commands/exit codes;
- a machine-readable gate result that is `PASS` only when every required artifact and test is present and green.

The existing JavaScript authority audit remains defense-in-depth. Its success is not used to establish graph closure or compartment security.

## Gate sequence and stop conditions

1. Obtain owner approval for a separate boundary-policy reopen; independently certify it and replace `UNASSIGNED` with its immutable 40-hex commit plus the six named policy/certification artifacts.
2. Run that baseline's named audit/static suite and prove exactly the three policy edges are allowed while all others remain denied.
3. Approve compiler provenance/reproducibility, signing/key controls, external Web root, SES/Endo ABI, exact engine builds, and protocol limits.
4. Implement only the graph compiler, artifact verifier, isolated worker compartment, fixtures, and evidence generator on a new implementation branch.
5. Run independent security review and the complete proof matrix.
6. Only after independent certification may a separate Authority Routing Gate review consider runtime promotion.

HARD STOP and request owner review if the boundary baseline remains `UNASSIGNED` or uncertified, its artifacts/suite are absent, any step requires changing a certified Foundation production module, weakening Foundation fail-closed behavior, adding a fourth Gate-to-Foundation edge, exposing a loader/host object, accepting an undeclared dependency, relaxing a failed target, or replacing behavioral proof with a source blacklist.
