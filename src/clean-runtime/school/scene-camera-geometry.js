'use strict';
// Exact candidate geometry mechanics. Opaque content pins are rechecked.
// AABB exclusion is conservative. No motion parameters or camera FOV invented.
const {digest}=require('../contracts/canonical'),{deepFreeze,world}=require('../contracts/world-state');
const {buildV21}=require('../../../scripts/track-b/gate-a-r1v4-package-builder'),{instantiate}=require('./scene-v2/instantiate'),{model}=require('./scene-v2/package');
const {projectKnownBodyBounds}=require('./door-legality-adapter');
const keys=['minX','maxX','minY','maxY','minZ','maxZ'];
function valid(b){return b&&keys.every(k=>Number.isSafeInteger(b[k]))&&['X','Y','Z'].every(k=>b['min'+k]<b['max'+k])}
function contains(b,a){return keys.every(k=>k.startsWith('min')?a[k]>=b[k]:a[k]<=b[k])}
function separate(a,b){const gaps={};for(const x of ['X','Y','Z'])gaps[x]=Math.max(a['min'+x]-b['max'+x],b['min'+x]-a['max'+x],0);return {clear:Object.values(gaps).some(x=>x>0),axisGapsMicrounits:gaps}}
function translated(e){const b=projectKnownBodyBounds(e),t=e.transform;if(!b||!t||JSON.stringify(t.orientation)!=='[0,0,0,1]'||JSON.stringify(t.scaleMicrounits)!=='[1000000,1000000,1000000]'||t.positionMicrounits?.length!==3||t.positionMicrounits.some(x=>!Number.isSafeInteger(x)))throw Error('BODY_GEOMETRY_UNSUPPORTED');const r=Object.fromEntries(keys.map(k=>[k,b[k]+t.positionMicrounits['XYZ'.indexOf(k.slice(-1))]]));if(!valid(r))throw Error('BODY_BOUNDS_INVALID');return r}
function verifySwingContainment(packet){
 const s=packet.swingEnvelope,p=s?.parameters,v=s?.volumeMicrounits,h=p?.hingeAxis,leaf=model.surfaces.find(x=>x.surfaceId==='door')?.region.volumes[0];
 if(!leaf||!h||h.axisKind!=='VERTICAL_LINE'||p.openingDirection!=='INTO_ROOM_POSITIVE_Z'||p.sweepAngleDeg!==90)throw Error('SWING_CONVENTION_UNSUPPORTED');
 const w=p.leafWidthMicrounits,t=p.leafThicknessMicrounits,height=p.leafHeightMicrounits,R=p.sweepRadiusMicrounits?.recordedContaining;
 if(![w,t,height,R,h.xMicrounits,h.zMicrounits].every(Number.isSafeInteger)||w<=0||t<=0||t%2||height<=0||R<=0)throw Error('SWING_PARAMETERS_INVALID');
 const half=t/2,rad2=BigInt(w)**2n+BigInt(half)**2n;
 if(BigInt(R)**2n<rad2||BigInt(R-1)**2n>=rad2)throw Error('SWING_RADIUS_NOT_CEILING');
 if(h.xMicrounits!==leaf.minX*1e6||h.zMicrounits!==(leaf.minZ+leaf.maxZ)*500000||w!==Math.round((leaf.maxX-leaf.minX)*1e6)||t!==Math.round((leaf.maxZ-leaf.minZ)*1e6)||height!==leaf.maxY*1e6-leaf.minY*1e6)throw Error('SWING_LEAF_BINDING_MISMATCH');
 // For theta in [0,pi/2], cos/sin nonnegative. Each coordinate
 // >= -half; Cauchy-Schwarz gives each <= sqrt(w*w+half*half)<=R.
 // This is an analytic all-points proof, not a sampled grid claim.
 const expected={minX:h.xMicrounits-half,maxX:h.xMicrounits+R,minY:leaf.minY*1e6,maxY:leaf.maxY*1e6,minZ:h.zMicrounits-half,maxZ:h.zMicrounits+R};
 if(keys.some(k=>v[k]!==expected[k]))throw Error('SWING_ENVELOPE_NOT_CONTAINING');
 return {status:'ANALYTIC_CONTAINMENT_CONFIRMED',lowerMicrounits:-half,upperContainingMicrounits:R,radiusSquaredExact:String(rad2),method:'NONNEGATIVE_SIN_COS_LOWER_BOUND_AND_CAUCHY_SCHWARZ_UPPER_BOUND',witnessVerified:'X maximum dx=width,dz=-thickness/2; Z maximum dx=width,dz=+thickness/2'};
}
function validatePacket(packet){
 const e=packet?.extension,p=buildV21();if(!e||e.status!=='AUTHORED_CANDIDATE_NOT_ADMITTED'||e.baseScenePackageRef?.scenePackageDigest!==p.scenePackageDigest||e.surfaceModelDigest!==model.surfaceModelDigest)throw Error('EXTENSION_BASE_STALE');
 const refs=[['boundsDigest',packet.environmentPhysicalState?.sceneBounds],['doorStateDigest',packet.environmentPhysicalState?.doorStates],['cameraBodyRef',packet.cameraBody],['modePolicyRef',packet.modePolicy],['sweepSpecRef',packet.sweepSpec],['swingEnvelopeRef',packet.swingEnvelope]];
 for(const [k,v] of refs)if(!v||digest(v)!==(typeof e[k]==='object'?e[k].digest:e[k]))throw Error('EXTENSION_PIN_STALE:'+k);
 const initial=world({...instantiate(p).after,environmentPhysicalState:packet.environmentPhysicalState});if(initial.stateDigest!==e.worldDigest||initial.revision!==e.worldRevision)throw Error('EXTENDED_WORLD_STALE');
 const wall=id=>model.surfaces.find(x=>x.surfaceId===id).region.volumes[0],left=wall('left-wall'),right=wall('right-wall'),back=wall('back-wall');
 const walls=model.surfaces.filter(x=>x.type==='WALL').flatMap(x=>x.region.volumes);
 const derived={minX:Math.round(left.maxX*1e6),maxX:Math.round(right.minX*1e6),minY:Math.round(Math.min(...walls.map(v=>v.minY))*1e6),maxY:Math.round(Math.max(...walls.map(v=>v.maxY))*1e6),minZ:Math.round(back.maxZ*1e6),maxZ:Math.round(Math.max(left.maxZ,right.maxZ)*1e6)};
 if(digest(derived)!==digest(packet.environmentPhysicalState.sceneBounds))throw Error('DECLARED_BOUNDS_RULE_MISMATCH');
 if(packet.sweepSpec.cameraBodyDigest!=null&&packet.sweepSpec.cameraBodyDigest!==e.cameraBodyRef.digest)throw Error('SWEEP_CAMERA_BINDING_MISMATCH');
 if(digest(packet.cameraBody)!==e.cameraBodyRef.digest)throw Error('CAMERA_BODY_REF_MISMATCH');
 if(!valid(packet.environmentPhysicalState.sceneBounds)||!valid(packet.swingEnvelope.volumeMicrounits))throw Error('EXTENSION_BOUNDS_INVALID');
 return initial;
}
function evaluateCandidateVolumes({packet,proposedState,cameraTransform,previousCameraTransform}={}){
 const evidence={evaluatorContract:{version:'CANDIDATE_VOLUME_EVALUATOR@1.0.0',boundsRole:'DECLARED_MODEL_ENVELOPE_NOT_CLOSED_ROOM',missingSolids:['FRONT_WALL','CEILING'],contact:'CLOSED_BOUNDS_CONTAINMENT_ALLOWED;SOLID_CONTACT_REJECTED',microunits:'INTEGER_EXACT_AFTER_MODEL_DECIMAL_TO_MICROUNIT_ROUND',motion:'EXPLICIT_STRAIGHT_SEGMENT_TRANSLATION_ANY_YAW_CONSERVATIVE_ENVELOPE',cameraQuaternion:'XY_ZW_FINITE_YAW_ONLY_NORM_SQUARED_TOLERANCE_2^-50',displayOptics:'NOT_VERIFIED;AUTHORED_EVIDENCE_VOLUME_ONLY'},classification:'CANDIDATE_OPAQUE_VOLUME_CHECKS_NOT_ADMISSION',checks:[],limitations:['SCENE_ADMISSION_PENDING','AUTHORED_NOT_MEASURED_MOTION_GEOMETRY','CONSERVATIVE_AABB_EXCLUSION']};
 const out=(outcome,reason)=>deepFreeze({outcome,reason,evidence,evidenceDigest:digest(evidence)});
 try{
  const initial=validatePacket(packet);evidence.swingContainment=verifySwingContainment(packet);if(!proposedState||proposedState.worldId!==initial.worldId)return out('UNKNOWN','WORLD_IDENTITY_MISSING');
  if(digest(proposedState.environmentPhysicalState)!==digest(packet.environmentPhysicalState))return out('UNKNOWN','ENVIRONMENT_RECORDS_CHANGED');
  const b=packet.environmentPhysicalState.sceneBounds,swing=packet.swingEnvelope.volumeMicrounits;
  if(!contains(b,swing))return out('FAIL','SWING_ENVELOPE_OUTSIDE_BOUNDS');
  for(const entity of Object.values(proposedState.entities).sort((a,b)=>a.entityId.localeCompare(b.entityId))){if(['REMOVED','CONSUMED'].includes(entity.lifecycleState))continue;const a=translated(entity);if(!contains(b,a))return out('FAIL','BODY_OUTSIDE_SCENE_BOUNDS');const c=separate(a,swing);evidence.checks.push({kind:'BODY_VS_AUTHORED_SWING_AABB',entityId:entity.entityId,...c});if(!c.clear)return out('FAIL','AUTHORED_SWING_BODY_COLLISION')}
  // Opaque candidate swept AABB must also clear static solids except its leaf.
  for(const s of model.surfaces.filter(s=>['WALL','OBSTACLE'].includes(s.type)))for(const v of s.region.volumes){const a=Object.fromEntries(keys.map(k=>[k,v[k]*1e6]));const c=separate(swing,a);evidence.checks.push({kind:'SWING_VS_STATIC_SOLID',surfaceId:s.surfaceId,...c});if(!c.clear)return out('FAIL','AUTHORED_SWING_STATIC_COLLISION')}
  if(!cameraTransform)return out('UNKNOWN','CAMERA_TRANSFORM_MISSING');
  if(packet.modePolicy.debug||packet.modePolicy.kind!=='EVIDENCE_ONLY'||!packet.sweepSpec.waypoints.some(w=>digest(w.transform)===digest(cameraTransform)))return out('UNKNOWN','CAMERA_NOT_AUTHORED_WAYPOINT');
  for(const t of [cameraTransform,previousCameraTransform].filter(Boolean)){const q=t.orientation;if(!Array.isArray(q)||q.length!==4||q.some(x=>!Number.isFinite(x))||q[0]!==0||q[2]!==0||Math.abs(q.reduce((a,x)=>a+x*x,0)-1)>2**-50)return out('UNKNOWN','CAMERA_QUATERNION_INVALID');}
  const p=cameraTransform.positionMicrounits,r=cameraTransform.nearPlaneMicrounits,body=packet.cameraBody;
  if(p?.length!==3||p.some(x=>!Number.isSafeInteger(x))||!Number.isSafeInteger(r)||r<=0||r!==body.nearPlaneMicrounits)return out('UNKNOWN','CAMERA_TRANSFORM_INVALID');
  if(body.bodyKind!=='CONSERVATIVE_FRUSTUM_CONTAINING_ORIENTED_BOX')return out('UNKNOWN','FULL_NEAR_PLANE_GEOMETRY_MISSING');
  const h=body.conservativeVolume?.halfExtentsMicrounits;
  if(!h||!['halfWidth','halfHeight','halfDepth'].every(k=>Number.isSafeInteger(h[k])&&h[k]>0)||h.halfDepth!==r/2)return out('UNKNOWN','CAMERA_BODY_INVALID');
  const from=previousCameraTransform?.positionMicrounits||p;if(from.length!==3||from.some(x=>!Number.isSafeInteger(x)))return out('UNKNOWN','CAMERA_PATH_INVALID');
  if(previousCameraTransform&&!packet.sweepSpec.waypoints.some(w=>digest(w.transform)===digest(previousCameraTransform)))return out('UNKNOWN','CAMERA_PATH_START_NOT_AUTHORED');
  // Orientation-independent L1 envelope encloses the authored yaw OBB at
  // every angle. Extra near distance gives conservative near-plane clearance.
  // The swept AABB of this envelope encloses a straight segment translation
  // plus ANY yaw along the segment; false rejects are allowed, never tunneling.
  const horizontal=r/2+h.halfWidth+h.halfDepth+r,vertical=h.halfHeight+r;
  const path={};for(let i=0;i<3;i++){const radius=i===1?vertical:horizontal;path['min'+'XYZ'[i]]=Math.min(p[i],from[i])-radius;path['max'+'XYZ'[i]]=Math.max(p[i],from[i])+radius}
  evidence.cameraVolumeDerivation={kind:'CONSERVATIVE_YAW_OBB_L1_ENVELOPE_PLUS_NEAR_CLEARANCE',horizontalRadiusMicrounits:horizontal,verticalRadiusMicrounits:vertical,motion:'STRAIGHT_SEGMENT_TRANSLATION_ANY_YAW',falseRejectionPossible:true};
  const floor=model.surfaces.find(s=>s.type==='FLOOR');if(!floor||floor.planeOrDepth?.kind!=='PLANE'||!floor.region.allowed.some(a=>path.minX>=Math.round(a.minX*1e6)&&path.maxX<=Math.round(a.maxX*1e6)&&path.minZ>=Math.round(a.minZ*1e6)&&path.maxZ<=Math.round(a.maxZ*1e6)))return out('FAIL','CAMERA_FOOTPRINT_OUTSIDE_SEMANTIC_FLOOR');
  if(path.minY<Math.round(floor.planeOrDepth.planeY*1e6))return out('FAIL','CAMERA_BELOW_SEMANTIC_FLOOR');
  if(!contains(b,path))return out('FAIL','CAMERA_VOLUME_PATH_OUTSIDE_BOUNDS');
  const solids=[{id:'authored-swing',a:swing},...model.surfaces.filter(s=>['WALL','OBSTACLE','DOOR_OR_OPENING'].includes(s.type)).flatMap(s=>s.region.volumes.map(v=>({id:s.surfaceId,a:Object.fromEntries(keys.map(k=>[k,v[k]*1e6]))}))),...Object.values(proposedState.entities).filter(e=>!['REMOVED','CONSUMED'].includes(e.lifecycleState)).map(e=>({id:e.entityId,a:translated(e)}))];
  for(const s of solids){const c=separate(path,s.a);evidence.checks.push({kind:'CAMERA_VOLUME_PATH_VS_SOLID',id:s.id,...c});if(!c.clear)return out('FAIL','CAMERA_VOLUME_PATH_COLLISION')}
  evidence.componentVerdict='CANDIDATE_VOLUMES_CLEAR';return out('UNKNOWN','SCENE_ADMISSION_PENDING');
 }catch(e){evidence.error=e.message;return out('UNKNOWN','CANDIDATE_AUTHORITY_INCOMPLETE')}
}
module.exports={validatePacket,verifySwingContainment,evaluateCandidateVolumes};
