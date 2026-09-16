'use strict';const {createSchoolRuntime}=require('../../src/clean-runtime/school/create-school-runtime'),{bagEntity,SCHOOL_SCENE}=require('../../src/clean-runtime/school/school-physical-contract');
const pos=(x,y,z)=>({positionMicrounits:[Math.round(x*1e6),Math.round(y*1e6),Math.round(z*1e6)],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]});
function initial(entity=bagEntity()){return {worldId:'clean-school-world',sceneDefinitionRef:SCHOOL_SCENE,revision:0,lifecycleState:'ACTIVE',entities:{[entity.entityId]:entity},physicalRelations:[],surfaces:null,environmentPhysicalState:null,committedEventSequence:0}}
function runtime(entity){return createSchoolRuntime({initialWorld:initial(entity)})}
function move(id,x,y,z,revision=0){return {commandId:id,type:'SetTransform',expectedWorldRevision:revision,entityId:'school-medical-bag',transform:pos(x,y,z)}}
module.exports={pos,initial,runtime,move,bagEntity};
