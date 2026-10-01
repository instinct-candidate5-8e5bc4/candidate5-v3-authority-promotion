'use strict';
// Offline authored first-person envelope/path preparation, NOT gameplay movement permission.
const {digest,deepFreeze}=require('../../contracts/canonical');
const {model}=require('../scene-v2/package');
const D=require('../passable-door-preparation/candidate');
const G=require('../scene-camera-geometry');
const {projectKnownBodyBounds}=require('../door-legality-adapter');
const keys=['minX','maxX','minY','maxY','minZ','maxZ'];
function inspectNavigationPath({packet,doorProposal,doorState,from,to,...extra}={}){
 const out=(status,reason,detail={})=>deepFreeze({status,reason,classification:'NAVIGATION_PREPARATION_NOT_ADMITTED',operationalStatus:'UNKNOWN',...detail});
 try{
  if(Object.keys(extra).length)return out('UNKNOWN','EXTRA_INPUT_FORBIDDEN');
  if(digest(doorProposal)!==digest(D.preparePassableDoor({packet})))return out('UNKNOWN','DOOR_PROPOSAL_NOT_EXACT');
  if(!['CLOSED','OPEN'].includes(doorState))return out('UNKNOWN','DOOR_STATE_UNKNOWN');
  if(![from,to].every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isSafeInteger)))return out('UNKNOWN','POSITION_NOT_EXACT');
  const h=packet.cameraBody.conservativeVolume.halfExtentsMicrounits,r=packet.cameraBody.nearPlaneMicrounits,sq=BigInt(h.halfWidth)**2n+BigInt(h.halfHeight)**2n+BigInt(h.halfDepth)**2n;let lo=0n,hi=BigInt(h.halfWidth+h.halfHeight+h.halfDepth);while(lo<hi){const m=(lo+hi)/2n;if(m*m>=sq)hi=m;else lo=m+1n}const radius=Number(lo)+r/2+r,path={};
  for(let i=0;i<3;i++){path['min'+'XYZ'[i]]=Math.min(from[i],to[i])-radius;path['max'+'XYZ'[i]]=Math.max(from[i],to[i])+radius}
  const floor=model.surfaces.find(s=>s.surfaceId==='floor');if(floor.planeOrDepth.kind!=='PLANE')return out('UNKNOWN','FLOOR_KIND_UNSUPPORTED');const floorY=Math.round(floor.planeOrDepth.planeY*1e6);if(path.minY<floorY)return out('BLOCKED_EVIDENCE_ONLY','BELOW_AUTHORITATIVE_FLOOR',{floorPlaneMicrounits:floorY});
  const apron=doorProposal.landingApron,rects=floor.region.allowed.map(a=>({minX:Math.round(a.minX*1e6),maxX:Math.round(a.maxX*1e6),minZ:Math.round(a.minZ*1e6),maxZ:Math.round(a.maxZ*1e6)})).concat([{minX:apron.minX,maxX:apron.maxX,minZ:apron.minZ,maxZ:apron.maxZ}]);
  // Exact rectangular sweep footprint coverage by union: partition at every Z boundary.
  const zs=[...new Set([path.minZ,path.maxZ,...rects.flatMap(a=>[a.minZ,a.maxZ]).filter(z=>z>path.minZ&&z<path.maxZ)])].sort((a,b)=>a-b);
  for(let i=1;i<zs.length;i++){const ranges=rects.filter(a=>a.minZ<=zs[i-1]&&a.maxZ>=zs[i]).map(a=>[a.minX,a.maxX]).sort((a,b)=>a[0]-b[0]);let covered=path.minX;for(const [a,b] of ranges){if(a>covered)break;covered=Math.max(covered,b)}if(covered<path.maxX)return out('BLOCKED_EVIDENCE_ONLY','FLOOR_FOOTPRINT_OR_BOUNDARY_NOT_COVERED')}
  const wallTop=Math.min(...model.surfaces.filter(s=>s.type==='WALL').flatMap(s=>s.region.volumes.map(v=>Math.round(v.maxY*1e6))));if(path.maxY>wallTop)return out('BLOCKED_EVIDENCE_ONLY','DECLARED_MODEL_HEIGHT_EXCEEDED');
  const entities=Object.values(G.validatePacket(packet).entities).filter(e=>!['REMOVED','CONSUMED'].includes(e.lifecycleState)).map(e=>{const b=projectKnownBodyBounds(e);if(!b||JSON.stringify(e.transform.orientation)!=='[0,0,0,1]'||JSON.stringify(e.transform.scaleMicrounits)!=='[1000000,1000000,1000000]')throw Error('ENTITY_UNSUPPORTED');return {id:e.entityId,bounds:Object.fromEntries(keys.map(k=>[k,b[k]+e.transform.positionMicrounits['XYZ'.indexOf(k.slice(-1))]]))}});
  const solids=[...entities,...doorProposal.wallSegments.map((bounds,i)=>({id:'wall:'+i,bounds})),...doorProposal.frame.map((bounds,i)=>({id:'frame:'+i,bounds})),...doorProposal.retainedStaticSolids.map(s=>({id:s.surfaceId,bounds:s.bounds})),{id:'declared-door:'+doorState,bounds:doorState==='OPEN'?doorProposal.openLeaf:doorProposal.closedLeaf}];
  const hit=solids.find(s=>!['X','Y','Z'].some(k=>path['max'+k]<s.bounds['min'+k]||s.bounds['max'+k]<path['min'+k]));
  return out(hit?'BLOCKED_EVIDENCE_ONLY':'PATH_CLEAR_EVIDENCE_ONLY_NOT_ADMITTED',hit?'SWEPT_ENVELOPE_SOLID_CONTACT':'CONSERVATIVE_SWEPT_ENVELOPE_CLEAR',{hitSolid:hit?.id||null,pathBoundsMicrounits:path,cameraEnvelopeRadiusMicrounits:radius,floorPlaneMicrounits:floorY,declaredDoorState:doorState,doorStateAuthority:doorState==='OPEN'?'HYPOTHETICAL_NOT_APPROVED_ACTIVATION':'CLOSED_PREPARATION_BASELINE',limitations:['NEW_GEOMETRY_NOT_REGISTERED_OR_WORLD_ADMITTED','CALLER_DECLARED_PATH_STATE_NOT_COMMITTED_NAVIGATION','CONSERVATIVE_AABB_FALSE_REJECTION_POSSIBLE','NO_CONTROL_INPUT_RENDER_CLIPPING_PIXEL_OR_GENERAL_GAMEPLAY_PROOF','OPEN_HYPOTHETICAL_ONLY_OWNER_ACTIVATION_PENDING','NO_RUNTIME_CONSUMER_OR_PRODUCTION_CLINICAL_UNLOCK']});
 }catch{return out('UNKNOWN','NAVIGATION_INPUT_INVALID_OR_INCOMPLETE')}
}
module.exports={inspectNavigationPath};
