#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,sys
B=Path(__file__).resolve().parent

def parse(blob):
 out=[];o=0
 while True:
  assert blob[o:o+6]==b'070701'; v=[int(blob[o+6+i*8:o+14+i*8],16) for i in range(13)];o+=110
  ns=v[11];name=blob[o:o+ns-1].decode();o+=ns;o+=(-o)%4;body=blob[o:o+v[6]];o+=v[6];o+=(-o)%4
  if name=='TRAILER!!!': return out
  out.append({'name':name,'ino':v[0],'mode':v[1],'uid':v[2],'gid':v[3],'nlink':v[4],'mtime':v[5],'body':body,'devmaj':v[7],'devmin':v[8],'rdevmaj':v[9],'rdevmin':v[10],'check':v[12]})
old=parse((B.parent/'root-admitter-candidate/uki/initramfs.cpio').read_bytes()); new=parse((B/'successor-initramfs.cpio').read_bytes()); om={e['name']:e for e in old};nm={e['name']:e for e in new}
assert (set(om)-{'init'})|{'init','init.root-admitter'} <= set(nm)
assert all(n in (set(om)-{'init'})|{'init','init.root-admitter'} or n in ('bin/gce-by-id-producer','sbin/scsi_id','gce-disk-naming.rules') for n in nm)
for name,e in om.items():
 if name=='init': continue
 n=nm[name]
 for k in ('ino','mode','uid','gid','nlink','mtime','body','devmaj','devmin','rdevmaj','rdevmin','check'): assert e[k]==n[k],(name,k)
for k in ('mode','uid','gid','nlink','mtime','body','devmaj','devmin','rdevmaj','rdevmin','check'): assert om['init'][k]==nm['init.root-admitter'][k],('init.root-admitter',k)
assert hashlib.sha256(nm['init']['body']).hexdigest()==hashlib.sha256((B/'cloud-boot-adapter.sh').read_bytes()).hexdigest()
inv=json.loads((B/'inventory.v1.json').read_text()); artifacts={x['path']:x for x in inv['artifacts']}; vec={e['name']:e for e in inv['initramfsMembers']}
for e in new:
 assert vec[e['name']]=={'name':e['name'],'mode':f"{e['mode']:08x}",'size':len(e['body']),'sha256':hashlib.sha256(e['body']).hexdigest()}
assert inv['status']=='CERTIFICATION_EVIDENCE_COMPLETE_RUNTIME_PASS'
print('SUCCESSOR_CANDIDATE_STATIC_PASS')

adapter=(B/'cloud-boot-adapter.sh').read_text()
for required in ('/bin/sh /bin/gce-by-id-producer','mount -t proc','mount -t devtmpfs','.v3-volume-role','E_ROLE_MARKER_MISMATCH','awk -v s=','nodev','nosuid','noexec','umount'):
 assert required in adapter,required
assert (B/'provider-producer/produce-google-by-id.sh').read_bytes()==nm['bin/gce-by-id-producer']['body']
for path,mode in [('cloud-boot-adapter.sh','100755'),('build-successor.py','100755'),('verify-candidate.py','100755'),('provider-producer/produce-google-by-id.sh','100755'),('provider-producer/lib/udev/scsi_id','100755')]:
 assert artifacts[path]['gitMode']==mode,(path,mode)
print('SUCCESSOR_EXECUTABLE_PATH_ASSERTIONS_PASS')

for required in ('schema=v3.cloud-boot-adapter-evidence.v2','result=ADAPTER_ENVIRONMENT_READY','device.%s=google-%s;%s','oldInitSha256=%s','E_EVIDENCE_WRITE','E_EVIDENCE_SYNC'):
 assert required in adapter,required
evidence=json.loads((B/'vm-harness-evidence.v1.json').read_text())
for key in ('harness','transcript'):
 x=evidence[key]; assert hashlib.sha256((B/x['path']).read_bytes()).hexdigest()==x['sha256']
t=(B/evidence['transcript']['path']).read_text(errors='replace')
assert t.count('VM_BY_ID_PRODUCER_PASS')==1
assert t.count('VM_FAIL')==0
assert t.count('QEMU_WRAPPER_EXIT=0')==1
for n in ('v3-rootfs-data','v3-rootfs-hash','v3-reviewed-root','v3-reviewed-input','v3-reviewed-output','v3-reviewed-evidence'): assert t.count('VM_LINK_PASS google-'+n)==1
for key in ('disposableInitramfs','guestInit','module'):
 x=evidence[key]; assert hashlib.sha256((B/x['path']).read_bytes()).hexdigest()==x['sha256']
print('SUCCESSOR_EVIDENCE_BINDINGS_PASS')

assert evidence['testedPredecessor']=='0a1b48863f97f8810ec568ff834a79b7c88d00fa'
assert evidence['successorInitramfsSha256']==hashlib.sha256((B/'successor-initramfs.cpio').read_bytes()).hexdigest()
assert evidence['producerScriptSha256']==hashlib.sha256((B/'provider-producer/produce-google-by-id.sh').read_bytes()).hexdigest()
assert evidence['scsiIdSha256']==hashlib.sha256((B/'provider-producer/lib/udev/scsi_id').read_bytes()).hexdigest()
for key in ('harness','qemuClosure'):
 x=evidence[key];assert hashlib.sha256((B/x['path']).read_bytes()).hexdigest()==x['sha256']
test_entries=parse((B/'producer-test-initramfs.cpio').read_bytes());tm={x['name']:x for x in test_entries}
assert hashlib.sha256(tm['init']['body']).hexdigest()==hashlib.sha256((B/'vm-test/guest-init.sh').read_bytes()).hexdigest()
assert hashlib.sha256(tm['virtio_scsi.ko']['body']).hexdigest()==hashlib.sha256((B/'vm-test/virtio_scsi.ko').read_bytes()).hexdigest()
assert hashlib.sha256(tm['bin/gce-by-id-producer']['body']).hexdigest()==evidence['producerScriptSha256']
assert hashlib.sha256(tm['sbin/scsi_id']['body']).hexdigest()==evidence['scsiIdSha256']
print('SUCCESSOR_VM_SEMANTIC_BINDINGS_PASS')

q=json.loads((B/'qemu-extracted-closure.v1.json').read_text())
assert 'archive/package origin is unverified and not claimed' in q['claim']
for path in ('producer-test-initramfs.cpio','producer-vm-raw-serial.txt','qemu-extracted-closure.v1.json','vm-test/virtio_scsi.ko'):
 assert artifacts[path]['gitMode']=='100644',path
print('SUCCESSOR_QEMU_PROVENANCE_AND_MODES_PASS')

assert t.count('PREFLIGHT_QEMU_VERSION=QEMU emulator version 6.2.0 (Debian 1:6.2+dfsg-2ubuntu6.31)')==1
assert t.count('PREFLIGHT_KERNEL_SHA256=b253def256f2560ed9b658830ca9ec2783bb51f3c5dcb0d9b5c695b6554d70fb')==1
assert t.count('PREFLIGHT_INITRD_SHA256='+evidence['disposableInitramfs']['sha256'])==1
assert t.count('PREFLIGHT_CLOSURE=PASS')==1
print('SUCCESSOR_CAPTURED_PREFLIGHT_PASS')

raw=(B/'vm-harness-evidence.v1.json').read_text()
for forbidden in ('qemuPackage','ovmfPackage','packageFiles','.deb','OVMF'):
 assert forbidden not in raw,forbidden
assert evidence['successorHead']=='EVIDENCE_ONLY_SUCCESSOR_OF_REVIEWED_RUN_6cb84f4'
print('SUCCESSOR_NO_UNSUPPORTED_PACKAGE_PROVENANCE_PASS')

# Canonical final certification closure.
def blob(d): return hashlib.sha1(b"blob "+str(len(d)).encode()+b"\0"+d).hexdigest()
for r in inv['artifacts']:
 p=(B/r['path']).resolve();d=p.read_bytes();assert len(d)==r['bytes'] and hashlib.sha256(d).hexdigest()==r['sha256'] and blob(d)==r['gitBlob'];assert r['gitMode']==('100755' if p.stat().st_mode&0o111 else '100644')
auth=json.loads((B/'successor-authority-record.v1.json').read_text());assert auth['status']==inv['status'];assert auth['certification']==inv['certification'];assert {r['path'] for r in auth['records']}=={r['path'] for r in inv['artifacts']}|{'inventory.v1.json'}
print('SUCCESSOR_CANONICAL_CERTIFICATION_CLOSURE_PASS')
