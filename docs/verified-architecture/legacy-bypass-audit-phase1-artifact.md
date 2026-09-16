# Phase 1 Legacy Bypass Audit Artifact

Status: inventory and enforcement plan only. Phase 1 does not remove or alter any path.

| Path ID | Current source/symbol | Trigger | Mutation/input | Binding status | Current gate coverage | Risk | Later disposition |
|---|---|---|---|---|---|---|---|
| L-01 | `index.html` procedural constructors (`box`, `prop`, `cyl`, `sphere`, `detailed*`) | boot/scene build | direct positions/transforms | unbound to panorama | none central | scene objects bypass package | investigate/route later |
| L-02 | hidden GLB load callback | async GLB load | group add/scale/pose/Box3 floor fit | unbound to visible PNG | isolated bounds | hidden proxy mismatch | block as proxy later |
| L-03 | casualty sprite initial placement | boot | table x/z, scale, flat surface Y | authored metadata only | candidate metadata gates | origin/contact heuristic | route later |
| L-04 | chair/gurney support reuse | boot | patient sprite reused as support | no separate geometry | contact metadata | composite mismatch | block later |
| L-05 | witness sprite initial placement | boot | x/z + `placeOnSurface` | authored metadata | candidate metadata gates | flat-floor heuristic | route later |
| L-06 | bag position table/adjustments | boot/layout | direct x/z branches + Y | PNG/procedural unbound | candidate metadata gates | collision bypass | route later |
| L-07 | mobile reposition | layout | direct x/scale then Y | prior approval may predate change | partial | mutation after proof | route later |
| L-08 | NPC texture/scale/state transition | NPC event | sprite texture, scale, pose, position | standing model reused | revalidation metadata | pose/contact mismatch | route later |
| L-09 | NPC continuous movement | animation loop | group lerp, sprite x/z copy | no swept collider | per-frame contact metadata | wall/path bypass | route later |
| L-10 | multi-casualty planner | API/test | fixed point arrays + fixed Y | no ScenePackage | separate overlap rule | independent path | route later |
| L-11 | treatment attachments | treatment event | hard-coded hidden-rig local coordinates | unbound to visible anatomy | finite Box3 | attachment bypass | investigate later |
| L-12 | exam focus | exam event | hard-coded local coordinates | visual only, not declared | none | role ambiguity | classify effect later |
| L-13 | reactive world entities | world event | direct position/visibility | not physical package | none | visual/physical divergence | classify/route later |
| L-14 | family Surface maps | contact/approval | screen polygons, ranges, flat plane | no scene geometry | candidate map checks | heuristic support | reject later |
| L-15 | alpha/UV path | texture/contact diagnostic | alpha pixels/UV landmarks | no physical derivation | diagnostic flag in candidate | legacy influence | block as proof later |
| L-16 | center-screen Raycaster | click | render picking | interaction only | render mesh hit | not placement if isolated | declare interaction-only |
| L-17 | debug/query injection paths | URL/test | induced state/position failures | varied | test-only assertions | possible bypass if reachable | instrument/block later |

## Planned later proof

Instrument the authoritative physical-transform and scene-mutation boundary. Every accepted mutation must carry a PlacementEvidence ID from the common service. Reconcile:

1. static AST call graph;
2. runtime mutation log over the complete trigger matrix;
3. PlacementEvidence log.

The sets must match exactly. Deliberately invoke each L-01 through L-17 route; no path classified physical may change authoritative state without evidence. Source-range hashes detect reintroduced paths. Any unexplained active mutation is `LEGACY_PLACEMENT_BYPASS_ACTIVE`. End state: One Placement Path.
