'use strict';
const crypto=require('node:crypto');
function canonicalize(v){if(Array.isArray(v))return v.map(canonicalize);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonicalize(v[k])]));return v;}
function canonicalJson(v){return JSON.stringify(canonicalize(v));}
function digest(v){return crypto.createHash('sha256').update(canonicalJson(v)).digest('hex');}
module.exports={canonicalize,canonicalJson,digest};
