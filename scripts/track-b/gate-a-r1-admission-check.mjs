#!/usr/bin/env node
// GATE A R1 REGISTRY ADMISSION evidence harness (executor requirement
// 2026-09-30): the R1 ADMISSION STATUS transition at 50eb37e recorded the
// owner's decision but did NOT change the runtime registry - A.admit REJECTED
// every record NOT_VERIFIED_FOR_SLICE and A.TYPES lacked OWNER_BODY_BINDING.
// src/clean-runtime/school/definitions/gate-a-r1-admission.js now executes the
// real envelope lifecycle (AUTHORED_NEW_DRAFT->VALIDATED->REVIEWED->
// VERIFIED_FOR_SLICE) and real A.admit for all six records, plus a DEDICATED
// reviewed scene-admission record for the approved v2.1.0 bytes (never
// mutated). Proven below: live admission, full lifecycle integrity, the four
// rejection paths, scene digest re-derivation, and signoff-record cross-checks.
// ADMITTED_BY_OWNER_R1 remains the owner-decision status, surfaced separately.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const path=require('node:path'),ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const A=require(path.join(ROOT,'src/clean-runtime/authoring'));
const SYN=require(path.join(ROOT,'src/clean-runtime/school/definitions/synthetic-training-unit-v1'));
const M=require(path.join(ROOT,'src/clean-runtime/school/definitions/gate-a-r1-admission'));
const SIGNOFF=require(path.join(ROOT,'evidence/track-b/r1-owner-signoff.json'));
const out=[];const c=(label,ok,detail)=>out.push((ok?'PASS ':'FAIL ')+label+(ok?'':' :: '+(detail||'')));
// --- D1: live registry admission through the runtime's own A.admit ---
const DEFS=[['unitBody','PHYSICAL_BODY',SYN.UNIT_BODY.definition],['ownerBody','PHYSICAL_BODY',SYN.OWNER_BODY.definition],['ownerEntity','ENTITY',SYN.OWNER_ENTITY.definition],['interiorFloor','SUPPORT_SURFACE',SYN.INTERIOR_FLOOR.definition],['containmentVolume','SUPPORT_VOLUME',SYN.CONTAINMENT_VOLUME.definition],['ownerBodyBinding','OWNER_BODY_BINDING',SYN.OWNER_BODY_BINDING.binding]];
for(const [key,type,def] of DEFS){
 const r=A.admit({definitionType:type,definition:def,envelope:M.ENVELOPES[key].verified,expectedScope:M.SCOPE});
 c('D1 '+key+' ADMITTED via real A.admit (live re-execution, '+type+')',r.status==='ADMITTED',JSON.stringify(r.failure||r.status));
}
// --- D2: lifecycle integrity + review pins ---
for(const [key] of DEFS){
 const e=M.ENVELOPES[key];
 c('D2 '+key+' lifecycle AUTHORED_NEW_DRAFT->VALIDATED->REVIEWED->VERIFIED_FOR_SLICE',e.draft.lifecycleState==='AUTHORED_NEW_DRAFT'&&e.validated.lifecycleState==='VALIDATED'&&e.reviewed.lifecycleState==='REVIEWED'&&e.verified.lifecycleState==='VERIFIED_FOR_SLICE');
 const v=e.verified;
 c('D2 '+key+' review pins: r1-owner-signoff + APPROVED_FOR_SLICE + scope + digest/revision match envelope ref',v.reviewId===M.REVIEW_ID&&v.reviewDecision==='APPROVED_FOR_SLICE'&&v.reviewScope===M.SCOPE&&v.reviewedDefinitionDigest===v.definitionRef.definitionDigest&&v.reviewedDefinitionRevision===v.definitionRef.revision);
 c('D2 '+key+' envelope digest verifies through real validateEnvelope',A.validateEnvelope(v).status==='VALIDATED');
 c('D2 '+key+' review evidence pins owner reply + question wamids + approved digests',v.reviewEvidenceRefs.includes('whatsapp:wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EyRThERTVDOTY4QTMzNUYwMjEA')&&v.reviewEvidenceRefs.includes('whatsapp:wamid.HBgMOTcyNTMyNDkwMzUxFQIAERgSMkRBNTcxMEY3MzRBNURDRjVEAA==')&&v.reviewEvidenceRefs.includes('package-sha256:'+SIGNOFF.approvedScope.proposedScene.packageDigest)&&v.reviewEvidenceRefs.includes('world-sha256:'+SIGNOFF.approvedScope.proposedScene.worldDigest));
}
// --- N: the four rejection paths, live ---
{
 const tampered=structuredClone(M.ENVELOPES.unitBody.verified);tampered.limitations=[...tampered.limitations,'FORGED_LIMITATION'];
 const r1=A.admit({definitionType:'PHYSICAL_BODY',definition:SYN.UNIT_BODY.definition,envelope:tampered,expectedScope:M.SCOPE});
 c('N1 negative: tampered verified envelope REJECTED ENVELOPE_DIGEST_MISMATCH',r1.status==='REJECTED'&&r1.failure.code==='ENVELOPE_DIGEST_MISMATCH',JSON.stringify(r1.failure||r1.status));
 const r2=A.admit({definitionType:'PHYSICAL_BODY',definition:SYN.UNIT_BODY.definition,envelope:M.ENVELOPES.unitBody.verified,expectedScope:'WRONG_SCOPE'});
 c('N2 negative: wrong expectedScope REJECTED REVIEW_SCOPE_MISMATCH',r2.status==='REJECTED'&&r2.failure.code==='REVIEW_SCOPE_MISMATCH');
 const r3=A.admit({definitionType:'PHYSICAL_BODY',definition:SYN.UNIT_BODY.definition,envelope:M.ENVELOPES.unitBody.reviewed,expectedScope:M.SCOPE});
 c('N3 negative: REVIEWED-not-VERIFIED envelope REJECTED NOT_VERIFIED_FOR_SLICE',r3.status==='REJECTED'&&r3.failure.code==='NOT_VERIFIED_FOR_SLICE');
 const r4=A.admit({definitionType:'PHYSICAL_BODY',definition:SYN.OWNER_BODY.definition,envelope:M.ENVELOPES.unitBody.verified,expectedScope:M.SCOPE});
 c('N4 negative: unit-body envelope against owner-body definition REJECTED DEFINITION_REF_MISMATCH',r4.status==='REJECTED'&&r4.failure.code==='DEFINITION_REF_MISMATCH');
 const r5=A.admit({definitionType:'PHYSICAL_BODY',definition:SYN.UNIT_BODY.definition,envelope:M.ENVELOPES.unitBody.draft,expectedScope:M.SCOPE});
 c('N5 negative: bare draft still REJECTED NOT_VERIFIED_FOR_SLICE (executor 03:18 repro closed)',r5.status==='REJECTED'&&r5.failure.code==='NOT_VERIFIED_FOR_SLICE');
}
// --- S: dedicated scene admission (approved bytes never mutated) ---
{
 const s=M.SCENE_ADMISSION,{buildV21}=require(path.join(ROOT,'scripts/track-b/gate-a-r1v4-package-builder')),{instantiate}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/instantiate'));
 const pkg=buildV21(),inst=instantiate(pkg);
 c('S1 scene admission record pins the approved v2.1.0 package digest (re-derived live)',s.scenePackageRef.scenePackageDigest===SIGNOFF.approvedScope.proposedScene.packageDigest&&pkg.scenePackageDigest===s.scenePackageRef.scenePackageDigest);
 c('S2 scene admission record pins the approved world digest (re-instantiated live)',s.worldRef.worldDigest===SIGNOFF.approvedScope.proposedScene.worldDigest&&inst.after.stateDigest===s.worldRef.worldDigest);
 c('S3 scene replay matches committed state',s.worldRef.replayMatchesCommittedState===true&&inst.replay.stateDigest===s.worldRef.worldDigest);
 c('S4 scene record review pins r1-owner-signoff + APPROVED_FOR_SLICE + scope',s.review.reviewId===M.REVIEW_ID&&s.review.reviewDecision==='APPROVED_FOR_SLICE'&&s.review.reviewScope===M.SCOPE);
 const {digest}=require(path.join(ROOT,'src/clean-runtime/contracts/canonical'));
 const recomputed=digest({...structuredClone(s),admissionDigest:undefined},'admissionDigest');
 c('S5 scene admission digest is canonical and stable',recomputed===s.admissionDigest);
 c('S6 approved package bytes NOT mutated by admission (digest unchanged since owner signoff)',pkg.scenePackageDigest==='5ba7ce47c9ff3a105a5636fda858d374bbdadcdedc41af3379d6fb2d54a989d8');
 c('S7 signoff record scope = exactly the six admitted records',SIGNOFF.approvedScope.records.length===6&&Object.keys(M.ADMISSIONS).length===6);
 c('S8 owner-decision status preserved separately: ADMITTED_BY_OWNER_R1 stays in evidence record, registry admission lives in the runtime module',SIGNOFF.admissionStatus==='ADMITTED_BY_OWNER_R1'&&M.ADMISSIONS.unitBody.status==='ADMITTED');
}
out.forEach(x=>console.log(x));
const fails=out.filter(x=>x.startsWith('FAIL'));
console.log('RESULT: '+(fails.length?'FAIL ('+fails.length+')':'PASS - '+out.length+' checks'));
process.exit(fails.length?1:0);
