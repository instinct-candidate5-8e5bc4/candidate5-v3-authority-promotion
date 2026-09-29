'use strict';
// TRACK B / B-W5 build step: emits visual-slice/entity-body-map.json, the
// versioned data table that binds every renderable entity to its physical
// body record, layout group and bounds. Derived from the SAME live certified
// builders as the scene bundle (read-only); never hand-edited. Unmapped
// entity = NO VISUAL ACTION (fail-closed). Synthetic-training entries are a
// distinct labeled type that can NEVER resolve to a clinical body region:
// medical meaning of examine(head/airway/chest/wrist/abdomen/leg) is frozen
// and owned by the authoritative engine; this table defines NO region
// semantics for anything.
const fs=require('node:fs'),path=require('node:path'),{execSync}=require('node:child_process'),
 {buildVisualSceneDescriptor}=require('../../src/clean-runtime/school/scene-v2/visual-descriptor'),
 {buildVisualCasualty}=require('../../src/clean-runtime/school/scene-v2/visual-casualty'),
 {buildVisualEquipment}=require('../../src/clean-runtime/school/scene-v2/visual-equipment'),
 {buildVisualSurfaceSet}=require('../../src/clean-runtime/school/scene-v2/visual-surfaces');
function git(cmd){try{return execSync('git '+cmd,{encoding:'utf8'}).trim()}catch{return 'UNKNOWN'}}
const descriptor=buildVisualSceneDescriptor(),casualty=buildVisualCasualty(descriptor),equipment=buildVisualEquipment(descriptor),surfaces=buildVisualSurfaceSet();
const ok=descriptor.status==='COMMITTED'&&casualty.status==='DIMENSIONED_TO_CERTIFIED_ENVELOPE'&&equipment.status==='DIMENSIONED_TO_CERTIFIED_BODIES';
const pins=JSON.parse(fs.readFileSync(path.join(__dirname,'../../visual-slice/engine/pins.json'),'utf8'));
const ANCHORS={
 sourcePackageDigest:descriptor.sourcePackage.scenePackageDigest,
 worldStateDigest:descriptor.worldRef.stateDigest,
 descriptorDigest:descriptor.descriptorDigest,
 surfaceModelPin:{repoPath:pins.inlined[0].repoPath,sha256:pins.inlined[0].sha256,bytes:pins.inlined[0].bytes}};
const FROZEN_CLINICAL_SEMANTICS={
 owner:'AUTHORITATIVE_ENGINE',
 note:'examine(head/airway/chest/wrist/abdomen/leg) medical meaning is frozen and owned by the authoritative engine. This visual table defines NO body-region semantics and MUST NOT be extended with any.'};
function bodyEntry(entityRef,entryType,layoutGroup,boundsMicrounits,sourceAnchor,extra={}){
 return Object.assign({entityId:entityRef.entityId,entryType,layoutGroup,
  physicalBodyRef:entityRef.physicalBodyRef,boundsMicrounits,sourceAnchor},extra)}
const map={mapVersion:'1.0.0',kind:'TRACK_B_ENTITY_BODY_MAP',generatedAt:new Date().toISOString(),
 git:{branch:git('rev-parse --abbrev-ref HEAD'),commit:git('rev-parse HEAD')},
 policy:'Every visual entity resolves through this table ONLY. Unknown or unmapped entity = NO VISUAL ACTION (fail-closed). No default mapping, no substitution, no inference from names or meshes.',
 anchors:ANCHORS,
 entryTypes:{
  CLINICAL_SUBJECT:'A patient body. clinicalSubjectOf() may return this entry. Region semantics remain engine-owned and frozen (see clinicalSemantics).',
  EQUIPMENT:'Certified equipment body. NEVER resolvable as a clinical subject.',
  ENVIRONMENT:'Room/surface geometry. NEVER resolvable as a clinical subject.',
  SYNTHETIC_TRAINING:'Labeled temporary integration-bridge entity (Option A). MUST NEVER carry clinicalBodyRegion/bodyRegions/clinicalSubject fields and NEVER resolve to a real medical body region or action. synthetic-training-unit-v1 is the only one; introduced for the B-W11 interim bridge (contract v0.3), explicitly UNCERTIFIED until Gate A admission.'},
 entities:{
  'school-casualty-adult-v1':bodyEntry(casualty.entityRef,'CLINICAL_SUBJECT','casualty',casualty.envelopeMicrounits,
   {visualDigest:casualty.visualDigest,bodyDigest:casualty.entityRef.physicalBodyRef.digest},
   {clinicalSemantics:FROZEN_CLINICAL_SEMANTICS}),
  'school-treatment-chair':bodyEntry(equipment.chair.entityRef,'EQUIPMENT','chair',equipment.chair.envelopeMicrounits,
   {visualDigest:equipment.visualDigest,bodyDigest:equipment.chair.entityRef.physicalBodyRef.digest},
   {supportSurfaceRef:equipment.chair.entityRef.supportSurfaceRef}),
  'school-medical-bag':bodyEntry(equipment.bag.entityRef,'EQUIPMENT','bag',equipment.bag.geometryMicrounits,
   {visualDigest:equipment.visualDigest,bodyDigest:equipment.bag.entityRef.physicalBodyRef.digest}),
  'school-treatment-room-v1':{entityId:'school-treatment-room-v1',entryType:'ENVIRONMENT',layoutGroup:'room',
   boundsMicrounits:null,sourceAnchor:{surfaceSetDigest:surfaces.setDigest,surfaceModelPinSha256:pins.inlined[0].sha256},
   note:'Room surfaces are lineage-evidenced presentation geometry, not entities with physical body records.'},
  'synthetic-training-unit-v1':{entityId:'synthetic-training-unit-v1',entryType:'SYNTHETIC_TRAINING',layoutGroup:'syntheticUnit',
   physicalBodyRef:null,
   boundsMicrounits:{minX:-100000,maxX:100000,minY:0,maxY:120000,minZ:-40000,maxZ:40000},
   sourceAnchor:{proposalDoc:'docs/track-b/gate-a-synthetic-unit-visual-asset-proposal.md'},
   gateAStatus:'PROPOSED_NOT_ADMITTED',
   presentationOnly:true,
   note:'B-W11 interim presentation bridge (contract v0.3). Bounds are the PROPOSED Gate A draft (R1 v3) - presentation-only until Gate A admission; this entry carries no physical authority and zero clinical fields. publicUseState AVAILABLE/RESERVED/CONSUMED present committed projections, never decide them.'}}};
if(!ok){console.error('REJECTED: builders not in expected status');process.exit(1)}
const out=path.join(__dirname,'../../visual-slice/entity-body-map.json');
fs.writeFileSync(out,JSON.stringify(map,null,1));
console.log('READY',out);
