(function(root){
'use strict';
const MODES=Object.freeze({
 training:Object.freeze({label:'Training',he:'אימון',hints:'full',feedback:'live'}),
 practice:Object.freeze({label:'Practice',he:'תרגול',hints:'limited',feedback:'live'}),
 assessment:Object.freeze({label:'Assessment',he:'הערכה',hints:'none',feedback:'live'}),
 exam:Object.freeze({label:'Exam',he:'מבחן',hints:'none',feedback:'deferred'})
});
function normalizeMode(value){return Object.prototype.hasOwnProperty.call(MODES,value)?value:'practice'}
function policy(value){const id=normalizeMode(value);return Object.freeze({id,...MODES[id]})}
function allowsHint(value,kind='contextual'){const p=policy(value);return p.hints==='full'||(p.hints==='limited'&&kind==='critical')}
function createController(doc,storage){
 let mode=normalizeMode(storage&&storage.getItem('ko-learning-mode'));
 let settings={contrast:false,reduced:false,largeText:false,captions:true};
 try{settings={...settings,...JSON.parse(storage&&storage.getItem('ko-accessibility')||'{}')}}catch(e){}
 const apply=()=>{
  const body=doc.body;if(!body)return;
  body.dataset.learningMode=mode;
  body.classList.toggle('a11y-contrast',!!settings.contrast);
  body.classList.toggle('a11y-reduced',!!settings.reduced);
  body.classList.toggle('a11y-large-text',!!settings.largeText);
  body.classList.toggle('a11y-captions',!!settings.captions);
  doc.documentElement.style.setProperty('--a11y-font-scale',settings.largeText?'1.2':'1');
 };
 const setMode=value=>{mode=normalizeMode(value);storage&&storage.setItem('ko-learning-mode',mode);apply();return policy(mode)};
 const setSetting=(key,value)=>{if(Object.prototype.hasOwnProperty.call(settings,key)){settings[key]=!!value;storage&&storage.setItem('ko-accessibility',JSON.stringify(settings));apply()}return {...settings}};
 return {apply,setMode,setSetting,getMode:()=>mode,getPolicy:()=>policy(mode),getSettings:()=>({...settings}),allowsHint:kind=>allowsHint(mode,kind)};
}
const api={MODES,normalizeMode,policy,allowsHint,createController};
if(typeof module==='object'&&module.exports)module.exports=api;
root.KoAccessibilityLearning=api;
})(typeof window!=='undefined'?window:globalThis);
