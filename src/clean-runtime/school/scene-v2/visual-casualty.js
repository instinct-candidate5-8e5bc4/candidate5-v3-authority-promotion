'use strict';
// TRACK B / PHASE B3 - male 3D casualty and posture representation (visual side).
//
// Builds the visual casualty from the CERTIFIED adult-v1 body definition
// (five AABB components, integer microunits) placed at the authoritative
// committed transform taken from the B1 visual scene descriptor - never from
// visual data. The physical posture stays the certified SUPINE_FLOOR; this
// module adds a strictly presentation-only appearance layer on top.
//
// Hard boundaries:
//  - STATUS CAVEAT carried visibly: the casualty body is Gate B
//    PASS_PENDING_LIFECYCLE_REVIEW, body AUTHORED_NEW_DRAFT/VALIDATED/
//    AWAITING_USER_GATE_REVIEW - NOT VERIFIED_FOR_SLICE.
//  - The visual pose is STATIC and exactly matches SUPINE_FLOOR. Articulation
//    and deformation are Gate D declared unknowns; nothing here animates,
//    articulates or deforms the body, and no visual pose ever feeds physical
//    posture state.
//  - Rotated contacts are a declared unknown: the entity orientation contract
//    is IDENTITY_ONLY; any non-identity orientation rejects the build.
//  - Integer microunits throughout (ED-P2-02); renderer converts downstream.
const D=require('../definitions/adult-v1-male-supine-floor'),{buildVisualSceneDescriptor,STATUS_CAVEATS}=require('./visual-descriptor'),{digest}=require('../../contracts/canonical');
const IDENTITY=[0,0,0,1];
function deepFreeze(v){if(v&&typeof v==='object'){for(const k of Object.keys(v))deepFreeze(v[k]);Object.freeze(v)}return v}
function compAabb(c){const t=c.localTransform.translationMicrounits,d=c.dimensionsMicrounits;return {minX:t[0]-d[0]/2,maxX:t[0]+d[0]/2,minY:t[1]-d[1]/2,maxY:t[1]+d[1]/2,minZ:t[2]-d[2]/2,maxZ:t[2]+d[2]/2}}
// Visual-only suggested appearance per component. Colors/materials are
// presentation claims only, never physical evidence.
const APPEARANCE={head:{colorHex:'0xd9b18c',label:'head'},torso:{colorHex:'0x3e5f8a',label:'torso'},'left-arm':{colorHex:'0x3e5f8a',label:'left-arm'},'right-arm':{colorHex:'0x3e5f8a',label:'right-arm'},legs:{colorHex:'0x2f3b52',label:'legs'}};
function buildVisualCasualty(descriptor=buildVisualSceneDescriptor()){
 if(descriptor.status!=='COMMITTED')return deepFreeze({visualVersion:'1.0.0',kind:'VISUAL_CASUALTY',status:'REJECTED',code:'DESCRIPTOR_NOT_COMMITTED'});
 const e=descriptor.entities.find(x=>x.entityId==='school-casualty-adult-v1');
 if(!e)return deepFreeze({visualVersion:'1.0.0',kind:'VISUAL_CASUALTY',status:'REJECTED',code:'CASUALTY_ENTITY_MISSING'});
 if(e.physicalBodyRef.digest!==D.BODY.canonicalDigest)return deepFreeze({visualVersion:'1.0.0',kind:'VISUAL_CASUALTY',status:'REJECTED',code:'BODY_DIGEST_MISMATCH'});
 const o=e.transform.orientation;
 if(!(o.length===4&&o.every((v,i)=>v===IDENTITY[i])))return deepFreeze({visualVersion:'1.0.0',kind:'VISUAL_CASUALTY',status:'REJECTED',code:'NON_IDENTITY_ORIENTATION_UNSUPPORTED',note:'rotated contacts are a Gate D declared unknown'});
 const pos=e.transform.positionMicrounits,scale=e.transform.scaleMicrounits;
 if(!scale.every(v=>v===1000000))return deepFreeze({visualVersion:'1.0.0',kind:'VISUAL_CASUALTY',status:'REJECTED',code:'NON_UNIT_SCALE_UNSUPPORTED'});
 const components=D.BODY.components.map(c=>{const local=compAabb(c),world={minX:local.minX+pos[0],maxX:local.maxX+pos[0],minY:local.minY+pos[1],maxY:local.maxY+pos[1],minZ:local.minZ+pos[2],maxZ:local.maxZ+pos[2]};return {componentId:c.componentId,kind:'BOX_MESH',dimensionsMicrounits:[...c.dimensionsMicrounits],localTransform:structuredClone(c.localTransform),localAabbMicrounits:local,worldAabbMicrounits:world,floorContact:local.minY===0,participationRole:c.participationRole,visualOnlyAppearance:{...APPEARANCE[c.componentId],materialClaim:'VISUAL_ONLY'}}});
 const envelope=D.BODY.aggregateBounds,worldEnvelope={minX:envelope.minX+pos[0],maxX:envelope.maxX+pos[0],minY:envelope.minY+pos[1],maxY:envelope.maxY+pos[1],minZ:envelope.minZ+pos[2],maxZ:envelope.maxZ+pos[2]};
 const union=components.reduce((a,c)=>({minX:Math.min(a.minX,c.localAabbMicrounits.minX),maxX:Math.max(a.maxX,c.localAabbMicrounits.maxX),minY:Math.min(a.minY,c.localAabbMicrounits.minY),maxY:Math.max(a.maxY,c.localAabbMicrounits.maxY),minZ:Math.min(a.minZ,c.localAabbMicrounits.minZ),maxZ:Math.max(a.maxZ,c.localAabbMicrounits.maxZ)}),components[0].localAabbMicrounits);
 const envelopeExact=Object.keys(union).every(k=>union[k]===envelope[k]);
 const v={visualVersion:'1.0.0',kind:'VISUAL_CASUALTY',status:envelopeExact?'DIMENSIONED_TO_CERTIFIED_ENVELOPE':'ENVELOPE_MISMATCH',
  entityRef:{entityId:e.entityId,physicalBodyRef:structuredClone(e.physicalBodyRef),profileRef:structuredClone(e.physicalState.profileRef),postureRef:structuredClone(e.physicalState.postureRef)},
  authoritativeTransformMicrounits:structuredClone(e.transform),
  physicalPosture:{semantic:'SUPINE_FLOOR',source:'CERTIFIED_AUTHORITATIVE_STATE',visualMayAlter:false},
  visualPose:{kind:'STATIC',matchesCertifiedPosture:true,articulation:false,deformation:false,reason:'articulation/deformation and rotated contacts are Gate D declared unknowns'},
  envelopeMicrounits:structuredClone(envelope),worldEnvelopeMicrounits:worldEnvelope,envelopeCheck:{componentUnionEqualsAggregateBounds:envelopeExact,floorContactY0:envelope.minY===0,dimensionsMicrounits:[envelope.maxX-envelope.minX,envelope.maxY-envelope.minY,envelope.maxZ-envelope.minZ]},
  components,
  statusCaveat:structuredClone(STATUS_CAVEATS.casualty),
  boundary:{presentationOnly:true,visualPoseFeedsPhysicalPosture:false,physicalProof:false,geometryGateBypass:false,rendererDownstreamOfContract:'ED-P2-02'}};
 v.visualDigest=digest({...v,visualDigest:undefined});
 return deepFreeze(v)}
module.exports={buildVisualCasualty};
