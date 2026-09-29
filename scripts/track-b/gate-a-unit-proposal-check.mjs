'use strict';
// PROPOSAL-STAGE CHECK for the Gate A synthetic-unit containment draft (R1 v3).
// NOT gate evidence, NOT admission - deterministic proof that every proposed
// number is verified arithmetic and that every drafted record passes the REAL
// Gate A validators today, so review talks about executed validators instead
// of asserted definitions. All values integer microunits (ED-P2-02).
import {createRequire} from 'node:module';
const req=createRequire(import.meta.url);
const A=req('../../src/clean-runtime/authoring');
const BAG_CONTRACT=req('../../src/clean-runtime/school/school-physical-contract.js');
const V1=A.V1;
const checks=[];
const c=(name,ok,detail)=>{checks.push({name,ok});console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''))};

// ============ PART A: containment arithmetic (corrected volume) ============
const BAG={minX:-275000,maxX:275000,minY:-175000,maxY:175000,minZ:-175000,maxZ:175000}; // certified SCHOOL_BAG_BODY.geometry (RECOVERED r1)
const INTERIOR={minX:-250000,maxX:250000,minY:-150000,maxY:150000,minZ:-150000,maxZ:150000}; // proposed containment volume (25mm inset, 6 faces)
const FLOOR_Y=-150000; // layer-1 interior support floor plane (SUPPORT_SURFACE, chair-seat pattern)
const UNIT_DIMS=[200000,120000,80000];
function legality(unit){
 const r=[];
 const strict=[['PROTRUSION_X',INTERIOR.maxX-unit.maxX],['PROTRUSION_X',unit.minX-INTERIOR.minX],['PROTRUSION_Y',INTERIOR.maxY-unit.maxY],['PROTRUSION_Z',INTERIOR.maxZ-unit.maxZ],['PROTRUSION_Z',unit.minZ-INTERIOR.minZ]];
 for(const [code,gap] of strict)if(gap<=0)r.push(code);
 if(unit.minY>FLOOR_Y)r.push('CONTACT_GAP_FLOATING');
 if(unit.minY<FLOOR_Y)r.push('SUPPORT_PENETRATION');
 if(!(unit.minX>=INTERIOR.minX&&unit.maxX<=INTERIOR.maxX&&unit.minZ>=INTERIOR.minZ&&unit.maxZ<=INTERIOR.maxZ))r.push('FOOTPRINT_OUTSIDE_FLOOR_REGION');
 return r.length?{legal:false,codes:[...new Set(r)]}:{legal:true,codes:[]}}
function placed(cx,cy,cz,dims=UNIT_DIMS){const[dx,dy,dz]=dims;return{minX:cx-dx/2,maxX:cx+dx/2,minY:cy-dy/2,maxY:cy+dy/2,minZ:cz-dz/2,maxZ:cz+dz/2}}
const inside=(a,b)=>a.minX>=b.minX&&a.maxX<=b.maxX&&a.minY>=b.minY&&a.maxY<=b.maxY&&a.minZ>=b.minZ&&a.maxZ<=b.maxZ;
c('A1 interior strictly inside certified bag bounds (25mm on all 6 faces)',
 inside(INTERIOR,BAG)&&INTERIOR.minX-BAG.minX===25000&&BAG.maxX-INTERIOR.maxX===25000&&INTERIOR.minY-BAG.minY===25000&&BAG.maxY-INTERIOR.maxY===25000&&INTERIOR.minZ-BAG.minZ===25000&&BAG.maxZ-INTERIOR.maxZ===25000);
const unit=placed(0,-90000,0);
c('A2 unit placement LEGAL under proposed two-layer rule',legality(unit).legal===true);
c('A3 clearances: +X/-X 150mm, +Z/-Z 110mm, top 180mm, all >50mm',
 INTERIOR.maxX-unit.maxX===150000&&unit.minX-INTERIOR.minX===150000&&INTERIOR.maxZ-unit.maxZ===110000&&unit.minZ-INTERIOR.minZ===110000&&INTERIOR.maxY-unit.maxY===180000);
c('A4 layer-1 contact: bottom exactly on floor plane -150000, footprint 200x80 inside 500x300 region',
 unit.minY===FLOOR_Y&&(unit.maxX-unit.minX)===200000&&(unit.maxZ-unit.minZ)===80000&&(INTERIOR.maxX-INTERIOR.minX)===500000&&(INTERIOR.maxZ-INTERIOR.minZ)===300000);
const BAG_POS=[-3000000,175000,1000000]; // certified committed bag position
const unitWorld=[BAG_POS[0]+0,BAG_POS[1]-90000,BAG_POS[2]+0];
c('A5 world transform: unit center [-3000000,85000,1000000], bottom 25000, top 145000',
 unitWorld[0]===-3000000&&unitWorld[1]===85000&&unitWorld[2]===1000000&&unitWorld[1]-60000===25000&&unitWorld[1]+60000===145000);
const bagWorld={minX:BAG_POS[0]+BAG.minX,maxX:BAG_POS[0]+BAG.maxX,minY:BAG_POS[1]+BAG.minY,maxY:BAG_POS[1]+BAG.maxY,minZ:BAG_POS[2]+BAG.minZ,maxZ:BAG_POS[2]+BAG.maxZ};
const unitWorldAabb={minX:unitWorld[0]-100000,maxX:unitWorld[0]+100000,minY:unitWorld[1]-60000,maxY:unitWorld[1]+60000,minZ:unitWorld[2]-40000,maxZ:unitWorld[2]+40000};
c('A6 collision-cover invariant: unit world AABB strictly inside bag world AABB',
 inside(unitWorldAabb,bagWorld)&&!Object.keys(unitWorldAabb).some(k=>unitWorldAabb[k]===bagWorld[k]));
const N=[
 ['protrusion +X (center +150001)',placed(150001,-90000,0),'PROTRUSION_X'],
 ['protrusion -X (center -150001)',placed(-150001,-90000,0),'PROTRUSION_X'],
 ['protrusion +Z (center +110001)',placed(0,-90000,110001),'PROTRUSION_Z'],
 ['protrusion -Z (center -110001)',placed(0,-90000,-110001),'PROTRUSION_Z'],
 ['oversized unit through ceiling, contact intact (height 300002)',placed(0,1,0,[200000,300002,80000]),'PROTRUSION_Y'],
 ['floating 1mm above floor',placed(0,-89999,0),'CONTACT_GAP_FLOATING'],
 ['penetration 1mm below floor',placed(0,-90001,0),'SUPPORT_PENETRATION'],
];
for(const [name,u,code] of N){const r=legality(u);
 c('A-neg: '+name+' rejects with '+code,r.legal===false&&r.codes.includes(code),JSON.stringify(r.codes))}
c('A7 authoring guard: interior exceeding bag bounds is detectable',!inside({...INTERIOR,maxY:180000},BAG));

// ============ PART B: drafted records through the REAL Gate A validators ============
// B1: narrowly-scoped bag OWNER body definition (the engine's integration
// blocker). The certified bag body is RECOVERED with geometryDigest over a
// meter-scale AABB - it has no Gate A authoring shape (no bodyDefinitionId/
// canonicalDigest), and validateBody requires classification AUTHORED_NEW.
// So this is an AUTHORED_NEW re-expression, byte-bound to the certified
// recovered record by evidence refs; equivalence proven below. It serves ONLY
// support-surface/volume ownership - the Phase 2 path keeps SCHOOL_BAG_BODY.
const rawBagOwnerBody={schemaVersion:'1.0.0',bodyDefinitionId:'school/medical-bag-owner-body',bodyRevision:1,
 semanticType:'medical-bag',profileId:'school-medical-bag',postureDefinitionId:'rigid',postureSemanticType:'SYNTHETIC_POSTURE',
 units:{linear:V1.linearUnit,microunitsPerAuthoredUnit:V1.microunitsPerAuthoredUnit},
 coordinateFrame:{handedness:V1.handedness,axes:V1.axes,upAxis:V1.upAxis,forwardDirection:V1.forwardDirection,transformOrder:V1.transformOrder},
 localOrigin:{kind:'AUTHOR_DECLARED_CONTACT_FRAME',positionMicrounits:[0,0,0]},
 orientationContract:{mode:'IDENTITY_ONLY',canonical:V1.canonicalOrientation},
 components:[{componentId:'bag-shell',primitiveType:'AABB',participationRole:'BOTH',dimensionsMicrounits:[550000,350000,350000],localTransform:{translationMicrounits:[0,0,0],orientation:V1.canonicalOrientation}}],
 aggregateBounds:{minX:-275000,maxX:275000,minY:-175000,maxY:175000,minZ:-175000,maxZ:175000},
 phase2Projection:{kind:V1.phase2Projection,bounds:{minX:-275000,maxX:275000,minY:-175000,maxY:175000,minZ:-175000,maxZ:175000}},
 footprint:{kind:'XZ_RECT_UNION',regions:[{minX:-275000,maxX:275000,minZ:-175000,maxZ:175000}]},
 contactRegions:[{contactRegionId:'bag-floor-contact',kind:'HORIZONTAL_XZ_RECT',planeY:-175000,region:{minX:-275000,maxX:275000,minZ:-175000,maxZ:175000}}],
 supportCategories:[{supportCategoryId:'floor',supportSemanticType:'FLOOR',provenanceStatus:'RECOVERED',fixtureOnly:false}],
 geometrySource:{classification:'AUTHORED_NEW',sourceId:'gate-a-bag-owner-authoring-001'},
 authoringProvenance:{decisionId:'gate-a-bag-owner-authoring-001',sourceReferenceEvidenceRefs:[
  'certified-runtime-record:school-medical-bag-body revision 1',
  'certified-bag-geometry-digest:'+BAG_CONTRACT.SCHOOL_BAG_BODY.geometryDigest,
  'recovered-source:index.html#school-bag-lockers@'+BAG_CONTRACT.SCHOOL_BAG_BODY.sourceDigest]},
 priorRevisionDigest:null};
const bagBody=A.validateBody(rawBagOwnerBody);
c('B1 bag owner body VALIDATED by the real Gate A body validator',bagBody.status==='VALIDATED',bagBody.failure&&JSON.stringify(bagBody.failure));
if(bagBody.status==='VALIDATED'){
 const agg=bagBody.definition.aggregateBounds;
 c('B2 owner-body aggregate EXACTLY equals certified bag bounds x 1e6 (equivalence proof)',
  agg.minX===BAG.minX&&agg.maxX===BAG.maxX&&agg.minY===BAG.minY&&agg.maxY===BAG.maxY&&agg.minZ===BAG.minZ&&agg.maxZ===BAG.maxZ);
 // B3: bag owner ENTITY definition at the certified committed world position.
 const bagEntityDef={entityDefinitionId:'school/medical-bag-entity',entityRevision:1,
  physicalBodyRef:{id:bagBody.definition.bodyDefinitionId,revision:bagBody.definition.bodyRevision,digest:bagBody.definition.canonicalDigest},
  transform:{translationMicrounits:[-3000000,175000,1000000],orientation:V1.canonicalOrientation}};
 bagEntityDef.entityDigest=A.digest(bagEntityDef,'entityDigest');
 const ent=A.validateSupportEntity(bagEntityDef,bagBody.definition);
 c('B3 bag owner entity VALIDATED; transform == certified committed bag position',ent.status==='VALIDATED'
  &&JSON.stringify(bagEntityDef.transform.translationMicrounits)===JSON.stringify(BAG_CONTRACT.bagEntity().transform.positionMicrounits),
  ent.failure&&JSON.stringify(ent.failure));
 // B4: interior floor surface against the validated owner entity.
 const rawFloor={schemaVersion:'1.0.0',supportSurfaceId:'school/medical-bag-interior-floor',surfaceRevision:1,
  ownerDefinitionRef:{id:bagEntityDef.entityDefinitionId,revision:bagEntityDef.entityRevision,digest:bagEntityDef.entityDigest},
  supportSemanticType:'SUPPORT_SURFACE',transformBinding:'OWNER_TRANSLATION_IDENTITY_ORIENTATION',
  localPlane:{normal:[0,1000000,0],offsetMicrounits:-150000},
  localRegion:{minX:-250000,maxX:250000,minZ:-150000,maxZ:150000},
  contactRule:{contactRuleId:'full-footprint-bag-interior-floor',policy:'FULL_FOOTPRINT'},
  provenance:{classification:'AUTHORED_NEW',decisionId:'gate-a-unit-authoring-001'}};
 const surf=A.validateSupportSurface(rawFloor,bagEntityDef);
 c('B4 interior floor surface VALIDATED by the real support validator',surf.status==='VALIDATED',surf.failure&&JSON.stringify(surf.failure));
 if(surf.status==='VALIDATED'){
  const mat=A.materializeSupportSurface({staticModelRef:{id:BAG_CONTRACT.SCHOOL_SURFACE_MODEL_REF.id,revision:BAG_CONTRACT.SCHOOL_SURFACE_MODEL_REF.revision,digest:BAG_CONTRACT.SCHOOL_SURFACE_MODEL_REF.digest},
   owner:{entityDefinitionId:bagEntityDef.entityDefinitionId,entityRevision:bagEntityDef.entityRevision,entityDigest:bagEntityDef.entityDigest,transform:bagEntityDef.transform},
   surface:surf.definition});
  const rg=mat.region.allowed[0];
  c('B5 materialized floor: world planeY 0.025, region X[-3.25,-2.75] Z[0.85,1.15] (matches Part A world math)',
   mat.planeOrDepth.planeY===0.025&&rg.minX===-3.25&&rg.maxX===-2.75&&rg.minZ===0.85&&rg.maxZ===1.15,
   JSON.stringify({planeY:mat.planeOrDepth.planeY,region:rg}))}
 // B6: unit body draft through the real body validator (validator-lawful today).
 const rawUnitBody={schemaVersion:'1.0.0',bodyDefinitionId:'synthetic-training-unit-body-v1',bodyRevision:1,
  semanticType:'synthetic-training-unit',profileId:'synthetic-training-unit',postureDefinitionId:'rigid',postureSemanticType:'SYNTHETIC_POSTURE',
  units:{linear:V1.linearUnit,microunitsPerAuthoredUnit:V1.microunitsPerAuthoredUnit},
  coordinateFrame:{handedness:V1.handedness,axes:V1.axes,upAxis:V1.upAxis,forwardDirection:V1.forwardDirection,transformOrder:V1.transformOrder},
  localOrigin:{kind:'AUTHOR_DECLARED_CONTACT_FRAME',positionMicrounits:[0,0,0]},
  orientationContract:{mode:'IDENTITY_ONLY',canonical:V1.canonicalOrientation},
  components:[{componentId:'unit-box',primitiveType:'AABB',participationRole:'BOTH',dimensionsMicrounits:UNIT_DIMS,localTransform:{translationMicrounits:[0,60000,0],orientation:V1.canonicalOrientation}}],
  aggregateBounds:{minX:-100000,maxX:100000,minY:0,maxY:120000,minZ:-40000,maxZ:40000},
  phase2Projection:{kind:V1.phase2Projection,bounds:{minX:-100000,maxX:100000,minY:0,maxY:120000,minZ:-40000,maxZ:40000}},
  footprint:{kind:'XZ_RECT_UNION',regions:[{minX:-100000,maxX:100000,minZ:-40000,maxZ:40000}]},
  contactRegions:[{contactRegionId:'unit-bottom-contact',kind:'HORIZONTAL_XZ_RECT',planeY:0,region:{minX:-100000,maxX:100000,minZ:-40000,maxZ:40000}}],
  supportCategories:[{supportCategoryId:'bag-interior-floor',supportSemanticType:'SUPPORT_SURFACE',provenanceStatus:'AUTHORED_NEW',fixtureOnly:false}],
  geometrySource:{classification:'AUTHORED_NEW',sourceId:'gate-a-unit-authoring-001'},
  authoringProvenance:{decisionId:'gate-a-unit-authoring-001',sourceReferenceEvidenceRefs:['owner-decision:Option A 2026-09-30 (synthetic training unit, minimal scope)']},
  priorRevisionDigest:null};
 const unitBody=A.validateBody(rawUnitBody);
 c('B6 unit body draft VALIDATED by the real Gate A body validator',unitBody.status==='VALIDATED',unitBody.failure&&JSON.stringify(unitBody.failure));
 // B-negatives: real-validator rejections (stale/rotated/non-horizontal/partial).
 const staleEnt=A.validateSupportEntity({...bagEntityDef,physicalBodyRef:{...bagEntityDef.physicalBodyRef,digest:'0'.repeat(64)}},bagBody.definition);
 c('B-neg: entity with stale body digest rejects STALE_BODY_REVISION',staleEnt.status==='REJECTED'&&staleEnt.failure.code==='STALE_BODY_REVISION');
 const rotEnt=A.validateSupportEntity({...bagEntityDef,transform:{translationMicrounits:BAG_POS,orientation:[0,0,1000000,0]}},bagBody.definition);
 c('B-neg: rotated owner orientation rejects UNSUPPORTED_V1_CAPABILITY',rotEnt.status==='REJECTED'&&rotEnt.failure.code==='UNSUPPORTED_V1_CAPABILITY');
 const staleSurf=A.validateSupportSurface({...rawFloor,ownerDefinitionRef:{...rawFloor.ownerDefinitionRef,digest:'0'.repeat(64)}},bagEntityDef);
 c('B-neg: surface with stale owner digest rejects INVALID_SUPPORT_REFERENCE',staleSurf.status==='REJECTED'&&staleSurf.failure.code==='INVALID_SUPPORT_REFERENCE');
 const tiltedSurf=A.validateSupportSurface({...rawFloor,localPlane:{normal:[0,0,1000000],offsetMicrounits:-150000}},bagEntityDef);
 c('B-neg: non-horizontal floor plane rejects INVALID_SUPPORT_SURFACE',tiltedSurf.status==='REJECTED'&&tiltedSurf.failure.code==='INVALID_SUPPORT_SURFACE');
 const partialSurf=A.validateSupportSurface({...rawFloor,contactRule:{contactRuleId:'partial',policy:'PARTIAL_FOOTPRINT'}},bagEntityDef);
 c('B-neg: non-FULL_FOOTPRINT contact rule rejects INVALID_SUPPORT_SURFACE',partialSurf.status==='REJECTED'&&partialSurf.failure.code==='INVALID_SUPPORT_SURFACE');
 if(surf.status==='VALIDATED'){let threw=null;
  try{A.materializeSupportSurface({staticModelRef:{id:'x',revision:1,digest:'0'.repeat(64)},owner:{entityDefinitionId:bagEntityDef.entityDefinitionId,entityRevision:1,entityDigest:bagEntityDef.entityDigest,transform:{translationMicrounits:BAG_POS,orientation:[0,0,1000000,0]}},surface:surf.definition})}catch(e){threw=e}
  c('B-neg: materialization with rotated owner throws UNSUPPORTED_V1_CAPABILITY',threw&&threw.code==='UNSUPPORTED_V1_CAPABILITY')}
}
const fails=checks.filter(x=>!x.ok);
console.log('RESULT: '+(fails.length?`FAIL (${fails.length})`:`PASS - ${checks.length} checks`)+' (proposal-stage: real validators executed, NOT gate evidence)');
process.exit(fails.length?1:0);
