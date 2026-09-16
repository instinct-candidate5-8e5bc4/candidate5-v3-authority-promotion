'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const acorn=require('/usr/lib/node_modules/eslint/node_modules/acorn/dist/acorn.js');
const ROOT=path.resolve(__dirname,'../../..'),BASE='7020b41e9067f5c58fb094cb126cd9ddc014ab72';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function lineCol(s,pos){let a=s.slice(0,pos).split('\n');return {line:a.length,column:a.at(-1).length}}
function scripts(){const html=read('index.html'),out=[];const re=/<script([^>]*)>([\s\S]*?)<\/script>/gi;let m,i=0;while((m=re.exec(html))){i++;if(/\bsrc\s*=/.test(m[1])||/type\s*=\s*["']importmap/.test(m[1]))continue;let start=m.index+m[0].indexOf(m[2]);out.push({file:'index.html',unit:`inline-${i}`,source:m[2],base:start,fileSource:html,sourceType:/type\s*=\s*["']module/.test(m[1])?'module':'script'});}for(const f of fs.readdirSync(path.join(ROOT,'src/nextgen')).filter(x=>x.endsWith('.js')).sort()){const p='src/nextgen/'+f,s=read(p);out.push({file:p,unit:f,source:s,base:0,fileSource:s,sourceType:'script'});}return out}
function walk(n,anc,fn){if(!n||typeof n!=='object')return;fn(n,anc);const next=anc.concat(n);for(const [k,v] of Object.entries(n)){if(['start','end','loc'].includes(k))continue;if(Array.isArray(v))for(const x of v)walk(x,next,fn);else if(v&&typeof v.type==='string')walk(v,next,fn)}}
function memberText(n,s){return s.slice(n.start,n.end)}
const transformLeaf=/\.(position|rotation|quaternion|scale)\.(x|y|z|w|order)$/;
const transformWhole=/\.(position|rotation|quaternion|scale|matrix|matrixWorld|matrixAutoUpdate)$/;
const transformMethods=new Set(['set','copy','lerp','add','sub','multiplyScalar','setScalar','setFromEuler','multiply','slerp','applyMatrix4']);
const membership=new Set(['add','remove','removeFromParent','clear','attach']);
const geometryMethods=new Set(['setAttribute','deleteAttribute','setIndex','setDrawRange','addGroup','clearGroups','dispose','setXYZ','setXYZW','copyArray']);
function enclosingFunction(anc,unit){const n=[...anc].reverse().find(x=>/Function|MethodDefinition/.test(x.type));return n?`${unit}:${n.start}-${n.end}`:`${unit}:TOP_LEVEL`}
function classify(node,u,anc){let kind=null,physical=false,instrumentability='DIAGNOSTIC_ONLY',detail='',computed=false;
 if(node.type==='AssignmentExpression'||node.type==='UpdateExpression'){
  const l=node.left||node.argument;if(l?.type==='MemberExpression'){
   const t=memberText(l,u.source);computed=l.computed;
   if(transformLeaf.test(t)){kind='DIRECT_SCALAR_WRITE';physical=true}
   else if(transformWhole.test(t)){kind='TRANSFORM_OR_MATRIX_WRITE';physical=true}
   else if(/\.geometry$/.test(t)){kind='GEOMETRY_REPLACEMENT';physical=true}
   else if(/\.visible$/.test(t)){kind='VISIBILITY_STATE_WRITE';physical=true;instrumentability='AMBIGUOUS'}
   else if(/\.(array|morphAttributes|drawRange|index)\b/.test(t)){kind='GEOMETRY_CONTENT_WRITE';physical=true}
   if(physical){detail=t;instrumentability=computed?'AMBIGUOUS':'INSTRUMENTABLE'}
  }else if((node.type==='AssignmentExpression'&&/Pattern$/.test(l?.type||''))){kind='DESTRUCTURING_WRITE';instrumentability='AMBIGUOUS'}
 }
 if(node.type==='CallExpression'&&node.callee?.type==='MemberExpression'){
  const callee=memberText(node.callee,u.source),prop=node.callee.computed?null:node.callee.property.name;computed=node.callee.computed;
  if(membership.has(prop)){kind='SCENE_MEMBERSHIP_OR_REPARENT';physical=true;instrumentability=/^(scene|world|[A-Za-z_$][\w$]*\.(scene|group))\./.test(callee)?'INSTRUMENTABLE':'AMBIGUOUS'}
  else if(transformMethods.has(prop)&&/\.(position|rotation|quaternion|scale)\./.test(callee+'.')){kind='TRANSFORM_MUTATOR_CALL';physical=true}
  else if(geometryMethods.has(prop)&&/(geometry|attribute|buffer|index|morph)/i.test(callee)){kind='GEOMETRY_MUTATOR_CALL';physical=true}
  else if(['updateMatrix','updateMatrixWorld','updateWorldMatrix'].includes(prop)){kind='DERIVED_RECOMPUTATION';instrumentability='DIAGNOSTIC_ONLY'}
  else if(['assign'].includes(prop)&&/Object\.assign/.test(callee)){kind='DYNAMIC_OR_REFLECTIVE_WRITE';instrumentability='AMBIGUOUS'}
  else if(/Reflect\.set/.test(callee)){kind='DYNAMIC_OR_REFLECTIVE_WRITE';instrumentability='AMBIGUOUS'}
  if(physical){detail=callee;if(kind!=='SCENE_MEMBERSHIP_OR_REPARENT')instrumentability=computed?'AMBIGUOUS':'INSTRUMENTABLE'}
 }
 if(!kind)return null;
 const absStart=u.base+node.start,absEnd=u.base+node.end,range=u.fileSource.slice(absStart,absEnd),lc=lineCol(u.fileSource,absStart),func=enclosingFunction(anc,u.unit),context=u.source.slice(Math.max(0,node.start-160),Math.min(u.source.length,node.end+160));
 const related=/(persist|recover|replay|debug|test|audit|query|URLSearchParams)/i.test(context+' '+u.file+' '+func);
 if(physical&&related)kind=kind+'__LEGACY_DEBUG_RECOVERY_PERSISTENCE';
 return {staticPathId:'SP-'+sha(`${sha(u.fileSource)}:${absStart}:${absEnd}:${node.type}`).slice(0,20),file:u.file,unit:u.unit,start:absStart,end:absEnd,line:lc.line,column:lc.column,nodeType:node.type,operator:node.operator||null,kind,physical,instrumentability,computed,sourceRangeSha256:sha(range),sourceRange:range,enclosingFunction:func,legacyRelated:related,runtimeEssential:physical&&!related,expectedEventClass:physical?'PHYSICAL_MUTATION':'DERIVED_RECOMPUTATION'};
}
const parseFailures=[],rows=[];
for(const u of scripts())try{const ast=acorn.parse(u.source,{ecmaVersion:'latest',sourceType:u.sourceType,allowHashBang:true});walk(ast,[],(n,a)=>{const r=classify(n,u,a);if(r)rows.push(r)})}catch(e){parseFailures.push({file:u.file,unit:u.unit,message:e.message,pos:e.pos})}
rows.sort((a,b)=>a.file.localeCompare(b.file)||a.start-b.start||a.end-b.end);
const count=k=>rows.filter(k).length,physical=rows.filter(x=>x.physical),by={};for(const r of rows)by[r.kind]=(by[r.kind]||0)+1;
const result={schemaVersion:'3.qualification.1',baseCommit:BASE,tool:{parser:'acorn',parserVersion:acorn.version,toolSha256:sha(fs.readFileSync(__filename))},parseUnits:scripts().length,parseFailures,counts:{allClassifiedSites:rows.length,authoritativePhysicalWriteCandidates:physical.length,directScalarWrites:count(x=>x.kind.startsWith('DIRECT_SCALAR_WRITE')),transformMutatorCalls:count(x=>x.kind.startsWith('TRANSFORM_MUTATOR_CALL')),sceneMembershipReparent:count(x=>x.kind.startsWith('SCENE_MEMBERSHIP_OR_REPARENT')),geometryMutationPaths:count(x=>x.kind.startsWith('GEOMETRY_')),persistenceRecoveryReplayPhysicalWrites:count(x=>x.physical&&x.legacyRelated),computedDynamicWrites:count(x=>x.computed||x.kind==='DYNAMIC_OR_REFLECTIVE_WRITE'),instrumentable:count(x=>x.physical&&x.instrumentability==='INSTRUMENTABLE'),ambiguous:count(x=>x.instrumentability==='AMBIGUOUS'),uninstrumentable:count(x=>x.instrumentability==='UNINSTRUMENTABLE'),libraryOnly:0,diagnosticOnly:count(x=>!x.physical),physicalFiles:new Set(physical.map(x=>x.file)).size,physicalFunctions:new Set(physical.map(x=>x.enclosingFunction)).size,independentMutationEntryPoints:new Set(physical.map(x=>x.enclosingFunction)).size,writesOutsideCentralBoundary:physical.length,geometryGateBypassCandidates:physical.length,legacyDebugRecoveryPersistenceRelated:count(x=>x.physical&&x.legacyRelated),runtimeEssential:count(x=>x.runtimeEssential)},byKind:by,rows};
result.manifestDigest=sha(JSON.stringify(result));fs.writeFileSync(path.join(ROOT,'evidence/verified-architecture-phase3/qualification/static-mutation-inventory.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({counts:result.counts,parseFailures:result.parseFailures,digest:result.manifestDigest},null,2));
