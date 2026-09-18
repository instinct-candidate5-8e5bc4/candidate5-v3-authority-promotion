# Measured-service failure-injection evidence

Review method: static control-flow/data-flow inspection only. The service, launcher and script were not invoked. Cleanup is armed immediately after argument/path validation and before the first temporary write (`mkdir`). Every later `fail`, failed command under `set -e`, signal exit or semantic mismatch traverses the `EXIT` trap, which recursively removes the one dedicated stage. The stage is explicitly removed before any launcher invocation. No authorization token/file is created.

| Injection point | Expected pre-invocation result | Residual stage | Launcher invoked |
|---|---|---|---|
| stage mkdir failure | `E_SERVICE_STAGE` | none | no |
| missing/symlink record | `E_SERVICE_RECORD` | none | no |
| pin/cross/manifest signature failure | `E_SERVICE_SIGNATURE` | none | no |
| noncanonical/malformed/extra/missing signed field | exact-record mismatch (`E_PIN_BINDING` or `E_CROSS_BINDING`) | none | no |
| stale sequence/floor or candidate authority | exact-record mismatch or `E_CANDIDATE_AUTHORITY` | none | no |
| closure path/order/type/length/digest/count mismatch | `E_CLOSURE_*` | none | no |
| any `VALID_SIGNATURE_WRONG_BINDING` fixture | signature passes; `E_CROSS_BINDING` | none | no |
| fully matched candidate package | `E_CANDIDATE_AUTHORITY` | none | no |

Operational records cannot be produced by editing these candidates. Later owner approval requires regenerated canonical records, signatures and independent review. The candidate hard stop remains in these review bytes until a separately authorized operational artifact is defined.
