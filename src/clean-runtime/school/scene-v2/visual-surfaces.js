'use strict';
// TRACK B / PHASE B2 - physical scene geometry and support surfaces (visual side).
//
// Derives the visual room geometry (floor, walls, door, locker obstacles) from
// the SAME locked authored source as the certified physical scene:
//   index.html SHA-256 e1955f80... (RECOVERED) + surface model school-surface-v1
//   rev 1 digest 308951f8...
// Every visual surface carries a WRITTEN LINEAGE RECORD binding it to (a) the
// exact authored source range (id, byte offset, range SHA-256, re-verified
// against the real bytes at build time) and (b) the certified physical surface
// it depicts, with an explicit cross-check. This converts Gate D's declared
// unknown "visual-physical lineage: UNKNOWN" into evidence for these surfaces.
//
// Hard boundaries:
//  - Visual meshes are PRESENTATION-ONLY. They are never input to a physical
//    request and never re-enter authoritative state (ED-P2-02 downstream-only).
//  - No Geometry Gate bypass: these meshes assert no physical legality. The
//    physical surfaces they depict already passed the sole placement path.
//  - Colors/materials are visual-only claims, never physical evidence.
//  - The panorama remains PIXEL_DIAGNOSTIC_ONLY with geometryBindingStatus
//    UNKNOWN; nothing here promotes it.
//  - All emitted geometry is integer microunits (1 world unit = 1,000,000
//    microunits). Authored source values are meters and are scaled exactly.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),
 {digest}=require('../../contracts/canonical'),{SCHOOL_SURFACE_MODEL_REF}=require('../school-physical-contract');
const REPO_ROOT=path.join(__dirname,'../../../..'),SOURCE_PATH=path.join(REPO_ROOT,'index.html'),SOURCE_SHA256='e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618',
 rangeEvidence=require('../../../../evidence/verified-architecture-phase2/source-range-evidence.json'),
 model=require('../../../../evidence/verified-architecture-phase2/surface-models/school.json');
const M=1000000,toMicro=meters=>{const n=Math.round(meters*M);if(Math.abs(meters*M-n)>1e-6*M)throw Error('NON_EXACT_METER_VALUE:'+meters);return n};
// Authored boxes transcribed from the locked source ranges (center,size in meters; colorHex visual-only).
// Each entry names its source range; range text is re-hashed and located in the real bytes at build time.
const AUTHORED=[
 {visualSurfaceId:'visual:floor',rangeId:'base-room',physicalSurfaceId:'floor',kind:'PLANE_MESH',center:[0,-.06,0],size:[18,.12,18],colorHex:'0x555b59',authoredCall:"box('floor',[0,-.06,0],[18,.12,18],0x555b59)"},
 {visualSurfaceId:'visual:back-wall',rangeId:'base-room',physicalSurfaceId:'back-wall',kind:'BOX_MESH',center:[0,3,-4],size:[18,6,.16],colorHex:'0x163039',authoredCall:"box('back wall',[0,3,-4],[18,6,.16],0x163039)"},
 {visualSurfaceId:'visual:left-wall',rangeId:'base-room',physicalSurfaceId:'left-wall',kind:'BOX_MESH',center:[-7,3,0],size:[.16,6,12],colorHex:'0x132931',authoredCall:"box('side wall left',[-7,3,0],[.16,6,12],0x132931)"},
 {visualSurfaceId:'visual:right-wall',rangeId:'base-room',physicalSurfaceId:'right-wall',kind:'BOX_MESH',center:[7,3,0],size:[.16,6,12],colorHex:'0x132931',authoredCall:"box('side wall right',[7,3,0],[.16,6,12],0x132931)"},
 {visualSurfaceId:'visual:door',rangeId:'door',physicalSurfaceId:'door',kind:'BOX_MESH',center:[5.4,1.45,-3.84],size:[1.35,2.9,.12],colorHex:'0x674b37',authoredCall:"prop('Door',[5.4,1.45,-3.84],[1.35,2.9,.12],0x674b37)"},
 ...[-4,-2,0,2,4].map((x,i)=>({visualSurfaceId:'visual:locker-'+i,rangeId:'school-bag-lockers',physicalSurfaceId:'locker-'+i,kind:'BOX_MESH',center:[x,1.2,-3.5],size:[1,2.4,.55],colorHex:'0x3c6680',authoredCall:`prop('Locker',[${x},1.2,-3.5],[1,2.4,.55],0x3c6680)`,variantCondition:'baseVariant===8'}))];
function aabb(center,size){return {minX:toMicro(center[0]-size[0]/2),maxX:toMicro(center[0]+size[0]/2),minY:toMicro(center[1]-size[1]/2),maxY:toMicro(center[1]+size[1]/2),minZ:toMicro(center[2]-size[2]/2),maxZ:toMicro(center[2]+size[2]/2)}}
function physicalVolumeMicro(surfaceId){const s=model.surfaces.find(x=>x.surfaceId===surfaceId);if(!s)return null;const v=s.region.volumes[0];return v?{minX:toMicro(v.minX),maxX:toMicro(v.maxX),minY:toMicro(v.minY),maxY:toMicro(v.maxY),minZ:toMicro(v.minZ),maxZ:toMicro(v.maxZ)}:null}
function verifySource(){const bytes=fs.readFileSync(SOURCE_PATH),hex=crypto.createHash('sha256').update(bytes).digest('hex');if(hex!==SOURCE_SHA256)return {ok:false,code:'SOURCE_BYTES_MISMATCH',actual:hex};const ranges={};for(const x of rangeEvidence.extracts){const at=bytes.slice(x.byteOffsetUtf8,x.byteOffsetUtf8+Buffer.byteLength(x.text,'utf8')).toString('utf8');ranges[x.id]={id:x.id,byteOffsetUtf8:x.byteOffsetUtf8,sha256:x.sha256,locatedInSourceBytes:at===x.text,rangeDigestMatches:crypto.createHash('sha256').update(Buffer.from(x.text,'utf8')).digest('hex')===x.sha256}}return {ok:true,sourceBytesDigest:hex,ranges}}
function crossCheck(visualMicro,surfaceId){const s=model.surfaces.find(x=>x.surfaceId===surfaceId);if(!s)return {physicalSurfaceFound:false,match:false,detail:'NO_PHYSICAL_SURFACE'};if(s.type==='FLOOR'){const topY=visualMicro.maxY,planeY=toMicro(s.planeOrDepth.planeY),region=s.region.allowed[0],within=region&&toMicro(region.minX)>=visualMicro.minX&&toMicro(region.maxX)<=visualMicro.maxX&&toMicro(region.minZ)>=visualMicro.minZ&&toMicro(region.maxZ)<=visualMicro.maxZ;return {physicalSurfaceFound:true,match:topY===planeY&&!!within,detail:'FLOOR planeY='+planeY+' vs visual top '+topY+'; allowed region within visual extent: '+!!within}}const pv=physicalVolumeMicro(surfaceId);if(!pv)return {physicalSurfaceFound:true,match:false,detail:'NO_PHYSICAL_VOLUME'};const match=Object.keys(pv).every(k=>pv[k]===visualMicro[k]);return {physicalSurfaceFound:true,match,detail:match?'EXACT_AABB_MATCH':'MISMATCH physical='+JSON.stringify(pv)+' visual='+JSON.stringify(visualMicro)}}
function deepFreeze(v){if(v&&typeof v==='object'){for(const k of Object.keys(v))deepFreeze(v[k]);Object.freeze(v)}return v}
function buildVisualSurfaceSet(){const src=verifySource();if(!src.ok)return deepFreeze({setVersion:'1.0.0',kind:'VISUAL_SURFACE_SET',status:'REJECTED',code:src.code,actual:src.actual});const surfaces=AUTHORED.map(a=>{const micro=aabb(a.center,a.size),cc=crossCheck(micro,a.physicalSurfaceId),range=src.ranges[a.rangeId];return {visualSurfaceId:a.visualSurfaceId,kind:a.kind,geometryMicrounits:micro,visualOnlyClaims:{colorHex:a.colorHex,authoredCall:a.authoredCall,variantCondition:a.variantCondition||null},lineage:{visualPhysicalLineage:'EVIDENCED',sourceArtifact:{path:'index.html',sha256:src.sourceBytesDigest,classification:'RECOVERED'},sourceRange:{id:range.id,byteOffsetUtf8:range.byteOffsetUtf8,sha256:range.sha256,locatedInSourceBytes:range.locatedInSourceBytes,rangeDigestMatches:range.rangeDigestMatches},physicalSurfaceRef:{surfaceModelRef:{id:model.surfaceModelId,revision:model.revision,digest:model.surfaceModelDigest},surfaceId:a.physicalSurfaceId},derivation:{op:'AUTHORED_BOX_METERS_TO_AABB_MICRUNITS',factor:M,rounding:'Math.round (exact for all authored values)'},crossCheck:cc}}});const allMatch=surfaces.every(s=>s.lineage.crossCheck.match&&s.lineage.sourceRange.locatedInSourceBytes&&s.lineage.sourceRange.rangeDigestMatches);const set={setVersion:'1.0.0',kind:'VISUAL_SURFACE_SET',status:allMatch?'LINEAGE_EVIDENCED':'LINEAGE_INCOMPLETE',semanticSceneId:'scene.school.treatment_room',numericContract:{contractId:'ED-P2-02',linearUnit:'MICROUNIT',microunitsPerWorldUnit:M,rendererConversion:'DOWNSTREAM_ONLY',rendererFloatsFeedAuthoritativeState:false},boundary:{presentationOnly:true,neverInputToPhysicalRequest:true,physicalProof:false,geometryGateBypass:false,colorsAreVisualOnlyClaims:true,panorama:{role:'PIXEL_DIAGNOSTIC_ONLY',geometryBindingStatus:'UNKNOWN',promoted:false}},surfaceModelRef:{id:model.surfaceModelId,revision:model.revision,digest:model.surfaceModelDigest},surfaces,uncoveredPhysicalSurfaces:model.surfaces.filter(s=>!AUTHORED.some(a=>a.physicalSurfaceId===s.surfaceId)).map(s=>s.surfaceId)};set.setDigest=digest({...set,setDigest:undefined});return deepFreeze(set)}
module.exports={buildVisualSurfaceSet,SOURCE_SHA256};
