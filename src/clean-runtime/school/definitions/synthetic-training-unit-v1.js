'use strict';
// GATE A R1 v4 / synthetic training unit - PROPOSED records, pre-admission.
// Single deterministic source for the unit + bag-owner drafts so scene-v2,
// the geometry adapter and the proposal harness all validate the SAME bytes.
// Every record here is run through the REAL validators at load; a broken
// draft throws instead of shipping asserted numbers. Nothing here is admitted
// until the formal R1 review signs exact bytes.
const A=require('../../authoring');
const {SCHOOL_BAG_BODY}=require('../school-physical-contract');
const {validateOwnerBodyBinding}=require('../../multi-support/owner-body-binding');
const V1=A.V1;
const BAG_BOUNDS_MU=Object.freeze({minX:Math.round(SCHOOL_BAG_BODY.geometry.minX*1e6),maxX:Math.round(SCHOOL_BAG_BODY.geometry.maxX*1e6),minY:Math.round(SCHOOL_BAG_BODY.geometry.minY*1e6),maxY:Math.round(SCHOOL_BAG_BODY.geometry.maxY*1e6),minZ:Math.round(SCHOOL_BAG_BODY.geometry.minZ*1e6),maxZ:Math.round(SCHOOL_BAG_BODY.geometry.maxZ*1e6)});
// 1. Bag owner BODY (AUTHORED_NEW re-expression, byte-bound to the certified recovered record).
const rawBagOwnerBody={schemaVersion:'1.0.0',bodyDefinitionId:'school/medical-bag-owner-body',bodyRevision:1,
 semanticType:'equipment-container',profileId:'equipment',postureDefinitionId:'rigid',postureSemanticType:'SYNTHETIC_POSTURE',
 units:{linear:V1.linearUnit,microunitsPerAuthoredUnit:V1.microunitsPerAuthoredUnit},
 coordinateFrame:{handedness:V1.handedness,axes:V1.axes,upAxis:V1.upAxis,forwardDirection:V1.forwardDirection,transformOrder:V1.transformOrder},
 localOrigin:{kind:'AUTHOR_DECLARED_CONTACT_FRAME',positionMicrounits:[0,0,0]},
 orientationContract:{mode:'IDENTITY_ONLY',canonical:V1.canonicalOrientation},
 components:[{componentId:'bag-shell',primitiveType:'AABB',participationRole:'BOTH',dimensionsMicrounits:[BAG_BOUNDS_MU.maxX-BAG_BOUNDS_MU.minX,BAG_BOUNDS_MU.maxY-BAG_BOUNDS_MU.minY,BAG_BOUNDS_MU.maxZ-BAG_BOUNDS_MU.minZ],localTransform:{translationMicrounits:[0,0,0],orientation:V1.canonicalOrientation}}],
 aggregateBounds:BAG_BOUNDS_MU,
 phase2Projection:{kind:V1.phase2Projection,bounds:BAG_BOUNDS_MU},
 footprint:{kind:'XZ_RECT_UNION',regions:[{minX:BAG_BOUNDS_MU.minX,maxX:BAG_BOUNDS_MU.maxX,minZ:BAG_BOUNDS_MU.minZ,maxZ:BAG_BOUNDS_MU.maxZ}]},
 contactRegions:[{contactRegionId:'bag-bottom-contact',kind:'HORIZONTAL_XZ_RECT',planeY:BAG_BOUNDS_MU.minY,region:{minX:BAG_BOUNDS_MU.minX,maxX:BAG_BOUNDS_MU.maxX,minZ:BAG_BOUNDS_MU.minZ,maxZ:BAG_BOUNDS_MU.maxZ}}],
 supportCategories:[{supportCategoryId:'floor',supportSemanticType:'SUPPORT_SURFACE',provenanceStatus:'RECOVERED',fixtureOnly:false}],
 geometrySource:{classification:'AUTHORED_NEW',sourceId:'gate-a-bag-owner-authoring-001'},
 authoringProvenance:{decisionId:'gate-a-bag-owner-authoring-001',sourceReferenceEvidenceRefs:['certified-runtime-record:school-medical-bag-body revision 1','certified-bag-geometry-digest:'+SCHOOL_BAG_BODY.geometryDigest,'recovered-source:index.html#school-bag-lockers@'+SCHOOL_BAG_BODY.sourceDigest]},
 priorRevisionDigest:null};
const OWNER_BODY=A.validateBody(rawBagOwnerBody);
if(OWNER_BODY.status!=='VALIDATED')throw Object.assign(Error('R1v4 bag owner body failed the real validator: '+JSON.stringify(OWNER_BODY.failure)),{code:'R1V4_DRAFT_INVALID'});
if(JSON.stringify(OWNER_BODY.definition.aggregateBounds)!==JSON.stringify(BAG_BOUNDS_MU))throw Object.assign(Error('R1v4 owner-body aggregate != certified bag bounds'),{code:'R1V4_DRAFT_INVALID'});
// 2. Bag owner ENTITY at the certified committed world position.
const OWNER_ENTITY_RAW={entityDefinitionId:'school/medical-bag-entity',entityRevision:1,
 physicalBodyRef:{id:OWNER_BODY.definition.bodyDefinitionId,revision:OWNER_BODY.definition.bodyRevision,digest:OWNER_BODY.definition.canonicalDigest},
 transform:{translationMicrounits:[-3000000,175000,1000000],orientation:V1.canonicalOrientation}};
OWNER_ENTITY_RAW.entityDigest=A.digest(OWNER_ENTITY_RAW,'entityDigest');
const OWNER_ENTITY=A.validateSupportEntity(OWNER_ENTITY_RAW,OWNER_BODY.definition);
if(OWNER_ENTITY.status!=='VALIDATED')throw Object.assign(Error('R1v4 bag owner entity failed: '+JSON.stringify(OWNER_ENTITY.failure)),{code:'R1V4_DRAFT_INVALID'});
// 3. Interior floor surface (the R1-Q1 signed semantic: certified hollow interior with a valid internal support floor).
const rawFloor={schemaVersion:'1.0.0',supportSurfaceId:'school/medical-bag-interior-floor',surfaceRevision:1,
 ownerDefinitionRef:{id:OWNER_ENTITY.definition.entityDefinitionId,revision:OWNER_ENTITY.definition.entityRevision,digest:OWNER_ENTITY.definition.entityDigest},
 supportSemanticType:'SUPPORT_SURFACE',transformBinding:'OWNER_TRANSLATION_IDENTITY_ORIENTATION',
 localPlane:{normal:[0,1000000,0],offsetMicrounits:-150000},
 localRegion:{minX:-250000,maxX:250000,minZ:-150000,maxZ:150000},
 contactRule:{contactRuleId:'full-footprint-bag-interior-floor',policy:'FULL_FOOTPRINT'},
 provenance:{classification:'AUTHORED_NEW',decisionId:'gate-a-unit-authoring-001'}};
const INTERIOR_FLOOR=A.validateSupportSurface(rawFloor,OWNER_ENTITY.definition);
if(INTERIOR_FLOOR.status!=='VALIDATED')throw Object.assign(Error('R1v4 interior floor failed: '+JSON.stringify(INTERIOR_FLOOR.failure)),{code:'R1V4_DRAFT_INVALID'});
// 4. Containment SUPPORT_VOLUME (the hollow interior above the floor).
const rawVolume={schemaVersion:'1.0.0',supportVolumeId:'school/medical-bag-containment-interior',volumeRevision:1,
 ownerEntityRef:{id:OWNER_ENTITY.definition.entityDefinitionId,revision:OWNER_ENTITY.definition.entityRevision,digest:OWNER_ENTITY.definition.entityDigest},
 transformBinding:'OWNER_TRANSLATION_IDENTITY_ORIENTATION',containmentRole:'CONTAINMENT_INTERIOR',
 localBoundsMicrounits:{minX:-250000,maxX:250000,minY:-150000,maxY:175000,minZ:-150000,maxZ:150000},
 classification:'AUTHORED_NEW',
 provenanceRefs:['owner-r1-q1:wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EwRTNFRDUxRDZDQzAwNEU2NjcA','decision:gate-a-unit-authoring-001']};
const CONTAINMENT_VOLUME=A.validateSupportVolume(rawVolume,OWNER_ENTITY.definition);
if(CONTAINMENT_VOLUME.status!=='VALIDATED')throw Object.assign(Error('R1v4 containment volume failed: '+JSON.stringify(CONTAINMENT_VOLUME.failure)),{code:'R1V4_DRAFT_INVALID'});
// 5. Unit body (200x120x80mm rigid box, bottom contact region at local Y=0).
const rawUnitBody={schemaVersion:'1.0.0',bodyDefinitionId:'synthetic-training-unit-body-v1',bodyRevision:1,
 semanticType:'synthetic-training-unit',profileId:'synthetic-training-unit',postureDefinitionId:'rigid',postureSemanticType:'SYNTHETIC_POSTURE',
 units:{linear:V1.linearUnit,microunitsPerAuthoredUnit:V1.microunitsPerAuthoredUnit},
 coordinateFrame:{handedness:V1.handedness,axes:V1.axes,upAxis:V1.upAxis,forwardDirection:V1.forwardDirection,transformOrder:V1.transformOrder},
 localOrigin:{kind:'AUTHOR_DECLARED_CONTACT_FRAME',positionMicrounits:[0,0,0]},
 orientationContract:{mode:'IDENTITY_ONLY',canonical:V1.canonicalOrientation},
 components:[{componentId:'unit-box',primitiveType:'AABB',participationRole:'BOTH',dimensionsMicrounits:[200000,120000,80000],localTransform:{translationMicrounits:[0,60000,0],orientation:V1.canonicalOrientation}}],
 aggregateBounds:{minX:-100000,maxX:100000,minY:0,maxY:120000,minZ:-40000,maxZ:40000},
 phase2Projection:{kind:V1.phase2Projection,bounds:{minX:-100000,maxX:100000,minY:0,maxY:120000,minZ:-40000,maxZ:40000}},
 footprint:{kind:'XZ_RECT_UNION',regions:[{minX:-100000,maxX:100000,minZ:-40000,maxZ:40000}]},
 contactRegions:[{contactRegionId:'unit-bottom-contact',kind:'HORIZONTAL_XZ_RECT',planeY:0,region:{minX:-100000,maxX:100000,minZ:-40000,maxZ:40000}}],
 supportCategories:[{supportCategoryId:'bag-interior-floor',supportSemanticType:'SUPPORT_SURFACE',provenanceStatus:'AUTHORED_NEW',fixtureOnly:false}],
 geometrySource:{classification:'AUTHORED_NEW',sourceId:'gate-a-unit-authoring-001'},
 authoringProvenance:{decisionId:'gate-a-unit-authoring-001',sourceReferenceEvidenceRefs:['owner-decision:Option A 2026-09-30 (synthetic training unit, minimal scope)']},
 priorRevisionDigest:null};
const UNIT_BODY=A.validateBody(rawUnitBody);
if(UNIT_BODY.status!=='VALIDATED')throw Object.assign(Error('R1v4 unit body failed the real validator: '+JSON.stringify(UNIT_BODY.failure)),{code:'R1V4_DRAFT_INVALID'});
// 6. BODY IDENTITY SEAM: admitted exact binding between the certified RECOVERED
//    bag body and the AUTHORED_NEW owner body (equivalence proven, not asserted).
const rawBinding={schemaVersion:'1.0.0',bindingId:'school/medical-bag-owner-body-binding',bindingRevision:1,
 recoveredBodyRef:{id:SCHOOL_BAG_BODY.bodyId,revision:SCHOOL_BAG_BODY.revision,digest:SCHOOL_BAG_BODY.geometryDigest},
 ownerBodyRef:{id:OWNER_BODY.definition.bodyDefinitionId,revision:OWNER_BODY.definition.bodyRevision,digest:OWNER_BODY.definition.canonicalDigest},
 boundWorldRevision:1,
 provenanceRefs:['certified-runtime-record:school-medical-bag-body revision 1','owner-body-definition:school/medical-bag-owner-body r1','decision:gate-a-bag-owner-authoring-001']};
const OWNER_BODY_BINDING=validateOwnerBodyBinding(rawBinding,{recoveredBody:{bodyId:SCHOOL_BAG_BODY.bodyId,revision:SCHOOL_BAG_BODY.revision,digest:SCHOOL_BAG_BODY.geometryDigest,boundsMicrounits:BAG_BOUNDS_MU},ownerBody:OWNER_BODY.definition});
if(OWNER_BODY_BINDING.status!=='VALIDATED')throw Object.assign(Error('R1v4 owner-body binding failed: '+JSON.stringify(OWNER_BODY_BINDING.failure)),{code:'R1V4_DRAFT_INVALID'});
module.exports=Object.freeze({OWNER_BODY,OWNER_ENTITY,INTERIOR_FLOOR,CONTAINMENT_VOLUME,UNIT_BODY,OWNER_BODY_BINDING,BAG_BOUNDS_MU});
