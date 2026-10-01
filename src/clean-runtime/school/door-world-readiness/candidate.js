'use strict';
// Rejection/readiness only. No admission issuer, positive gate or operational projection.
const {digest,deepFreeze}=require('../../contracts/canonical');
const {replay}=require('../../events/replay');
const {createMultiSupportRuntime}=require('../../multi-support/runtime');
const C=require('../door-world-genesis/candidate'),L=require('../door-world-legality/candidate');
const unknown=reason=>deepFreeze({status:'UNKNOWN',reason,operationalStatus:'UNKNOWN'});
function inspectChain({packet,surfaceModel,genesis,events,committedWorld,...extra}={}){try{
 if(Object.keys(extra).length)return unknown('EXTRA_INPUT_OR_CALLER_ADMISSION_FORBIDDEN');
 const exact=C.prepareGenesis(packet);if(digest(surfaceModel)!==digest(exact.surfaceModel)||digest(genesis)!==digest(exact.genesis))return unknown('EXACT_NEW_GENESIS_MODEL_REQUIRED');
 if(!Array.isArray(events)||!events.length)return unknown('NONEMPTY_COMMITTED_CHAIN_REQUIRED');
 let state=genesis,head='0'.repeat(64);
 for(let i=0;i<events.length;i++){const e=events[i];if(e.eventType!=='MutationCommitted'||e.kind!=='multi-support-transaction'||e.worldId!==genesis.worldId||e.sequence!==i+1||e.priorEventDigest!==head||e.priorWorldRevision!==state.revision||e.newWorldRevision!==state.revision+1||e.priorStateDigest!==state.stateDigest||e.eventDigest!==digest({...e,eventDigest:undefined})||!/^[a-f0-9]{64}$/.test(e.commandDigest||''))return unknown('NEW_WORLD_CHAIN_INVALID');
 if(digest(e.stateDelta.surfaces)!==digest(genesis.surfaces)||digest(e.stateDelta.environmentPhysicalState)!==digest(genesis.environmentPhysicalState))return unknown('MODEL_OR_CLOSED_DOOR_RECORD_CHANGED');
 state=replay(genesis,events.slice(0,i+1));head=e.eventDigest;}
 if(digest(state)!==digest(committedWorld))return unknown('REPLAYED_WORLD_NOT_EXACT');
 return deepFreeze({status:'CHAIN_MECHANICS_VALIDATED_NOT_ADMITTED',genesisDigest:genesis.stateDigest,worldDigest:state.stateDigest,modelDigest:surfaceModel.surfaceModelDigest,eventHeadDigest:head,eventCount:events.length,operationalStatus:'UNKNOWN',limitations:['HASH_REPLAY_IS_NOT_GATE_OR_OWNER_ADMISSION','NO_GEOMETRY_STRUCTURAL_OR_COMMIT_AUTHORITY_PROOF']});
 }catch{return unknown('CHAIN_REPLAY_INVALID')}}
function inspectLaterClosedProjection(input){const chain=inspectChain(input);if(chain.status!=='CHAIN_MECHANICS_VALIDATED_NOT_ADMITTED')return chain;return unknown('SEPARATE_EXACT_NEW_WORLD_ADMISSION_AUTHORITY_UNAVAILABLE')}
function probeRejectedAdultCommit(packet){const g=C.prepareGenesis(packet),pkg=require('../../../../scripts/track-b/gate-a-r1v4-package-builder').buildV21(),entity=pkg.entities.find(e=>e.entityId==='school-casualty-adult-v1'),relation=structuredClone(pkg.supportRelations.find(r=>r.supportedEntityId===entity.entityId));relation.surfaceModelRef={id:g.surfaceModel.surfaceModelId,revision:g.surfaceModel.revision,digest:g.surfaceModel.surfaceModelDigest};
 const api=createMultiSupportRuntime({initialWorld:g.genesis,legalityPort:L.createPreparationLegalityPort({packet,surfaceModel:g.surfaceModel})}),tx={transactionId:'new-world-preparation-rejection',expectedWorldRevision:0,commands:[{type:'SpawnEntity',commandId:'rejection:spawn',expectedWorldRevision:0,entity},{type:'AttachSupportRelation',commandId:'rejection:support',expectedWorldRevision:0,relation}]},result=api.proposeTransaction(tx),after=api.getWorldState(),events=api.getEventLog();
 if(result.status!=='REJECTED'||digest(after)!==digest(g.genesis)||events.length!==0)throw Error('PREPARATION_PORT_MUST_NOT_COMMIT');
 return deepFreeze({kind:'ACTUAL_MUTATION_REJECTION_READINESS_NOT_ADMITTED',transaction:tx,result,genesis:g.genesis,after,events,replayedWorldDigest:replay(g.genesis,events).stateDigest,limitations:['NO_POSITIVE_COMMIT','SUPPORT_MODEL_REF_IS_PROPOSAL_ONLY','NO_ADMISSION_RENDER_MOVEMENT_OR_DOOR_ACTIVATION']});}
module.exports={inspectChain,inspectLaterClosedProjection,probeRejectedAdultCommit};
