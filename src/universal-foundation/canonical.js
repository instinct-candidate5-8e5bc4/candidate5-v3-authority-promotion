'use strict';
const crypto=require('node:crypto');
function normalize(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(normalize);return Object.fromEntries(Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>[k,normalize(v[k])]));}
function bytes(v){return Buffer.from(JSON.stringify(normalize(v)));}
function digest(v,omit){const x=structuredClone(v);if(omit)delete x[omit];return crypto.createHash('sha256').update(bytes(x)).digest('hex');}
function seal(v,digestField='digest'){const x=structuredClone(v);x[digestField]=digest(x,digestField);return Object.freeze(x)}
module.exports={normalize,bytes,digest,seal};
