'use strict';
// Next-Gen ID 26: Offline First.
// Real offline mode: the app shell, Next-Gen runtime, scenarios (bundled in
// index.html), assets and the on-device model files are cached so the simulator
// boots, runs, understands Hebrew intents (local lexicon + on-device LLM), saves
// results locally (outbox in localStorage) and syncs later. Runtime caching means
// everything the user has ever loaded online keeps working with no network.
const STATIC_CACHE='ko-rishon-static-v1';
const RUNTIME_CACHE='ko-rishon-runtime-v1';
const APP_SHELL=[
 './',
 './index.html',
 './llm-worker.js',
 './src/nextgen/core.js',
 './src/nextgen/legacy-adapter.js',
 './src/nextgen/posture-map.js',
 './src/nextgen/npc-state.js',
 './src/nextgen/world-reactor.js',
 './src/nextgen/migrations.js',
 './src/nextgen/persistence.js',
 './src/nextgen/sync-engine.js'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(STATIC_CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==STATIC_CACHE&&k!==RUNTIME_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(req.mode==='navigate'){
  // Navigations: network-first so updates ship, with the cached shell as the offline
  // fallback that makes refresh/reopen work with no connectivity.
  event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(STATIC_CACHE).then(c=>c.put('./index.html',copy));return res}).catch(()=>caches.match('./index.html')));
  return;
 }
 if(url.origin===self.location.origin){
  // Same-origin assets (panoramas, posture/witness images, runtime modules): cache-first.
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy))}return res})));
  return;
 }
 // Cross-origin runtime dependencies (three.js CDN, on-device model shards):
 // stale-while-revalidate so first online load populates the offline cache.
 event.respondWith(caches.match(req).then(hit=>{
  const fresh=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(RUNTIME_CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>hit);
  return hit||fresh;
 }));
});
