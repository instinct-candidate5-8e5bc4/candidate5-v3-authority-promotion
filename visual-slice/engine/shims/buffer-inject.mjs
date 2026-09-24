// B7 build-time inject: minimal Buffer global. Only Buffer.from(utf8 string)
// with .toString('hex') is used by the canonical-bytes path.
const hex=u=>[...u].map(b=>b.toString(16).padStart(2,'0')).join('');
export const Buffer={from(s){const u=new TextEncoder().encode(String(s));u.toString=enc=>enc==='hex'?hex(u):new TextDecoder().decode(u);return u}};
