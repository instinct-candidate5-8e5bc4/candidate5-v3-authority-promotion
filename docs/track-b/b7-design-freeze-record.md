# B7 DESIGN FREEZE - engine-in-browser integration

Status: FROZEN 2026-09-24 after Yael's fresh authenticated approval (WhatsApp
08:13:53 IDT: "כל מה שיוני מבקש לאשר לו!!!!"). Base SHA:
7cd96d366948366e0aeda099d96bf3e0fa1d0f91 (branch candidate5-track-b-visual-slice;
B7 lands as a new fast-forward via the patch -> main-verify -> publisher pattern).

## Locked wording (two distinct layers)

1. "Semantic integrity verified against certified digests at runtime."
   Runtime digests assert VALUE integrity only: package
   187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec, world
   fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea, descriptor
   5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18, plus
   replayMatchesCommittedState===true and browser-descriptor === Node-descriptor
   for the same tree. NEVER claim runtime byte assurance: JSON-semantics-
   preserving byte changes (whitespace, key order) provably do not diverge
   these digests (experiment 2026-09-23).
2. "Byte-exact source identity enforced at build time against pinned raw-file
   hashes." The build reads checkout bytes and fails closed on ANY byte
   difference, including whitespace and key order.

## Raw-byte pins (inlined evidence files)

| repo path | sha256 (raw bytes) | bytes | derivation |
|---|---|---|---|
| evidence/verified-architecture-phase2/surface-models/school.json | 6e9878bd1640b2747e8db52237843a8fd75f878e5dc6e162646c4971e85d99c5 | 8988 | sha256sum of `git show 7cd96d36:evidence/verified-architecture-phase2/surface-models/school.json`; independently recomputed by main and track-b (both match) |

Instantiate-path closure analysis (2026-09-23): 39 CommonJS files; the only
node:fs consumer is src/verified-architecture-phase2/evidence-loader.js, and the
only file it reads on this path is the surface model above. Any future inline
must be pinned here first. Machine-readable copy: visual-slice/engine/pins.json.

## Separate semantic anchor

Canonical surface model digest 308951f841bd9be7a56d5d14ee1852c0cffe66b30d29d6a34f7a7da6bb0555cf
(school-surface-v1 rev 1) stays the runtime semantic anchor, distinct from the
raw-byte pin above.

## Build rules

- esbuild (version pinned in the build manifest), format=esm, thin additive ESM
  wrapper entry; shims are additive files only (sync SHA-256 via vendored
  js-sha256, fs-inline, minimal path, minimal Buffer inject, __dirname define).
  No require-site edits, no certified-tree edits.
- Inlining never reserializes JSON: raw bytes embedded as text; the unmodified
  runtime code does JSON.parse itself.
- Build emits a manifest (path / byte size / raw SHA-256) per inlined file and
  fails closed on any mismatch against pins.
- No page-runtime network beyond the existing pinned three.js CDN; engine bytes
  ship locally as visual-slice/engine-bundle.js.

## Negative-test obligations (proven framing)

- Byte-level tamper in an inlined file -> build MUST fail closed (pin mismatch).
- Value-level tamper that survives JSON parsing -> all three runtime digests
  MUST diverge and the page MUST show the fail-closed error panel, no scene.
- SHA-256 shim: known vectors (empty, "abc", 1M x 'a', UTF-8 multibyte,
  chunked updates).

## AMENDMENT 2026-09-24/25 - status-caveat correction, final approach: separable overlay (anchors UNCHANGED)

This replaces the earlier amendment draft, which described changing the
scene-v2 visual builders in src/ to retire the provisional caveats. That
in-src approach was SUPERSEDED and was never committed: the coordinator's
final acceptance spec (relayed by main 2026-09-25 00:00 IDT) requires the
lifecycle status correction to be a SEPARABLE byte diff confined to
docs/track-b/*, the scene-bundle statusCaveats/status fields and page
status text - with NO byte changes under src/clean-runtime/**, evidence/**,
pins.json or Track A.

Final state:
- Builders in src/clean-runtime/school/scene-v2/ still emit their original
  provisional status caveats; their bytes and all anchors are UNCHANGED:
  package 187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec,
  world fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea,
  descriptor 5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18,
  casualty visual efe6bd00ebbc4aeb13cf219d3aa1a81258b6b2f6ae2f109eb5f4c44850a535d9,
  equipment visual e97a9d885f0c431fe36fac51461d330ef20503b72ecbb2f8ca7fc27b8dcb1770,
  school.json raw pin 6e9878bd1640b2747e8db52237843a8fd75f878e5dc6e162646c4971e85d99c5.
- The correction record lives in docs/track-b/lifecycle-status-correction.json:
  casualty adult-v1 VERIFIED_FOR_SLICE (reviewId gate-b-user-review-ee04481,
  grounded in evidence/clean-runtime/gate-a2-admission/exact-review.json);
  treatment chair VERIFIED_FOR_SLICE (reviewId gate-c-user-review-0c27c92,
  grounded in evidence/clean-runtime/gate-c-admission/gate-result.json).
- scripts/track-b/build-scene-bundle.js overlays the corrected
  statusCaveats/statusCorrection into visual-slice/scene-bundle.json at
  build time; the page renders the overlay, not the builder labels.
- One additive optional parameter on buildVisualSceneDescriptor(committedResult)
  belongs to the separately authorized C6 demo implementation; the default
  call path is byte-identical (asserted by tests).
- tests/clean-runtime-school-scene-v2/c0-lifecycle-status-correction.test.js
  pins the reviewIds to the grounded evidence files and asserts every anchor
  above is unchanged.
