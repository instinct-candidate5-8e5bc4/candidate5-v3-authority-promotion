#!/usr/bin/env python3
from pathlib import Path
import hashlib,json
B=Path(__file__).resolve().parent; D=B.parent; R=D.parent/'root-admitter-candidate'; x=json.loads((B/'final-recertification.v1.json').read_text()); h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert x['status']=='PASS'; assert x['classification']=={'interpretation':'POSITIVE_HANDOFF_PASS_AT_DESIGNED_AUTHORITY_BOUNDARY','observedTerminal':'E_CANDIDATE_AUTHORITY','provisioningOrMutationPerformed':False}
t=(D/'full-handoff-raw-serial.txt').read_text(errors='replace'); assert t.count('E_CANDIDATE_AUTHORITY')==1 and t.count('QEMU_WRAPPER_EXIT=0')==1
assert [e['basename'] for e in x['exactInputSet']['exclusions']]==['.v3-volume-role','lost+found'] and x['exactInputSet']['requiredCertifiedInputs']==9
for n,w in x['deterministicDoubleBuild']['artifacts'].items(): assert h(D/n)==w
for n,w in x['rootAdmitterArtifacts'].items(): assert h(R/n)==w
hr=json.loads((D/'hostile-runtime-evidence/hostile-runtime-results.v1.json').read_text()); assert hr['status']=='EXECUTABLE_VM_MATRIX_PASS' and hr['caseCount']==hr['distinctInitrdCount']==12
for c in hr['cases']:
 p=D/'hostile-runtime-evidence'/c['transcriptPath']; assert h(p)==c['transcriptSha256']; s=p.read_text(errors='replace'); assert s.count(c['expected'])==2 and s.count('QEMU_WRAPPER_EXIT=0')==1
print('FINAL_RECERTIFICATION=PASS')
