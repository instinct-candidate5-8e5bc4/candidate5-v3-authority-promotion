'use strict';
// Offline NEW scene-semantic proposal. No landed model change or admission inheritance.
const {digest,deepFreeze}=require('../../contracts/canonical');
const {model}=require('../scene-v2/package');
const G=require('../scene-camera-geometry');
const {projectKnownBodyBounds}=require('../door-legality-adapter');
const keys=['minX','maxX','minY','maxY','minZ','maxZ'];
const separate=(a,b)=>['X','Y','Z'].some(k=>a['max'+k]<b['min'+k]||b['max'+k]<a['min'+k]);
function preparePassableDoor({packet,...extra}={}){
 if(Object.keys(extra).length)throw Error('EXTRA_INPUT_FORBIDDEN');G.validatePacket(packet);
 const micro=v=>Object.fromEntries(keys.map(k=>[k,Math.round(v[k]*1e6)])),back=micro(model.surfaces.find(s=>s.surfaceId==='back-wall').region.volumes[0]),leaf=micro(model.surfaces.find(s=>s.surfaceId==='door').region.volumes[0]);
 const frameThickness=80000,margin=100000,hingeSideMargin=160000,opening={minX:leaf.minX-hingeSideMargin,maxX:leaf.maxX+margin,minY:back.minY,maxY:leaf.maxY+margin,minZ:back.minZ,maxZ:back.maxZ};
 const wallSegments=[{...back,maxX:opening.minX},{...back,minX:opening.maxX},{...back,minX:opening.minX,maxX:opening.maxX,minY:opening.maxY}];
 const frame=[{...opening,maxX:opening.minX+frameThickness},{...opening,minX:opening.maxX-frameThickness},{...opening,minY:opening.maxY-frameThickness}];
 const pivot={xMicrounits:leaf.minX,yMicrounits:leaf.minY,zMicrounits:(back.minZ+back.maxZ)/2},thickness=leaf.maxZ-leaf.minZ,width=leaf.maxX-leaf.minX;
 const closedLeaf={...leaf,minZ:pivot.zMicrounits-thickness/2,maxZ:pivot.zMicrounits+thickness/2};
 const openLeaf={minX:pivot.xMicrounits-thickness/2,maxX:pivot.xMicrounits+thickness/2,minY:leaf.minY,maxY:leaf.maxY,minZ:pivot.zMicrounits,maxZ:pivot.zMicrounits+width};
 const apron={kind:'NEW_BOUNDED_LANDING_APRON_NOT_EXISTING_CORRIDOR',minX:opening.minX,maxX:opening.maxX,minZ:back.minZ-(opening.maxX-opening.minX),maxZ:back.maxZ,planeYMicrounits:Math.round(model.surfaces.find(s=>s.surfaceId==='floor').planeOrDepth.planeY*1e6),depthRule:'OPENING_WIDTH_BEYOND_OUTER_WALL_FACE'};
 const retainedStaticSolids=model.surfaces.filter(s=>!['back-wall','door','floor'].includes(s.surfaceId)).flatMap(s=>s.region.volumes.map(v=>({surfaceId:s.surfaceId,bounds:micro(v)})));
 const proposal={kind:'NEW_PASSABLE_DOOR_SURFACE_PROPOSAL_NOT_ADMITTED',originalSurfaceModelDigest:model.surfaceModelDigest,packetDigest:digest(packet),designDimensionsMicrounits:{frameThickness,oppositeAndHeaderMargin:margin,hingeSideMargin,openLeafToJambClearance:20000},opening,wallSegments,frame,pivot,closedLeaf,openLeaf,landingApron:apron,retainedStaticSolids,declaredDoorStates:['CLOSED','OPEN'],limitations:['NEW_SCENE_GEOMETRY_REQUIRES_OWN_REVIEW_WORLD_AND_ADMISSION','LEAF_RELOCATED_TO_WALL_PLANE_NEW_GEOMETRY_NOT_OLD_SWEEP_PROOF','NO_SETDOORSTATE_COMMIT_REPLAY_OR_CONSUMER','DISCRETE_STATES_ONLY_NO_SWING_CONCURRENT_CAMERA_PROOF','APRON_IS_PROPOSED_DESTINATION_OWNER_ACTIVATION_DECISION_REQUIRED','NO_RENDER_GAMEPLAY_CLINICAL_PRODUCTION_ACTIVATION_A8_SEPARATE']};return deepFreeze({...proposal,proposalDigest:digest(proposal)});
}
function inspectDoorPassage({packet,proposal,doorState,...extra}={}){
 const fail=reason=>deepFreeze({status:'UNKNOWN',reason});
 try{if(Object.keys(extra).length)return fail('EXTRA_INPUT_FORBIDDEN');if(digest(proposal)!==digest(preparePassableDoor({packet})))return fail('PROPOSAL_NOT_EXACT');if(!['CLOSED','OPEN'].includes(doorState))return fail('DOOR_STATE_UNKNOWN');
 const h=packet.cameraBody.conservativeVolume.halfExtentsMicrounits,r=packet.cameraBody.nearPlaneMicrounits;const sq=BigInt(h.halfWidth)**2n+BigInt(h.halfHeight)**2n+BigInt(h.halfDepth)**2n;let lo=0n,hi=BigInt(h.halfWidth+h.halfHeight+h.halfDepth);while(lo<hi){const mid=(lo+hi)/2n;if(mid*mid>=sq)hi=mid;else lo=mid+1n}const radius=Number(lo)+r/2+r;
 // Conservative authored camera envelope as in the existing evaluator, not first-person body admission.
 const centerX=(proposal.opening.minX+proposal.opening.maxX)/2,centerY=1600000,path={minX:centerX-radius,maxX:centerX+radius,minY:centerY-radius,maxY:centerY+radius,minZ:proposal.landingApron.minZ+radius,maxZ:-2800000+radius};
 const aperture={minX:proposal.frame[0].maxX,maxX:proposal.frame[1].minX,minY:proposal.opening.minY,maxY:proposal.frame[2].minY};
 if(path.minX<aperture.minX||path.maxX>aperture.maxX||path.minY<aperture.minY||path.maxY>aperture.maxY)return fail('AUTHORED_CAMERA_ENVELOPE_DOES_NOT_FIT_APERTURE');
 const floor=model.surfaces.find(s=>s.surfaceId==='floor'),room=floor.region.allowed[0],a=proposal.landingApron;
 if(path.minY<a.planeYMicrounits||path.minZ<a.minZ||path.maxZ>Math.round(room.maxZ*1e6)||path.minX<a.minX||path.maxX>a.maxX||a.maxZ<Math.round(room.minZ*1e6))return fail('FLOOR_UNION_OR_BOUNDARY_NOT_COVERED');
 const entities=Object.values(G.validatePacket(packet).entities).filter(e=>!['REMOVED','CONSUMED'].includes(e.lifecycleState)).map(e=>{const b=projectKnownBodyBounds(e);if(!b||JSON.stringify(e.transform.orientation)!=='[0,0,0,1]'||JSON.stringify(e.transform.scaleMicrounits)!=='[1000000,1000000,1000000]')throw Error('ENTITY_GEOMETRY_UNSUPPORTED');return Object.fromEntries(keys.map(k=>[k,b[k]+e.transform.positionMicrounits['XYZ'.indexOf(k.slice(-1))]]))});
 const solids=[...entities,...proposal.wallSegments,...proposal.frame,...proposal.retainedStaticSolids.map(s=>s.bounds),doorState==='OPEN'?proposal.openLeaf:proposal.closedLeaf],collisions=solids.map((b,i)=>({index:i,clear:separate(path,b)})).filter(c=>!c.clear);
 return deepFreeze({status:doorState==='OPEN'&&collisions.length===0?'DISCRETE_OPEN_PASSAGE_EVIDENCE_NOT_ADMITTED':doorState==='CLOSED'&&collisions.length===1&&collisions[0].index===solids.length-1?'DISCRETE_CLOSED_LEAF_BLOCKS_PASSAGE_EVIDENCE_NOT_ADMITTED':'UNKNOWN',doorState,proposalDigest:proposal.proposalDigest,pathBoundsMicrounits:path,cameraEnvelopeRadiusMicrounits:radius,collisions,floorPlaneMicrounits:a.planeYMicrounits,operationalStatus:'UNKNOWN',limitations:proposal.limitations});
 }catch{return fail('PASSAGE_PREPARATION_INVALID')}
}
module.exports={preparePassableDoor,inspectDoorPassage};
