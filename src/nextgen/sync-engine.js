(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonSync=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Next-Gen ID 27 (Synchronization Engine) with the ID 26 offline-first outbox.
// Pipeline per the spec: Local Events -> Validation -> Upload -> Server Merge.
// Every local event receives a unique, dedupe-safe ID (device + monotonic sequence +
// content hash). Without a configured server transport nothing is ever marked synced:
// records stay queued locally and the status reports that honestly (fail-closed).
const SYNC_SCHEMA_VERSION='sync-1.0';
const clone=v=>JSON.parse(JSON.stringify(v));
const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'};
const hash=v=>{let h=2166136261,x=stable(v);for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
function invariant(ok,msg){if(!ok)throw new Error(msg)}
const validators={
 // A finished-scenario result record: lean scoring evidence plus the audit head hash
 // that anchors it to the tamper-evident P0 event log.
 'result':p=>p&&typeof p.caseKey==='string'&&Number.isFinite(p.score)&&typeof p.grade==='string'&&p.versions&&p.versions.engine&&p.evidence&&typeof p.evidence.auditHeadHash==='string'&&Number.isInteger(p.evidence.eventCount)?true:{code:'RESULT_SCHEMA_INVALID'},
 // A mid-session checkpoint marker: proves the local chain head at a point in time.
 'session-checkpoint':p=>p&&typeof p.eventLogHeadHash==='string'&&Number.isInteger(p.eventCount)&&p.eventCount>=0?true:{code:'CHECKPOINT_SCHEMA_INVALID'}
};
// Deterministic, idempotent server-side merge, exported so the future server endpoint
// and the client share one merge semantics. Union by eventId; identical re-uploads are
// duplicates; same ID with different content is a fail-closed conflict (deterministic
// winner by createdAtMs then eventId, conflict reported, never silently overwritten).
function mergeEventStreams({localEvents=[],remoteEvents=[]}){
 const byId=new Map(),conflicts=[],order=[];
 for(const source of [['local',localEvents],['remote',remoteEvents]]){
  for(const e of source[1]){
   if(!e||!e.eventId)continue;
   const existing=byId.get(e.eventId);
   if(!existing){byId.set(e.eventId,clone(e));order.push(e.eventId);continue}
   if(existing.contentHash!==e.contentHash){
    const winner=[existing,e].sort((a,b)=>(a.createdAtMs-b.createdAtMs)||String(a.eventId).localeCompare(String(b.eventId)))[0];
    byId.set(e.eventId,clone(winner));
    conflicts.push({eventId:e.eventId,keptContentHash:winner.contentHash,droppedContentHash:(winner===existing?e:existing).contentHash});
   }
  }
 }
 const events=[...byId.values()].sort((a,b)=>(a.createdAtMs-b.createdAtMs)||String(a.eventId).localeCompare(String(b.eventId)));
 return{events,conflicts,total:events.length,duplicates:(localEvents.length+remoteEvents.length)-events.length-conflicts.length};
}
function createHttpTransport({storage,baseUrl='',fetchImpl=globalThis.fetch,namespace='korishon'}={}){
 invariant(storage,'SYNC_STORAGE_REQUIRED');invariant(typeof fetchImpl==='function','SYNC_FETCH_REQUIRED');const credentialKey=`${namespace}:sync-credential`;
 const request=async(path,options)=>{const r=await fetchImpl(baseUrl+path,options);let body={};try{body=await r.json()}catch(e){}if(!r.ok)throw new Error(body.code||`HTTP_${r.status}`);return body};
 const credential=async()=>{try{const saved=JSON.parse(storage.getItem(credentialKey)||'null');if(saved?.token&&saved?.installationId)return saved}catch(e){}const created=await request('/api/sync/session',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(!created?.token||!created?.installationId)throw new Error('SYNC_CREDENTIAL_INVALID');storage.setItem(credentialKey,JSON.stringify(created));return created};
 return{upload:async events=>{const auth=await credential();return request('/api/sync/upload',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${auth.token}`},body:JSON.stringify({events})})}};
}
function createSyncEngine({storage,namespace='korishon',deviceId,transport=null,now=()=>Date.now(),maxAttempts=5}={}){
 invariant(storage,'SYNC_STORAGE_REQUIRED');
 const outboxKey=`${namespace}:sync-outbox`,ledgerKey=`${namespace}:sync-ledger`,seqKey=`${namespace}:sync-seq`,deviceKey=`${namespace}:device-id`;
 let device=deviceId;
 if(!device){device=storage.getItem(deviceKey);if(!device){device='dev-'+hash(String(now())+':'+Math.random())+Math.floor(Math.random()*1e6).toString(36);storage.setItem(deviceKey,device)}}
 let state='idle',lastSyncAtMs=null;
 const read=k=>{try{return JSON.parse(storage.getItem(k)||'[]')}catch(e){return[]}};
 const write=(k,v)=>storage.setItem(k,JSON.stringify(v));
 const nextSeq=()=>{const n=Number(storage.getItem(seqKey)||'0')+1;storage.setItem(seqKey,String(n));return n};
 function enqueue(kind,payload){
  const v=(validators[kind]||(()=>({code:'KIND_UNKNOWN'})))(payload);
  if(v!==true)return{enqueued:false,code:v.code||'VALIDATION_FAILED'};
  const contentHash=hash({kind,payload});
  const outbox=read(outboxKey);
  const dup=outbox.find(r=>r.contentHash===contentHash&&r.status==='queued');
  if(dup)return{enqueued:true,deduped:true,eventId:dup.eventId};
  const record={eventId:`${device}:${String(nextSeq()).padStart(8,'0')}`,kind,createdAtMs:now(),deviceId:device,payload:clone(payload),contentHash,attempts:0,lastError:null,status:'queued'};
  outbox.push(record);write(outboxKey,outbox);
  return{enqueued:true,eventId:record.eventId};
 }
 async function drain(){
  if(state!=='idle')return{status:'busy',queued:read(outboxKey).filter(r=>r.status==='queued').length};
  state='validating';
  let outbox=read(outboxKey);
  for(const r of outbox){if(r.status!=='queued')continue;const v=(validators[r.kind]||(()=>({code:'KIND_UNKNOWN'})))(r.payload);if(v!==true){r.status='dead';r.lastError=v.code||'VALIDATION_FAILED'}}
  write(outboxKey,outbox);
  const queued=outbox.filter(r=>r.status==='queued');
  if(!queued.length){state='idle';return{status:'idle',queued:0,synced:read(ledgerKey).length,dead:outbox.filter(r=>r.status==='dead').length}}
  if(!transport||typeof transport.upload!=='function'){state='idle';return{status:'queued-no-transport',queued:queued.length,synced:read(ledgerKey).length,dead:outbox.filter(r=>r.status==='dead').length}}
  state='uploading';
  let response;
  try{response=await transport.upload(clone(queued))}catch(e){
   outbox=read(outboxKey);
   for(const r of outbox)if(r.status==='queued'){r.attempts++;r.lastError='TRANSPORT_ERROR';if(r.attempts>=maxAttempts)r.status='dead'}
   write(outboxKey,outbox);state='idle';
   return{status:'failed',code:'TRANSPORT_ERROR',queued:outbox.filter(r=>r.status==='queued').length};
  }
  state='merging';
  const accepted=new Set((response&&response.acceptedIds)||[]),rejected=(response&&response.rejected)||[];
  outbox=read(outboxKey);const ledger=read(ledgerKey);
  const remaining=[];
  for(const r of outbox){
   if(r.status!=='queued'){remaining.push(r);continue}
   if(accepted.has(r.eventId)){ledger.push({eventId:r.eventId,kind:r.kind,contentHash:r.contentHash,ackedAtMs:now()});continue}
   const rej=rejected.find(x=>x.eventId===r.eventId);
   if(rej){r.attempts++;r.lastError=rej.code||'SERVER_REJECTED';if(r.attempts>=maxAttempts)r.status='dead'}
   remaining.push(r);
  }
  write(outboxKey,remaining);write(ledgerKey,ledger);
  lastSyncAtMs=now();state='idle';
  return{status:rejected.length?'partial':'synced',accepted:accepted.size,rejected:rejected.length,queued:remaining.filter(r=>r.status==='queued').length,synced:ledger.length,dead:remaining.filter(r=>r.status==='dead').length};
 }
 function status(){const outbox=read(outboxKey),ledger=read(ledgerKey);return{deviceId:device,state,queued:outbox.filter(r=>r.status==='queued').length,synced:ledger.length,dead:outbox.filter(r=>r.status==='dead').length,lastSyncAtMs,transport:transport?'configured':'none'}}
 return{enqueue,drain,status,mergeEventStreams:(l,r)=>mergeEventStreams({localEvents:l,remoteEvents:r}),registerValidator:(kind,fn)=>{invariant(kind&&typeof fn==='function','SYNC_VALIDATOR_INVALID');validators[kind]=fn}};
}
return{SYNC_SCHEMA_VERSION,createSyncEngine,createHttpTransport,mergeEventStreams};
});
