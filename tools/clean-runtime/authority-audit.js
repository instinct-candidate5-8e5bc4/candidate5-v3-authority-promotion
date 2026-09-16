'use strict';
const fs=require('node:fs'),path=require('node:path'),acorn=require('internal/deps/acorn/acorn/dist/acorn'),walk=require('internal/deps/acorn/acorn-walk/dist/walk');
const root=path.resolve(__dirname,'../..'),srcRoot=path.join(root,'src/clean-runtime'),files=[];
function scanFiles(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,x.name);x.isDirectory()?scanFiles(p):x.name.endsWith('.js')&&files.push(p)}}scanFiles(srcRoot);
const mutationOwners=new Set(['world/world-store.js','mutation/world-mutation-api.js','contracts/world-state.js','events/replay.js']);
mutationOwners.add('events/event-log.js');mutationOwners.add('multi-support/runtime.js');
const internalOnly=new Set(['world/world-store.js','mutation/world-mutation-api.js']);
const forbiddenDependencies=['three','src/nextgen','index.html','sw.js'];
const findings=[];let parsedNodes=0,geometryGateCallSites=0;
function memberName(n){return n.computed&&n.property.type==='Literal'?String(n.property.value):(!n.computed&&n.property.type==='Identifier'?n.property.name:null)}
for(const f of files){const rel=path.relative(srcRoot,f).replaceAll(path.sep,'/'),source=fs.readFileSync(f,'utf8');let ast;try{ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'})}catch(e){findings.push({rule:'PARSE_FAILURE',file:rel,line:e.loc?.line||null,detail:e.message});continue}
 walk.full(ast,node=>{parsedNodes++;if(node.type==='AssignmentExpression'||node.type==='UpdateExpression'){const target=node.type==='AssignmentExpression'?node.left:node.argument;if(target.type==='MemberExpression'){const name=memberName(target);if(['entities','state','transform','position','positionMicrounits','physicalRelations','supportRelation','parentEntityId','physicalBodyRef','participatesIn'].includes(name)&&!mutationOwners.has(rel))findings.push({rule:'UNAUTHORIZED_PHYSICAL_WRITE',file:rel,start:node.start,member:name})}}
 if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'){const name=memberName(node.callee);if(['set','delete','splice','push'].includes(name)&&!mutationOwners.has(rel))findings.push({rule:'UNAUTHORIZED_MUTATING_CALL',file:rel,start:node.start,member:name})}
 if(node.type==='CallExpression'&&node.callee.name==='require'&&node.arguments[0]?.type==='Literal'){const dep=String(node.arguments[0].value).toLowerCase();if(dep.includes('verified-architecture-phase2/geometry-gate')){geometryGateCallSites++;if(!['school/school-geometry-adapter.js','mutation/phase2-gateway.js'].includes(rel))findings.push({rule:'GEOMETRY_GATE_BYPASS',file:rel,start:node.start})}if(forbiddenDependencies.some(x=>dep.includes(x)))findings.push({rule:'FORBIDDEN_DEPENDENCY',file:rel,start:node.start,dependency:dep})}
 });
 if(rel==='school/school-geometry-adapter.js'&&/distance|tolerance|containment|collision correction|auto.?move|snap|clamp|pixel|panorama|three/i.test(source))findings.push({rule:'ADAPTER_NOT_THIN_OR_VISUAL_AUTHORITY',file:rel});
 if(rel==='index.js'&&[...internalOnly].some(x=>source.includes(x)))findings.push({rule:'PUBLIC_INTERNAL_EXPORT',file:rel});
}
if(geometryGateCallSites!==1)findings.push({rule:'GEOMETRY_GATE_CALL_SITE_COUNT',actual:geometryGateCallSites,expected:1});
const result={geometryGateCallSites,auditKind:'ACORN_AST_AUTHORITY_AUDIT',ecmaVersion:'latest',files:files.length,parsedNodes,mutationOwnerModules:[...mutationOwners],internalOnlyModules:[...internalOnly],forbiddenDependencies,unauthorizedFindings:findings,status:findings.length?'FAIL':'PASS'};
const out=process.env.CLEAN_RUNTIME_AUDIT_OUTPUT?path.resolve(process.env.CLEAN_RUNTIME_AUDIT_OUTPUT):path.join(root,'evidence/clean-runtime/authority-skeleton/authority-audit.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(findings.length)process.exitCode=1;
