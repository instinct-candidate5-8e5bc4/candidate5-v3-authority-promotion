// B7 build-time shim for node:crypto. Sync SHA-256 only (Web Crypto is async
// and cannot serve this path). Backed by the vendored js-sha256 (MIT), which
// carries known-vector tests in tests/clean-runtime-school-scene-v2/b7-engine.test.mjs.
import {sha256} from '../vendor/js-sha256.mjs';
export function createHash(alg){if(alg!=='sha256')throw Error('crypto shim: unsupported algorithm '+alg);const parts=[];return {update(d){parts.push(typeof d==='string'?new TextEncoder().encode(d):d);return this},digest(enc){if(enc!=='hex')throw Error('crypto shim: unsupported encoding '+enc);const n=parts.reduce((a,p)=>a+p.length,0),all=new Uint8Array(n);let o=0;for(const p of parts){all.set(p,o);o+=p.length}return sha256.hex(all)}}}
export default {createHash};
