'use strict';
// Additive new-scene definition/genesis preparation. No inherited admission or mutation runtime.
const {digest,deepFreeze}=require('../../contracts/canonical');
const {world}=require('../../contracts/world-state');
const {replay}=require('../../events/replay');
const {model:oldModel}=require('../scene-v2/package');
const D=require('../passable-door-preparation/candidate');
function definition(packet){
 const p=D.preparePassableDoor({packet}),surfaces=structuredClone(oldModel.surfaces.filter(s=>!['back-wall','door'].includes(s.surfaceId)));
 const boxes=(id,type,volumes)=>({surfaceId:id,type,region:{allowed:[],volumes:volumes.map((v,i)=>({volumeId:id+':'+i,...Object.fromEntries(Object.entries(v).map(([k,x])=>[k,x/1e6]))}))},confidence:'NEW_AUTHORED_PROPOSAL_NOT_ADMITTED'});
 surfaces.push(boxes('back-wall-opening','WALL',p.wallSegments),boxes('door-frame','OBSTACLE',p.frame));
 const floor=surfaces.find(s=>s.surfaceId==='floor');floor.region.allowed.push({regionId:'proposed-landing-apron',minX:p.landingApron.minX/1e6,maxX:p.landingApron.maxX/1e6,minZ:p.landingApron.minZ/1e6,maxZ:p.landingApron.maxZ/1e6});
 const body={surfaceModelId:'school-passable-door-proposal',revision:1,units:'METERS',surfaces,doorDefinition:{doorId:'school-authoritative-door-proposal',pivot:p.pivot,closedLeaf:p.closedLeaf,openLeaf:p.openLeaf,designDimensionsMicrounits:p.designDimensionsMicrounits},provenance:{kind:'NEW_SCENE_SEMANTIC_PROPOSAL',originalSurfaceModelDigest:oldModel.surfaceModelDigest,doorProposalDigest:p.proposalDigest},limitations:['NO_ADMISSION_INHERITANCE','NO_PATIENT_ENTITY_SUPPORT_COMMIT_PROOF','NO_OPEN_COMMAND_SWING_OR_CONCURRENT_CAMERA_PROOF','APRON_DESTINATION_PROPOSED_OWNER_DECISION_OPEN','NO_RUNTIME_RENDER_NAVIGATION_OR_PRODUCTION_ACTIVATION']};return deepFreeze({...body,surfaceModelDigest:digest(body)});
}
function prepareGenesis(packet){const m=definition(packet),door=m.doorDefinition,id=door.doorId;
 const genesis=world({stateSchemaVersion:'2.0.0',worldId:'school-passable-door-empty-proposal',sceneDefinitionRef:{sceneId:'school-passable-door-proposal',revision:1,digest:m.surfaceModelDigest},revision:0,lifecycleState:'INITIALIZING',entities:{},supportRelations:[],surfaces:{id:m.surfaceModelId,revision:m.revision,digest:m.surfaceModelDigest},environmentPhysicalState:{surfaceModelDigest:m.surfaceModelDigest,doorEntities:[{entityId:id,definitionDigest:digest(door),state:'CLOSED',transform:{pivot:door.pivot,rotationDegrees:0},collisionBoundsMicrounits:door.closedLeaf}],landingApronClassification:'NEW_PROPOSED_DESTINATION_NOT_EXISTING_CORRIDOR'},committedEventSequence:0});
 return deepFreeze({kind:'EMPTY_TREATMENT_WORLD_GENESIS_PREPARATION_NOT_ADMITTED',surfaceModel:m,genesis,events:[],replayedWorldDigest:replay(genesis,[]).stateDigest,limitations:m.limitations});
}
function inspectClosedProjection({packet,surfaceModel,committedWorld,...extra}={}){const fail=reason=>deepFreeze({status:'UNKNOWN',reason});try{
 if(Object.keys(extra).length)return fail('CALLER_DOOR_STATE_OR_EXTRA_INPUT_FORBIDDEN');const exact=prepareGenesis(packet);
 if(digest(surfaceModel)!==digest(exact.surfaceModel))return fail('NEW_MODEL_NOT_EXACT');if(digest(committedWorld)!==digest(exact.genesis))return fail('NEW_GENESIS_IDENTITY_REQUIRED');
 const e=committedWorld.environmentPhysicalState,door=surfaceModel.doorDefinition;if(e.surfaceModelDigest!==surfaceModel.surfaceModelDigest||committedWorld.surfaces.digest!==surfaceModel.surfaceModelDigest)return fail('STATE_MODEL_MISMATCH');if(e.doorEntities.length!==1||e.doorEntities[0].entityId!==door.doorId)return fail('DOOR_ENTITY_MISSING');const d=e.doorEntities[0];if(d.state!=='CLOSED'||d.definitionDigest!==digest(door)||digest(d.collisionBoundsMicrounits)!==digest(door.closedLeaf))return fail('CLOSED_COMMITTED_DOOR_BINDING_REQUIRED');
 return deepFreeze({status:'CLOSED_GENESIS_COLLISION_PROJECTION_PREPARED_NOT_ADMITTED',worldDigest:committedWorld.stateDigest,modelDigest:surfaceModel.surfaceModelDigest,doorEntityId:d.entityId,leafCollisionBoundsMicrounits:d.collisionBoundsMicrounits,doorTransform:d.transform,operationalStatus:'UNKNOWN',limitations:exact.limitations});
 }catch{return fail('GENESIS_PROJECTION_INVALID')}}
module.exports={definition,prepareGenesis,inspectClosedProjection};
