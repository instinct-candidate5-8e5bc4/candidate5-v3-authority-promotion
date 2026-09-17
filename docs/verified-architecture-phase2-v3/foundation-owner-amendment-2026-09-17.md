# V3 Authority Promotion Foundation — Owner Amendment

Date: 2026-09-17
Applies only to the isolated Foundation gate on `chatgpt/v3-authority-promotion-preflight`.

## A. Global registry closure — APPROVED normative amendment

The Foundation validates the complete authoritative registry snapshot for internal reference/digest/revision consistency before allowing `COMMIT_ALLOWED`. A missing, stale, forged, conflicting, cyclic, or otherwise invalid authority record anywhere in the authoritative snapshot rejects the candidate transaction even when that record is outside the transaction impact subset.

This is intentional global fail-closed policy. Impact closure still determines which physical proof obligations are generated; it does not weaken the prerequisite that the authoritative world snapshot itself is internally valid. Therefore an unrelated but valid authority record must not create an extra physical proof, while an unrelated invalid authority record rejects envelope construction.

## B. Event append / commit / replay — Foundation test simulator required

The Foundation must prove atomic decision/evidence semantics using a deterministic simulator located under `tests/` only. This does not authorize a production runtime, School, gateway, writer, store, or event-log connection. The simulator must cover successful append+commit, append failure with zero mutation, commit failure with rollback of staged evidence, exact replay, and fail-closed tamper/missing/duplicate/reordered-event detection.

## C. Exact envelope binding

Every obligation context is content-bound to the exact sealed authority envelope from which it was projected. Mixing a valid obligation/context/route from different envelopes is non-committing and must not invoke closed V3.

## D. Behavioral acceptance

Source-token assertions are not authority proof. Static source inspection may remain defense-in-depth, but acceptance claims must be backed by executable behavioral regressions. The Foundation remains isolated and cannot be declared runtime-promoted by this amendment.
