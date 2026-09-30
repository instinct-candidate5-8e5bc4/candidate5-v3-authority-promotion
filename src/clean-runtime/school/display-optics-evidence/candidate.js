'use strict';
// Read-only optics evidence prep. Not a renderer, gameplay mode or admission.
const {digest,deepFreeze}=require('../../contracts/canonical');
const {buildExtendedWorldReplayCandidate}=require('../scene-extension-replay/candidate');
const sourceOptics=deepFreeze({kind:'SYMMETRIC_PERSPECTIVE_NEG_Z',verticalFovDegrees:55,viewportPixels:{width:1200,height:700},aspect:1200/700,nearPlaneMicrounits:100000,farPlaneMicrounits:40000000,zoom:1,filmOffset:0,viewOffset:null});
// Actual matrix independently extracted from the pinned capture host's camera.
const sourceProjection=deepFreeze([1.120572907399847,0,0,0,0,1.9209821269711662,0,0,0,0,-1.005012531328321,-1,0,0,-0.2005012531328321,0]);
function inspectDisplayOpticsCandidate({packet,genesis,committedWorld,optics,projectionMatrixElements,measuredCanvasRect}){
 const fail=reason=>deepFreeze({status:'UNKNOWN',reason});
 try{
  const w=buildExtendedWorldReplayCandidate({packet});
  if(digest(genesis)!==digest(w.genesis)||digest(committedWorld)!==digest(w.after))return fail('NEW_GENESIS_WORLD_NOT_EXACT');
  if(digest(optics)!==digest(sourceOptics)||digest(projectionMatrixElements)!==digest(sourceProjection))return fail('CAPTURE_OPTICS_OR_PROJECTION_NOT_EXACT');
  if(!measuredCanvasRect||!['x','y','width','height'].every(k=>Number.isFinite(measuredCanvasRect[k]))||measuredCanvasRect.width!==1200||measuredCanvasRect.height!==700)return fail('MEASURED_CANVAS_NOT_EXACT_CAPTURE_SIZE');
  const r=optics.nearPlaneMicrounits,body=packet.cameraBody,h=body.conservativeVolume.halfExtentsMicrounits;
  if(r!==body.nearPlaneMicrounits||h.halfDepth!==r/2)return fail('NEAR_DEPTH_NOT_BODY_BOUND');
  // Standard symmetric projection: near-plane x=near/m00, y=near/m11.
  // Ceiling plus explicit 1 µm numerical margin. This is source-bound numeric
  // evidence, not a general interval-arithmetic proof for arbitrary optics.
  const halfWidth=Math.ceil(r/projectionMatrixElements[0])+1,halfHeight=Math.ceil(r/projectionMatrixElements[5])+1;
  if(halfWidth>body.nearPlaneHalfExtentsMicrounits.halfWidth||halfHeight>body.nearPlaneHalfExtentsMicrounits.halfHeight||halfWidth>h.halfWidth||halfHeight>h.halfHeight)return fail('NEAR_FRUSTUM_EXCEEDS_AUTHORED_BODY');
  return deepFreeze({status:'OPTICS_EVIDENCE_CONTAINED_NOT_OPERATIONALLY_ADMITTED',genesisDigest:genesis.stateDigest,worldDigest:committedWorld.stateDigest,packetDigest:digest(packet),opticsDigest:digest(optics),projectionDigest:digest(projectionMatrixElements),nearFrustumContainingHalfExtentsMicrounits:{halfWidth,halfHeight},authoredNearPlaneHalfExtentsMicrounits:body.nearPlaneHalfExtentsMicrounits,depthIntervalMicrounits:[0,r],numericalMarginMicrounits:1,derivation:'SYMMETRIC_PROJECTION_NEAR_DIVIDED_BY_M00_M11_CEILING_PLUS_MARGIN;LINEAR_EYE_TO_NEAR_FRUSTUM',limitations:['NEW_WORLD_88B6E019_REQUIRES_OWN_REVIEW_AND_RECORD','CAPTURE_OPTICS_ONLY_NOT_LIVE_RENDERER_VERIFICATION','SOURCE_BOUND_NUMERIC_EVIDENCE_NOT_GENERAL_INTERVAL_PROOF','NO_ADMISSION_OR_CONSUMER_OR_RENDER_OR_GAMEPLAY_UNLOCK','FAR_FRUSTUM_NOT_CAMERA_COLLISION_BODY','NO_WALL_OPENING_FRONT_WALL_OR_CEILING_PROOF']});
 }catch(e){return fail('OPTICS_EVIDENCE_INCOMPLETE:'+e.message)}
}
module.exports={sourceOptics,sourceProjection,inspectDisplayOpticsCandidate};
