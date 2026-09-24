// TRACK B / C2 articulated visual layout. PURE MATH, no three.js import:
// consumed by the preview page (mesh construction) AND by the node geometric
// gates (G13 containment, G1-G5 support/contact). Every part is expressed in
// integer microunits and must be fully contained inside its certified source
// component AABB - visual articulation within certified envelopes, never new
// geometry claims. Certified colorHex values stay dominant; accent parts
// (hair, eyes, shoes, cushion, zipper, strap) are presentation-only.
// Renderer remains downstream of ED-P2-02; nothing here feeds state.
export function buildArticulatedLayout(liveCasualty,liveEquipment){
 const comp=Object.fromEntries(liveCasualty.components.map(c=>[c.componentId,c]));
 const P=(shape,extra)=>({shape,...extra});
 const casualty=[];
 const add=(componentId,colorHex,parts)=>casualty.push({componentId,colorHex,parts});
 add('head',comp.head.visualOnlyAppearance.colorHex,[
  P('sphere',{center:[0,120000,1647000],radius:110000}),
  P('sphere',{center:[0,125000,1622000],radius:95000,colorHex:'0x3a2e24'}),
  P('sphere',{center:[-40000,228000,1655000],radius:8000,colorHex:'0x222222'}),
  P('sphere',{center:[40000,228000,1655000],radius:8000,colorHex:'0x222222'})]);
 add('torso',comp.torso.visualOnlyAppearance.colorHex,[
  P('capsuleZ',{center:[0,150000,1202000],radius:140000,cylinderLength:370000})]);
 add('left-arm',comp['left-arm'].visualOnlyAppearance.colorHex,[
  P('capsuleZ',{center:[-305000,90000,1227000],radius:24000,cylinderLength:652000})]);
 add('right-arm',comp['right-arm'].visualOnlyAppearance.colorHex,[
  P('capsuleZ',{center:[305000,90000,1227000],radius:24000,cylinderLength:652000})]);
 add('legs',comp.legs.visualOnlyAppearance.colorHex,[
  P('capsuleZ',{center:[-115000,110000,349000],radius:105000,cylinderLength:846000}),
  P('capsuleZ',{center:[115000,110000,349000],radius:105000,cylinderLength:846000}),
  P('box',{aabb:{minX:-215000,maxX:-15000,minY:0,maxY:90000,minZ:-179000,maxZ:-99000},colorHex:'0x24262b'}),
  P('box',{aabb:{minX:15000,maxX:215000,minY:0,maxY:90000,minZ:-179000,maxZ:-99000},colorHex:'0x24262b'})]);
 const ch=Object.fromEntries(liveEquipment.chair.components.map(c=>[c.componentId,c]));
 const wood='0x8a6a4f',metal=ch['lower-frame'].visualOnlyAppearance.colorHex;
 const leg=x=>z=>P('capsuleY',{center:[x,225000,z],radius:20000,cylinderLength:410000,colorHex:metal});
 const chair=[
  {componentId:'lower-frame',colorHex:metal,parts:[leg(-2200000)(800000),leg(-2200000)(1200000),leg(-1800000)(800000),leg(-1800000)(1200000),
   P('box',{aabb:{minX:-2240000,maxX:-1760000,minY:380000,maxY:440000,minZ:760000,maxZ:1240000},colorHex:metal})]},
  {componentId:'seat-slab',colorHex:wood,parts:[
   P('box',{aabb:{minX:-2245000,maxX:-1755000,minY:450000,maxY:470000,minZ:755000,maxZ:1245000},colorHex:wood}),
   P('box',{aabb:{minX:-2200000,maxX:-1800000,minY:470000,maxY:490000,minZ:800000,maxZ:1200000},colorHex:'0x9c7c5e'})]},
  {componentId:'backrest',colorHex:wood,parts:[
   P('box',{aabb:{minX:-2245000,maxX:-1755000,minY:480000,maxY:895000,minZ:752000,maxZ:788000},colorHex:wood}),
   P('box',{aabb:{minX:-2245000,maxX:-1755000,minY:860000,maxY:900000,minZ:750000,maxZ:790000},colorHex:'0x9c7c5e'})]}];
 const bagColor=liveEquipment.bag.components[0].visualOnlyAppearance.colorHex;
 const bag=[{componentId:'bag-body',colorHex:bagColor,parts:[
  P('box',{aabb:{minX:-3275000,maxX:-2725000,minY:0,maxY:250000,minZ:825000,maxZ:1175000},colorHex:bagColor}),
  P('box',{aabb:{minX:-3270000,maxX:-2730000,minY:250000,maxY:340000,minZ:830000,maxZ:1170000},colorHex:'0x6f3139'}),
  P('box',{aabb:{minX:-3260000,maxX:-2740000,minY:340000,maxY:348000,minZ:990000,maxZ:1010000},colorHex:'0xd8d3c8'}),
  P('box',{aabb:{minX:-3100000,maxX:-2900000,minY:330000,maxY:350000,minZ:970000,maxZ:1030000},colorHex:'0x2c2c30'})]}];
 // Geometry-derived contact shadows: footprints of floor-contacting parts.
 const contactShadows=[];
 const fp=aabb=>({minX:aabb.minX,maxX:aabb.maxX,minZ:aabb.minZ,maxZ:aabb.maxZ});
 for(const c of liveCasualty.components)if(c.floorContact)contactShadows.push({forComponent:'casualty:'+c.componentId,footprint:fp(c.worldAabbMicrounits)});
 for(const c of liveEquipment.chair.components)if(c.floorContact)contactShadows.push({forComponent:'chair:'+c.componentId,footprint:fp(c.worldAabbMicrounits)});
 for(const c of liveEquipment.bag.components)if(c.floorContact!==false)contactShadows.push({forComponent:'bag:'+c.componentId,footprint:fp(c.worldAabbMicrounits)});
 return {casualty,chair,bag,contactShadows}}
// AABB of any part, in integer microunits (shared by page and gates).
export function partAabb(part){
 if(part.shape==='sphere'){const[x,y,z]=part.center,r=part.radius;return{minX:x-r,maxX:x+r,minY:y-r,maxY:y+r,minZ:z-r,maxZ:z+r}}
 if(part.shape==='capsuleZ'){const[x,y,z]=part.center,r=part.radius,h=part.cylinderLength/2;return{minX:x-r,maxX:x+r,minY:y-r,maxY:y+r,minZ:z-h-r,maxZ:z+h+r}}
 if(part.shape==='capsuleY'){const[x,y,z]=part.center,r=part.radius,h=part.cylinderLength/2;return{minX:x-r,maxX:x+r,minY:y-h-r,maxY:y+h+r,minZ:z-r,maxZ:z+r}}
 return part.aabb}
export function aabbContains(outer,inner){
 return inner.minX>=outer.minX&&inner.maxX<=outer.maxX&&inner.minY>=outer.minY&&inner.maxY<=outer.maxY&&inner.minZ>=outer.minZ&&inner.maxZ<=outer.maxZ}
export function aabbOverlaps(a,b){
 return a.minX<b.maxX&&a.maxX>b.minX&&a.minY<b.maxY&&a.maxY>b.minY&&a.minZ<b.maxZ&&a.maxZ>b.minZ}
