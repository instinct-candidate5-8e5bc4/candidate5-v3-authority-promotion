'use strict';
const LIMITS=Object.freeze({translationBits:63,quaternionComponentBits:256,intermediateBits:4096,frameDepth:64,frameCount:4096,fixedScale:1000000n});
function parse(s,{bits=LIMITS.intermediateBits,canonical=true}={}){if(typeof s!=='string'||!(/^(0|-?[1-9][0-9]*)$/.test(s))||s==='-0')throw Error('MALFORMED_INTEGER_ENCODING');const x=BigInt(s);if(bitLength(x)>bits)throw Error('INTEGER_OVERFLOW');if(canonical&&String(x)!==s)throw Error('NONCANONICAL_INTEGER');return x}
function bitLength(x){x=x<0n?-x:x;return x===0n?0:x.toString(2).length}
function checked(x,bits=LIMITS.intermediateBits){if(bitLength(x)>bits)throw Error('INTEGER_OVERFLOW');return x}
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a}
function reduce(ns,d){if(d===0n)throw Error('ZERO_DENOMINATOR');if(d<0n){d=-d;ns=ns.map(n=>-n)}let g=d;for(const n of ns)g=gcd(g,n);if(g===0n)g=1n;ns=ns.map(n=>checked(n/g));d=checked(d/g);return {numerators:ns.map(String),denominator:String(d)}}
module.exports={LIMITS,parse,bitLength,checked,gcd,reduce};
