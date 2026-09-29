'use strict';
// R1 v4 PROPOSAL builder: derives the v2.1.0 scene package from the certified
// canonical v2.0.0 PACKAGE by exactly four additive changes (unit entity,
// unit containment relation, bag interior floor surface, owner-body binding)
// plus the version/requiredEntityIds/digest headers. Pre-admission proposal
// bytes only; admission remains the formal R1 review's call.
const {PACKAGE}=require('../../src/clean-runtime/school/scene-v2/package');
const {digest}=require('../../src/clean-runtime/contracts/canonical');
const SYN=require('../../src/clean-runtime/school/definitions/synthetic-training-unit-v1');
function buildV21(){
 const UB=SYN.UNIT_BODY.definition,FL=SYN.INTERIOR_FLOOR.definition,OB=SYN.OWNER_BODY.definition,BD=SYN.OWNER_BODY_BINDING.binding;
 const p=structuredClone(PACKAGE);
 p.scenePackageVersion='2.1.0';
 p.requiredEntityIds=[...p.requiredEntityIds,'synthetic-training-unit-v1'];
 const bag=p.entities.find(e=>e.entityId==='school-medical-bag');
 bag.physicalState.supportSurface={supportSurfaceId:FL.supportSurfaceId,surfaceRevision:FL.surfaceRevision,canonicalDigest:FL.canonicalDigest};
 p.entities.push({entityId:'synthetic-training-unit-v1',entityTypeId:'synthetic/training-unit',revision:1,lifecycleState:'ACTIVE',
  transform:{positionMicrounits:[-3000000,25000,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]},
  parentEntityId:null,
  physicalBodyRef:{recordId:UB.bodyDefinitionId,revision:UB.bodyRevision,digest:UB.canonicalDigest,proofGeometryDigest:UB.canonicalDigest},
  geometrySourceRef:{recordId:'gate-a-unit-authoring-001',revision:1,digest:UB.canonicalDigest,classification:'AUTHORED_NEW',lineageStatus:'AUTHORED_NEW'},
  participatesIn:['collision','support'],postureStateId:'rigid',
  physicalState:{active:true,surfaceId:FL.supportSurfaceId,orientationUpDot:1,supportNormalUpDot:1}});
 const contactRegionGeometry={contactRegionId:'unit-bottom-contact',kind:'HORIZONTAL_XZ_RECT',planeY:0,region:{minX:-100000,maxX:100000,minZ:-40000,maxZ:40000}};
 p.supportRelations.push({relationId:'synthetic:unit:bag-interior-floor',supportedEntityId:'synthetic-training-unit-v1',
  supportedBodyRef:{id:UB.bodyDefinitionId,revision:UB.bodyRevision,digest:UB.canonicalDigest},
  contactRegionRef:{bodyId:UB.bodyDefinitionId,bodyRevision:UB.bodyRevision,bodyDigest:UB.canonicalDigest,contactRegionId:'unit-bottom-contact'},
  contactRegionGeometry,contactRegionDigest:digest(contactRegionGeometry),
  contactRole:'GENERIC',requirement:'REQUIRED',supportSourceKind:'ENTITY_OWNED',boundWorldRevision:1,
  ownerEntityRef:{id:'school-medical-bag',revision:1},
  ownerBodyRef:{id:OB.bodyDefinitionId,revision:OB.bodyRevision,digest:OB.canonicalDigest},
  supportSurfaceRef:{id:FL.supportSurfaceId,revision:FL.surfaceRevision,digest:FL.canonicalDigest},
  surfaceId:FL.supportSurfaceId,contactNormal:{x:0,y:1,z:0},
  evidenceRefs:['gate-a-r1-v4-proposal','owner-r1-q1:wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EwRTNFRDUxRDZDQzAwNEU2NjcA']});
 p.ownerBodyBindings=[structuredClone(BD)];
 delete p.scenePackageDigest;
 p.scenePackageDigest=digest({...p,scenePackageDigest:undefined},'scenePackageDigest');
 return p}
module.exports={buildV21};
