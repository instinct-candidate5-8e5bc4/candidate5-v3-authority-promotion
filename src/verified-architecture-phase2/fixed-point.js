'use strict';
const MICROUNITS_PER_UNIT=1_000_000;
const MAX_INPUT_MAGNITUDE=Math.floor(Number.MAX_SAFE_INTEGER/MICROUNITS_PER_UNIT);
function toMicrounits(value){
  if(!Number.isFinite(value))throw new RangeError('GEOMETRY_COORDINATE_NOT_FINITE');
  if(Math.abs(value)>MAX_INPUT_MAGNITUDE)throw new RangeError('GEOMETRY_COORDINATE_OVERFLOW');
  const scaled=Math.abs(value)*MICROUNITS_PER_UNIT;
  const rounded=Math.floor(scaled+.5);
  const result=(value<0?-1:1)*rounded;
  if(!Number.isSafeInteger(result))throw new RangeError('GEOMETRY_COORDINATE_OVERFLOW');
  return Object.is(result,-0)?0:result;
}
module.exports=Object.freeze({MICROUNITS_PER_UNIT,MAX_INPUT_MAGNITUDE,toMicrounits});
