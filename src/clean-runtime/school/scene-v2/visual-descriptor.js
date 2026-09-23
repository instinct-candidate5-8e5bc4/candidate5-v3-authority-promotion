'use strict';
// TRACK B / PHASE B1 - authoritative runtime integration (read-only).
//
// Projects the certified Gate D package SCHOOL_TREATMENT_ROOM_PHYSICAL_V2 through
// the composition root (instantiate -> WorldMutationAPI -> PhysicalLegalityPort ->
// SchoolGeometryAdapter -> Phase 2 Geometry Gate) and exposes the committed world
// state as a frozen, read-only scene descriptor for the visual loader.
//
// Hard boundaries carried by this module:
//  - Numeric contract ED-P2-02: 1 world unit = 1,000,000 integer microunits;
//    rotations are canonical integer quaternions. All values below are integers
//    exactly as committed by the authoritative runtime. Renderer conversion is
//    DOWNSTREAM-ONLY; renderer floats never feed authoritative state.
//  - This descriptor is VisualBinding projection evidence (derived, read-only).
//    It is NEVER physical proof. Visuals are never represented as certified
//    physics, and no physical truth may be derived from pixels.
//  - No Geometry Gate bypass: every entity/relation here entered the world
//    through the sole placement path and was committed by instantiate().
//  - Status caveats are carried visibly (see statusCaveats): the casualty body
//    is Gate B PASS_PENDING_LIFECYCLE_REVIEW (NOT VERIFIED_FOR_SLICE) and the
//    treatment chair is Gate C PASS_PENDING_USER_REVIEW_FOR_ADMISSION.
const {PACKAGE,model}=require('./package'),{instantiate}=require('./instantiate'),{digest}=require('../../contracts/canonical');
const SEMANTIC_SCENE_ID='scene.school.treatment_room',NUMERIC_CONTRACT_ID='ED-P2-02',MICROWUNITS_PER_WORLD_UNIT=1000000;
// Gate D declared unknowns (the visual frontier) - carried verbatim so no
// consumer can mistake uncertified areas for certified ones.
const DECLARED_UNKNOWNS=Object.freeze(['panorama-geometry lineage','visual-physical lineage','final visual correctness','rotated contacts','articulation/deformation','friction/load/stability','Constraint/Entrapment/Accessibility','real posture contact regions','dynamic hazard/event contracts']);
// Lifecycle-review status current at authoring time. NOTE: the certified package
// provenanceLedger records 'AUTHORED_NEW+VERIFIED_FOR_SLICE'; the owner-facing
// lifecycle review supersedes that label for slice use, and the stricter status
// is the one carried here.
const STATUS_CAVEATS=Object.freeze({
 casualty:Object.freeze({entityId:'school-casualty-adult-v1',gate:'GATE B',gateResult:'PASS_PENDING_LIFECYCLE_REVIEW',bodyLifecycle:'AUTHORED_NEW_DRAFT/VALIDATED/AWAITING_USER_GATE_REVIEW',verifiedForSlice:false,caveat:'Male casualty body is NOT VERIFIED_FOR_SLICE. Visual use is provisional pending lifecycle review.'}),
 chair:Object.freeze({entityId:'school-treatment-chair',gate:'GATE C',gateResult:'PASS_PENDING_USER_REVIEW_FOR_ADMISSION',verifiedForSlice:false,caveat:'Treatment chair is PASS_PENDING_USER_REVIEW_FOR_ADMISSION. Visual use is provisional pending user review.'})});
function deepFreeze(v){if(v&&typeof v==='object'){for(const k of Object.keys(v))deepFreeze(v[k]);Object.freeze(v)}return v}
function entityView(e){return {entityId:e.entityId,entityTypeId:e.entityTypeId,revision:e.revision,lifecycleState:e.lifecycleState,transform:structuredClone(e.transform),physicalBodyRef:structuredClone(e.physicalBodyRef),geometrySourceRef:structuredClone(e.geometrySourceRef),postureStateId:e.postureStateId,participatesIn:structuredClone(e.participatesIn||[]),physicalState:structuredClone(e.physicalState)}}
function buildVisualSceneDescriptor(){
 const r=instantiate(PACKAGE);
 if(r.status!=='COMMITTED')return deepFreeze({descriptorVersion:'1.0.0',kind:'VISUAL_SCENE_DESCRIPTOR',status:'REJECTED',code:r.code||'INSTANTIATION_NOT_COMMITTED',sourcePackage:{scenePackageId:PACKAGE.scenePackageId,scenePackageDigest:PACKAGE.scenePackageDigest}});
 const s=r.after,entityIds=Object.keys(s.entities).sort();
 const descriptor={descriptorVersion:'1.0.0',kind:'VISUAL_SCENE_DESCRIPTOR',status:'COMMITTED',
  semanticRef:{semanticId:SEMANTIC_SCENE_ID,sceneRef:structuredClone(PACKAGE.sceneRef)},
  sourcePackage:{scenePackageId:PACKAGE.scenePackageId,scenePackageVersion:PACKAGE.scenePackageVersion,scenePackageDigest:PACKAGE.scenePackageDigest,certification:'GATE D SCHOOL PHYSICAL SCENE PACKAGE V2 PASS',gateEvidenceRef:'evidence/clean-runtime/gate-d/gate-result.json',packageProvenanceLedger:structuredClone(PACKAGE.provenanceLedger)},
  worldRef:{worldId:s.worldId,revision:s.revision,stateDigest:s.stateDigest,replayMatchesCommittedState:r.replay?r.replay.stateDigest===s.stateDigest:null},
  numericContract:{contractId:NUMERIC_CONTRACT_ID,linearUnit:'MICROUNIT',microunitsPerWorldUnit:MICROWUNITS_PER_WORLD_UNIT,orientation:'CANONICAL_INTEGER_QUATERNION',rendererConversion:'DOWNSTREAM_ONLY',rendererFloatsFeedAuthoritativeState:false,unitsNotes:['entities[].transform is integer microunits / canonical integer quaternion per ED-P2-02','supportRelations[].contactRegionGeometry for school-medical-bag is carried verbatim in AUTHORED METERS from the locked SCHOOL_BAG_BODY geometry (digest f3630d860bbd1900c026aa392632cf73097273c4b7894745d92ac31bf75f2c5a, .55x.35x.35m box) - not converted here; the renderer applies each field\'s declared units','casualty contact region geometry is integer microunits from the adult-v1 body definition']},
  boundary:{kind:'VISUAL_BINDING_PROJECTION',readOnly:true,physicalProof:false,visualsRepresentCertifiedPhysics:false,physicalTruthFromPixels:false,geometryGateBypass:false,rendererDownstreamOfContract:NUMERIC_CONTRACT_ID,rendererMayWriteToAuthoritativeState:false},
  surfaces:{surfaceModelRef:{id:model.surfaceModelId,revision:model.revision,digest:model.surfaceModelDigest,provenance:PACKAGE.refs.surfaceModel.provenance},requiredSurfaces:structuredClone(PACKAGE.refs.requiredSurfaces)},
  entities:entityIds.map(id=>entityView(s.entities[id])),
  supportRelations:structuredClone(s.supportRelations),
  statusCaveats:structuredClone(STATUS_CAVEATS),
  declaredUnknowns:[...DECLARED_UNKNOWNS],
  placementPath:['WorldMutationAPI','PhysicalLegalityPort','SchoolGeometryAdapter','Phase 2 Geometry Gate (PASS, phase2ByteIdentical)']};
 descriptor.descriptorDigest=digest({...descriptor,descriptorDigest:undefined});
 return deepFreeze(descriptor)}
module.exports={buildVisualSceneDescriptor,SEMANTIC_SCENE_ID,NUMERIC_CONTRACT_ID,MICROWUNITS_PER_WORLD_UNIT,DECLARED_UNKNOWNS,STATUS_CAVEATS};
