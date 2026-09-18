from pathlib import Path
import hashlib
R=Path(__file__).parent;s=(R/'composed-measured-service.review-bytes').read_text();root=R/'rootfs';b=(root/'approved-service/measured-execution-service-closure.v1.bin').read_bytes();n=0
for l in b.splitlines():p,r,z,d=l.split(b'\0');q=root/p.decode().lstrip('/');assert q.stat().st_size==int(z) and hashlib.sha256(q.read_bytes()).hexdigest()==d.decode();n+=1
assert n==44
for token in ['seal pin-record','seal cross-binding','seal offline-input-manifest','[ "$count" -eq 9 ]','E_INPUT_READONLY','input_object=','unshare --user --map-root-user --mount --pid --fork --kill-child --net','"$LAUNCHER_FD" "$ROOT" "$INPUT" "$OUTPUT" "$EVIDENCE"','! -e "$OUTPUT.stage"','! -e "$SERVICE_STAGE"','fail E_CANDIDATE_AUTHORITY']:assert token in s
assert s.index('fail E_CANDIDATE_AUTHORITY')<s.index('/usr/bin/unshare')
print('COMPOSED_SERVICE_STATIC_REVIEW=PASS')
