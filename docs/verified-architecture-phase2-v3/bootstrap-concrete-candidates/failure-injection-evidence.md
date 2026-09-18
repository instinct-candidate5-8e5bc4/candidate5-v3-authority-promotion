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

## Earliest reachable cleanup injection

`cleanup-earliest-point-injection.v1.json` places the injected asynchronous exit immediately after the first mutable operation (`mkdir`) returns and before the next statement. At that point the EXIT trap is already installed and cleanup tests stage existence directly. The only possible service-created path is therefore removed; no evidence or authorization path has been created. This is an exact static control-flow injection, not runtime evidence, because executing the service is outside this design-only authorization.

The signed wrong-binding result data uses the exact required assertions per case: `PIN VALIDATION=PASS`; `SIGNATURE VALIDATION=PASS`; `SEMANTIC CROSS-BINDING VALIDATION=REACHED`; `FINAL RESULT=E_CROSS_BINDING`. `PIN_LAYER_NEGATIVE_CONTROL` proves the review harness keeps the layers distinct: both signatures pass, but pin validation fails exactly at `E_PIN_BINDING` and semantic cross-binding validation is not reached.
