'use strict';
// Candidate evidence inspection, never admission or registry mutation.
const {digest,deepFreeze}=require('../contracts/canonical');
const {validatePacket,verifySwingContainment,evaluateCandidateVolumes}=require('./scene-camera-geometry');
const {discreteClosedLeaf}=require('./door-legality-adapter');
const {model}=require('./scene-v2/package');
function inspectSceneExtensionAdmission({packet,sweepEvidence,verifySweepEvidence,reviewRecord,verifyReviewRecord}={}){
 const rows=[],missing=[];
 const row=(id,status,detail)=>{rows.push({id,status,detail});if(status!=='VERIFIED')missing.push(id)};
 let initial;
 try{initial=validatePacket(packet);row('EXACT_EXTENSION_PINS_AND_WORLD','VERIFIED',{worldDigest:initial.stateDigest,worldRevision:initial.revision,baseScenePackageRef:packet.extension.baseScenePackageRef});row('SWING_CONTAINMENT','VERIFIED',verifySwingContainment(packet))}catch(e){row('EXACT_EXTENSION_PINS_AND_WORLD','UNKNOWN',e.message);return deepFreeze({status:'PENDING',reason:'INVALID_OR_MISSING_EXTENSION_EVIDENCE',rows,missing})}
 const door=packet.environmentPhysicalState.doorStates[0];const leaf=discreteClosedLeaf({surfaceModel:model,proposedState:initial,command:{commandId:'admission-evidence:door',surfaceId:door.surfaceId,geometryDigest:door.geometryDigest}});
 row('DISCRETE_DOOR_GEOMETRY',leaf.outcome==='PASS'?'VERIFIED':'UNKNOWN',{outcome:leaf.outcome,reason:leaf.reason,evidenceDigest:leaf.evidenceDigest});
 const views=packet.sweepSpec.waypoints.map((w,i)=>({id:w.id,endpoint:evaluateCandidateVolumes({packet,proposedState:initial,cameraTransform:w.transform}),transition:i?evaluateCandidateVolumes({packet,proposedState:initial,cameraTransform:w.transform,previousCameraTransform:packet.sweepSpec.waypoints[i-1].transform}):null}));
 row('DECLARED_CAMERA_VOLUME_ENDPOINTS_AND_ROUTES',views.every(v=>v.endpoint.evidence?.componentVerdict==='CANDIDATE_VOLUMES_CLEAR'&&(!v.transition||v.transition.evidence?.componentVerdict==='CANDIDATE_VOLUMES_CLEAR'))?'VERIFIED':'UNKNOWN',views.map(v=>({id:v.id,endpointDigest:v.endpoint.evidenceDigest,transitionDigest:v.transition?.evidenceDigest||null})));
 // A search hit, screenshot name or boolean flag cannot grant pixel validity.
 const sweepPins=sweepEvidence?.worldDigest===initial.stateDigest&&sweepEvidence?.packetDigest===digest(packet)&&sweepEvidence?.sweepSpecDigest===packet.extension.sweepSpecRef.digest&&sweepEvidence?.cameraBodyDigest===packet.extension.cameraBodyRef.digest&&sweepEvidence?.kind==='SCENE_SPECIFIC_RENDER_SWEEP_EVIDENCE'&&sweepEvidence?.sceneId===packet.sweepSpec.sceneId;
 let verified=false;try{verified=sweepPins&&typeof verifySweepEvidence==='function'&&verifySweepEvidence({packet,initialWorld:initial,sweepEvidence})===true}catch{}
 row('D1_D3_SOURCE_BOUND_RENDER_PIXELS_AND_ALIGNMENT',verified?'VERIFIED':'UNKNOWN',verified?{evidenceDigest:digest(sweepEvidence)}:'Actual five-view and transition captures, constrained camera records, committed entity transforms, renderer/presentation binding and independent pixel/alignment verification required');
 let reviewed=false;try{reviewed=reviewRecord?.packetDigest===digest(packet)&&reviewRecord?.worldDigest===initial.stateDigest&&reviewRecord?.scope==='SCHOOL_SCENE_EXTENSION_V1_3_EVIDENCE_CAMERA_ONLY'&&typeof verifyReviewRecord==='function'&&verifyReviewRecord({packet,initialWorld:initial,reviewRecord})===true}catch{}
 row('EXACT_EXTENSION_ADMISSION_REVIEW',reviewed?'VERIFIED':'UNKNOWN','Specific extension review/admission evidence, not R1 signoff or exactly-two audit permission');
 return deepFreeze({status:missing.length?'PENDING':'EVIDENCE_COMPLETE_NOT_ADMITTED',reason:missing.length?'SCENE_ADMISSION_PENDING':'REGISTRY_ADMISSION_SEAM_NOT_EXECUTED',packetDigest:digest(packet),worldDigest:initial.stateDigest,rows,missing,limitations:['EVIDENCE_INSPECTION_ONLY','NO_R1_REWRITE','NO_SCENE_OR_MESH_ADMISSION','NO_GAMEPLAY_CAMERA_MODE_SELECTION','DISPLAY_OPTICS_NOT_VERIFIED','NO_CLOSED_ROOM_INFERENCE']});
}
module.exports={inspectSceneExtensionAdmission};
