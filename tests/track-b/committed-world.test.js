'use strict';
// TRACK B / R3 evidence: committed-world projection guard + pinned
// synthetic-unit asset binding (root-shell physical session route).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
 ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice');
async function load(){const g=await import(path.join(VS,'package','committed-world-guard.mjs'));
 const map=JSON.parse(fs.readFileSync(path.join(VS,'entity-body-map.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(VS,'presentation-manifest.json'),'utf8'));
 return{g,map,manifest,bound:manifest.entities.map(e=>e.physicalEntityId)}}
const HEX='a'.repeat(64);
function fixture(){return{kind:'TRACK_B_COMMITTED_WORLD_PROJECTION',contractVersion:'1.0',
 worldDigest:HEX,committedTransactionId:'tx-r3-0001',
 entities:[{publicRef:'syn',authoritativeTransformMicrounits:{positionMicrounits:[-1200000,410000,1000000]},publicUseState:'RESERVED'}]}}
const BT={syn:'synthetic-training-unit-v1',bag:'school-medical-bag',cas:'school-casualty-adult-v1'};
test('valid committed-world projection accepts and yields committed actions',async()=>{
 const{g,map,bound}=await load();
 const r=g.validateCommittedWorldProjection(fixture(),{bindingTable:BT,map,boundEntities:bound});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.worldDigest,HEX);assert.equal(r.transactionId,'tx-r3-0001');
 assert.deepEqual(r.actions.map(a=>a.type).sort(),['committedTransform','useState']);});
test('negatives: cue, finding text, highlight, pose/location codes, inventory, unknown keys at every level',async()=>{
 const{g,map,bound}=await load();
 const V=x=>g.validateCommittedWorldProjection(x,{bindingTable:BT,map,boundEntities:bound});
 const cue=fixture();cue.cue='SYNTHETIC_ACTION_STARTED';assert.equal(V(cue).ok,false);
 const inv=fixture();inv.inventory={bag:['unit']};assert.equal(V(inv).ok,false);
 const fin=fixture();fin.entities[0].findingText='x';assert.equal(V(fin).ok,false);
 const hi=fixture();hi.entities[0].highlightComponentIds=['torso'];assert.equal(V(hi).ok,false);
 const pose=fixture();pose.entities[0].visiblePoseCode='SUPINE_FLOOR';assert.equal(V(pose).ok,false);
 const loc=fixture();loc.entities[0].visibleLocationCode='IN_BAG';assert.equal(V(loc).ok,false);
 const tx=fixture();tx.entities[0].authoritativeTransformMicrounits.orientationMicrounits=[0,0,0,1];assert.equal(V(tx).ok,false);
 for(const bad of[cue,inv,fin,hi,pose,loc,tx])assert.match(V(bad).reason,/unknown|whitelist|no cues/i);});
test('negatives: kind/version/digest/transaction/binding/allowlist/use-state/position',async()=>{
 const{g,map,bound}=await load();
 const V=(x,o={})=>g.validateCommittedWorldProjection(x,{bindingTable:BT,map,boundEntities:bound,...o});
 const kind=fixture();kind.kind='TRACK_B_PUBLIC_PROJECTION';assert.equal(V(kind).ok,false);
 const ver=fixture();ver.contractVersion='0.3';assert.equal(V(ver).ok,false);
 const dg=fixture();dg.worldDigest='xyz';assert.equal(V(dg).ok,false);
 const tx=fixture();tx.committedTransactionId='';assert.equal(V(tx).ok,false);
 const unbound=fixture();unbound.entities[0].publicRef='nobody';assert.equal(V(unbound).ok,false);
 const bag=fixture();bag.entities[0].publicRef='bag';const rb=V(bag);assert.equal(rb.ok,false);assert.match(rb.reason,/allowlist/);
 const cas=fixture();cas.entities[0]={publicRef:'cas',publicUseState:'AVAILABLE'};assert.equal(V(cas).ok,false);
 const us=fixture();us.entities[0].publicUseState='EXPLODED';assert.equal(V(us).ok,false);
 const pos=fixture();pos.entities[0].authoritativeTransformMicrounits.positionMicrounits=[0,'x',0];assert.equal(V(pos).ok,false);
 const pos2=fixture();pos2.entities[0].authoritativeTransformMicrounits.positionMicrounits=[0,2e9,0];assert.equal(V(pos2).ok,false);
 const noTbl=fixture();assert.equal(g.validateCommittedWorldProjection(noTbl,{bindingTable:null,map,boundEntities:bound}).ok,false);
 const unpin=fixture();assert.equal(V(unpin,{boundEntities:['school-medical-bag']}).ok,false);});
test('manifest 0.2.0 pin matches the committed synthetic-unit definition bytes (drift check)',async()=>{
 const{manifest}=await load();
 const e=manifest.entities.find(x=>x.physicalEntityId==='synthetic-training-unit-v1');
 assert.equal(manifest.manifestVersion,'0.2.0');
 assert(e.assetRef.pinned,'pinned binding required');
 assert.equal(e.assetRef.pinned.assetBindingVersion,'1.0.0');
 const bytes=fs.readFileSync(path.join(ROOT,'src','clean-runtime','school','definitions','synthetic-training-unit-v1.js'));
 const actual=crypto.createHash('sha256').update(bytes).digest('hex');
 assert.equal(e.assetRef.pinned.unitDefinitionSha256,actual,'definition drift - regenerate the manifest');
 const bd=crypto.createHash('sha256').update(JSON.stringify({...e.assetRef.pinned,bindingDigest:undefined})).digest('hex');
 assert.equal(e.assetRef.pinned.bindingDigest,bd,'binding digest drift');
 const md=crypto.createHash('sha256').update(JSON.stringify({...manifest,manifestDigest:undefined})).digest('hex');
 assert.equal(manifest.manifestDigest,md,'manifest digest drift');});
test('presentation guard still validates the 0.2.0 manifest against the real map',async()=>{
 const pg=await import(path.join(VS,'package','presentation-guard.mjs'));
 const{manifest,map}=await load();
 const bundle=JSON.parse(fs.readFileSync(path.join(VS,'scene-bundle.json'),'utf8'));
 const r=pg.validatePresentationManifest(manifest,{map,worldDigest:bundle.inputs.worldStateDigest});
 assert.equal(r.ok,true,r.reason);
 const noPin=structuredClone(manifest);
 delete noPin.entities.find(x=>x.physicalEntityId==='synthetic-training-unit-v1').assetRef.pinned;
 const r2=pg.validatePresentationManifest(noPin,{map,worldDigest:bundle.inputs.worldStateDigest});
 assert.equal(r2.ok,false);assert.match(r2.reason,/pinned/);});
