(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonMigrations=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Next-Gen ID 78: Migration system.
// A version upgrade must never break old simulations. Every persisted document kind
// (scenario, event-log metadata, save envelope) carries an explicit version, and a
// registered deterministic migration chain upgrades it. Unknown versions fail closed:
// no chain, no migration, original document preserved.
const MIGRATION_REGISTRY_VERSION='mig-1.0';
const clone=v=>JSON.parse(JSON.stringify(v));
const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'};
// Mirrors the FNV-1a/stable-stringify hash in core.js so migration provenance hashes
// are comparable with event-log integrity hashes.
const hash=v=>{let h=2166136261,x=stable(v);for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
function invariant(ok,msg){if(!ok)throw new Error(msg)}
const steps=[];
function registerMigration(step){
 invariant(step&&step.kind&&step.from&&step.to&&typeof step.migrate==='function','MIGRATION_STEP_INVALID');
 invariant(step.from!==step.to,'MIGRATION_STEP_LOOP');
 steps.push(Object.freeze({kind:String(step.kind),from:String(step.from),to:String(step.to),migrate:step.migrate}));
}
function findPath(kind,from,to){
 const queue=[[from,[]]],seen=new Set([from]);
 while(queue.length){
  const [version,path]=queue.shift();
  if(version===to)return path;
  for(const s of steps){
   if(s.kind!==kind||s.from!==version||seen.has(s.to))continue;
   seen.add(s.to);queue.push([s.to,[...path,s]]);
  }
 }
 return null;
}
// Generic deterministic chain runner. Returns {doc, report}; throws MIGRATION_PATH_MISSING
// when no registered chain reaches the target version.
function migrate({kind,doc,to}){
 invariant(kind&&doc,'MIGRATION_DOC_INVALID');
 const from=versionOf(kind,doc);
 invariant(from,'MIGRATION_VERSION_UNKNOWN');
 if(from===to)return{doc:clone(doc),report:{kind,from,to,steps:[],changed:false,beforeHash:hash(doc),afterHash:hash(doc)}};
 const path=findPath(kind,from,to);
 invariant(path,'MIGRATION_PATH_MISSING:'+kind+':'+from+'->'+to);
 let current=clone(doc);const applied=[];
 for(const s of path){current=s.migrate(current);invariant(current&&typeof current==='object','MIGRATION_STEP_INVALID_OUTPUT:'+s.from);applied.push({from:s.from,to:s.to})}
 return{doc:current,report:{kind,from,to,steps:applied,changed:true,beforeHash:hash(doc),afterHash:hash(current),registry:MIGRATION_REGISTRY_VERSION}};
}
function versionOf(kind,doc){
 if(kind==='scenario')return doc&&doc.version!=null?String(doc.version):null;
 if(kind==='eventlog-meta')return doc&&doc.engineVersion!=null?String(doc.engineVersion):null;
 if(kind==='save')return doc&&doc.saveVersion!=null?String(doc.saveVersion):null;
 return null;
}
// Built-in: v3 scenario document -> v4 (spec ID 78: "v3 Scenario -> Migration -> v4 Scenario").
// v3 predates the rules-version contract (ID 43); the migration attaches it and normalizes
// the initial medical state without inventing clinical data: missing fields become 'unknown'
// and the condition is clamped into the valid 0-100 range.
registerMigration({kind:'scenario',from:'3.0',to:'4.0.0-p0.2',migrate(doc){
 invariant(doc.id&&doc.initialState,'MIGRATION_DOC_INVALID:scenario');
 const s=doc.initialState;
 const condition=Number.isFinite(s.condition)?Math.max(0,Math.min(100,s.condition)):50;
 return{...clone(doc),version:'4.0.0-p0.2',rulesVersion:'clinical-p0.2',initialState:{condition,consciousness:s.consciousness||'unknown',breathing:s.breathing||'unknown',perfusion:s.perfusion||'unknown'},migratedFrom:String(doc.version),migration:MIGRATION_REGISTRY_VERSION};
}});
// Built-in: event-log metadata from the p0.1 engine line -> current p0.2 contract.
// Event hashes cover event fields only (never meta), so upgrading meta keeps the
// append-only chain intact; replay compatibility after migration is verified by the
// persistence lane before any restore is accepted.
registerMigration({kind:'eventlog-meta',from:'4.0.0-p0.1',to:'4.0.0-p0.2',migrate(meta){
 invariant(meta&&meta.scenarioId,'MIGRATION_DOC_INVALID:eventlog-meta');
 return{...clone(meta),engineVersion:'4.0.0-p0.2',rulesVersion:'clinical-p0.2',migratedFrom:String(meta.engineVersion),migration:MIGRATION_REGISTRY_VERSION};
}});
// Built-in: pilot save envelopes ('save-0.9') lacked kind/status; default them honestly.
registerMigration({kind:'save',from:'save-0.9',to:'save-1.0',migrate(env){
 invariant(env&&env.payload,'MIGRATION_DOC_INVALID:save');
 return{...clone(env),saveVersion:'save-1.0',kind:env.kind||'session',status:env.status||'in-progress'};
}});
return{MIGRATION_REGISTRY_VERSION,registerMigration,migrate,findPath,hash,stable};
});
