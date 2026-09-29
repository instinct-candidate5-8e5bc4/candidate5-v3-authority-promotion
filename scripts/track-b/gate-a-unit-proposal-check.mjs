'use strict';
// PROPOSAL-STAGE NUMERIC CHECK for the Gate A synthetic-unit containment
// draft (R1 v2). NOT gate evidence, NOT a validator - a deterministic
// arithmetic harness proving the proposed volume/contact/clearance numbers
// and exercising the proposed legality rule against its negative matrix, so
// review talks about verified arithmetic instead of asserted dimensions.
// All values integer microunits (ED-P2-02).
const BAG={minX:-275000,maxX:275000,minY:-175000,maxY:175000,minZ:-175000,maxZ:175000}; // certified SCHOOL_BAG_BODY.geometry (RECOVERED r1)
const INTERIOR={minX:-250000,maxX:250000,minY:-150000,maxY:150000,minZ:-150000,maxZ:150000}; // proposed containment volume (25mm inset on all 6 faces)
const FLOOR_Y=-150000; // layer-1 interior support floor plane (SUPPORT_SURFACE, chair-seat pattern)
const UNIT_DIMS=[200000,120000,80000]; // proposed unit AABB dims
// Proposed TWO-LAYER legality (no Phase 2 change):
//  layer 1: bottom face exactly on floor plane, FULL_FOOTPRINT inside floor region (existing SUPPORT_SURFACE semantics)
//  layer 2: aggregate STRICTLY inside interior on +X/-X/+Z/-Z/+Y (new containment validator)
function legality(unit){
 const r=[];
 const strict=[['PROTRUSION_X',INTERIOR.maxX-unit.maxX],['PROTRUSION_X',unit.minX-INTERIOR.minX],['PROTRUSION_Y',INTERIOR.maxY-unit.maxY],['PROTRUSION_Z',INTERIOR.maxZ-unit.maxZ],['PROTRUSION_Z',unit.minZ-INTERIOR.minZ]];
 for(const [code,gap] of strict)if(gap<=0)r.push(code);
 if(unit.minY>FLOOR_Y)r.push('CONTACT_GAP_FLOATING');
 if(unit.minY<FLOOR_Y)r.push('SUPPORT_PENETRATION');
 if(!(unit.minX>=INTERIOR.minX&&unit.maxX<=INTERIOR.maxX&&unit.minZ>=INTERIOR.minZ&&unit.maxZ<=INTERIOR.maxZ))r.push('FOOTPRINT_OUTSIDE_FLOOR_REGION');
 return r.length?{legal:false,codes:[...new Set(r)]}:{legal:true,codes:[]}}
function placed(cx,cy,cz,dims=UNIT_DIMS){const[dx,dy,dz]=dims;return{minX:cx-dx/2,maxX:cx+dx/2,minY:cy-dy/2,maxY:cy+dy/2,minZ:cz-dz/2,maxZ:cz+dz/2}}
const checks=[];
const c=(name,ok,detail)=>{checks.push({name,ok});console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''))};
const inside=(a,b)=>a.minX>=b.minX&&a.maxX<=b.maxX&&a.minY>=b.minY&&a.maxY<=b.maxY&&a.minZ>=b.minZ&&a.maxZ<=b.maxZ;
// --- positives ---
c('interior strictly inside certified bag bounds (25mm on all 6 faces)',
 inside(INTERIOR,BAG)&&INTERIOR.minX-BAG.minX===25000&&BAG.maxX-INTERIOR.maxX===25000&&INTERIOR.minY-BAG.minY===25000&&BAG.maxY-INTERIOR.maxY===25000&&INTERIOR.minZ-BAG.minZ===25000&&BAG.maxZ-INTERIOR.maxZ===25000);
const unit=placed(0,-90000,0); // bottom on floor plane, centered X/Z
c('unit placement LEGAL under proposed two-layer rule',legality(unit).legal===true);
c('clearances: +X/-X 150mm, +Z/-Z 110mm, top 180mm, all >50mm',
 INTERIOR.maxX-unit.maxX===150000&&unit.minX-INTERIOR.minX===150000&&INTERIOR.maxZ-unit.maxZ===110000&&unit.minZ-INTERIOR.minZ===110000&&INTERIOR.maxY-unit.maxY===180000,
 `+X=150000 -X=150000 +Z=110000 -Z=110000 top=180000`);
c('layer-1 contact: bottom face exactly on floor plane -150000, footprint 200x80 inside 500x300 floor region',
 unit.minY===FLOOR_Y&&(unit.maxX-unit.minX)===200000&&(unit.maxZ-unit.minZ)===80000&&(INTERIOR.maxX-INTERIOR.minX)===500000&&(INTERIOR.maxZ-INTERIOR.minZ)===300000);
// World transform: bag center [-3000000,175000,1000000] (certified committed
// world position), unit local center [0,-90000,0], identity orientation.
const BAG_POS=[-3000000,175000,1000000];
const unitWorld=[BAG_POS[0]+0,BAG_POS[1]-90000,BAG_POS[2]+0];
c('world transform: unit center [-3000000,85000,1000000], bottom 25000 above world floor, top 145000',
 unitWorld[0]===-3000000&&unitWorld[1]===85000&&unitWorld[2]===1000000&&unitWorld[1]-60000===25000&&unitWorld[1]+60000===145000);
const bagWorld={minX:BAG_POS[0]+BAG.minX,maxX:BAG_POS[0]+BAG.maxX,minY:BAG_POS[1]+BAG.minY,maxY:BAG_POS[1]+BAG.maxY,minZ:BAG_POS[2]+BAG.minZ,maxZ:BAG_POS[2]+BAG.maxZ};
const unitWorldAabb={minX:unitWorld[0]-100000,maxX:unitWorld[0]+100000,minY:unitWorld[1]-60000,maxY:unitWorld[1]+60000,minZ:unitWorld[2]-40000,maxZ:unitWorld[2]+40000};
c('collision-cover invariant: unit world AABB strictly inside bag world AABB (container collision conservatively covers contained entity)',
 inside(unitWorldAabb,bagWorld)&&!Object.keys(unitWorldAabb).some(k=>unitWorldAabb[k]===bagWorld[k]));
// --- negatives: every one must reject with the expected code ---
const N=[
 ['protrusion +X (center +150001)',placed(150001,-90000,0),'PROTRUSION_X'],
 ['protrusion -X (center -150001)',placed(-150001,-90000,0),'PROTRUSION_X'],
 ['protrusion +Z (center +110001)',placed(0,-90000,110001),'PROTRUSION_Z'],
 ['protrusion -Z (center -110001)',placed(0,-90000,-110001),'PROTRUSION_Z'],
 ['oversized unit: top protrusion with floor contact intact (height 300002)',placed(0,1,0,[200000,300002,80000]),'PROTRUSION_Y'],
 ['floating 1mm above floor (contact broken, top still clear)',placed(0,-89999,0),'CONTACT_GAP_FLOATING'],
 ['penetration 1mm below floor',placed(0,-90001,0),'SUPPORT_PENETRATION'],
];
for(const [name,u,code] of N){const r=legality(u);
 c('negative: '+name+' rejects with '+code,r.legal===false&&r.codes.includes(code),JSON.stringify(r.codes))}
// note: a pure top-protrusion-by-displacement case cannot exist - raising the
// unit always breaks floor contact first (CONTACT_GAP_FLOATING fires); only an
// oversized unit protrudes through the ceiling with contact intact (covered above).
const badInterior={...INTERIOR,maxY:180000};
c('authoring guard: interior exceeding bag bounds is detectable',!inside(badInterior,BAG));
const fails=checks.filter(x=>!x.ok);
console.log('RESULT: '+(fails.length?`FAIL (${fails.length})`:`PASS - ${checks.length} checks`)+' (proposal-stage arithmetic, NOT gate evidence)');
process.exit(fails.length?1:0);
