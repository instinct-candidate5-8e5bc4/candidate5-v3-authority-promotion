'use strict';
// TRACK B / Gate A R1 REGISTRY ADMISSION (executor requirement 2026-09-30):
// the 50eb37e admission transition recorded the owner's decision but did not
// change the runtime registry. The admission module executes the real
// envelope lifecycle + A.admit for the six R1 records and a dedicated
// reviewed scene-admission record; this test runs the executable evidence
// harness (admission proofs + the four rejection paths + scene re-derivation
// + signoff-record cross-checks). ADMITTED_BY_OWNER_R1 stays owner-decision
// status only.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process'),ROOT=path.join(__dirname,'../..');
const M=require(path.join(ROOT,'src/clean-runtime/school/definitions/gate-a-r1-admission'));
test('gate-a-r1-admission: module load executes real registry admission (fail-closed)',()=>{
 for(const k of ['unitBody','ownerBody','ownerEntity','interiorFloor','containmentVolume','ownerBodyBinding'])assert.equal(M.ADMISSIONS[k].status,'ADMITTED');
 assert.equal(M.SCENE_ADMISSION.kind,'REVIEWED_SCENE_ADMISSION');
});
test('gate-a-r1-admission: executable evidence harness passes',()=>{
 const out=execFileSync(process.execPath,[path.join(ROOT,'scripts/track-b/gate-a-r1-admission-check.mjs')],{cwd:ROOT,encoding:'utf8'});
 assert.match(out,/RESULT: PASS - 43 checks/);
});
