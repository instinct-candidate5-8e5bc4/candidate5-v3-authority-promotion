# LINEAGE REVIEW VERDICT - exact non-geometry root revision chain

Review round: 2026-09-30 04:44 EEST
Reviewer: Track B coordinator (lineage owner for the B2 root-source lineage records)
Reviewed artifacts: executor commit 77070bf58adc2eea671b02f278a1c8a124b2216e
("Prepare exact non-geometry root revision reconstruction", layered on timer-fix
4787744df7d8a9a42412c984c0d3d287c3b7a949, previously reviewed SOUND by this reviewer);
final implementation with shipping conditions: executor f3c51d9 (isolated worktree).

## VERDICT: ACCEPT
The mechanism is an exact reviewed non-geometry revision chain, not a general hash
exemption. Certified physical lineage, original source-range-evidence.json,
SOURCE_SHA256 (e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618)
and the downstream room set digest remain byte-identical. No Geometry Gate bypass,
no certified-definition update.

## INDEPENDENT VERIFICATIONS RUN BY THIS REVIEWER
On branch candidate5-track-b-visual-slice HEAD f03c903:
1. Pre-fix root index.html sha256 = e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618
   = revision.originalSha256. EXACT MATCH.
2. sha256 of index.html after applying the reviewed timer-fix 4787744 =
   3e78e97f85d7b9ea06cbbdc9ba3e8364b50ae0f261e04949f52f7c098eb9cfab
   = revision.currentSha256. EXACT MATCH. (Reverse-applied afterwards; tree clean.)
3. Both patches (timer-fix; mechanism) pass git apply --check onto f03c903.
4. Substitution records compared byte-exact against the reviewed timer-fix diff:
   sub1 = window-qualified advance() call; sub2 = window.unexpectedEngine export
   insertion at the original construction site. Neither pattern nests in the other;
   reversal order-independent for this pair.
5. Range offset records internally consistent: all five geometry ranges shift +7
   bytes (the "window." prefix precedes them; the 41-char export insertion lies
   after them).
6. Mechanism patch touches only visual-surfaces.js verifySource + the new evidence
   JSON - no Track A coupling, no transported-surface interaction.

## FAIL-CLOSED PROPERTIES CONFIRMED IN THE REVIEWED CODE
Exact currentSha256 gate; each substitution required exactly once (split-count,
count===1); whole-file reconstruction SHA must equal SOURCE_SHA256; original
geometry ranges then validate at original offsets. Unknown edits, extra/missing
substitutions, altered geometry, or future edits touching the substitution strings
all reject.

## REQUIRED SHIPPING CONDITIONS AND SATISFACTION STATUS
1. STATUS GATE: verifySource must reject unless the revision record carries the
   approved-review status; shipped record must reference this review round.
   Status: IMPLEMENTED per executor f3c51d9 report (approved-status gate mandatory).
   Final confirmation at transport-time re-verification (see below).
2. NEGATIVE TESTS: one-byte root edit, geometry-range edit, extra substitution,
   missing substitution, wrong currentSha256 rejections, pending-status rejection,
   bad substitution count, wrong reconstructed bytes.
   Status: IMPLEMENTED per executor f3c51d9 report (10 focused tests pass).
   Final confirmation at transport-time re-verification (see below).

## ADVISORY (non-blocking)
verifySource may return recoveredViaRevision:true for test observability, provided
it is NOT fed into the visual-surface set (set digest must remain unchanged).

## TRANSPORT-TIME RE-VERIFICATION (standing condition for the approved flip)
This artifact plus the executor's test evidence is sufficient for the approved
status flip, PROVIDED the final ship commit is re-verified at transport review:
commit ID presented, applied onto the then-current branch HEAD, B2 lineage tests
run green, and the two SHAs above re-confirmed against the shipped bytes. If any of
those fail at transport time, this verdict is void for that commit.

## RECORD CORRECTION (for completeness)
This reviewer's 04:42 statement that "no Track-B pin update is triggered" was
incomplete: it covered only served-pins (visual-slice/*). The B2 root-source
lineage checks (tests/clean-runtime-school-scene-v2/visual-surfaces.test.js x5,
visual-slice-b5.test.js build x1, via SOURCE_SHA256 in
src/clean-runtime/school/scene-v2/visual-surfaces.js) DO pin root index.html bytes;
this revision chain is the accepted mechanism keeping them honest across the fix.
