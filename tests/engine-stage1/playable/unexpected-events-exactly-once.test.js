'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Engine}=require('../../../src/nextgen/unexpected-events.js');
const {WorldReactor}=require('../../../src/nextgen/world-reactor.js');
function engine(){return new Engine({seed:1,definitions:[{type:'noise-started',minMs:10,maxMs:10},{type:'person-arrived',minMs:20,maxMs:20}]});}
test('empty ticks before and after each fired event return no entries',()=>{
 const e=engine();assert.deepEqual(e.advance(0),[]);
 assert.deepEqual(e.advance(10).map(x=>x.type),['noise-started']);
 for(const t of [10,11,19])assert.deepEqual(e.advance(t),[]);
 assert.deepEqual(e.advance(20).map(x=>x.type),['person-arrived']);
 for(const t of [20,21,1000])assert.deepEqual(e.advance(t),[]);
 assert.equal(e.snapshot().fired.length,2);assert.equal(e.snapshot().pending,0);
});
test('a tick fires exactly its newly-due entries even when several become due',()=>{
 const e=engine();assert.deepEqual(e.advance(20).map(x=>x.type),['noise-started','person-arrived']);
 assert.deepEqual(e.advance(21),[]);assert.equal(e.snapshot().fired.length,2);
});
test('timer-like delivery never replays world effects or population increments',()=>{
 const e=engine(),w=new WorldReactor();for(let t=0;t<=30;t++)for(const event of e.advance(t))w.react(event);
 const a=w.snapshot();assert.equal(a.state.people.additional,1);assert.equal(a.state.revision,2);
 for(const cause of ['noise-started','person-arrived'])assert.equal(a.eventLog.filter(x=>x.cause===cause).length,1);
});
