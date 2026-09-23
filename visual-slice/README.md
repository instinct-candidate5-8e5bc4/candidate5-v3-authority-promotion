# Track B - School Treatment Room visual slice (B5 preview)

**VISUALS ARE NOT CERTIFIED PHYSICS.** This is a presentation-only projection of
certified authoritative state (Gate D package SCHOOL_TREATMENT_ROOM_PHYSICAL_V2,
digest 187cf1a4...). No physical truth is derived from pixels; renderer values
never feed authoritative state (numeric contract ED-P2-02, downstream-only).

## Run (zero cost, no account, no credentials)

Any static file server from the repo root works. Two examples:

    python3 -m http.server 8000
    # then open http://localhost:8000/visual-slice/

or

    npx --yes serve .
    # then open the printed URL + /visual-slice/

Opening `visual-slice/index.html` directly from disk also works in browsers that
allow module scripts and fetch from `file://` (most do not; use a server).

Requires network access to the pinned public CDN `cdn.jsdelivr.net`
(three@0.160.0). No paid API, no credit card, no tracking endpoint.

## Deployment

Host-agnostic static bundle: `visual-slice/index.html` +
`visual-slice/scene-bundle.json`. Deployable unchanged to any zero-cost static
host approved by the review loop. The deployment target is undecided on purpose
- do NOT deploy to production `ko-rishon-first-aid.pages.dev`.

## Regenerating the bundle

    node scripts/track-b/build-scene-bundle.js

Rebuilds `scene-bundle.json` from the authoritative builders (B1-B4) and stamps
the current branch/commit. Refuses to emit a READY bundle if any input is not
in its expected status.

## On-screen FPS meter

The HUD shows FPS measured on the hardware running the browser. Per the owner's
bar, only real-hardware numbers count (target 45 FPS; production measured 17).
Emulated numbers are not reported anywhere.
