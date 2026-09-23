'use strict';
// TRACK B / PHASE B4 - chair, bag and equipment (visual side).
//
// Builds the treatment-chair and medical-bag visuals from their CERTIFIED body
// definitions, placed at the authoritative committed transforms taken from the
// B1 visual scene descriptor - never from visual data.
//
// Hard boundaries:
//  - STATUS CAVEAT carried visibly: the treatment chair is Gate C
//    PASS_PENDING_USER_REVIEW_FOR_ADMISSION (verifiedForSlice:false).
//  - The medical bag is RECOVERED from the locked authored source range
//    'school-bag-lockers'; its DIMENSIONS are identical to the authored box,
//    and its PLACEMENT is the authoritative committed transform. Where the
//    authored visual call differs (center y .18 vs authoritative .175, the
//    exact floor-contact position), the authoritative transform wins and the
//    difference is recorded, not hidden.
//  - NO equipment beyond bag+chair: anything further is NEW authoring through
//    the Gate A lifecycle (AUTHORED_NEW) and is not borrowed from legacy
//    visuals as physical truth.
//  - Presentation-only; integer microunits (ED-P2-02); identity orientation
//    only (rotated contacts are a declared unknown).
const C=require('../definitions/treatment-chair'),{SCHOOL_BAG_BODY}=require('../school-physical-contract'),{buildVisualSceneDescriptor,STATUS_CAVEATS}=require('./visual-descriptor'),{digest}=require('../../contracts/canonical');
const IDENTITY=[0,0,0,1];
function deepFreeze(v){if(v&&typeof v==='object'){for(const k of Object.keys(v))deepFreeze(v[k]);Object.freeze(v)}return v}
const reject=(code,note)=>deepFreeze({visualVersion:'1.0.0',kind:'VISUAL_EQUIPMENT',status:'REJECTED',code,note});
function compAabb(c){const t=c.localTransform.translationMicrounits,d=c.dimensionsMicrounits;return {minX:t[0]-d[0]/2,maxX:t[0]+d[0]/2,minY:t[1]-d[1]/2,maxY:t[1]+d[1]/2,minZ:t[2]-d[2]/2,maxZ:t[2]+d[2]/2}}
function place(e,pos){return {minX:e.minX+pos[0],maxX:e.maxX+pos[0],minY:e.minY+pos[1],maxY:e.maxY+pos[1],minZ:e.minZ+pos[2],maxZ:e.maxZ+pos[2]}}
function checkEntity(descriptor,entityId,expectedDigest){const e=descriptor.entities.find(x=>x.entityId===entityId);if(!e)return {error:'ENTITY_MISSING:'+entityId};if(e.physicalBodyRef.digest!==expectedDigest)return {error:'BODY_DIGEST_MISMATCH:'+entityId};const o=e.transform.orientation;if(!(o.length===4&&o.every((v,i)=>v===IDENTITY[i])))return {error:'NON_IDENTITY_ORIENTATION_UNSUPPORTED:'+entityId};if(!e.transform.scaleMicrounits.every(v=>v===1000000))return {error:'NON_UNIT_SCALE_UNSUPPORTED:'+entityId};return {e}}
function buildVisualEquipment(descriptor=buildVisualSceneDescriptor()){
 if(descriptor.status!=='COMMITTED')return reject('DESCRIPTOR_NOT_COMMITTED');
 const ch=checkEntity(descriptor,'school-treatment-chair',C.BODY.canonicalDigest);if(ch.error)return reject(ch.error,'rotated contacts are a Gate D declared unknown');
 const bg=checkEntity(descriptor,'school-medical-bag',SCHOOL_BAG_BODY.geometryDigest);if(bg.error)return reject(bg.error);
 const cpos=ch.e.transform.positionMicrounits,
  chairComponents=C.BODY.components.map(c=>{const local=compAabb(c);return {componentId:c.componentId,kind:'BOX_MESH',dimensionsMicrounits:[...c.dimensionsMicrounits],localTransform:structuredClone(c.localTransform),localAabbMicrounits:local,worldAabbMicrounits:place(local,cpos),floorContact:local.minY===0,participationRole:c.participationRole,visualOnlyAppearance:{colorHex:'0x6a7f8c',materialClaim:'VISUAL_ONLY'}}}),
  cEnv=C.BODY.aggregateBounds,
  chair={entityRef:{entityId:ch.e.entityId,physicalBodyRef:structuredClone(ch.e.physicalBodyRef),supportSurfaceRef:{id:C.SURFACE.supportSurfaceId,revision:C.SURFACE.surfaceRevision,digest:C.SURFACE.canonicalDigest}},authoritativeTransformMicrounits:structuredClone(ch.e.transform),envelopeMicrounits:structuredClone(cEnv),worldEnvelopeMicrounits:place(cEnv,cpos),envelopeCheck:{dimensionsMicrounits:[cEnv.maxX-cEnv.minX,cEnv.maxY-cEnv.minY,cEnv.maxZ-cEnv.minZ],seatPlaneYMicrounits:C.SURFACE.localPlane.offsetMicrounits,floorContactY0:cEnv.minY===0},components:chairComponents,provenance:{classification:'AUTHORED_NEW',decisionId:C.BODY.authoringProvenance.decisionId},statusCaveat:structuredClone(STATUS_CAVEATS.chair)};
 const g=SCHOOL_BAG_BODY.geometry,bpos=bg.e.transform.positionMicrounits,M=1000000,
  gMicro={minX:Math.round(g.minX*M),maxX:Math.round(g.maxX*M),minY:Math.round(g.minY*M),maxY:Math.round(g.maxY*M),minZ:Math.round(g.minZ*M),maxZ:Math.round(g.maxZ*M)},
  bag={entityRef:{entityId:bg.e.entityId,physicalBodyRef:structuredClone(bg.e.physicalBodyRef)},authoritativeTransformMicrounits:structuredClone(bg.e.transform),geometryMicrounits:gMicro,worldAabbMicrounits:place(gMicro,bpos),envelopeCheck:{dimensionsMicrounits:[gMicro.maxX-gMicro.minX,gMicro.maxY-gMicro.minY,gMicro.maxZ-gMicro.minZ],floorContactY0:gMicro.minY+bpos[1]===0},components:[{componentId:'bag-body',kind:'BOX_MESH',localAabbMicrounits:gMicro,worldAabbMicrounits:place(gMicro,bpos),floorContact:true,visualOnlyAppearance:{colorHex:'0x883d46',materialClaim:'VISUAL_ONLY'}}],provenance:{classification:'RECOVERED',lineageStatus:'RECOVERED',sourceId:SCHOOL_BAG_BODY.sourceId,sourceDigest:SCHOOL_BAG_BODY.sourceDigest,sourceRange:'school-bag-lockers'},authoredVsAuthoritative:{authoredCenterMicrounits:[-3000000,180000,1000000],authoritativePositionMicrounits:[...bpos],yDifferenceMicrounits:bpos[1]-180000,resolution:'AUTHORITATIVE_TRANSFORM_WINS: authored .18m center vs committed .175m exact floor-contact position; dimensions identical'},statusCaveat:null};
 const v={visualVersion:'1.0.0',kind:'VISUAL_EQUIPMENT',status:'DIMENSIONED_TO_CERTIFIED_BODIES',chair,bag,equipmentBeyondBagAndChair:{included:[],policy:'REQUIRES_GATE_A_LIFECYCLE',note:'No additional equipment is included. Any further equipment is NEW authoring through the Gate A lifecycle (AUTHORED_NEW); legacy visuals are never borrowed as physical truth.'},boundary:{presentationOnly:true,physicalProof:false,geometryGateBypass:false,rendererDownstreamOfContract:'ED-P2-02',visualNeverFeedsAuthoritativeState:true}};
 v.visualDigest=digest({...v,visualDigest:undefined});
 return deepFreeze(v)}
module.exports={buildVisualEquipment};
