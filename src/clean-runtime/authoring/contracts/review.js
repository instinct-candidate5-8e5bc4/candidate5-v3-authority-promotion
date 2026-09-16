'use strict';
function reviewRecord(x){if(!x||!x.reviewId||!x.reviewedRevisionDigest||!['APPROVE_FOR_SLICE','REJECT'].includes(x.reviewDecision)||!Array.isArray(x.reviewEvidenceRefs)||!x.reviewer?.role||!x.reviewer?.identifier)throw Object.assign(Error('INVALID_REVIEW'),{code:'INVALID_REVIEW'});return Object.freeze(structuredClone(x))}
function canVerify(body,review){return body.status==='REVIEWED'&&review.reviewDecision==='APPROVE_FOR_SLICE'&&review.reviewedRevisionDigest===body.canonicalDigest}
module.exports={reviewRecord,canVerify};
