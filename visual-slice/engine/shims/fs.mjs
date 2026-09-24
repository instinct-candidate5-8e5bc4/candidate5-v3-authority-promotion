// B7 build-time shim for node:fs. The ONLY read on the instantiate path is the
// school surface-model evidence JSON, inlined here as RAW TEXT (never
// reserialized) and pinned byte-exact in visual-slice/engine/pins.json.
import SCHOOL_SURFACE_MODEL_TEXT from '../../../evidence/verified-architecture-phase2/surface-models/school.json';
const FILES=[{suffix:'evidence/verified-architecture-phase2/surface-models/school.json',text:SCHOOL_SURFACE_MODEL_TEXT}];
export function readFileSync(p,enc){const s=String(p);for(const f of FILES)if(s.endsWith(f.suffix))return f.text;throw Error('fs shim: read outside the pinned inline set: '+s)}
export default {readFileSync};
