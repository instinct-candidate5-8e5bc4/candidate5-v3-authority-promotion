# V3 Structural Enforcement Preflight

Status: design-only preflight. No runtime promotion is authorized by this document.

Certified Foundation baseline: `127f284d78b83f358f076b3ee8f8b56044bcc691`.

## Decision

Do not proceed to implementation. A prerequisite boundary-policy reopen has not been approved or certified, so both immutable roles, `BOUNDARY_POLICY_ARTIFACT_COMMIT` and `BOUNDARY_POLICY_CERTIFICATION_COMMIT`, are currently `UNASSIGNED`. This is an explicit blocker, not a value an implementer may fill. After owner approval and independent certification name both 40-hex commits; only then may reviewers consider a separate implementation gate using a trusted, hermetic graph compiler and a locked-down SES compartment in a dedicated worker. Do not continue the JavaScript spelling/identifier blacklist approach.

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

Before implementation, a separate owner-approved boundary-policy reopen must be independently delivered and certified. The prerequisite commit contains this acyclic certified set:

- `boundary-policy/root.json`: hashes the six unsigned child artifacts below; never itself or the detached signature.
- `boundary-policy/exact-three-edges.json`
- `boundary-policy/foundation-files.json`
- `boundary-policy/inbound-import-policy.json`
- `boundary-policy/audit-contract.json`
- `boundary-policy/certification-payload.json`: unsigned owner/reviewer assertions.
- `boundary-policy/canonical-vectors.json`
- `boundary-policy/certification.sig`: added only by the later certification commit; detached Ed25519 signature over the root binding, not hashed by `root.json`.
- `boundary-policy/certification-attestation.json`: added only by the later certification commit; names the finalized artifact commit/tree/root and signature/key identity, and never names its own containing certification commit.

`BOUNDARY_POLICY_ARTIFACT_COMMIT` and `BOUNDARY_POLICY_CERTIFICATION_COMMIT` are currently `UNASSIGNED`. They are distinct, ordered roles. The artifact commit contains `root.json` plus the six unsigned children, but not `certification.sig`; none of those files contains the artifact commit ID or a future certification commit ID. `root.json` canonical fields are schema, immutable Foundation parent/source commit `127f284`, artifact tree root (`git write-tree` object ID), and ordered SHA-256 values of exact-edges, Foundation-files, inbound-policy, audit-contract, certification-payload and vectors. To avoid tree self-reference, the artifact tree root is supplied to canonical root construction by the guard and is not stored as a literal inside `root.json`; `root.json` uses the fixed marker `EXTERNAL_ARTIFACT_TREE_OID`.

A later certification commit has the artifact commit as its first parent and adds only `boundary-policy/certification.sig` plus an attestation naming the already-final artifact commit/tree/root. The signature signs `text("V3CERT:v3") || git20(artifactCommit) || git20(artifactTree) || sha256(rootCanonicalBytesWithExternalTreeSubstitution) || git20(foundationParent)`. Neither the signature nor certification commit ID is an input to the artifact commit. `BOUNDARY_POLICY_CERTIFICATION_COMMIT` is assigned only after that commit exists and is held externally by the guard/ruleset configuration; it is not written into either commit. This two-commit sequence is conventionally constructible and acyclic.

Artifact commit construction is exact: its first parent MUST equal the named immutable Foundation/boundary source commit, initially `127f284d78b83f358f076b3ee8f8b56044bcc691`; its tree MUST equal that parent tree plus only the seven artifact-commit files under `boundary-policy/` named above, with no modification, deletion, rename, mode change, symlink, submodule, or other path. The guard proves `git rev-parse artifact^1 == sourceCommit`, compares full recursive trees/modes, and rejects merge commits or any extra delta. The later certification commit's first parent MUST equal the artifact commit and its tree delta MUST add only `certification.sig` and `certification-attestation.json`.

`root.json` has an exact closed JSON schema with nine keys: `schemaVersion` (`"v3-boundary-root/1"`), `foundationParent` (40 lowercase hex), `artifactTree` (literal `"EXTERNAL_ARTIFACT_TREE_OID"`), and six 64-lowercase-hex fields `exactEdgesSha256`, `foundationFilesSha256`, `inboundPolicySha256`, `auditContractSha256`, `certificationPayloadSha256`, `canonicalVectorsSha256`. RFC 8785/JCS is the sole byte-order rule: keys occur in lexicographic UTF-16/ASCII order exactly `artifactTree`, `auditContractSha256`, `canonicalVectorsSha256`, `certificationPayloadSha256`, `exactEdgesSha256`, `foundationFilesSha256`, `foundationParent`, `inboundPolicySha256`, `schemaVersion`. Duplicate, missing, extra, non-JCS order/escaping/whitespace, non-ASCII, or non-shortest UTF-8 input is rejected. Hashes decode from hex to raw32.

The exact zero marker-form repository bytes are 687 UTF-8 bytes with no BOM or trailing newline:

```json
{"artifactTree":"EXTERNAL_ARTIFACT_TREE_OID","auditContractSha256":"0000000000000000000000000000000000000000000000000000000000000000","canonicalVectorsSha256":"0000000000000000000000000000000000000000000000000000000000000000","certificationPayloadSha256":"0000000000000000000000000000000000000000000000000000000000000000","exactEdgesSha256":"0000000000000000000000000000000000000000000000000000000000000000","foundationFilesSha256":"0000000000000000000000000000000000000000000000000000000000000000","foundationParent":"0000000000000000000000000000000000000000","inboundPolicySha256":"0000000000000000000000000000000000000000000000000000000000000000","schemaVersion":"v3-boundary-root/1"}
```

Exact UTF-8 hex: `7b22617274696661637454726565223a2245585445524e414c5f41525449464143545f545245455f4f4944222c226175646974436f6e7472616374536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c2263616e6f6e6963616c566563746f7273536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c2263657274696669636174696f6e5061796c6f6164536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c2265786163744564676573536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c22666f756e646174696f6e46696c6573536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c22666f756e646174696f6e506172656e74223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030222c22696e626f756e64506f6c696379536861323536223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c22736368656d6156657273696f6e223a2276332d626f756e646172792d726f6f742f31227d`.

The signature does not sign JSON reserialization. The guard parses the closed marker JSON, validates its bytes equal JCS output, then emits root canonical bytes directly as: `text("V3BOUNDARYROOT:v1") || text(schemaVersion) || git20(foundationParent) || u8(treeForm) || treeValue || sha256(exactEdges) || sha256(foundationFiles) || sha256(inboundPolicy) || sha256(auditContract) || sha256(certificationPayload) || sha256(canonicalVectors)`. Marker form uses `treeForm=0` and `treeValue=text("EXTERNAL_ARTIFACT_TREE_OID")`; substituted form uses `treeForm=1` and `treeValue=git20(finalArtifactTree)`. Substitution changes only these 27 marker bytes into 20 raw OID bytes after validation; it never inserts 40 hex characters or rewrites JSON. Zero vectors are:

- marker bytes (286 bytes): `000000115633424f554e44415259524f4f543a76310000001276332d626f756e646172792d726f6f742f310000000000000000000000000000000000000000000000001a45585445524e414c5f41525449464143545f545245455f4f4944000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`
- substituted bytes with raw20 zero tree (276 bytes): `000000115633424f554e44415259524f4f543a76310000001276332d626f756e646172792d726f6f742f310000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`

The dependency chain is acyclic: Foundation parent -> six unsigned children -> finalized artifact tree/commit -> root bytes with externally substituted finalized tree OID -> detached signature/attestation -> later certification commit -> external guard pins both commit IDs. Policy binds only Foundation/exact-edge roots. Audit binds computed policy root. No artifact-commit file names its containing commit. No certification file signs or names its containing certification commit.

`audit-contract.json` contains schema, baseline, computed policy root, ordered command records, expected results and audit root. Each command has ID, exact argv, working directory, tool path/git blob/SHA-256, expected exit/schema/rule IDs/counts/result digest. Audit root uses `V3AUDIT`.

`certification-payload.json` contains schema; Foundation parent/source commit and the literal role marker `ARTIFACT_COMMIT_BOUND_EXTERNALLY` (not a final containing commit ID); policy/audit/vectors roots; result `PASS`; owner approval record; owner checkpoint; reviewer identity/key/verdict/timestamp/reviewed roots; revocation-log namespace/checkpoint; and control-infrastructure identifiers. Owner approval records trusted service, conversation/message IDs, timestamp, handle and exact body SHA-256. The guard independently retrieves and checks scoped approval. A peer claim or copied text fails.

Owner evidence and revocation are fail-closed. The trusted-channel adapter has a public key pinned in the independently installed guard. It signs `text("V3OWNER-CHECKPOINT:v1") || text(accountNamespace) || text(conversationId) || u64(providerSequence) || text(providerCursor) || u64(observedUnixMs) || sha256(orderedMessages)`. Sequence namespace is the stable provider account/conversation pair. The guard uses a trusted clock from two pinned authenticated time sources and requires agreement within 30 seconds. At guard completion, checkpoint age must be at most 5 minutes. It reads from approval through provider-confirmed end-of-stream and rejects later matching owner revocation/restriction, ambiguous order, deletion/change, cursor or sequence rollback, incomplete page, unavailable adapter/time source, stale checkpoint, or signature/key mismatch.

The independently hosted revocation service has a separate offline-root-authorized signing key pinned in the guard. It signs `text("V3REVOCATION:v2") || text(repositoryId) || git20(artifactCommit) || git20(certificationCommit) || u64(pinConfigSequence) || sha256(pinTupleBytes) || sha256(certificationRoot) || u64(sequence) || u64(issuedUnixMs) || u64(expiresUnixMs) || sha256(entries)`. Namespace is `(repositoryId, artifactCommit, certificationCommit, pinConfigSequence, pinTupleDigest, certificationRoot)`. The minimum accepted revocation sequence and pin-tuple sequence/digest are stored in the installed guard's append-only transparency checkpoint, every guard result, and the signed release metadata; use the greater value. Max checkpoint age is 5 minutes and expiry may not exceed issue time by 10 minutes. Missing, stale, expired, rolled-back, equivocating, unknown-key or unavailable state fails.

### Atomic external pin state

The two commit IDs are one authenticated atomic configuration, never two environment variables. Central guard configuration stores a signed tuple with exact bytes: `text("V3BOUNDARYPINS:v1") || text(repositoryId) || u64(configSequence) || git20(sourceCommit) || git20(artifactCommit) || git20(certificationCommit) || git20(artifactTree) || sha256(rootSubstitutedBytes) || u64(issuedUnixMs)`. An offline-root-authorized configuration key, distinct from release/revocation keys and pinned in the installed guard, signs it. The tuple is published as one immutable transparency-log entry and one atomic object; readers fetch by digest, verify signature/inclusion, and use all fields from that object. Partial fields or mixed sequences cannot exist in the API.

The installed guard carries an append-only minimum `configSequence`; release metadata and revocation state also carry it, and verification uses the greatest observed floor. Updates require sequence +1, correct first-parent/tree equations, fresh approval/review and a new signed tuple. Rollback requires a separate offline recovery signature naming current sequence/digest and target sequence/digest; it publishes a new higher sequence, never lowers the floor. Tests cover atomic replacement, torn/mixed reads, replay of both old pins together, sequence skip/rollback, equivocation, wrong repository/source/tree/root and recovery rollback.

### Zero-cost external certification authority

GitHub Free, repository refs, merge state, branch settings and GitHub Actions are untrusted publication/convenience surfaces. They MAY run defense-in-depth checks and display results, but they never grant authority. No paid plan, organization migration, protected environment, required workflow or ruleset is a prerequisite. Administrator action, branch protection failure, a green/forged check, merge, tag or moved ref cannot change the certified verdict.

The zero-cost external verifier/guard, named `structural-boundary-policy-guard` in evidence, is installed with the certified runtime baseline rather than enforced by GitHub. The sole authority predicate is `CERTIFICATION_VALID`. A candidate is authorized only when a separately installed verifier, whose binary and trust roots are part of the certified runtime baseline, validates this complete external chain from content-addressed bytes:

`deterministic external certification -> signed artifact/root -> atomic pin tuple -> certified runtime baseline`.

The verifier receives no authority from GitHub APIs. It fetches repository objects only as untrusted bytes by exact object ID, reconstructs every digest locally, retrieves the signed pin/revocation/checkpoint state from independently hosted append-only stores, and compares it with its locally pinned rollback floors. Runtime evaluation accepts only an in-memory `CERTIFICATION_VALID` capability minted by this verifier for one exact candidate digest and session. A boolean/string supplied by application code, CI, GitHub, an admin, a file in the candidate, or a moved ref is not this capability.

The atomic pin tuple and signed certification MUST bind all of:

- repository identity: immutable provider namespace plus repository numeric/global ID, not owner/name alone;
- candidate identity: source commit, complete source tree, target, candidate artifact root and release sequence;
- Foundation baseline exactly `127f284d78b83f358f076b3ee8f8b56044bcc691` plus all six unchanged Foundation blob IDs;
- artifact commit, artifact tree, certification commit and certification root;
- exact graph, bundle, policy and audit roots;
- compiler source/binary, parser/resolver/lowering, toolchain/lock/vendor/container/linker/target and verifier/runtime-bootstrap identities;
- exact ordered test-suite contract, test inputs, expected results and independently reproduced result roots;
- pin configuration sequence/digest, minimum accepted sequence and rollback authorization floor;
- revocation namespace, key, sequence, checkpoint digest, issue/expiry and minimum accepted sequence;
- certified runtime baseline identity: verifier binary, trusted keys, clock sources, transparency/revocation stores, SES/Endo/engine/OS target and protocol version.

The external certifier accepts two administratively independent deterministic builds and test runs, requires byte-identical compiler, graph, policy, bundle, evidence and release roots, then signs only the exact certification/artifact binding already defined. Signing and runtime verification are performed outside GitHub-hosted application JavaScript and outside repository-controlled CI. Free CI may reproduce the work, but its result is informational.

Verdict is closed:

```
CERTIFICATION_VALID = signatureValid
  && completeBindingsMatch
  && deterministicReproductionMatches
  && testContractAndResultsMatch
  && pinSequenceAtOrAboveFloor
  && revocationStateFreshAndNotRevoked
  && ownerCheckpointFreshAndUnrevoked
  && runtimeBaselineMatches

otherwise NOT_AUTHORIZED
```

Missing, stale, malformed, unsigned, untrusted-key, revoked, mismatched, unreproducible, ambiguous, unavailable or rolled-back input yields `NOT_AUTHORIZED`. There is no warning mode, CI fallback, cached-green fallback, previous-ref fallback or admin override. `NOT_AUTHORIZED` terminates before compartment creation and before any transaction can commit.

### Governance-independence hostile proofs

A future certification gate MUST execute each proof against the real verifier/runtime boundary and show the exact candidate receives `NOT_AUTHORIZED`, zero compartment evaluation, zero transaction mutation and no releasable runtime artifact:

| Hostile state | Required proof |
| --- | --- |
| merge or green CI without valid certification | merge commit and genuinely green Free CI exist; certification absent/invalid; verifier returns `NOT_AUTHORIZED` |
| forged CI | fabricated check/status/artifact says green; bound external roots do not match; `NOT_AUTHORIZED` |
| moved ref | branch/tag is force-moved to attacker commit while pin tuple stays fixed; exact-object verification rejects; `NOT_AUTHORIZED` |
| stale certification | owner, clock, pin or revocation checkpoint exceeds its max age/expiry; `NOT_AUTHORIZED` |
| rollback/replay | old but correctly signed artifact, tuple or certification is replayed below either monotonic floor; `NOT_AUTHORIZED` |
| SHA mismatch | one source/artifact/evidence byte changes; local recomputation differs; `NOT_AUTHORIZED` |
| substitutions | artifact commit, certification commit, graph root or compiler/toolchain identity is independently substituted; each binding mismatch is `NOT_AUTHORIZED` |
| revoked certification | fresh signed revocation entry names both commits and tuple; verifier returns `NOT_AUTHORIZED` |
| admin bypass | repository admin disables checks, pushes directly, rewrites branches/tags or publishes a release; external verifier ignores governance state and returns `NOT_AUTHORIZED` without valid chain |
| governance outage | GitHub controls are absent, branches unprotected, CI unavailable or repository is still user-owned; exact signed external chain alone determines verdict; absence cannot create `CERTIFICATION_VALID` |

Positive control: the exact independently reproduced candidate with fresh, valid, non-revoked chain and matching certified runtime baseline receives one session-bound `CERTIFICATION_VALID` capability. Mutating any bound field after minting invalidates the session digest and yields `NOT_AUTHORIZED`.

GitHub Free CI remains useful for fast regressions, publication visibility and independent reproduction hints. Its workflow must label itself `design only - non-authorizing`, publish the exact head it tested, and never emit or store the production certification key/capability. CI success is not included in the authority predicate.

This design amendment is non-authorizing. Both commit roles remain `UNASSIGNED`; compiler/runtime identities and external key/store/clock infrastructure remain unassigned. No implementation, routing, merge or runtime promotion may begin until a separate gate supplies and independently certifies them.

## Exact trust boundaries

### Trusted build boundary

Trusted:

- a pinned Rust graph compiler, built from a locked toolchain and dependency lockfile;
- the clean source checkout at the certified baseline plus explicitly reviewed Authority Routing Gate additions;
- the exact-edge policy file;
- deterministic bundling and canonicalization;
- the external certification signing key, held outside GitHub and repository-controlled CI;
- deterministic external certifiers that record compiler, policy, graph, bundle, source and test identities.

GitHub/CI are explicitly untrusted for authority. Their outputs are candidate evidence that external certification must reproduce and bind independently.

The compiler parses every production module with a real ECMAScript parser. It resolves imports using a fixed, repository-relative resolver. It never executes application code to discover dependencies. Parse ambiguity, unsupported syntax, resolver ambiguity, symlink escape, case collision, package export ambiguity, dynamic dependency expression, native add-on, or generated-at-runtime module is a build failure.

Untrusted inside this boundary: source text, package metadata supplied by the application, code-generation directives, and dependency names. They are inputs, not instructions to the compiler.

### Graph authority boundary

The canonical graph is the sole module authority for the compartment. Each node records normalized module ID, source SHA-256, format, ordered dependency specifiers, resolved target IDs, transform identity, and output record SHA-256. The graph header records schema version, policy root, compiler/transform identities, target, boundary baseline and source commit. It deliberately omits the bundle root. The acyclic runtime chain is `policyRoot -> graphRoot -> bundleRoot -> release signature`: policy is computed first, graph binds policy, bundle binds graph, and release binds all three.

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
| policy header | `text("V3POLICY:HEADER:v1")`, `text(schemaVersion)`, `git20(boundaryBaseline)`, `sha256(foundationFilesArtifact)`, `sha256(exactThreeEdgesArtifact)`, `u32(ruleCount)` |
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

A required machine-readable `boundary-policy/canonical-vectors.json` is part of the certified set and hashed by `root.json`. It contains field values, complete canonical hex and roots. The minimum vector fixes: graph schema `v3-graph/1`; policy schema `v3-policy/1`; bundle schema `v3-bundle/1`; target `node`; the vector-only boundary/source commit fields, Foundation/exact-edge/compiler/transform/verifier/audit/vector hashes all zero; one ESM node `a` with no dependencies/exports; one allow rule `a -> b`; one bundle record `a` containing `0x78`; sequence 1. Policy is computed first; its computed root enters the graph header; computed graph root enters bundle header; computed roots enter release.

```json
{
  "values": {
    "graphSchemaVersion": "v3-graph/1",
    "policySchemaVersion": "v3-policy/1",
    "bundleSchemaVersion": "v3-bundle/1",
    "target": "node",
    "boundaryBaselineHex": "0000000000000000000000000000000000000000",
    "sourceCommitHex": "0000000000000000000000000000000000000000",
    "foundationRootHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "exactEdgesRootHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "compilerBinaryHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "transformSetHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "verifierHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "auditRootHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "vectorsRootHex": "0000000000000000000000000000000000000000000000000000000000000000",
    "releaseSequence": 1
  },
  "policyArtifactHex": "000000145633504f4c4943593a41525449464143543a76310000007d000000125633504f4c4943593a4845414445523a76310000000b76332d706f6c6963792f31000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000005f000000105633504f4c4943593a52554c453a7631010000000161000000016200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "policyRootHex": "44bc96c81ee4a220fc73dbbc8411bcb9ae382e9422faf86d29e67a041077e207",
  "graphArtifactHex": "00000013563347524150483a41525449464143543a7631000000bb00000011563347524150483a4845414445523a76310000000a76332d67726170682f31000000046e6f64650000000000000000000000000000000000000000000000000000000000000000000000000000000044bc96c81ee4a220fc73dbbc8411bcb9ae382e9422faf86d29e67a041077e207000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000810000000f563347524150483a4e4f44453a76310000000161000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "graphRootHex": "a2f53978d0d1210bdd16d3f7b31c98cc83aff43beb7d87498cc002dc55a82b04",
  "bundleArtifactHex": "00000014563342554e444c453a41525449464143543a76310000005100000012563342554e444c453a4845414445523a76310000000b76332d62756e646c652f31000000046e6f6465a2f53978d0d1210bdd16d3f7b31c98cc83aff43beb7d87498cc002dc55a82b04000000010000004100000012563342554e444c453a5245434f52443a763100000001610100000001782d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881",
  "bundleRootHex": "df58f63a9d410d35f21b3d73295705fb2a9cda430abad6e018e71021fb3ef21d",
  "releaseBytesHex": "0000000c563352454c454153453a7631a2f53978d0d1210bdd16d3f7b31c98cc83aff43beb7d87498cc002dc55a82b0444bc96c81ee4a220fc73dbbc8411bcb9ae382e9422faf86d29e67a041077e207df58f63a9d410d35f21b3d73295705fb2a9cda430abad6e018e71021fb3ef21d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000046e6f64650000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
  "releaseSha256Hex": "b7b9da67513ac475832bb37f94e1f8151a76c9610180d3ee97d7e5f1bdc0866f"
}
```

The complete Merkle vectors below use raw record hex `61`, `62`, `63`, `64`; empty values exercise the defined empty hash even though graph/policy/bundle artifacts reject empty record sets.

```json
{
  "V3GRAPH": {
    "empty": {
      "recordsHex": [],
      "rootHex": "9e50018a4c1e260f08c985cc8c0c956678a383e06c95e9bdc7842679c7356b2a"
    },
    "single": {
      "recordsHex": [
        "61"
      ],
      "rootHex": "38acb3f63d9fbfe94538c9ab344f39a0c2ff8a3d5d46f2741d09c7dfc4326ecc"
    },
    "odd": {
      "recordsHex": [
        "61",
        "62",
        "63"
      ],
      "rootHex": "1ae0ad23df23de2b160e8044cc83e52c636e0416a0dada94549d28d4a6fcf8f9"
    },
    "multi": {
      "recordsHex": [
        "61",
        "62",
        "63",
        "64"
      ],
      "rootHex": "66458dd0549f0f8e20b2180940c1b7b8150179cc5ea5847ac47667f165005908"
    }
  },
  "V3POLICY": {
    "empty": {
      "recordsHex": [],
      "rootHex": "9cfae1cb720d41d9e7a86f1b95ba2305338c3c12a1b5ed93d284421dff08732c"
    },
    "single": {
      "recordsHex": [
        "61"
      ],
      "rootHex": "2c378ede32479527b9bbbe9304cefc9ae3ebc34bcbcce8136b4f073b3b8895db"
    },
    "odd": {
      "recordsHex": [
        "61",
        "62",
        "63"
      ],
      "rootHex": "add93892d38a955e73223e94a6883ef04aa176744e9c78d626d5b3192e38f5cd"
    },
    "multi": {
      "recordsHex": [
        "61",
        "62",
        "63",
        "64"
      ],
      "rootHex": "c34857a63744e2f49d3f1eccea1ba089dac6dcb2cc30bbac0217c9f96884418f"
    }
  },
  "V3BUNDLE": {
    "empty": {
      "recordsHex": [],
      "rootHex": "88a3cf0f5e6bc4f1ce7cabe59fd120c5fd585e0c9e1ebbb98fe02516f111aa32"
    },
    "single": {
      "recordsHex": [
        "61"
      ],
      "rootHex": "8d3eeec6e7c58a976a58769ea6283e5d065ecad69cdd266cac190d18f515ed36"
    },
    "odd": {
      "recordsHex": [
        "61",
        "62",
        "63"
      ],
      "rootHex": "6623f6a03dfaffcb3bf541c0649871da8b9a7d58d3ae691b4a07eebbbce52f29"
    },
    "multi": {
      "recordsHex": [
        "61",
        "62",
        "63",
        "64"
      ],
      "rootHex": "7cf04bb053b06817fd10e1391b691fc69e4eb199a2492fda40e35a88d1d702c9"
    }
  },
  "V3AUDIT": {
    "empty": {
      "recordsHex": [],
      "rootHex": "2bc052a839f690206dfe135610122646040b7a1faa77035697fafd1b74fced77"
    },
    "single": {
      "recordsHex": [
        "61"
      ],
      "rootHex": "2759e29bc786e1286175d8170ddf2514ef3f380821bddb649a97adf0c7b34511"
    },
    "odd": {
      "recordsHex": [
        "61",
        "62",
        "63"
      ],
      "rootHex": "32564d21e6af533fdb336976381144fccabbbd9116d187f169d194a574c350b8"
    },
    "multi": {
      "recordsHex": [
        "61",
        "62",
        "63",
        "64"
      ],
      "rootHex": "598fb3ecaaf8667ed1d50afce0c162995681d7de792096ac7f5c28456b3a6a56"
    }
  }
}
```

Executable rejection vectors are canonical inputs with exact expected codes:

| Input hex / construction | Expected code |
| --- | --- |
| `text` length `00000002` followed by overlong UTF-8 `c0af` | `NON_CANONICAL_UTF8` |
| identifier bytes `2e2e2f61` (`../a`) | `NON_CANONICAL_ID` |
| two equal node blobs in one graph | `DUPLICATE_NODE_ID` |
| node dependency `x -> b` without equal edge | `DEPENDENCY_EDGE_MISMATCH` |
| header nodeCount `00000002` with one node | `COUNT_MISMATCH` |
| empty graph records | `EMPTY_GRAPH` |
| policy allow and deny for same tuple | `POLICY_CONFLICT` |
| bundle record hash all zero for record byte `78` | `RECORD_DIGEST_MISMATCH` |
| bundle header containing a nonmatching graph root | `GRAPH_BUNDLE_MISMATCH` |
| release target `web` with graph target `node` | `TARGET_MISMATCH` |
| certification signature bytes included in root child list | `CERTIFICATION_CYCLE_FORBIDDEN` |

`canonical-vectors.json` must reproduce these exact values and codes; the guard executes all of them. Independent Rust and non-Rust implementations must match full bytes, roots and failures.

The external certifier signs only the normative release bytes. GitHub CI cannot sign them. Runtime reconstructs all canonical bytes from parsed bounded values, verifies roots/signature and then verifies every referenced digest before evaluation.

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
4. Ed25519 signatures over the canonical release statement. Production keys are generated inside a non-exportable HSM by a release-security custodian, with signer identity and approved boundary baseline bound into an auditable release authorization. Build operators cannot use the key; security custodians cannot alter artifacts. The external HSM policy refuses signing unless two independently built unsigned release statements, every gate result, and source/reviewer authorization match exactly; GitHub CI cannot invoke this production key. Dev/test keys live in separate accounts/HSM partitions, have distinct key IDs and trust roots, and cannot verify in production.

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

1. Obtain owner approval for a separate boundary-policy reopen; independently certify it and replace both `UNASSIGNED` roles with immutable 40-hex artifact and certification commit IDs plus the named boundary artifacts.
2. Run that baseline's named audit/static suite and prove exactly the three policy edges are allowed while all others remain denied.
3. Approve compiler provenance/reproducibility, external certification/verifier and key/store/clock controls, governance-independence hostile proofs, external Web root, SES/Endo ABI, exact engine builds, and protocol limits.
4. Implement only the graph compiler, artifact verifier, isolated worker compartment, fixtures, and evidence generator on a new implementation branch.
5. Run independent security review and the complete proof matrix.
6. Only after independent certification may a separate Authority Routing Gate review consider runtime promotion.

HARD STOP and request owner review if either boundary commit role remains `UNASSIGNED` or uncertified, its zero-cost external certification/verifier controls, nine two-commit files, or suite are absent, any step requires changing a certified Foundation production module, weakening Foundation fail-closed behavior, adding a fourth Gate-to-Foundation edge, exposing a loader/host object, accepting an undeclared dependency, relaxing a failed target, or replacing behavioral proof with a source blacklist.
