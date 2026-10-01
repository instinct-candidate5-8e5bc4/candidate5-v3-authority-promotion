'use strict';
// Independent proposal-specific topology check. Does not call definition/equality validator.
// This is a bounded doorway/floor specification, not arbitrary-scene certification.
const {digest,deepFreeze}=require('../../contracts/canonical');
const axes=['X','Y','Z'],keys=axes.flatMap(k=>['min'+k,'max'+k]);
const eq=(a,b)=>digest(a)===digest(b);
const valid=b=>keys.every(k=>Number.isSafeInteger(b[k]))&&axes.every(k=>b['min'+k]<b['max'+k]);
function micro(b){const a={};for(const k of keys){const v=b[k]*1e6;if(!Number.isFinite(v)||Math.abs(v-Math.round(v))>1e-6)throw Error('NON_MICROUNIT_BOX');a[k]=Math.round(v)}if(!valid(a))throw Error('DEGENERATE_BOX');return a}
function validateStructure(model){try{
 if(model.units!=='METERS')throw Error('UNITS');const ids=new Set(),volIds=new Set();for(const s of model.surfaces){if(!s.surfaceId||ids.has(s.surfaceId))throw Error('DUPLICATE_SURFACE');ids.add(s.surfaceId);for(const v of s.region.volumes){if(!v.volumeId||volIds.has(v.volumeId))throw Error('DUPLICATE_VOLUME');volIds.add(v.volumeId);micro(v)}}
 const take=id=>{const s=model.surfaces.find(s=>s.surfaceId===id);if(!s)throw Error('MISSING_SURFACE');return s};
 const allowed={'floor':'FLOOR','left-wall':'WALL','right-wall':'WALL','back-wall-opening':'WALL','door-frame':'OBSTACLE',...Object.fromEntries(Array.from({length:5},(_,i)=>['locker-'+i,'OBSTACLE']))};
 if(model.surfaces.length!==Object.keys(allowed).length||model.surfaces.some(s=>allowed[s.surfaceId]!==s.type))throw Error('SURFACE_ALLOWLIST');
 const side=(id,x)=>{const s=take(id);if(s.region.volumes.length!==1||!eq(micro(s.region.volumes[0]),{minX:x-80000,maxX:x+80000,minY:0,maxY:6000000,minZ:-6000000,maxZ:6000000}))throw Error('SIDE_WALL_ENVELOPE')};side('left-wall',-7000000);side('right-wall',7000000);
 for(let i=0;i<5;i++){const vs=take('locker-'+i).region.volumes;if(vs.length!==1)throw Error('LOCKER_VOLUME_COUNT');const b=micro(vs[0]);if(b.minX<-6920000||b.maxX>6920000||b.minY<0||b.maxY>6000000||b.minZ<-3920000||b.maxZ>6000000)throw Error('LOCKER_ROOM_ENVELOPE')}
 const w=take('back-wall-opening').region.volumes.map(micro),f=take('door-frame').region.volumes.map(micro),d=model.doorDefinition,p=d.pivot,c=d.closedLeaf,o=d.openLeaf,t=d.designDimensionsMicrounits.frameThickness;
 if(w.length!==3||f.length!==3||!valid(c)||!valid(o)||!Number.isSafeInteger(t)||t<=0||!Object.values(p).every(Number.isSafeInteger))throw Error('DOOR_SHAPE');
 const [l,r,h]=w,a={minX:l.maxX,maxX:r.minX,minY:l.minY,maxY:h.minY,minZ:l.minZ,maxZ:l.maxZ};if(!valid(a))throw Error('OPENING');
 // Explicit independent structural domain envelope: room wall 18m x 6m, 160mm depth.
 const outer={minX:-9000000,maxX:9000000,minY:0,maxY:6000000,minZ:-4080000,maxZ:-3920000};
 if(!eq(l,{...outer,maxX:a.minX})||!eq(r,{...outer,minX:a.maxX})||!eq(h,{...outer,minX:a.minX,maxX:a.maxX,minY:a.maxY}))throw Error('WALL_PARTITION_GAP_OR_OVERLAP');
 if(!eq(f[0],{...a,maxX:a.minX+t})||!eq(f[1],{...a,minX:a.maxX-t})||!eq(f[2],{...a,minY:a.maxY-t}))throw Error('FRAME_BINDING');
 const width=c.maxX-c.minX,thick=c.maxZ-c.minZ;if(p.xMicrounits!==c.minX||p.yMicrounits!==c.minY||p.zMicrounits!==(c.minZ+c.maxZ)/2||p.zMicrounits!==(a.minZ+a.maxZ)/2)throw Error('PIVOT_BINDING');
 if(!eq(o,{minX:p.xMicrounits-thick/2,maxX:p.xMicrounits+thick/2,minY:c.minY,maxY:c.maxY,minZ:p.zMicrounits,maxZ:p.zMicrounits+width}))throw Error('DISCRETE_LEAF_PIVOT_BINDING');
 if(c.minY!==a.minY||c.minX<=f[0].maxX||c.maxX>=f[1].minX||c.maxY>=f[2].minY||c.minZ<a.minZ||c.maxZ>a.maxZ||o.minX-f[0].maxX!==d.designDimensionsMicrounits.openLeafToJambClearance||o.maxX>=f[1].minX)throw Error('LEAF_FRAME_CLEARANCE');
 const intersection=(a,b)=>{const c={};for(const k of axes){c['min'+k]=Math.max(a['min'+k],b['min'+k]);c['max'+k]=Math.min(a['max'+k],b['max'+k])}return valid(c)?c:null};
 const solids=model.surfaces.filter(s=>s.type!=='FLOOR').flatMap(s=>s.region.volumes.map((v,i)=>({id:s.surfaceId+':'+i,b:micro(v)})));
 const junctions={'back-wall-opening:0|left-wall:0':{minX:-7080000,maxX:-6920000,minY:0,maxY:6000000,minZ:-4080000,maxZ:-3920000},'door-frame:0|door-frame:2':{minX:4565000,maxX:4645000,minY:2920000,maxY:3000000,minZ:-4080000,maxZ:-3920000},'door-frame:1|door-frame:2':{minX:6095000,maxX:6175000,minY:2920000,maxY:3000000,minZ:-4080000,maxZ:-3920000},'back-wall-opening:1|right-wall:0':{minX:6920000,maxX:7080000,minY:0,maxY:6000000,minZ:-4080000,maxZ:-3920000}},seenJunctions=new Set();
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){const x=intersection(solids[i].b,solids[j].b),key=[solids[i].id,solids[j].id].sort().join('|');if(junctions[key]){if(!eq(x,junctions[key]))throw Error('DECLARED_JUNCTION_SHAPE_CHANGED');seenJunctions.add(key)}else if(x)throw Error('STATIC_SOLID_INTERPENETRATION')}
 if(seenJunctions.size!==4)throw Error('DECLARED_JUNCTION_MISSING');
 const aperture={...a,minX:f[0].maxX,maxX:f[1].minX,maxY:f[2].minY};
 for(const v of solids){if(intersection(c,v.b)||intersection(o,v.b))throw Error('LEAF_STATIC_SOLID_INTERPENETRATION');if(intersection(aperture,v.b))throw Error('APERTURE_STATIC_SOLID_INTERPENETRATION')}
 const locker4=micro(take('locker-4').region.volumes[0]);if(o.minX-locker4.maxX!==165000)throw Error('OPEN_LEAF_LOCKER4_CLEARANCE');
 const floor=take('floor');if(floor.type!=='FLOOR'||floor.planeOrDepth.kind!=='PLANE'||floor.planeOrDepth.planeY!==0||floor.region.allowed.length!==2)throw Error('FLOOR_SPEC');
 const rect=v=>Object.fromEntries(['minX','maxX','minZ','maxZ'].map(k=>[k,Math.round(v[k]*1e6)]));for(const v of floor.region.allowed)for(const k of ['minX','maxX','minZ','maxZ'])if(!Number.isFinite(v[k])||Math.abs(v[k]*1e6-Math.round(v[k]*1e6))>1e-6)throw Error('FLOOR_UNITS');
 const room=rect(floor.region.allowed[0]),apron=rect(floor.region.allowed[1]);if(!eq(room,{minX:-7000000,maxX:7000000,minZ:-4000000,maxZ:6000000}))throw Error('ROOM_FLOOR_HOLE_OR_EXTENT');if(!eq(apron,{minX:a.minX,maxX:a.maxX,minZ:a.minZ-(a.maxX-a.minX),maxZ:a.maxZ})||apron.maxZ<room.minZ||apron.minX<room.minX||apron.maxX>room.maxX)throw Error('APRON_FLOOR_HOLE_OR_BINDING');
 return deepFreeze({status:'DOORWAY_FLOOR_STATIC_TOPOLOGY_VALIDATED_NOT_ADMITTED',validatorVersion:'doorway-floor-static-topology-v2',modelContentDigest:digest(model),checks:['MICROUNIT_NONDEGENERATE_VOLUMES_UNIQUE_IDS','3_WALL_PARTITION_AND_FRAME','DISCRETE_LEAF_PIVOT_CLEARANCE','ROOM_FLOOR_APRON_SPEC_UNION','ALL_STATIC_PAIRS_EXCEPT_FOUR_EXACT_DECLARED_UNIONS','CLOSED_OPEN_LEAF_AND_APERTURE_CLEAR_OF_STATIC_SOLIDS','OPEN_LEAF_LOCKER4_CLEARANCE_165000_MICROUNITS'],limitations:['PROPOSAL_SPEC_ONLY_NOT_GENERAL_SCENE_VALIDATOR','NO_CONTINUOUS_SWING_BODY_OR_SUPPORT_PROOF','EXACT_UNIONS_BACK_WALL_0_LEFT_WALL_BACK_WALL_1_RIGHT_WALL_FRAME_0_FRAME_2_FRAME_1_FRAME_2','APRON_PROPOSED_NOT_AUTHORIZED_DESTINATION','NO_ADMISSION_OR_POSITIVE_GATE_AUTHORIZATION']});
 }catch(e){return deepFreeze({status:'REJECTED',reason:e.message,validatorVersion:'doorway-floor-static-topology-v2'})}}
module.exports={validateStructure};
