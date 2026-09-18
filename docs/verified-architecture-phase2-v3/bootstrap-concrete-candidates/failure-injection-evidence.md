# Measured-service failure-injection evidence

Review method: static control-flow/data-flow and exact-record reconstruction only. The service, launcher and script were not invoked. Cleanup is armed before stage creation. Cleanup tests stage existence directly, so an asynchronous exit between successful `mkdir` and the next statement also removes the stage. Every later `fail`, `set -e` exit, signal exit or semantic mismatch traverses the `EXIT` trap. The stage is explicitly removed before the unreachable launcher invocation. No authorization token/file is created.

| Injection point | Expected pre-invocation result | Residual stage | Launcher invoked |
|---|---|---|---|
| stage mkdir failure | `E_SERVICE_STAGE` | none | no |
| asynchronous exit during/after mkdir | EXIT cleanup | none | no |
| missing/symlink record | `E_SERVICE_RECORD` | none | no |
| pin/cross/manifest signature failure | `E_SERVICE_SIGNATURE` | none | no |
| noncanonical/malformed/extra/missing signed field | exact-record mismatch (`E_PIN_BINDING` or `E_CROSS_BINDING`) | none | no |
| closure path/order/type/length/digest/count mismatch | `E_CLOSURE_*` | none | no |
| each complete four-artifact `VALID_SIGNATURE_WRONG_BINDING` root | pin and cross signatures pass; pin exact comparison passes; `E_CROSS_BINDING` | none | no |
| fully matched candidate package | `E_CANDIDATE_AUTHORITY` | none | no |
