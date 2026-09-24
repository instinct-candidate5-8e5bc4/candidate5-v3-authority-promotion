// B7 additive ESM wrapper entry for esbuild (CJS named-export interop).
// Exposes the read-only engine path to the preview page. No edits to any
// existing file; everything imported here is consumed as-is.
import d from '../../src/clean-runtime/school/scene-v2/visual-descriptor.js';
import c from '../../src/clean-runtime/school/scene-v2/visual-casualty.js';
import e from '../../src/clean-runtime/school/scene-v2/visual-equipment.js';
export const buildVisualSceneDescriptor=d.buildVisualSceneDescriptor;
export const buildVisualCasualty=c.buildVisualCasualty;
export const buildVisualEquipment=e.buildVisualEquipment;
// Fail-closed runtime pins (certified anchors; see b7-design-freeze-record.md).
export const EXPECTED=Object.freeze({
 packageDigest:'187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec',
 worldDigest:'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea',
 nodeDescriptorDigest:'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18'});
