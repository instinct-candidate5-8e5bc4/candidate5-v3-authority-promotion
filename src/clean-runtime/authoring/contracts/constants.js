'use strict';
const AUTHORING_STATUSES=Object.freeze(['AUTHORED_NEW_DRAFT','VALIDATED','REVIEWED','VERIFIED_FOR_SLICE','REJECTED','SUPERSEDED','UNKNOWN']);
const PRIMITIVES=Object.freeze(['AABB']);
const PARTICIPATION_ROLES=Object.freeze(['COLLISION','CONTACT','BOTH']);
const SUPPORT_TYPES=Object.freeze(['SYNTHETIC_FLOOR','SYNTHETIC_SUPPORT']);
const V1=Object.freeze({handedness:'RIGHT_HANDED',axes:Object.freeze({x:'ENTITY_RIGHT',y:'UP',z:'ENTITY_FORWARD'}),upAxis:'Y',forwardDirection:'+Z',transformOrder:'SCALE_ROTATE_TRANSLATE',canonicalOrientation:Object.freeze([0,0,0,1000000]),orientationUnit:'MICROUNIT_QUATERNION',linearUnit:'MICROUNIT',microunitsPerAuthoredUnit:1000000,supportMaterialization:'TRANSLATION_ONLY_IDENTITY_ORIENTATION',supportPlane:'HORIZONTAL_Y',supportRegion:'AXIS_ALIGNED_RECTANGLE',phase2Projection:'CONSERVATIVE_AGGREGATE_AABB'});
module.exports={AUTHORING_STATUSES,PRIMITIVES,PARTICIPATION_ROLES,SUPPORT_TYPES,V1};
