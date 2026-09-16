'use strict';const crypto=require('node:crypto');
function normalizeZero(x){return typeof x==='number'&&Object.is(x,-0)?0:x}
function normalize(v){if(Array.isArray(v))return v.map(normalize);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,normalize(v[k])]));return normalizeZero(v)}
function canonicalBytes(v){return Buffer.from(JSON.stringify(normalize(v)))}
function digest(v,field='canonicalDigest'){const x=structuredClone(v);if(x&&typeof x==='object')delete x[field];return crypto.createHash('sha256').update(canonicalBytes(x)).digest('hex')}
module.exports={normalize,canonicalBytes,digest};
