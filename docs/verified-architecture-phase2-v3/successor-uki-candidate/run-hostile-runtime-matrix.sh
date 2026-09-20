#!/bin/sh
set -eu
B=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
QROOT=$1; KERNEL=$2; WORK=$3
rm -rf "$WORK"; mkdir -p "$WORK/initrds" "$WORK/templates"
python3 "$B/build-hostile-runtime-matrix.py" "$WORK/initrds" >/dev/null
Q="$QROOT/usr/bin/qemu-system-x86_64"
export LD_LIBRARY_PATH="$QROOT/usr/lib/x86_64-linux-gnu:$QROOT/lib/x86_64-linux-gnu"
export QEMU_MODULE_DIR="$QROOT/usr/lib/x86_64-linux-gnu/qemu"
[ "$($Q --version | head -1)" = 'QEMU emulator version 6.2.0 (Debian 1:6.2+dfsg-2ubuntu6.31)' ]
python3 - "$QROOT" "$B/qemu-extracted-closure.v1.json" <<'PY'
import hashlib,json,pathlib,sys
r=pathlib.Path(sys.argv[1]);m=json.load(open(sys.argv[2]))
for x in m['files']:
 p=r/x['path'];assert p.stat().st_size==x['bytes'];assert hashlib.sha256(p.read_bytes()).hexdigest()==x['sha256']
PY
for role in reviewed-root reviewed-input reviewed-output reviewed-evidence; do
  d="$WORK/templates/$role.dir"; mkdir -p "$d"; printf '%s' "$role" > "$d/.v3-volume-role"
  truncate -s 16M "$WORK/templates/$role.img"
  mkfs.ext4 -q -F -d "$d" "$WORK/templates/$role.img"
done
truncate -s 16M "$WORK/templates/rootfs-data.img"; truncate -s 16M "$WORK/templates/rootfs-hash.img"
run_case(){
 name=$1; expected=$2; mutation=$3; dir="$WORK/$name"; mkdir -p "$dir"
 args='-device virtio-scsi-pci,id=scsi0'; i=0
 for role in rootfs-data rootfs-hash reviewed-root reviewed-input reviewed-output reviewed-evidence; do
  img="$dir/$role.img"
  if [ "$mutation" = reviewed-root-unformatted ] && [ "$role" = reviewed-root ]; then truncate -s 16M "$img"; else cp --reflink=auto "$WORK/templates/$role.img" "$img"; fi
  args="$args -drive file=$img,format=raw,if=none,id=d$i -device scsi-hd,drive=d$i,bus=scsi0.0,serial=v3-$role,vendor=Google"; i=$((i+1))
 done
 transcript="$dir/raw-serial.txt"
 printf 'CASE=%s\nEXPECTED=%s\nINITRD_SHA256=%s\n' "$name" "$expected" "$(sha256sum "$WORK/initrds/$name.cpio"|cut -d' ' -f1)" > "$transcript"
 set +e
 # shellcheck disable=SC2086
 "$Q" -L "$QROOT/usr/share/qemu" -accel tcg -nodefaults -no-reboot -nographic -serial stdio -monitor none -m 512 -kernel "$KERNEL" -initrd "$WORK/initrds/$name.cpio" -append 'console=ttyS0 panic=-1' $args </dev/null >> "$transcript" 2>&1
 rc=$?; set -e
 printf 'QEMU_WRAPPER_EXIT=%s\n' "$rc" >> "$transcript"
 [ "$rc" -eq 0 ]; [ "$(grep -aFc "$expected" "$transcript")" -eq 2 ]
 printf '%s\t%s\t%s\t%s\n' "$name" "$expected" "$(sha256sum "$WORK/initrds/$name.cpio"|cut -d' ' -f1)" "$(sha256sum "$transcript"|cut -d' ' -f1)" >> "$WORK/results.tsv"
}
python3 - "$WORK/initrds/matrix-inputs.v1.json" <<'PY' > "$WORK/cases.tsv"
import json,sys
for x in json.load(open(sys.argv[1]))['cases']: print(x['name'],x['expected'],x['diskMutation'],sep='\t')
PY
while IFS="$(printf '\t')" read -r n e m; do run_case "$n" "$e" "$m"; done < "$WORK/cases.tsv"
python3 - "$WORK" <<'PY'
import hashlib,json,pathlib,sys
w=pathlib.Path(sys.argv[1]); inputs=json.load(open(w/'initrds/matrix-inputs.v1.json')); rows={x.split('\t')[0]:x.split('\t') for x in (w/'results.tsv').read_text().splitlines()}
out=[]
for c in inputs['cases']:
 r=rows[c['name']]; p=w/c['name']/'raw-serial.txt'
 out.append({'name':c['name'],'expected':c['expected'],'observed':c['expected'],'status':'EXECUTABLE_VM_PASS','qemuExit':0,'initrdSha256':r[2],'transcriptPath':c['name']+'/raw-serial.txt','transcriptSha256':r[3]})
(w/'hostile-runtime-results.v1.json').write_text(json.dumps({'schema':'v3.hostile-runtime-results.v1','status':'EXECUTABLE_VM_MATRIX_PASS','caseCount':len(out),'distinctInitrdCount':len(set(x['initrdSha256'] for x in out)),'cases':out},sort_keys=True,separators=(',',':'))+'\n')
PY
