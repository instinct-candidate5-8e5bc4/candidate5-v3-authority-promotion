'use strict';const crypto=require('node:crypto');
function normalize(v){if(v instanceof Map)return Object.fromEntries([...v.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,normalize(x)]));if(Array.isArray(v))return v.map(normalize);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,normalize(v[k])]));return v;}
function canonicalBytes(v){return Buffer.from(JSON.stringify(normalize(v)))}function digest(v){return crypto.createHash('sha256').update(canonicalBytes(v)).digest('hex')}
module.exports={normalize,canonicalBytes,digest};
