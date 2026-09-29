'use strict';
// B-W8 protocol integrity: the scripted verification matrix and its certified
// anchors are pinned here. Drift in the script's pins (a weakened threshold, a
// dropped viewport/rig/action, a changed anchor) fails loudly - expectations
// are never adjusted to make a change pass.
const test=require('node:test'),assert=require('node:assert/strict');
const {MATRIX,ANCHORS,EXPECT}=require('../../scripts/track-b/b-w8-verification-protocol.js');
test('matrix covers both viewports, all three rigs, all three demo actions, and the unavailable family',()=>{
 assert.deepEqual(MATRIX.viewports.map(v=>[v.name,v.width,v.height]),[['desktop',1440,900],['mobile',390,844]]);
 assert.deepEqual(MATRIX.rigs,['day','night','winter']);
 assert.deepEqual(MATRIX.actions,['seat','legal','wall']);
 assert.equal(MATRIX.unavailableFamily,'drowning');
});
test('anchors match the certified Track B anchor set',()=>{
 assert.equal(ANCHORS.baseWorldDigest,'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea');
 assert.equal(ANCHORS.legalMoveWorldDigest,'0ff66dcebe2cdb310e08ee4b9d493e3360e6c3f2077dfe896716238a6f61066e');
 assert.equal(ANCHORS.packageDigestPrefix,'187cf1a4c0af01ef');
 assert.equal(ANCHORS.sceneFamily,'school-treatment-room');
 assert.equal(ANCHORS.sceneId,'school-treatment-room-v1');
 assert.equal(ANCHORS.bannerWarning,'VISUALS ARE NOT CERTIFIED PHYSICS');
});
test('demo-action expectations pin the certified gate outcomes verbatim',()=>{
 for(const a of['seat','legal','wall'])assert.ok(Array.isArray(EXPECT[a])&&EXPECT[a].length>=3,a);
 assert.ok(EXPECT.seat.includes('LEGALITY_FAIL')&&EXPECT.seat.includes('CONTACT_GAP_FLOATING'));
 assert.ok(EXPECT.wall.includes('OBSTACLE_PENETRATION'));
 assert.ok(EXPECT.legal.includes(ANCHORS.legalMoveWorldDigest.slice(0,16)));
 assert.ok(EXPECT.legal.includes(ANCHORS.packageDigestPrefix));
 assert.ok(EXPECT.seat.includes(ANCHORS.baseWorldDigest.slice(0,16))&&EXPECT.wall.includes(ANCHORS.baseWorldDigest.slice(0,16)));
});
