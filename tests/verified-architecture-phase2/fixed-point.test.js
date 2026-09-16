'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {MICROUNITS_PER_UNIT,MAX_INPUT_MAGNITUDE,toMicrounits}=require('../../src/verified-architecture-phase2/fixed-point');
test('contract uses one million integer microunits per authored unit',()=>assert.equal(MICROUNITS_PER_UNIT,1_000_000));
test('identical decimal 0.08 has exact identical representation',()=>assert.equal(toMicrounits(.08),80_000));
test('rounds nearest microunit with half away from zero',()=>{assert.equal(toMicrounits(.0000005),1);assert.equal(toMicrounits(-.0000005),-1);assert.equal(toMicrounits(.00000049),0);assert.equal(toMicrounits(-.00000049),0);});
test('negative authored values preserve sign',()=>assert.equal(toMicrounits(-3.84),-3_840_000));
test('near contract magnitude limit remains safe integer',()=>{const n=MAX_INPUT_MAGNITUDE-.25;assert(Number.isSafeInteger(toMicrounits(n)));assert(Number.isSafeInteger(toMicrounits(-n)));});
test('overflow and non-finite coordinates fail closed',()=>{for(const n of [MAX_INPUT_MAGNITUDE+1,-MAX_INPUT_MAGNITUDE-1,Infinity,-Infinity,NaN])assert.throws(()=>toMicrounits(n),RangeError);});
