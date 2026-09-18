from pathlib import Path
import hashlib,json,re,subprocess
A=Path(__file__).parent; art=A/'external-measured-admission-launcher.review-bytes'; bind=A/'external-admission-binding.v1.json'; closure=A/'external-admission-closure.v1.bin'
def h(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def blob(p): return subprocess.check_output(['git','hash-object',str(p)],text=True).strip()
x=json.loads(bind.read_text()); raw=bind.read_bytes()
assert json.dumps(x,sort_keys=True,separators=(',',':')).encode()+b'\n'==raw
assert x['admissionArtifact']=={'blob':blob(art),'byteLength':len(art.read_bytes()),'mode':'100644','sha256':h(art)}
assert x['closure']=={'blob':blob(closure),'byteLength':len(closure.read_bytes()),'pathCount':30,'sha256':h(closure)}
assert x['script']['blob']=='2622618addebf7385bda722295965540cf51c849'
s=art.read_text();assert 'compgen -e' in s and 'exported_count' in s and 'SHLVL" = 1' in s and 'E_ENVIRONMENT_ENUM' in s;assert 'case "$0" in /proc/self/fd/[0-9]*' in s and 'admission_fd_object=' in s and 'admission_path_object=' in s and 'E_ADMISSION_DESCRIPTOR_OBJECT' in s;assert '$STAGE' not in s and 'admission-message.tmp' not in s;assert s.index('exec 9<"$SCRIPT"')<s.index('sha256sum "$fd"')<s.index('exec /usr/bin/bash --noprofile --norc "$fd"');assert s.index('fail E_CANDIDATE_AUTHORITY')<s.index('>"$EVIDENCE_STAGE/admission.v1.txt"')<s.index('exec /usr/bin/bash')
rows=[]
for line in closure.read_bytes().splitlines():
 p,r,n,d=line.split(b'\0');rows.append(p)
assert len(rows)==30 and rows==sorted(rows) and len(set(rows))==30
host=json.loads((A/'hostile-fixtures/expected-results.v1.json').read_text());assert len(host['cases'])==32
wrong=json.loads((A/'hostile-fixtures/valid-signature-wrong-admission-identity.json').read_text());assert wrong['admissionArtifact']['sha256']=='0'*64 and wrong!=x
print('EXTERNAL_ADMISSION_STATIC_REVIEW=PASS')
