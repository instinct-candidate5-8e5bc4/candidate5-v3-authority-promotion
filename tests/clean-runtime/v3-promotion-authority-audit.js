'use strict';

const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),srcRoot=path.join(root,'src'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'foundation-allowed-paths.json'),'utf8'));
function walk(d){
return fs.readdirSync(d,{
withFileTypes:true
}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])
}const prod=walk(srcRoot).filter(x=>x.endsWith('.js')).sort(),rel=f=>path.relative(root,f).replaceAll('\\','/'),foundationPaths=Object.keys(manifest.files).sort(),foundation=foundationPaths.map(p=>path.join(root,p)),foundationSet=new Set(foundationPaths),findings=[];

const routingGate=manifest.routingGate||null,routingPaths=routingGate?Object.keys(routingGate.files||{}).sort():[],routingSet=new Set(routingPaths),allowedEdges=routingGate?.allowedInboundEdges||{};
if(!routingGate||routingGate.schemaVersion!=='v3-routing-gate-allowlist/1.0.0')findings.push({
id:'ROUTING_GATE_MANIFEST_MISSING'
});
for(const [importer,deps] of Object.entries(allowedEdges)){
if(!routingSet.has(importer))findings.push({
id:'ROUTING_EDGE_NOT_ROUTING_MODULE',file:importer
});
for(const d of deps)if(!foundationSet.has(d))findings.push({
id:'ROUTING_EDGE_NOT_FOUNDATION',file:importer,dependency:d
})
}

for(const p of foundationPaths){
if(!fs.existsSync(path.join(root,p))){
findings.push({
id:'MANIFEST_MISSING_FILE',file:p
});
continue
}const actual=cp.execFileSync('git',['hash-object',p],{
cwd:root,encoding:'utf8'
}).trim();
if(actual!==manifest.files[p])findings.push({
id:'MANIFEST_SHA_MISMATCH',file:p,expected:manifest.files[p],actual
})
}for(const p of routingPaths){
if(!fs.existsSync(path.join(root,p))){
findings.push({
id:'ROUTING_MISSING_FILE',file:p
});
continue
}const actual=cp.execFileSync('git',['hash-object',p],{
cwd:root,encoding:'utf8'
}).trim();
if(actual!==routingGate.files[p])findings.push({
id:'ROUTING_SHA_MISMATCH',file:p,expected:routingGate.files[p],actual
})
}const discovered=prod.filter(x=>x.includes('/clean-runtime/mutation/v3-')||x.endsWith('/physical-capability-router.js')||x.endsWith('/physical-proof-planner.js')||x.includes('/clean-runtime/v3-authority/')).map(rel).sort();
if(JSON.stringify(discovered)!==JSON.stringify(foundationPaths))findings.push({
id:'FOUNDATION_MANIFEST_SET_MISMATCH',expected:foundationPaths,actual:discovered
});
const discoveredRouting=prod.filter(x=>x.includes('/clean-runtime/v3-routing/')).map(rel).sort();
if(JSON.stringify(discoveredRouting)!==JSON.stringify(routingPaths))findings.push({
id:'ROUTING_MANIFEST_SET_MISMATCH',expected:routingPaths,actual:discoveredRouting
});

function imports(f){
const s=fs.readFileSync(f,'utf8'),out=[];
for(const m of s.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)){
const q=m[1];
if(!q.startsWith('.'))continue;
let p=path.resolve(path.dirname(f),q);
if(!path.extname(p))p+='.js';
out.push(rel(p))
}return out.sort()
}const graph=Object.fromEntries(prod.map(f=>[rel(f),imports(f)])),evalTarget='src/verified-architecture-phase2-v3/evaluate.js',evalImport=Object.entries(graph).filter(([,xs])=>xs.includes(evalTarget)).map(([f])=>f);
if(evalImport.length!==1||!evalImport[0].endsWith('/v3-authority-adapter.js'))findings.push({
id:'EVALUATOR_SEAM',files:evalImport
});

for(const f of [...foundation,...routingPaths.map(p=>path.join(root,p))]){
const s=fs.readFileSync(f,'utf8');
for(const token of ['Math.random','Date.now','setState(','commit(','appendEvent(','epsilon','clamp','snap'])if(s.includes(token))findings.push({
id:'FORBIDDEN_TOKEN',file:rel(f),token
});
const compositionRoots=new Set(routingGate?.compositionRoots||[]);
for(const dep of graph[rel(f)]||[])if(dep.includes('/clean-runtime/school/')||dep.endsWith('/world-mutation-api.js')||dep.includes('/renderer/')||dep.toLowerCase().includes('three')||(dep.endsWith('/authority-runtime.js')&&!(routingSet.has(rel(f))&&compositionRoots.has(rel(f)))))findings.push({
id:foundationSet.has(rel(f))?'FOUNDATION_FORBIDDEN_IMPORT':'ROUTING_FORBIDDEN_IMPORT',file:rel(f),dependency:dep
})
}
const inbound=Object.entries(graph).filter(([f,xs])=>!foundationSet.has(f)&&xs.some(x=>foundationSet.has(x))).map(([f,xs])=>({
file:f,foundationImports:xs.filter(x=>foundationSet.has(x))
}));
const unexpectedInbound=inbound.filter(x=>{
const allowed=allowedEdges[x.file]||[];
return !routingSet.has(x.file)||JSON.stringify([...x.foundationImports].sort())!==JSON.stringify([...allowed].sort())
});
for(const x of unexpectedInbound)findings.push({
id:'FORBIDDEN_INBOUND_FOUNDATION_IMPORT',...x
});
for(const [importer,deps] of Object.entries(allowedEdges)){
if(!deps.length)continue;
const actual=(graph[importer]||[]).filter(x=>foundationSet.has(x));
if(JSON.stringify(actual)!==JSON.stringify([...deps].sort()))findings.push({
id:'ROUTING_SEAM_MISSING',file:importer,expected:deps,actual
})
}
const schoolInbound=inbound.filter(x=>x.file.includes('/clean-runtime/school/')),runtimeInbound=inbound.filter(x=>x.file.endsWith('/authority-runtime.js')||x.file.endsWith('/world-mutation-api.js')||x.file.includes('/renderer/'));

const adapter=foundation.find(f=>f.endsWith('/v3-authority-adapter.js')),adapterCalls=adapter?(fs.readFileSync(adapter,'utf8').match(/evaluateV3\s*\(/g)||[]).length:0;
if(adapterCalls!==1)findings.push({
id:'EVALUATOR_CALL_SITES',count:adapterCalls
});
const {
ROUTE_TABLE,validateRouteTable
}=require('../../src/clean-runtime/mutation/physical-capability-router');
try{
validateRouteTable(ROUTE_TABLE)
}catch(e){
findings.push({
id:'ROUTE_TABLE',error:e.message
})
}
const gatewayRouted=Object.entries(graph).some(([f,xs])=>f.endsWith('/phase2-gateway.js')&&xs.some(x=>foundationSet.has(x)||routingSet.has(x))),schoolConnected=schoolInbound.length>0,runtimeConnected=runtimeInbound.length>0,legalityPromoted=Object.entries(graph).some(([f,xs])=>!foundationSet.has(f)&&xs.some(x=>x.endsWith('/v3-authority-adapter.js'))),routingConnected=routingPaths.length>0&&unexpectedInbound.length===0&&Object.entries(allowedEdges).every(([f,deps])=>!deps.length||JSON.stringify((graph[f]||[]).filter(x=>foundationSet.has(x)))===JSON.stringify([...deps].sort()));
if(gatewayRouted)findings.push({
id:'GATEWAY_ROUTED'
});
if(schoolConnected)findings.push({
id:'SCHOOL_CONNECTED'
});
if(runtimeConnected)findings.push({
id:'RUNTIME_CONNECTED'
});
if(legalityPromoted)findings.push({
id:'LEGALITY_PROMOTED'
});
if(!routingConnected)findings.push({
id:'ROUTING_NOT_CONNECTED'
});
const body={
schemaVersion:'v3-foundation-authority-audit/1.3.0',gatewayRouted,schoolConnected,runtimeConnected,legalityPromoted,routingConnected,evaluatorImportSeams:evalImport,adapterEvaluatorCallSites:adapterCalls,foundationFiles:foundationPaths,manifestBlobShas:manifest.files,routingFiles:routingPaths,routingBlobShas:routingGate?.files||{},allowedRoutingEdges:allowedEdges,inboundFoundationImports:inbound,findings
};
const canonical=JSON.stringify(body);
body.auditDigest=crypto.createHash('sha256').update(canonical).digest('hex');
console.log(JSON.stringify(body,null,2));
if(findings.length)process.exit(1);
