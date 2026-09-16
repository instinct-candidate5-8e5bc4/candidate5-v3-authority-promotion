# Numeric Frame / Rotation Engineering Review

## Initial proposal challenge

Canonical integer quaternion ratios are exact, deterministic and avoid hidden floating normalization, but repeated quaternion multiplication and exact rational translation composition have unbounded mathematical growth. Unbounded BigInt is not a practical authoritative format under adversarial or deep inputs. Preserving the earlier proposal unchanged would be unsafe.

## Proposed correction

Retain the ratio representation with explicit resource bounds and fail-closed arithmetic:

- canonical stored translation: signed 63-bit microunits;
- canonical quaternion component: at most 256 magnitude bits after GCD/sign reduction;
- any intermediate numerator, denominator or product: at most 4096 magnitude bits;
- frame graph: at most 4,096 frames and depth at most 64;
- materialized fixed coordinate: signed 63-bit;
- zero is exactly `"0"`; `"-0"`, leading zeroes and unsafe Number inputs are invalid;
- overflow never wraps, saturates or truncates. It rejects.

These are engineering bounds, not geometry tolerances. The depth 64 limit matches this gate's required analysis and prevents uncontrolled traversal. The 256/4096-bit limits leave measured headroom for depth-64 representative composition but remain subject to review before oriented geometry.

## Rotation validity and canonicalization

A valid represented rotation is any nonzero integer 4-tuple interpreted projectively as a quaternion. Unit semantics are exact because the derived rotation matrix divides by squared norm; no normalized float quaternion is needed. Rules: strict decimal integer strings, no negative zero/leading zeroes; nonzero tuple; divide common positive GCD; first nonzero component positive. Component order is `[w,x,y,z]`. Identity is `[1,0,0,0]`; 180-degree X/Y/Z are `[0,1,0,0]`, `[0,0,1,0]`, `[0,0,0,1]`. Equivalent scale and q/-q have one encoding/digest. Strict state input rejects noncanonical ratios rather than silently rewriting them. Conversion/import tooling may canonicalize only as an explicit evidenced operation.

Exact matrix:

`R(q) = N(q)/(w²+x²+y²+z²)` using the standard 3x3 polynomial numerator. All operations are checked BigInt. Identity, ±90-degree axes, 180-degree axes and a non-axis `[1,2,3,4]` case are proved synthetically. This claims exactness for the represented rational rotation, not accuracy to an external real-valued rotation.

## Final question

**YES, with the locked bounds and one remaining implementation gate.** It is deterministic, canonically serialized and practical for bounded frame depth. Exact rational composition preserves associativity before materialization. It can serve as the authoritative transform substrate without a representation redesign. Before oriented geometry, the owner must still approve bounds against expected scene content plus the exact rational-to-fixed interface/precision policy of Phase 2 V3. Inputs exceeding bounds are unsupported, not approximated.
