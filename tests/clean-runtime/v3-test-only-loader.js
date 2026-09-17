'use strict';
// Test-only module-resolution loader for hostile-evaluator regressions.
//
// The six Foundation production modules export ONLY their real closed
// surfaces: the adapter closes over the real evaluateV3 through its own
// require, and the coordinator closes over the real adapter. No factory or
// dependency seam is exported, so no caller of a production module can select
// an evaluator.
//
// To exercise the adapter's hostile-input handling (throwing or malformed
// evaluators) tests must therefore construct the seam outside the modules:
// this loader runs the production module SOURCE verbatim inside a fresh
// CommonJS wrapper with selected relative require specifiers substituted.
// The exercised code path is byte-identical to production; only module
// resolution is proxied, which is exactly the barrier production relies on.
// This file is never imported by production code.
const fs=require('node:fs'),path=require('node:path');
function loadModuleWithSubstitutions(absPath,substitutions){
 const src=fs.readFileSync(absPath,'utf8'),dir=path.dirname(absPath);
 const m={exports:{}};
 const localRequire=id=>{
  if(Object.prototype.hasOwnProperty.call(substitutions,id))return substitutions[id];
  if(id.startsWith('.'))return require(path.resolve(dir,id));
  return require(id)};
 const fn=new Function('exports','require','module','__filename','__dirname',src);
 fn.call(m.exports,m.exports,localRequire,m,absPath,dir);
 return m.exports}
// Builds a Foundation coordinator whose adapter closes over the given
// evaluator, by loading the real adapter and coordinator sources with only
// module resolution substituted.
function foundationWithEvaluator(evaluator){
 const adapterPath=path.resolve(__dirname,'../../src/clean-runtime/mutation/v3-authority-adapter.js');
 const foundationPath=path.resolve(__dirname,'../../src/clean-runtime/mutation/v3-promotion-foundation.js');
 const adapter=loadModuleWithSubstitutions(adapterPath,{'../../verified-architecture-phase2-v3/evaluate':{evaluateV3:evaluator}});
 return loadModuleWithSubstitutions(foundationPath,{'./v3-authority-adapter':{evaluate:adapter.evaluate}})}
module.exports={loadModuleWithSubstitutions,foundationWithEvaluator};
