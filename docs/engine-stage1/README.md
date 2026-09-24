# Ko-Rishon engine - Stage 1 vertical slice

Status: STAGE 1 CANDIDATE on isolated branch `stage1-engine-vertical-slice`, base `127f284d78b83f358f076b3ee8f8b56044bcc691` (certified Foundation). Not merged, not promoted, not certified. All clinical content is SYNTHETIC_NOT_CLINICAL (engine mechanics only, not medical guidance).

## Scope (owner Stage 1 GO, 25 Sep 2026 02:32)
One scene (certified School treatment room), one male patient (certified adult-v1 SUPINE_FLOOR body), one question, one exam, one equipment item (personal dressing x2), one synthetic treatment, all through one authoritative chain.

## Chain
```
input (text | voice transcript | menu | direct)
 -> ledger INPUT_RECEIVED
 -> deterministic intent engine            src/engine-stage1/intent-engine.js
 -> permission gate (ProtocolVersion x level)
 -> pure domain preparation                src/engine-stage1/domains/*-authority.js
 -> certified physical runtime (bag moves) src/engine-stage1/domains/physical-port.js
      = certified multi-support runtime -> legality port -> school geometry adapter -> Phase 2 gate
 -> one atomic swap of all domain slices + hash-chained ledger append
```
Physical commit is the only irreversible step and runs last; everything fallible happens before it. Any exception before the swap restores the prior state (tested with fault injection at four points).

## Module map
| Path | Role |
|---|---|
| `contracts/scenario-version.js` | ScenarioVersion: binds scene package digest, male casualty body digest, protocol digest, male-only roster, knowledge, clinical facts, inventory, reach rule; refuses female characters, childbirth content, non-synthetic Stage 1 content |
| `contracts/protocol-version.js` | ProtocolVersion: SYNTHETIC_NOT_CLINICAL or CLINICAL_APPROVED (needs source, document version, validity, approval); refuses the blanket "MDA ALS 2024" label |
| `contracts/clinical-state.js` | ClinicalState (sealed, revisioned, protocol-bound) |
| `contracts/clinical-observation.js` | ClinicalObservation - the only path a finding reaches the player; bound to the clinical revision/digest |
| `contracts/intent.js` | Canonical Intent; channel recorded but excluded from the semantic key |
| `contracts/action-attempt.js` | ActionAttempt - one sealed record per input, accepted or rejected |
| `contracts/equipment-unit.js` | EquipmentUnit - individual units with exactly one location (no counters) |
| `contracts/inventory-transfer.js` | InventoryTransfer - the only way a unit moves |
| `contracts/simulation-clock.js` | SimulationClock - integer simulated ms, RUNNING/PAUSED |
| `contracts/event.js` | Event ledger - 15 event types, SHA-256 hash chain, `verifyLedger` |
| `contracts/result-codes.js` | Canonical result codes |
| `contracts/canonical.js` | Re-exports the certified canonical digest (read-only) |
| `domains/clinical-authority.js` | Question answering from patient knowledge, exam findings, synthetic treatment effect |
| `domains/inventory-authority.js` | Transfers with source/revision checks; bag view = name + quantity only |
| `domains/clock-authority.js` | pause / resume / advance; advance refused while paused |
| `domains/physical-port.js` | Composes certified modules exactly as the certified Gate D instantiate path; forwards bag placement to the certified gate |
| `intent-engine.js` | Hebrew normalizer (niqqud, final letters, prefixes, 1-letter typos) + lexicon; ambiguous -> clarifying question; recognized-but-unbuilt -> unsupported |
| `coordinator.js` | Authoritative coordination layer, atomic commit, exportRun / replayRun |
| `content/stage1-synthetic.js` | Stage 1 synthetic protocol + scenario |

## Result codes
ACCEPTED_SUCCESS, ACCEPTED_NEGATIVE_CLINICAL_OUTCOME, ACCEPTED_IN_PROGRESS, REJECTED_NOT_PERMITTED_FOR_LEVEL, REJECTED_EQUIPMENT_MISSING, REJECTED_ILLEGAL_LOCATION, REJECTED_INTENT_AMBIGUOUS, REJECTED_CAPABILITY_UNSUPPORTED, REJECTED_CLOCK_PAUSED, REJECTED_ACTION_IN_PROGRESS, REJECTED_INVALID_INPUT.

## Run
Node 22, no dependencies, $0.
```
node --test tests/engine-stage1/*.test.js                 # Stage 1 tests
node --test $(find tests -name '*.test.js' | sort)         # certified 560 + Stage 1
node tests/engine-stage1/demo-run.js evidence/engine-stage1 # end-to-end demo + replay
```

## Known limits (by design for Stage 1)
- All clinical content is synthetic placeholders; the permission matrix (dressing allowed for medic/paramedic) and the 20 s duration are mechanics fixtures, not medical rules. Real rules need an owner-approved source, version, validity and training level.
- No UI wiring: the engine is a headless module. Voice = transcript text on the `voice` channel; the browser speech layer is not connected.
- Physical actions limited to the bag (certified scene has casualty, chair, bag only). The bag target set is two named positions; legality is always decided by the certified gate.
- Physical commit cannot be rolled back by the coordinator (certified runtime has no undo); it is therefore the last step and all validation precedes it.
- No persistence to disk/browser storage; runs are exported as JSON and replayed.
