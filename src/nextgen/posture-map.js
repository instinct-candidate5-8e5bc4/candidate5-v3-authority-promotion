(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonPostureMap=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FAMILIES=new Set(['school','clinic','industrial','urban']);
const postureByCase={
 cardiac:{default:'supine-floor',clinic:'supine-gurney'},
 bleeding:{default:'seated-floor',clinic:'supine-gurney',industrial:'supine-floor'},
 burn:{default:'standing',clinic:'seated-chair'},
 trauma:{default:'supine-floor',clinic:'supine-gurney'},
 stroke:{default:'seated-chair'},
 seizure:{default:'recovery-floor'},
 anaphylaxis:{default:'seated-chair',urban:'standing'},
 choking:{default:'standing'},
 drowning:{default:'recovery-floor',clinic:'supine-gurney'},
 poisoning:{default:'seated-floor',clinic:'supine-gurney'},
 heatcold:{default:'recovery-floor',clinic:'supine-gurney'},
 diabetes:{default:'seated-chair',urban:'seated-floor',industrial:'seated-floor'}
};
const assetByPosture={
 standing:'./assets/realistic/postures/standing-patient.png',
 'seated-chair':'./assets/realistic/postures/seated-chair-patient.png',
 'seated-floor':'./assets/realistic/postures/seated-floor-patient.png',
 'supine-floor':'./assets/realistic/postures/supine-floor-patient.png',
 'supine-gurney':'./assets/realistic/postures/supine-gurney-patient.png',
 'recovery-floor':'./assets/realistic/postures/recovery-floor-patient.png'
};
const supportByPosture={standing:'feet','seated-chair':'chair','seated-floor':'floor','supine-floor':'floor','supine-gurney':'gurney','recovery-floor':'floor'};
function resolve({caseKey,family,state={}}){if(!postureByCase[caseKey])throw new Error('POSTURE_CASE_UNKNOWN');if(!FAMILIES.has(family))throw new Error('POSTURE_FAMILY_UNKNOWN');let posture=postureByCase[caseKey][family]||postureByCase[caseKey].default;if(state.consciousness==='unresponsive'&&['standing','seated-chair','seated-floor'].includes(posture))posture=family==='clinic'?'supine-gurney':'supine-floor';if(state.breathing==='normal'&&state.recoveryPosition===true)posture='recovery-floor';const asset=assetByPosture[posture];return{posture,support:supportByPosture[posture],asset,ready:!!asset,integrated:false};}
return{resolve,postureByCase,assetByPosture,supportByPosture};
});
