'use strict';
// V3 Authority Routing Gate: composition root for the promoted runtime.
//
// This is the only composition seam that wires the promoted
// PhysicalLegalityPort into the Clean Runtime authority path. It composes the
// existing createAuthorityRuntime (WorldMutationAPI, internal world store,
// event log) unchanged, injecting exactly one legality port. The authority
// registrySnapshot source is supplied here at composition time, never carried
// by a mutation request. School, renderer, and visual composition roots are
// not connected by this gate.
const {createAuthorityRuntime}=require('../authority-runtime');
const {EventLog}=require('../events/event-log');
const {createPromotedLegalityPort}=require('./promoted-legality-port');
function createV3PromotedAuthorityRuntime({initialWorld,registrySnapshot,registryProvider,eventLog=new EventLog()}={}){
 if(registrySnapshot&&registryProvider)throw TypeError('AMBIGUOUS_REGISTRY_SOURCE');
 const provider=registryProvider||(registrySnapshot?()=>registrySnapshot:null);
 if(!provider)throw TypeError('REGISTRY_SOURCE_REQUIRED');
 const legalityPort=createPromotedLegalityPort({registryProvider:provider});
 return createAuthorityRuntime({initialWorld,legalityPort,eventLog});
}
module.exports={createV3PromotedAuthorityRuntime};
