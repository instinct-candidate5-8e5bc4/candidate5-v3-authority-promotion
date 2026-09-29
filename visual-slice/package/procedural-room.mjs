// TRACK B / PW-2: procedural room architecture skin (production-world track).
// Every dimension derives from the CERTIFIED room surface descriptors in the
// committed scene bundle (authority); the skin only re-skins those bounds and
// adds documented decorative elements (ceiling, window, trim, door handle)
// that never contradict the scene definition and carry zero physical
// authority. Surfaces are matched by visualSurfaceId and unwrapped from
// geometryMicrounits - never by array position or assumed layout.
// Procedural = first $0 path, not the quality ceiling: ZERO-COST is a
// permanent project constraint (owner directive 2026-09-30) and any future
// external asset needs explicit provenance/license evidence before entering.
const U=1e6,m=v=>v/U;
function canvasTex(THREE,w,h,paint,repX=1,repY=1){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repX,repY);return t}
function floorTexture(THREE){return canvasTex(THREE,256,256,(x,w,h)=>{x.fillStyle='#8f8a7d';x.fillRect(0,0,w,h);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#948f82':'#8a8578';x.fillRect(i*64,j*64,64,64)}
 x.strokeStyle='rgba(60,58,50,.55)';x.lineWidth=2;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,h);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(w,i*64);x.stroke()}
 for(let i=0;i<300;i++){x.fillStyle='rgba(70,66,58,'+Math.random()*.08+')';x.fillRect(Math.random()*w,Math.random()*h,2,2)}},10,10)}
function plasterTexture(THREE,tint){return canvasTex(THREE,128,128,(x,w,h)=>{x.fillStyle=tint;x.fillRect(0,0,w,h);
 for(let i=0;i<900;i++){x.fillStyle='rgba(0,0,0,'+Math.random()*.05+')';x.fillRect(Math.random()*w,Math.random()*h,1,1)}
 for(let i=0;i<400;i++){x.fillStyle='rgba(255,255,255,'+Math.random()*.05+')';x.fillRect(Math.random()*w,Math.random()*h,1,1)}},6,2)}
function lockerTexture(THREE){return canvasTex(THREE,128,256,(x,w,h)=>{x.fillStyle='#4d7a99';x.fillRect(0,0,w,h);
 const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.strokeStyle='rgba(20,40,55,.8)';x.lineWidth=4;x.strokeRect(8,8,w-16,h-16);
 x.fillStyle='rgba(20,40,55,.85)';for(let i=0;i<5;i++)x.fillRect(24,30+i*14,w-48,6);           // vents
 x.fillStyle='#d8d4c8';x.fillRect(w-30,h/2-14,12,26);                                            // handle
 for(let i=0;i<120;i++){x.fillStyle='rgba(0,0,0,'+Math.random()*.06+')';x.fillRect(Math.random()*w,Math.random()*h,1,2)}})}
function woodTexture(THREE){return canvasTex(THREE,128,128,(x,w,h)=>{x.fillStyle='#8a6a44';x.fillRect(0,0,w,h);
 for(let i=0;i<24;i++){x.strokeStyle='rgba(60,40,20,'+(0.12+Math.random()*0.18)+')';x.lineWidth=1+Math.random()*2;
  x.beginPath();const y=Math.random()*h;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+6,w*.6,y-6,w,y);x.stroke()}
 for(let i=0;i<60;i++){x.fillStyle='rgba(50,32,16,'+Math.random()*.1+')';x.fillRect(Math.random()*w,Math.random()*h,2,1)}},1,2)}
function box(THREE,b,mat,o={}){const sx=m(b.maxX-b.minX),sy=m(b.maxY-b.minY),sz=m(b.maxZ-b.minZ);
 if(!(sx>0&&sy>0&&sz>0))return new THREE.Group();                 // fail-safe: skip degenerate bounds
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
 mesh.position.set(m(b.minX)+sx/2,m(b.minY)+sy/2,m(b.minZ)+sz/2);
 if(o.cast)mesh.castShadow=true;if(o.receive!==false)mesh.receiveShadow=true;return mesh}
function slab(THREE,sx,sy,sz,mat,x,y,z,cast){const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
 mesh.position.set(x,y,z);if(cast)mesh.castShadow=true;mesh.receiveShadow=true;return mesh}
const aabbOf=s=>s&&(s.geometryMicrounits||s);

export function buildProceduralRoom(THREE,room){
 const grp=new THREE.Group();grp.name='vw-school-treatment-room';
 const byId={};for(const s of room||[]){if(s&&s.visualSurfaceId)byId[s.visualSurfaceId]=aabbOf(s)}
 const floor=byId['visual:floor'],back=byId['visual:back-wall'],left=byId['visual:left-wall'],
       right=byId['visual:right-wall'],door=byId['visual:door'];
 const lockers=Object.keys(byId).filter(k=>/^visual:locker-\d+$/.test(k)).sort().map(k=>byId[k]);
 const floorMat=new THREE.MeshStandardMaterial({map:floorTexture(THREE),roughness:.9,metalness:.02});
 const wallMat=new THREE.MeshStandardMaterial({map:plasterTexture(THREE,'#c9c4b4'),roughness:.95});
 const wallMatSide=new THREE.MeshStandardMaterial({map:plasterTexture(THREE,'#c4bfaf'),roughness:.95});
 const lockerMat=new THREE.MeshStandardMaterial({map:lockerTexture(THREE),roughness:.55,metalness:.35});
 const doorMat=new THREE.MeshStandardMaterial({map:woodTexture(THREE),roughness:.65,metalness:.05});
 const trimMat=new THREE.MeshStandardMaterial({color:0x8a8578,roughness:.8});
 const ceilMat=new THREE.MeshStandardMaterial({map:plasterTexture(THREE,'#d6d2c6'),roughness:.95});
 // Certified skins (exact AABB substitution, by certified surface id).
 if(floor)grp.add(box(THREE,floor,floorMat));
 if(back)grp.add(box(THREE,back,wallMat));
 if(left)grp.add(box(THREE,left,wallMatSide));
 if(right)grp.add(box(THREE,right,wallMatSide));
 for(const l of lockers)grp.add(box(THREE,l,lockerMat,{cast:true}));
 // Certified door slab: wood skin + decorative handle. The door surface is
 // part of the certified set; the handle is decorative and non-authoritative.
 if(door){grp.add(box(THREE,door,doorMat,{cast:true}));
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.16,10),trimMat);
  handle.rotation.x=Math.PI/2;
  handle.position.set(m(door.maxX)-0.12,1.05,m(door.maxZ)+0.04);grp.add(handle)}
 // Decorative: ceiling spanning exactly the certified walls' footprint
 // (side walls to back wall), sitting on the certified wall tops.
 if(back&&left&&right){
  const topY=Math.max(m(back.maxY),m(left.maxY),m(right.maxY));
  const cx0=m(left.minX),cx1=m(right.maxX);
  const cz0=m(back.minZ),cz1=Math.max(m(left.maxZ),m(right.maxZ));
  grp.add(slab(THREE,cx1-cx0,0.12,cz1-cz0,ceilMat,(cx0+cx1)/2,topY+0.06,(cz0+cz1)/2));
  // Decorative: window on the back wall, above locker tops, clear of the
  // certified door span. Glass is slightly emissive; frame is trim wood.
  const lockerTop=lockers.length?Math.max(...lockers.map(l=>m(l.maxY))):0;
  const wy0=Math.max(lockerTop+0.6,3.2),wy1=Math.min(wy0+1.6,topY-0.6);
  const doorMinX=door?m(door.minX):Infinity;
  let wx0=m(back.minX)+1.2,wx1=wx0+2.4;
  if(wx1>doorMinX-0.4)wx0=doorMinX-0.4-2.4,wx1=doorMinX-0.4;     // keep clear of door
  const wz=m(back.maxZ)+0.02;
  const glassMat=new THREE.MeshStandardMaterial({color:0xbfd8e8,roughness:.15,metalness:.1,emissive:0x9fb8cc,emissiveIntensity:.35});
  grp.add(slab(THREE,wx1-wx0,wy1-wy0,0.03,glassMat,(wx0+wx1)/2,(wy0+wy1)/2,wz));
  grp.add(slab(THREE,wx1-wx0+0.16,0.08,0.06,trimMat,(wx0+wx1)/2,wy1+0.04,wz));
  grp.add(slab(THREE,wx1-wx0+0.16,0.08,0.06,trimMat,(wx0+wx1)/2,wy0-0.04,wz));
  grp.add(slab(THREE,0.08,wy1-wy0+0.16,0.06,trimMat,wx0-0.04,(wy0+wy1)/2,wz));
  grp.add(slab(THREE,0.08,wy1-wy0+0.16,0.06,trimMat,wx1+0.04,(wy0+wy1)/2,wz));
  // Decorative: baseboards along the certified walls' interior faces.
  const bbH=0.12;
  grp.add(slab(THREE,m(back.maxX-back.minX),bbH,0.02,trimMat,m((back.minX+back.maxX)/2),bbH/2,m(back.maxZ)+0.01));
  grp.add(slab(THREE,0.02,bbH,m(left.maxZ-left.minZ),trimMat,m(left.maxX)+0.01,bbH/2,m((left.minZ+left.maxZ)/2)));
  grp.add(slab(THREE,0.02,bbH,m(right.maxZ-right.minZ),trimMat,m(right.minX)-0.01,bbH/2,m((right.minZ+right.maxZ)/2)));
 }
 return grp;
}
