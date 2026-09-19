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
inv=json.loads((B/'inventory.v1.json').read_text()); vec={e['name']:e for e in inv['initramfsMembers']}
for e in new:
 assert vec[e['name']]=={'name':e['name'],'mode':f"{e['mode']:08x}",'size':len(e['body']),'sha256':hashlib.sha256(e['body']).hexdigest()}
assert inv['status']=='SUCCESSOR_UKI_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW'
print('SUCCESSOR_CANDIDATE_STATIC_PASS')
