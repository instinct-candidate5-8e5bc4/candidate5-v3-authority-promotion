'use strict';
// TRACK B / PHASE B6: visual smoke test wrapper. Asserts pixels/visual behavior
// only. Skips when no browser/dev-deps are available (host-dependent by design;
// the certified CI platform is not required for a presentation-layer check).
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const hasChrome=!!(process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p)));
let hasDeps=false;try{require.resolve('puppeteer');require.resolve('pngjs');hasDeps=true}catch{}
test('B6 visual smoke: preview renders and carries mandatory visual markers',{skip:!(hasChrome&&hasDeps)&&'no Chromium binary or dev deps (puppeteer/pngjs) on this host'},()=>{const out=execFileSync('node',['scripts/track-b/visual-smoke.js'],{cwd:path.join(__dirname,'../..'),encoding:'utf8',timeout:120000});assert.match(out,/RESULT: PASS/)});
