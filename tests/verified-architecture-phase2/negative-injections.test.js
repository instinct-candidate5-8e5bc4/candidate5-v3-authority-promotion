'use strict';const test=require('node:test');const assert=require('node:assert/strict');const {evaluate}=require('../../src/verified-architecture-phase2/geometry-gate');const {model,request,BAG,digest}=require('./helpers');
const cases=[
 ['partial footprint outside',{transform:{x:0,y:.175,z:5.9}},'FOOTPRINT_PARTIALLY_OUTSIDE_LEGAL_REGION'],
 ['full footprint outside',{transform:{x:8,y:.175,z:1}},'FOOTPRINT_FULLY_OUTSIDE_LEGAL_REGION'],
 ['wall penetration',{transform:{x:0,y:.175,z:-3.95}},'WALL_PENETRATION'],
 ['door penetration',{transform:{x:5.4,y:.175,z:-3.84}},'DOOR_OR_OPENING_PENETRATION'],
 ['obstacle penetration',{transform:{x:-4,y:.175,z:-3.5}},'OBSTACLE_PENETRATION'],
 ['floating',{transform:{x:0,y:.4,z:1}},'CONTACT_GAP_FLOATING'],
 ['support penetration',{transform:{x:0,y:.1,z:1}},'SUPPORT_PENETRATION'],
 ['wrong surface id',{surfaceId:'not-a-surface'},'SURFACE_ID_NOT_FOUND'],
 ['forbidden surface type',{surfaceId:'back-wall'},'SURFACE_TYPE_FORBIDDEN_FOR_CONTACT'],
 ['bad orientation',{orientationUpDot:0},'ORIENTATION_OR_SUPPORT_INVALID']];
for(const [name,over,code] of cases)test(name+' deterministically fails',()=>{const m=model('school'),a=evaluate(request(m,over),m),b=evaluate(request(m,over),m);assert.equal(a.reasonCode,code);assert.deepEqual(a,b);assert.equal(a.evidence.autoFixed,false);});
test('UNKNOWN surface fails closed',()=>{const m=model('urban'),x=evaluate(request(m,{surfaceId:'ground-unknown'}),m);assert.equal(x.reasonCode,'SURFACE_TYPE_UNKNOWN');});
test('stale mismatched proof fails',()=>{const m=model('school'),r=request(m);r.surfaceModelRef.revision=2;assert.equal(evaluate(r,m).reasonCode,'SURFACE_PROOF_STALE_OR_MISMATCHED');});
test('missing evidence fails',()=>{const m=model('school'),r=request(m);r.evidenceRefs=[];assert.equal(evaluate(r,m).reasonCode,'GEOMETRY_EVIDENCE_MISSING_OR_MISMATCHED');});
test('mismatched geometry digest fails',()=>{const m=model('school'),r=request(m);r.geometryDigest='0'.repeat(64);assert.equal(evaluate(r,m).reasonCode,'GEOMETRY_EVIDENCE_MISSING_OR_MISMATCHED');});
test('geometry changed after proof fails',()=>{const m=model('school'),r=request(m);r.proofGeometryDigest='f'.repeat(64);assert.equal(evaluate(r,m).reasonCode,'GEOMETRY_CHANGED_AFTER_PROOF');});
