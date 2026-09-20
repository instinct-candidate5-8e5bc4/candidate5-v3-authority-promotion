#!/usr/bin/env python3
from pathlib import Path
import importlib.util,sys
B=Path(__file__).resolve().parent
saved=sys.argv;sys.argv=[sys.argv[0]]
spec=importlib.util.spec_from_file_location('successor_builder',B/'build-successor.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);sys.argv=saved
es=m.parse_cpio((B/'successor-initramfs.cpio').read_bytes())
for e in es:
 if e['name']=='init':
  s=e['body'].decode(); needle='/bin/sh /bin/gce-by-id-producer || fail E_PROVIDER_NAMESPACE\n'; assert s.count(needle)==1
  e['body']=s.replace(needle,'"$BB" insmod /virtio_scsi.ko || fail E_TEST_VIRTIO_SCSI\n'+needle).encode()
ino=max(e['ino'] for e in es)+1
es.append({'name':'virtio_scsi.ko','ino':ino,'mode':0o100644,'uid':0,'gid':0,'nlink':1,'mtime':1,'body':(B/'vm-test/virtio_scsi.ko').read_bytes(),'devmaj':0,'devmin':0,'rdevmaj':0,'rdevmin':0,'check':0})
m.emit_cpio(es,Path(sys.argv[1]) if len(sys.argv)>1 else B/'full-handoff-test-initramfs.cpio')
