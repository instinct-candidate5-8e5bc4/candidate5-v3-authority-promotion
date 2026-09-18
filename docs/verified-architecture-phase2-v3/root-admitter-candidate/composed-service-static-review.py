from pathlib import Path
import hashlib
R=Path(__file__).parent;s=(R/'composed-measured-service.review-bytes').read_text();root=R/'rootfs';b=(root/'approved-service/measured-execution-service-closure.v1.bin').read_bytes();n=0
for l in b.splitlines():p,r,z,d=l.split(b'\0');q=root/p.decode().lstrip('/');assert q.stat().st_size==int(z) and hashlib.sha256(q.read_bytes()).hexdigest()==d.decode();n+=1
assert n==44
for token in ['seal pin-record','seal cross-binding','seal offline-input-manifest','actual_text=$(/usr/bin/find "$INPUT" -xdev -mindepth 1 -maxdepth 1','E_INPUT_EXTRA','E_INPUT_EXACT_SET','exec {input_fd}<"$p"','/proc/self/fd/$input_fd','E_HASH_OUTPUT','/usr/bin/mount -t tmpfs','/usr/bin/cat "$src" >"$dst"','E_STAGE_DIGEST','remount,ro,bind','--kill-child --net','"$LAUNCHER_FD"','! -e "$OUTPUT.stage"','! -e "$SERVICE_STAGE"','fail E_CANDIDATE_AUTHORITY']:assert token in s,token
assert s.index('actual_text=$(/usr/bin/find')<s.index('exec {input_fd}')<s.index('fail E_CANDIDATE_AUTHORITY')<s.index('/usr/bin/unshare')<s.index('/usr/bin/mount -t tmpfs')<s.index('"$launcher" "$root" "$stage"')
assert hashlib.sha256((root/'usr/bin/mount').read_bytes()).hexdigest()=='bad230d68e012eb1a2fcaa3b42688d912940f5c61f041ae9451eee7dfb858ff1'
print('COMPOSED_SERVICE_STATIC_REVIEW=PASS')
