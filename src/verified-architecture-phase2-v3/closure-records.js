'use strict';
const {digest}=require('./definitions');
function seal(kind,x,idKey){if(!x||typeof x!=='object'||!x[idKey]||!Number.isInteger(x.revision)||x.revision<1)throw Error('INVALID_INPUT');const y=structuredClone(x);y.recordKind=kind;y.digest=digest(y,'digest');return Object.freeze(y)}
function contactRegion(x){if(!x.supportedBodyRef||!x.geometryRef||!x.expectedContactNormal||!x.expectedContactNormal.frameRef)throw Error('INVALID_INPUT');return seal('CONTACT_REGION_DEFINITION',x,'contactRegionId')}
function supportRelation(x){if(!x.relationId||!['REQUIRED','OPTIONAL'].includes(x.requirement)||!x.bodyRef||!x.contactRegionRef||!x.supportSurfaceRef||x.contactPolicy!=='EXACT_OPPOSED_PHYSICAL_NORMAL'||!Array.isArray(x.frameRefs))throw Error('INVALID_INPUT');const y=structuredClone(x);y.recordKind='SUPPORT_RELATION';y.digest=digest(y,'digest');return Object.freeze(y)}
function boundaryFeature(x){if(!x.localFrameRef||!Array.isArray(x.solidGeometryRefs)||!Array.isArray(x.openingRegionRefs))throw Error('INVALID_INPUT');const y=structuredClone(x);y.solidGeometryRefs.sort(refCmp);y.openingRegionRefs.sort(refCmp);return seal('BOUNDARY_FEATURE_DEFINITION',y,'boundaryFeatureId')}
function refCmp(a,b){return String(a.geometryId||a.frameId||a.bodyId||a.contactRegionId).localeCompare(String(b.geometryId||b.frameId||b.bodyId||b.contactRegionId))}
module.exports={contactRegion,supportRelation,boundaryFeature,refCmp};
