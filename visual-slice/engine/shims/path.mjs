// B7 build-time shim for node:path. The instantiate path uses join/dirname/
// resolve only, on forward-slash repo paths.
const norm=s=>s.replace(/\/+/g,'/');
export function join(...a){return norm(a.filter(x=>x!==''&&x!==undefined).join('/'))}
export function dirname(p){const s=norm(String(p));const i=s.lastIndexOf('/');return i<=0?'/':s.slice(0,i)}
export function resolve(...a){return join(...a)}
export const sep='/';
export default {join,dirname,resolve,sep};
