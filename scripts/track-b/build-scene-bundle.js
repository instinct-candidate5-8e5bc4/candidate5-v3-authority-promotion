'use strict';
// TRACK B / B5 build step: emits visual-slice/scene-bundle.json, the single
// read-only input of the browser preview. All values are produced by the
// B1-B4 builders (authoritative-derived, integer microunits). The browser
// layer converts microunits -> meters DOWNSTREAM for display only.
const fs=require('node:fs'),path=require('node:path'),{execSync}=require('node:child_process'),
 {buildVisualSceneDescriptor}=require('../../src/clean-runtime/school/scene-v2/visual-descriptor'),
 {buildVisualSurfaceSet}=require('../../src/clean-runtime/school/scene-v2/visual-surfaces'),
 {buildVisualCasualty}=require('../../src/clean-runtime/school/scene-v2/visual-casualty'),
 {buildVisualEquipment}=require('../../src/clean-runtime/school/scene-v2/visual-equipment');
function git(cmd){try{return execSync('git '+cmd,{encoding:'utf8'}).trim()}catch{return 'UNKNOWN'}}
const descriptor=buildVisualSceneDescriptor(),surfaces=buildVisualSurfaceSet(),casualty=buildVisualCasualty(descriptor),equipment=buildVisualEquipment(descriptor);
const ok=descriptor.status==='COMMITTED'&&surfaces.status==='LINEAGE_EVIDENCED'&&casualty.status==='DIMENSIONED_TO_CERTIFIED_ENVELOPE'&&equipment.status==='DIMENSIONED_TO_CERTIFIED_BODIES';

function c2basis(){return JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/track-b/lifecycle-status-correction.json'),'utf8')).basis}
function c2hardStop(){return JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/track-b/lifecycle-status-correction.json'),'utf8')).hardStop}
const bundle={bundleVersion:'1.0.0',kind:'TRACK_B_VISUAL_SCENE_BUNDLE',generatedAt:new Date().toISOString(),
 git:{branch:git('rev-parse --abbrev-ref HEAD'),commit:git('rev-parse HEAD'),base:'7cd96d36'},
 banner:{title:'SCHOOL TREATMENT ROOM - VISUAL PREVIEW',warning:'VISUALS ARE NOT CERTIFIED PHYSICS',distinction:'Everything drawn here is a presentation-only projection of certified authoritative state. No physical truth is derived from pixels. Renderer values never feed authoritative state (ED-P2-02 downstream-only).'},
 inputs:{descriptorStatus:descriptor.status,descriptorDigest:descriptor.descriptorDigest,surfaceSetStatus:surfaces.status,surfaceSetDigest:surfaces.setDigest,casualtyStatus:casualty.status,casualtyDigest:casualty.visualDigest,equipmentStatus:equipment.status,equipmentDigest:equipment.visualDigest,sourcePackageDigest:descriptor.sourcePackage.scenePackageDigest,worldStateDigest:descriptor.worldRef.stateDigest},
 statusCaveats:(()=>{const c=JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/track-b/lifecycle-status-correction.json'),'utf8'));
  // STATUS-ONLY overlay (acceptance spec A): the separable lifecycle status
  // correction rides in bundle status fields + page status text. Engine
  // builders, anchors and digests stay byte-identical.
  const mk=k=>({entityId:c[k].entityId,gate:c[k].gate,gateResult:c[k].gateResult,verifiedForSlice:c[k].verifiedForSlice,reviewId:c[k].reviewId,reviewDecision:c[k].reviewDecision,groundedRecord:c[k].groundedRecord,caveat:c[k].caveat});
  return {casualty:mk('casualty'),chair:mk('chair')}})(),
 statusCorrection:{kind:'TRACK_B_LIFECYCLE_STATUS_CORRECTION',record:'docs/track-b/lifecycle-status-correction.json',basis:c2basis(),hardStop:c2hardStop()},
 declaredUnknowns:descriptor.declaredUnknowns,boundary:descriptor.boundary,
 microunitsPerWorldUnit:1000000,
 room:surfaces.surfaces,casualty,equipment,
 camera:{note:'Camera calibration formally belongs in the ScenePackage per the architecture decision; the certified ScenePackage has no camera field and was not modified. These are presentation-only defaults pending a future ScenePackage revision.',positionMicrounits:[4000000,3000000,6000000],lookAtMicrounits:[0,300000,0],fovDegrees:55},
 lighting:{note:'Visual-only claims; never physical evidence.',ambient:{colorHex:'0xbfd4e0',intensity:.55},key:{colorHex:'0xfff2dd',intensity:1.1,positionMicrounits:[3000000,5000000,2000000]},fill:{colorHex:'0xdde8ff',intensity:.35,positionMicrounits:[-4000000,3500000,4000000]}}};
if(!ok){bundle.status='REJECTED';bundle.reason={descriptor:descriptor.status,surfaces:surfaces.status,casualty:casualty.status,equipment:equipment.status}}else bundle.status='READY';
const out=path.join(__dirname,'../../visual-slice/scene-bundle.json');
fs.writeFileSync(out,JSON.stringify(bundle,null,1));
console.log(bundle.status, out);if(!ok)process.exit(1);
