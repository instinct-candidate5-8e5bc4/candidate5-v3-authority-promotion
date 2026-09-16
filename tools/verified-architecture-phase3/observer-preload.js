const EXPECTED_HOSTS=new Set(['127.0.0.1','localhost']);
const params=new URLSearchParams(location.search);
const authorized=EXPECTED_HOSTS.has(location.hostname)&&params.get('p3ObserverGate')==='integration-touchpoint-v1';
if(authorized){
  const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
  const enabled=params.get('p3Observer')==='on';
  const events=[],frames=[],errors=[];let sequence=0,firstMutationSequence=null,renderCount=0,serializedBytes=0;
  const now=()=>performance.now();
  const copyValue=v=>{if(v&&typeof v==='object'){if(v.isVector3||v.isEuler)return {x:v.x,y:v.y,z:v.z};if(v.isQuaternion)return {x:v.x,y:v.y,z:v.z,w:v.w};if(v.isObject3D)return {uuid:v.uuid,name:v.name||'',type:v.type,parentUuid:v.parent?.uuid||null};}return typeof v==='number'||typeof v==='string'||typeof v==='boolean'||v==null?v:String(v)};
  const emit=(kind,target,args,before,after)=>{if(firstMutationSequence===null)firstMutationSequence=sequence+1;if(!enabled)return;const e={sequence:++sequence,kind,target:copyValue(target),args:[...args].map(copyValue),before,after,logicalFrame:renderCount};events.push(e);serializedBytes+=JSON.stringify(e).length};
  const wrap=(proto,key,snapshot=x=>copyValue(x))=>{const original=proto[key];if(typeof original!=='function')throw Error('P3_WRAP_TARGET_INVALID:'+key);Object.defineProperty(proto,key,{configurable:true,writable:true,value:function(...args){const before=snapshot(this);let result;try{result=Reflect.apply(original,this,args)}catch(error){errors.push({key,name:error.name,message:error.message});throw error}emit(key,this,args,before,snapshot(this));return result}});return original};
  const vecSnap=v=>({x:v.x,y:v.y,z:v.z});
  for(const key of ['set','copy','lerp','add','sub','multiplyScalar'])wrap(THREE.Vector3.prototype,key,vecSnap);
  for(const key of ['set','copy','reorder'])wrap(THREE.Euler.prototype,key,vecSnap);
  for(const key of ['set','copy','setFromEuler','multiply','slerp'])wrap(THREE.Quaternion.prototype,key,q=>({x:q.x,y:q.y,z:q.z,w:q.w}));
  for(const key of ['add','remove','removeFromParent','clear','updateMatrix','updateMatrixWorld','updateWorldMatrix'])if(typeof THREE.Object3D.prototype[key]==='function')wrap(THREE.Object3D.prototype,key,o=>({uuid:o.uuid,parentUuid:o.parent?.uuid||null,position:vecSnap(o.position),rotation:vecSnap(o.rotation),scale:vecSnap(o.scale),matrix:o.matrix.elements.slice(),matrixWorld:o.matrixWorld.elements.slice(),children:o.children.map(x=>x.uuid)}));
  for(const key of ['setAttribute','deleteAttribute','setIndex','setDrawRange','computeBoundingBox','computeBoundingSphere','dispose'])if(typeof THREE.BufferGeometry.prototype[key]==='function')wrap(THREE.BufferGeometry.prototype,key,g=>({uuid:g.uuid,version:g.version||0,attributes:Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,{itemSize:a.itemSize,count:a.count,version:a.version,arrayType:a.array?.constructor?.name}]))}));
  const renderOriginal=THREE.WebGLRenderer.prototype.render;Object.defineProperty(THREE.WebGLRenderer.prototype,'render',{configurable:true,writable:true,value:function(scene,camera){const started=now();const result=Reflect.apply(renderOriginal,this,[scene,camera]);const ended=now();renderCount++;frames.push({frame:renderCount,renderMs:ended-started,objects:(()=>{let n=0;scene.traverse(()=>n++);return n})()});return result}});
  let last=now();const raf=()=>{const t=now();frames.push({raf:frames.filter(x=>x.raf).length+1,deltaMs:t-last});last=t;if(frames.filter(x=>x.raf).length<180)requestAnimationFrame(raf)};requestAnimationFrame(raf);
  globalThis.__p3ObserverGate=Object.freeze({authorized:true,enabled,installedAt:now(),installationBeforeFirstMutation:()=>firstMutationSequence===1||(!enabled&&firstMutationSequence===0),snapshot:()=>structuredClone({enabled,events,frames,errors,sequence,firstMutationSequence,serializedBytes,heap:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null})});
  document.documentElement.dataset.p3ObserverInstalled='true';document.documentElement.dataset.p3ObserverMode=enabled?'on':'off';
}else{
  globalThis.__p3ObserverGate=Object.freeze({authorized:false,enabled:false,reason:'PRODUCTION_EXCLUSION'});
}
