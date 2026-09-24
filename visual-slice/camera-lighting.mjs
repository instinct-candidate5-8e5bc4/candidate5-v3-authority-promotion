// TRACK B / C3: camera fit + lighting rigs. Pure math, no three.js - node-testable.
// Camera: exact corner-based fit of the casualty world envelope along the
// authored view direction; never closer than the authored distance. Grounded
// input is the CERTIFIED casualty world envelope (descriptor-derived).
// Lighting: day/night/winter are RIGS ONLY (light params); no geometry, no
// material, no tint pass, no digest-bearing data.
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=a=>{const l=Math.hypot(a[0],a[1],a[2]);return[a[0]/l,a[1]/l,a[2]/l]};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function aabbCorners(a){const xs=[a.minX,a.maxX],ys=[a.minY,a.maxY],zs=[a.minZ,a.maxZ],out=[];
 for(const x of xs)for(const y of ys)for(const z of zs)out.push([x,y,z]);return out}
// fit: all corners project inside the viewport with `margin` (fraction of half-extent).
// Returns camera position in the same units as the inputs.
export function fitCameraToAabb(aabb,authoredPos,lookAt,fovDeg,aspect,margin=0.08){
 const dir=norm(sub(lookAt,authoredPos)); // camera forward
 const up0=Math.abs(dir[1])>0.99?[1,0,0]:[0,1,0];
 const right=norm(cross(dir,up0));
 const up=cross(right,dir);
 const tanV=Math.tan(fovDeg*Math.PI/360)*(1-margin);
 const tanH=tanV*aspect;
 const authoredDist=dot(sub(authoredPos,lookAt),dir)*-1||Math.hypot(...sub(authoredPos,lookAt));
 let d=Math.hypot(...sub(authoredPos,lookAt));
 for(const p of aabbCorners(aabb)){
  const v=sub(p,lookAt);
  const fwd=dot(v,dir); // corner depth relative to lookAt along forward
  const needH=Math.abs(dot(v,right))/tanH-fwd;
  const needV=Math.abs(dot(v,up))/tanV-fwd;
  d=Math.max(d,needH,needV);
 }
 d=Math.max(d,authoredDist,0.5);
 return {position:[lookAt[0]-dir[0]*d,lookAt[1]-dir[1]*d,lookAt[2]-dir[2]*d],distance:d,direction:dir};
}
// project a world point with a fitted camera; returns NDC [x,y] (inside iff |x|<=1 and |y|<=1)
export function projectNdc(point,camPos,lookAt,fovDeg,aspect){
 const dir=norm(sub(lookAt,camPos));
 const up0=Math.abs(dir[1])>0.99?[1,0,0]:[0,1,0];
 const right=norm(cross(dir,up0));
 const up=cross(right,dir);
 const v=sub(point,camPos);
 const z=dot(v,dir);
 const tanV=Math.tan(fovDeg*Math.PI/360);
 return [dot(v,right)/(z*tanV*aspect),dot(v,up)/(z*tanV)];
}
export const LIGHTING_RIGS=Object.freeze({
 day:Object.freeze({label:'יום',ambient:{colorHex:'0xbfd4e0',intensity:0.55},key:{colorHex:'0xfff2dd',intensity:1.1,positionMicrounits:[3000000,5000000,2000000]},fill:{colorHex:'0xdde8ff',intensity:0.35,positionMicrounits:[-4000000,3500000,4000000]},shadow:{mapSize:2048,bias:-0.0005}}),
 night:Object.freeze({label:'לילה',ambient:{colorHex:'0x2a3a55',intensity:0.28},key:{colorHex:'0xffe0b3',intensity:0.55,positionMicrounits:[2500000,4200000,1800000]},fill:{colorHex:'0x33415e',intensity:0.12,positionMicrounits:[-4000000,3000000,4000000]},shadow:{mapSize:2048,bias:-0.0005}}),
 winter:Object.freeze({label:'חורף',ambient:{colorHex:'0xaec6d8',intensity:0.62},key:{colorHex:'0xeaf2ff',intensity:0.85,positionMicrounits:[3500000,4800000,1500000]},fill:{colorHex:'0xcdd9ea',intensity:0.42,positionMicrounits:[-4000000,3500000,4000000]},shadow:{mapSize:2048,bias:-0.0005}})
});
