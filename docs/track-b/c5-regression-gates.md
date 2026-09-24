# C5 PERMANENT VISUAL + GEOMETRIC/SEMANTIC REGRESSION GATES (FROZEN SPEC)

Status: FROZEN SPEC 2026-09-24 (gate list approved by main on behalf of Yoni's
owner decision; G6/G7 confirmed as registry-honesty gates under the
no-scene-expansion constraint). Implementation lands alongside C2/C3; the full
suite must be green before the integrated delivery SHA. Geometric gates compute
from integer-microunit world-state AABBs - never from pixels. Pixel gates
assert presentation only and never physical truth.

| gate | name | assertion |
|---|---|---|
| G1 | supine contact | casualty AABB bottom plane == support-surface top plane (integer microunits, zero gap, zero penetration) |
| G2 | seated support | chair seat plane carries its intended load surface; chair leg bottoms on the floor plane |
| G3 | legal bag surface | bag contact region (authored meters, carried verbatim + annotated, never silently converted) rests on a legal support surface; no float, no intersection |
| G4 | stretcher wheel contact | every stretcher wheel AABB contacts the floor plane |
| G5 | no illegal placement | zero 3D AABB overlap of any placed object with door/wall/furniture exclusion volumes |
| G6 | drowning-scene semantics | registry-honesty: the drowning family resolves to a semantically fitting scene, or to UNAVAILABLE; treatment-room substitution is a hard failure |
| G7 | synagogue recognizability | registry-honesty: the synagogue family is UNAVAILABLE until a real scene exists and passes its quality bar; a placeholder render is a hard failure |
| G8 | matched night light | day/night/winter are lighting RIGS only (key/fill/ambient/shadow params); no global tint; scene geometry and digests byte-identical across lighting modes |
| G9 | mobile first frame | at 390x844 the FIRST rendered frame contains the patient's projected AABB fully inside the viewport (projection math + pixel assert) |
| G10 | desktop first frame | same at 1280x800 |
| G11 | engine anchors (B7) | browser descriptor digest == Node pin 5f6829b7... (UNCHANGED by the status correction; final separable-overlay approach recorded in b7-design-freeze-record.md AMENDMENT 2026-09-24/25); package 187cf1a4...; world fa1bbaa9...; replayMatchesCommittedState === true |
| G12 | visual markers (B6) | banner VISUALS ARE NOT CERTIFIED PHYSICS, distinction text, status caveats, non-black pixels, FPS meter present |

Twelve gates exceed the contractual minimum of ten. Gates run in the node test
suite (host-independent) plus the browser smoke (skips cleanly on hosts
without Chromium/puppeteer). Any gate failure blocks delivery - there is no
"warn" tier.
