'use strict';const {world}=require('../contracts/world-state');
function createInternalWorldStore(initial){let state=world(initial);const capability=Object.freeze({token:Symbol('WorldMutationAPI commit')});const publicStore=Object.freeze({getState:()=>state});const writer=Object.freeze({capability,commit(next,token){if(token!==capability)throw Error('PHYSICAL_BYPASS_ATTEMPT');state=next;return state}});return Object.freeze({publicStore,writer})}
module.exports={createInternalWorldStore};
